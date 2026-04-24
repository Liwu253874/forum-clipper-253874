// content.js
// 功能：
// 1) 任意网页：优先抓"选中内容"，未选中则用 Readability 提取全文
// 2) 提取时保留段落/换行/列表，并将正文 <img> 转成可插入内容的图片表达（兼容腾讯无扩展名图片）
// 3) 在 https://www.253874.net/post：读取 storage 的 lastClip，自动填充发帖表单
//
// 依赖：manifest.json 必须先加载 Readability.js 再加载本文件：
// "js": ["Readability.js", "content.js"]

function getSelectionHtml() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return "";
  const container = document.createElement("div");
  for (let i = 0; i < sel.rangeCount; i++) {
    container.appendChild(sel.getRangeAt(i).cloneContents());
  }
  return (container.innerHTML || "").trim();
}

function safeText(str) {
  return (str || "").replace(/\r\n/g, "\n").trim();
}

function truncate(str, maxLen) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, Math.max(0, maxLen - 1)) + "…";
}

/**
 * 知乎专属：提取当前回答的内容（解决多回答页面提取错误问题）
 * 返回：{ title: string, contentHtml: string, authorName: string } 或 null
 */
function extractCurrentZhihuAnswer() {
  try {
    // 1) 单个回答页 (/answer/ 开头)
    const answerUrlMatch = location.href.match(/\/answer\/(\d+)/);
    
    if (answerUrlMatch) {
      const answerId = answerUrlMatch[1];
      
      // 方法 1：找 name 属性等于 answerId 的元素
      let answerEl = document.querySelector('[name="' + answerId + '"]');
      
      // 方法 2：找 data-zop 中包含 itemId 等于 answerId 的元素
      if (!answerEl) {
        const allItems = document.querySelectorAll('[data-zop]');
        for (const el of allItems) {
          try {
            const zopData = JSON.parse(el.getAttribute('data-zop') || '{}');
            if (zopData.itemId === answerId) {
              answerEl = el;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
      }
      
      if (answerEl) {
        const contentEl = answerEl.querySelector('.RichContent-inner');
        const authorEl = answerEl.querySelector('.AuthorInfo-name, .UserLink-link');
        
        // 从 data-zop 中提取作者名和标题（最可靠）
        let authorName = '';
        let title = document.title || '';
        try {
          const zopData = JSON.parse(answerEl.getAttribute('data-zop') || '{}');
          authorName = zopData.authorName || '';
          if (zopData.title) {
            title = zopData.title;
          }
        } catch (e) {
          // ignore
        }
        
        // 如果 data-zop 中没有作者名，从 DOM 获取
        if (!authorName && authorEl) {
          authorName = safeText(authorEl.innerText);
        }
        
        // 如果 data-zop 中没有标题，从页面获取
        if (!title) {
          const questionTitle = document.querySelector('.QuestionHeader-title, .QuestionPage-title, h1');
          if (questionTitle) {
            title = safeText(questionTitle.innerText);
          }
        }
        
        return {
          title: title,
          contentHtml: contentEl ? contentEl.innerHTML : answerEl.innerHTML,
          authorName: authorName
        };
      }
    }
    
    // 2) 问题页 (/question/)：找展开的回答或第一个回答
    if (/\/question\//.test(location.href) && !/\/answer\//.test(location.href)) {
      // 优先找展开的回答
      const expandedAnswer = document.querySelector('.ContentItem.Expanded .RichContent-inner, .ContentItem.Expanded .RichText');
      const expandedAuthor = document.querySelector('.ContentItem.Expanded .AuthorInfo-name, .ContentItem.Expanded .UserLink-link');
      const expandedTitle = document.querySelector('.QuestionHeader-title');
      
      if (expandedAnswer) {
        return {
          title: expandedTitle ? safeText(expandedTitle.innerText) : (document.title || ''),
          contentHtml: expandedAnswer.innerHTML,
          authorName: expandedAuthor ? safeText(expandedAuthor.innerText) : ''
        };
      }
      
      // 否则找第一个回答（使用 AnswerItem 类名）
      const firstAnswer = document.querySelector('.ContentItem.AnswerItem .RichContent-inner, .ContentItem.AnswerItem .RichText');
      const firstAuthor = document.querySelector('.ContentItem.AnswerItem .AuthorInfo-name, .ContentItem.AnswerItem .UserLink-link');
      
      if (firstAnswer) {
        return {
          title: expandedTitle ? safeText(expandedTitle.innerText) : (document.title || ''),
          contentHtml: firstAnswer.innerHTML,
          authorName: firstAuthor ? safeText(firstAuthor.innerText) : ''
        };
      }
    }
  } catch (_) {
    // ignore
  }
  
  return null;
}
/**
 * 腾讯/部分站点标题清洗：
 * - "..._腾讯新闻"  -> "..."
 * - "...-腾讯新闻"  -> "..."
 * - "...｜腾讯新闻" -> "..."
 */
function cleanTitleBySite(title, pageUrl) {
  let t = safeText(title || "");
  if (!t) return t;

  const ensurePrefix = (str, prefix) => {
    if (!str || str.includes(prefix)) return str;
    const m = str.match(/^((?:【[^【】]+】)+)/);
    if (m) return `${m[1]}${prefix}${str.slice(m[1].length)}`;
    return `${prefix}${str}`;
  };
  const ensureSuffix = (str, suffix) => {
    if (!str || str.includes(suffix)) return str;
    return `${str}${suffix}`;
  };

  const isTencentNews =
    /(^|\.)qq\.com/i.test(new URL(pageUrl || location.href).hostname) ||
    /inews\.qq\.com/i.test(pageUrl || "") ||
    /news\.qq\.com/i.test(pageUrl || "");

  if (isTencentNews) {
    t = t.replace(/(\s*[_\-｜|]\s*腾讯新闻\s*)$/i, "");
    t = t.replace(/(\s*[_\-｜|]\s*腾讯网\s*)$/i, "");
    t = ensurePrefix(t, "【新闻】");
  }

  const isSina = /(^|\.)sina\.com\.cn/i.test(new URL(pageUrl || location.href).hostname);
  if (isSina) {
    t = ensurePrefix(t, "【新闻】");
  }

  const isSohu = /(^|\.)sohu\.com/i.test(new URL(pageUrl || location.href).hostname);
  if (isSohu) {
    t = ensurePrefix(t, "【新闻】");
  }

  const isZhihu = /(^|\.)zhihu\.com/i.test(new URL(pageUrl || location.href).hostname);
  if (isZhihu) {
    t = t.replace(/\s*[-]\s*.*?的回答/, "");
    t = ensureSuffix(t, "【知乎】");
  }

  return t.trim();
}

/**
 * 针对特定站点的正文清洗（截断、去噪）
 */
function cleanTextBySite(text, pageUrl) {
  let t = text || "";
  if (!t) return t;

  const isZhihu = /(^|\.)zhihu\.com/i.test(new URL(pageUrl || location.href).hostname);

  if (isZhihu) {
    t = t.replace(/^\s*.*?人赞同了该回答\s*/, "");

    const patterns = [
      /编辑于\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/,
      /发布于\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/
    ];

    let minIndex = -1;
    for (const p of patterns) {
      const match = p.exec(t);
      if (match) {
        if (minIndex === -1 || match.index < minIndex) {
          minIndex = match.index;
        }
      }
    }

    if (minIndex !== -1) {
      t = t.substring(0, minIndex);
    }
  }

  return t.trim();
}

/**
 * 针对特定站点的作者信息清洗
 */
function cleanBylineBySite(byline, pageUrl, doc) {
  let b = safeText(byline || "");
  if (!b) return b;

  const isZhihu = /(^|\.)zhihu\.com/i.test(new URL(pageUrl || location.href).hostname);

  if (isZhihu) {
    b = b.replace(/^关于作者\s*/i, "");
    const parsed = extractZhihuAuthorName(b, doc || document) || "";
    if (parsed.trim()) return parsed.trim();
  }

  return b.trim();
}

/**
 * 知乎适配：提取作者用户名，优先 byline，其次 DOM，失败时返回原文
 */
function extractZhihuAuthorName(bylineText, doc) {
  try {
    const text = safeText(bylineText || "");
    const bylineMatch = text.match(/关于作者\s*([^\s·,，。/|｜]+)/);
    if (bylineMatch && bylineMatch[1]) return bylineMatch[1];
    const firstToken = text.match(/^[\p{L}\p{N}_-]+/u);
    if (firstToken && firstToken[0]) return firstToken[0];

    const d = doc || document;
    if (d) {
      const selectors = [
        'meta[itemprop="author"]',
        'meta[name="author"]',
        '.AuthorInfo .AuthorInfo-head span',
        '.ContentItem .AuthorInfo-name span',
        '.AuthorInfo a[href*="/people/"] span',
        'a.UserLink-link',
        '.UserLink-link'
      ];
      for (const sel of selectors) {
        const el = d.querySelector(sel);
        const name = safeText(el ? (el.content || el.innerText || el.textContent) : "");
        if (name) return name;
      }
    }
  } catch (_) {
  }
  return bylineText;
}

/**
 * 归一化图片 URL
 */
function normalizeImageUrl(src, allowNoExt = false) {
  if (!src) return "";
  src = String(src).trim();
  if (!src) return "";

  if (src.startsWith("data:") || src.startsWith("blob:")) return "";
  if (src.startsWith("//")) src = "https:" + src;

  try {
    src = new URL(src, location.href).toString();
  } catch (_) { }

  src = src.split("#")[0].split("?")[0];

  const lower = src.toLowerCase();
  const hasExt = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".avif"].some(ext => lower.endsWith(ext));

  if (hasExt) return src;
  if (allowNoExt) return src;

  return "";
}

/**
 * 生成要写入帖子的图片表示
 */
function formatImageForPost(url) {
  if (!url) return "";

  const isTencentInews = /inews\.gtimg\.com/i.test(url) || /inews\.qq\.com/i.test(location.href);

  if (isTencentInews) {
    return `<img src="${url}">`;
  }

  return url;
}

/**
 * HTML -> 纯文本（保留段落/换行/列表）
 */
function htmlToTextWithParagraphs(html) {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  const out = [];

  const blockTags = new Set([
    "P", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "ASIDE",
    "H1", "H2", "H3", "H4", "H5", "H6",
    "BLOCKQUOTE", "PRE",
    "UL", "OL", "LI",
    "TABLE", "TR"
  ]);

  function pushNewline(count = 1) {
    while (count-- > 0) out.push("\n");
  }

  function walk(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.nodeValue.replace(/[ \t]+/g, " ");
      if (t) out.push(t);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName;

    if (tag === "BR") {
      pushNewline(1);
      return;
    }

    if (tag === "IMG") {
      const src = node.getAttribute("src") || "";
      const fallback =
        node.getAttribute("data-src") ||
        node.getAttribute("data-original") ||
        node.getAttribute("data-lazy-src") ||
        "";

      const url =
        normalizeImageUrl(src, true) ||
        normalizeImageUrl(fallback, true);

      const imgText = formatImageForPost(url);
      if (imgText) {
        pushNewline(2);
        out.push(imgText);
        pushNewline(2);
      }
      return;
    }

    if (tag === "LI") {
      pushNewline(1);
      out.push("- ");
    }

    if (tag === "PRE") {
      pushNewline(1);
      out.push(node.innerText || node.textContent || "");
      pushNewline(2);
      return;
    }

    for (const child of node.childNodes) walk(child);

    if (blockTags.has(tag)) {
      pushNewline(tag === "LI" ? 1 : 2);
    }
  }

  walk(doc.body);

  let text = out.join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

/**
 * Readability 全文提取
 */
function extractWithReadability(pageUrl) {
  try {
    if (typeof Readability === "undefined") return null;

    const docClone = document.cloneNode(true);
    const reader = new Readability(docClone);
    const article = reader.parse();
    if (!article) return null;

    const contentHtml = article.content || "";
    const textWithParagraphs = htmlToTextWithParagraphs(contentHtml);

    const cleanedTitle = cleanTitleBySite(article.title || document.title || "", pageUrl || location.href);
    const cleanedText = cleanTextBySite(textWithParagraphs, pageUrl || location.href);
    const cleanedByline = cleanBylineBySite(article.byline || "", pageUrl || location.href, docClone);

    return {
      title: cleanedTitle,
      text: safeText(cleanedText) || "",
      excerpt: safeText(article.excerpt) || "",
      byline: safeText(cleanedByline) || "",
      siteName: safeText(article.siteName) || ""
    };
  } catch (e) {
    return null;
  }
}

/**
 * 在论坛发帖页自动填充表单
 */
async function fillForumPostFormFromStorage() {
  if (location.origin !== "https://www.253874.net") return;
  if (location.pathname !== "/post") return;

  const { lastClip } = await chrome.storage.local.get("lastClip");
  if (!lastClip) return;

  const form = document.querySelector("#postForm");
  const titleEl = document.querySelector('input[name="title"]');
  const msgEl = document.querySelector("#messageTextArea");
  const linkEl = document.querySelector('input[name="about_link"]');

  if (!form || !titleEl || !msgEl) {
    alert("未检测到发帖表单：请先登录论坛账号，然后再使用转发插件。");
    return;
  }

  const meta = lastClip.extractedMeta || {};
  const metaLines = [];
  if (meta.siteName) metaLines.push(`【站点】${meta.siteName}`);
  if (meta.byline) metaLines.push(`【作者】${meta.byline}`);

  const header =
    `【来源】${lastClip.pageTitle || ""}
【链接】${lastClip.pageUrl || ""}
${metaLines.length ? metaLines.join("\n") + "\n" : ""}
`;

  const body =
    lastClip.selectionText
      ? lastClip.selectionText
      : (lastClip.extractedFullText
        ? lastClip.extractedFullText
        : (lastClip.pageUrl
          ? `（未能提取正文，仅记录链接）\n${lastClip.pageUrl}`
          : ""
        )
      );

  const finalTitle = cleanTitleBySite(lastClip.pageTitle || "转发", lastClip.pageUrl || location.href);
  titleEl.value = truncate(finalTitle, 60);

  msgEl.value = header + "\n" + body;
  if (linkEl && lastClip.pageUrl) linkEl.value = lastClip.pageUrl;

  await chrome.storage.local.remove("lastClip");

  if (lastClip.autoSubmit) {
    setTimeout(() => {
      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      form.submit();
    }, 2000);
  }
}

// 处理 background.js 发来的"抓取内容"请求
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "GET_CLIP") return;

  const rawTitle = document.title || "";
  const pageUrl = location.href || "";
  
  // 【知乎特殊处理】优先使用知乎专属提取逻辑
  const isZhihu = /(^|\.)zhihu\.com/i.test(new URL(pageUrl).hostname);
  
  if (isZhihu) {
    const zhihuAnswer = extractCurrentZhihuAnswer();
    
    if (zhihuAnswer) {
      const selHtml = getSelectionHtml();
      let selText = selHtml ? htmlToTextWithParagraphs(selHtml) : "";
      selText = cleanTextBySite(selText, pageUrl);
      
      if (selText) {
        sendResponse({
          pageTitle: cleanTitleBySite(rawTitle, pageUrl),
          pageUrl,
          selectionText: selText,
          extractedFullText: "",
          extractedMeta: { byline: zhihuAnswer.authorName, siteName: '知乎' }
        });
      } else {
        const contentText = htmlToTextWithParagraphs(zhihuAnswer.contentHtml);
        const cleanedText = cleanTextBySite(contentText, pageUrl);
        
        sendResponse({
          pageTitle: cleanTitleBySite(zhihuAnswer.title, pageUrl),
          pageUrl,
          selectionText: "",
          extractedFullText: cleanedText,
          extractedMeta: { byline: zhihuAnswer.authorName, siteName: '知乎' }
        });
      }
      return;
    }
  }
  
  // 非知乎 或 知乎提取失败 → 走通用逻辑
  const pageTitle = cleanTitleBySite(rawTitle, pageUrl);

  const selHtml = getSelectionHtml();
  let selText = selHtml ? htmlToTextWithParagraphs(selHtml) : "";
  selText = cleanTextBySite(selText, pageUrl);

  if (selText) {
    sendResponse({
      pageTitle,
      pageUrl,
      selectionText: selText,
      extractedFullText: "",
      extractedMeta: {}
    });
    return;
  }

  const extracted = extractWithReadability(pageUrl);

  sendResponse({
    pageTitle: (extracted && extracted.title) ? extracted.title : pageTitle,
    pageUrl,
    selectionText: "",
    extractedFullText: (extracted && extracted.text) ? extracted.text : "",
    extractedMeta: extracted ? {
      excerpt: extracted.excerpt,
      byline: extracted.byline,
      siteName: extracted.siteName
    } : {}
  });
});

// 如果当前就是发帖页，尝试自动填充
fillForumPostFormFromStorage();

// content.js
// 功能：
// 1) 任意网页：优先抓“选中内容”，未选中则用 Readability 提取全文
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
    const m = str.match(/^((?:【[^【】]+】)+)/); // 保留已有前缀块
    if (m) return `${m[1]}${prefix}${str.slice(m[1].length)}`;
    return `${prefix}${str}`;
  };
  const ensureSuffix = (str, suffix) => {
    if (!str || str.includes(suffix)) return str;
    return `${str}${suffix}`;
  };

  // 腾讯新闻
  const isTencentNews =
    /(^|\.)qq\.com/i.test(new URL(pageUrl || location.href).hostname) ||
    /inews\.qq\.com/i.test(pageUrl || "") ||
    /news\.qq\.com/i.test(pageUrl || "");

  if (isTencentNews) {
    t = t.replace(/(\s*[_\-｜|]\s*腾讯新闻\s*)$/i, "");
    t = t.replace(/(\s*[_\-｜|]\s*腾讯网\s*)$/i, "");
  }

  // 知乎
  const isZhihu = /(^|\.)zhihu\.com/i.test(new URL(pageUrl || location.href).hostname);
  if (isZhihu) {
    t = t.replace(/\s*[-]\s*.*?的回答/, "");
    // 知乎适配：不需要新闻前缀，将站点标识放在标题后方
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
    // 1. 去除开头的“xxx人赞同了该回答”
    t = t.replace(/^\s*.*?人赞同了该回答\s*/, "");

    // 2. 截断“编辑于...”或“发布于...”
    // 示例：编辑于 2026-01-05 14:22・辽宁
    // 示例：发布于 2026-01-04 12:05
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
    // 1) 直接从 byline 中抓取 “关于作者xxx” 或首个连续用户名
    const bylineMatch = text.match(/关于作者\s*([^\s·,，。/|｜]+)/);
    if (bylineMatch && bylineMatch[1]) return bylineMatch[1];
    const firstToken = text.match(/^[\p{L}\p{N}_-]+/u);
    if (firstToken && firstToken[0]) return firstToken[0];

    // 2) DOM fallback：常见作者位置
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
    // ignore and fall through
  }
  return bylineText;
}

/**
 * 归一化图片 URL：
 * - //example.com/a.jpg?x=1 -> https://example.com/a.jpg
 * - http(s)://... -> 去掉 ?# 后缀
 * - data: / blob: -> 丢弃
 * - 相对路径 -> 转绝对
 *
 * allowNoExt=true：允许腾讯这种无扩展名图片（/641）返回
 */
function normalizeImageUrl(src, allowNoExt = false) {
  if (!src) return "";
  src = String(src).trim();
  if (!src) return "";

  if (src.startsWith("data:") || src.startsWith("blob:")) return "";
  if (src.startsWith("//")) src = "https:" + src;

  try {
    src = new URL(src, location.href).toString();
  } catch (_) {}

  src = src.split("#")[0].split("?")[0];

  const lower = src.toLowerCase();
  const hasExt = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".avif"].some(ext => lower.endsWith(ext));

  if (hasExt) return src;
  if (allowNoExt) return src; // 允许腾讯这种无扩展名

  return "";
}

/**
 * 生成要写入帖子的图片表示：
 * - 普通站点：优先输出直链（你论坛可识别 .jpg 自动渲染）
 * - 腾讯新闻（无扩展名常见）：输出 <img src="...">
 */
function formatImageForPost(url) {
  if (!url) return "";

  const isTencentInews = /inews\.gtimg\.com/i.test(url) || /inews\.qq\.com/i.test(location.href);

  if (isTencentInews) {
    return `<img src="${url}">`;
  }

  // 默认：输出 url（方便你论坛识别 jpg/png 自动渲染）
  return url;
}

/**
 * HTML -> 纯文本（尽量保留段落/换行/列表）
 * 并把 <img> 转成图片直链 或 <img src="...">（腾讯适配）
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

    // 图片处理：腾讯新闻可能无扩展名，所以 allowNoExt=true
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
 * Readability 全文提取（返回：带段落文本 + 元信息）
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

  const now = new Date();
  const ts =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ` +
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

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

  // 标题：你之前需要加【新闻】前缀就在这里加
  // const TITLE_PREFIX = "【新闻】";
  // const finalTitle = (lastClip.pageTitle || "转发").startsWith(TITLE_PREFIX) ? (lastClip.pageTitle || "转发") : (TITLE_PREFIX + (lastClip.pageTitle || "转发"));
  // titleEl.value = truncate(finalTitle, 60);

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

// 处理 background.js 发来的“抓取内容”请求
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "GET_CLIP") return;

  const rawTitle = document.title || "";
  const pageUrl = location.href || "";
  const pageTitle = cleanTitleBySite(rawTitle, pageUrl);

  // 1) 有选中 → 用选中（保留段落 + 处理图片）
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

  // 2) 无选中 → Readability 全文提取（标题也清洗）
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

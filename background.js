const FORUM_POST_URL = "https://www.253874.net/post";
const AUTO_SUBMIT = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "repost_to_253874",
    title: "转发到 253874（填充发帖页）",
    contexts: ["page", "selection", "link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "repost_to_253874") return;

  const payload = await chrome.tabs.sendMessage(tab.id, { type: "GET_CLIP" }).catch(() => null);
  if (!payload) return;

  payload.autoSubmit = AUTO_SUBMIT;

  await chrome.storage.local.set({ lastClip: payload });

  // 视频帖子需要指定分类 typeid=8
  const postUrl = payload.isVideo
    ? `${FORUM_POST_URL}?type_id=8`
    : FORUM_POST_URL;
  await chrome.tabs.create({ url: postUrl });
});

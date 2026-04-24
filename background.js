const FORUM_POST_URL = "https://www.253874.net/post";
const AUTO_SUBMIT = false; // ← 改成 true 就会自动发帖（不推荐默认开）

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
  await chrome.tabs.create({ url: FORUM_POST_URL });
});

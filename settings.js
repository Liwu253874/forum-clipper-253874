// settings.js - 设置页逻辑

document.addEventListener("DOMContentLoaded", async () => {
  const checkbox = document.getElementById("titleTagEnabled");

  // 读取当前设置
  const result = await chrome.storage.sync.get({ titleTagEnabled: true });
  checkbox.checked = result.titleTagEnabled;

  // 切换时自动保存
  checkbox.addEventListener("change", async () => {
    await chrome.storage.sync.set({ titleTagEnabled: checkbox.checked });
    showToast();
  });
});

function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}

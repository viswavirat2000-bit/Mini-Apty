chrome.runtime.onInstalled.addListener(() => {
  console.log("Mini Apty background installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ status: "ok" });
  }
  return true;
});

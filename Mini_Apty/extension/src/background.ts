chrome.runtime.onInstalled.addListener(() => {
  console.log("Mini Apty background installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ status: "ok" });
    return true;
  }

  if (message?.type === "CAPTURE_RESULT" && message.target) {
    if (message.skipStorage) {
      sendResponse({ status: "captured" });
      return true;
    }
    const key = "miniAptyPendingSteps";
    chrome.storage.local.get(key, (result) => {
      const pending = Array.isArray(result[key]) ? result[key] : [];
      const nextPending = [...pending, { target: message.target, trigger: message.trigger || "manual" }];
      chrome.storage.local.set({ [key]: nextPending }, () => {
        chrome.runtime.sendMessage({ type: "PENDING_STEPS_UPDATED", steps: nextPending });
        sendResponse({ status: "captured" });
      });
    });
    return true;
  }

  return true;
});

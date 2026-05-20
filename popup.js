(function () {
  "use strict";

  const button = document.getElementById("dyco-toggle");
  const status = document.getElementById("dyco-status");

  button.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      status.textContent = "No active tab found.";
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { type: "DYCO_TOGGLE" });
      window.close();
    } catch (error) {
      status.textContent = "Open or reload a YouTube video first.";
    }
  });
})();

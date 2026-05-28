(function () {
  "use strict";

  const capturedTimedText = [];

  chrome.webRequest.onBeforeRequest.addListener((details) => {
    try {
      const url = new URL(details.url);
      capturedTimedText.unshift({
        url: details.url,
        videoId: url.searchParams.get("v") || "",
        languageCode: url.searchParams.get("lang") || "",
        targetLanguageCode: url.searchParams.get("tlang") || "",
        kind: url.searchParams.get("kind") || "",
        format: url.searchParams.get("fmt") || "",
        name: url.searchParams.get("name") || "",
        hasPot: Boolean(url.searchParams.get("pot")),
        timestamp: Date.now()
      });

      capturedTimedText.splice(25);
    } catch (error) {
    }
  }, {
    urls: ["https://www.youtube.com/api/timedtext*"]
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "DYCO_GET_CAPTURED_TIMEDTEXT") {
      const maxAgeMs = 15000;
      const now = Date.now();
      const candidates = capturedTimedText.filter((item) => {
        if (now - item.timestamp > maxAgeMs) return false;
        if (message.startedAt && item.timestamp < message.startedAt) return false;
        if (message.videoId && item.videoId !== message.videoId) return false;
        if (message.languageCode && item.languageCode !== message.languageCode) return false;
        if (message.kind && item.kind && item.kind !== message.kind) return false;
        if (message.requirePot && !item.hasPot) return false;
        return true;
      });
      const sourceOnly = candidates.find((item) => !item.targetLanguageCode);
      const match = message.targetLanguageCode
        ? candidates.find((item) => item.targetLanguageCode === message.targetLanguageCode) || sourceOnly
        : sourceOnly;

      sendResponse({
        url: match ? match.url : "",
        languageCode: match ? match.languageCode : "",
        targetLanguageCode: match ? match.targetLanguageCode : "",
        format: match ? match.format : "",
        timestamp: match ? match.timestamp : 0
      });
      return false;
    }

    if (!message || message.type !== "DYCO_FETCH_CAPTIONS" || !message.url) {
      return false;
    }

    fetch(message.url, {
      credentials: "include"
    })
      .then(async (response) => {
        const text = await response.text();
        sendResponse({
          ok: response.ok,
          status: response.status,
          text
        });
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          status: 0,
          error: error && error.message ? error.message : String(error)
        });
      });

    return true;
  });
})();

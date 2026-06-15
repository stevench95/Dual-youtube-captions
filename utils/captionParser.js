(function () {
  "use strict";

  const DYCO = (window.DYCO = window.DYCO || {});

  function decodeEntities(value) {
    if (!value || typeof value !== "string") return "";

    const textarea = decodeEntities.textarea || document.createElement("textarea");
    decodeEntities.textarea = textarea;
    textarea.innerHTML = value;
    return textarea.value;
  }

  function parseJson3(payload) {
    if (!payload || !Array.isArray(payload.events)) return [];

    const captions = [];
    for (const event of payload.events) {
      if (!event || typeof event.tStartMs !== "number" || !Array.isArray(event.segs)) {
        continue;
      }

      const text = event.segs
        .map((segment) => segment && segment.utf8 ? segment.utf8 : "")
        .join("")
        .replace(/\s+/g, " ")
        .trim();

      if (!text) continue;

      const start = event.tStartMs / 1000;
      const durationMs = typeof event.dDurationMs === "number" ? event.dDurationMs : 2500;
      const end = Math.max(start + 0.2, (event.tStartMs + durationMs) / 1000);

      captions.push({
        start,
        end,
        text: decodeEntities(text)
      });
    }

    for (let index = 0; index < captions.length - 1; index += 1) {
      captions[index].end = Math.min(captions[index].end, captions[index + 1].start);
    }

    return captions;
  }

  function parseXmlTimedText(text) {
    if (!text || typeof DOMParser === "undefined") return [];

    const documentXml = new DOMParser().parseFromString(text, "text/xml");
    if (documentXml.querySelector("parsererror")) return [];

    return Array.from(documentXml.querySelectorAll("text")).map((node) => {
      const start = Number(node.getAttribute("start") || "0");
      const duration = Number(node.getAttribute("dur") || "2.5");
      return {
        start,
        end: Math.max(start + 0.2, start + duration),
        text: decodeEntities(node.textContent || "").replace(/\s+/g, " ").trim()
      };
    }).filter((caption) => caption.text);
  }

  function parseCaptionResponse(text) {
    if (!text || typeof text !== "string") return [];

    const trimmed = text.trim();
    const withoutXssi = trimmed.startsWith(")]}'")
      ? trimmed.slice(trimmed.indexOf("\n") + 1).trim()
      : trimmed;

    if (withoutXssi.startsWith("{") || withoutXssi.startsWith("[")) {
      return parseJson3(JSON.parse(withoutXssi));
    }

    if (withoutXssi.startsWith("<")) {
      return parseXmlTimedText(withoutXssi);
    }

    throw new Error(`Unsupported caption response: ${withoutXssi.slice(0, 120)}`);
  }

  function makeCaptionUrl(track) {
    if (!track || !track.baseUrl) return "";

    const url = new URL(track.baseUrl, window.location.href);

    if (!url.searchParams.has("fmt")) {
      url.searchParams.set("fmt", "json3");
    }
    if (track.translationLanguageCode) {
      url.searchParams.set("tlang", track.translationLanguageCode);
    } else {
      url.searchParams.delete("tlang");
    }

    return url.toString();
  }

  function makeTranslatedCapturedUrl(capturedUrl, languageCode) {
    if (!capturedUrl || !languageCode) return capturedUrl || "";

    const url = new URL(capturedUrl);
    url.searchParams.set("tlang", languageCode);
    url.searchParams.delete("origin_tlang");
    url.searchParams.set("fmt", "json3");
    return url.toString();
  }

  DYCO.captionParser = {
    makeCaptionUrl,
    makeTranslatedCapturedUrl,
    parseCaptionResponse,
    parseJson3
  };
})();

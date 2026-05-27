(function () {
  "use strict";

  const DYCO = (window.DYCO = window.DYCO || {});
  const converter = window.OpenCC && window.OpenCC.Converter
    ? window.OpenCC.Converter({ from: "cn", to: "tw" })
    : null;

  function convertText(text) {
    if (!text || typeof text !== "string") return text || "";
    return converter ? converter(text) : text;
  }

  function convertCaptions(captions) {
    if (!Array.isArray(captions) || captions.length === 0) return captions || [];

    return captions.map((caption) => ({
      ...caption,
      text: convertText(caption.text)
    }));
  }

  DYCO.zhHansToHant = {
    convertCaptions,
    convertText
  };
})();

(function () {
  "use strict";

  const SOURCE = "DYCO_BRIDGE";
  const REQUEST_TYPE = "DYCO_REQUEST_PLAYER_RESPONSE";
  const RESPONSE_TYPE = "DYCO_PLAYER_RESPONSE";
  const PRIME_TYPE = "DYCO_PRIME_CAPTIONS";

  function textOf(value) {
    if (!value) return "";
    if (typeof value.simpleText === "string") return value.simpleText;
    if (Array.isArray(value.runs)) return value.runs.map((run) => run.text || "").join("");
    return "";
  }

  function getPlayerResponse() {
    const player = document.getElementById("movie_player");
    if (player && typeof player.getPlayerResponse === "function") {
      try {
        const response = player.getPlayerResponse();
        if (response) return response;
      } catch (error) {
      }
    }
    return window.ytInitialPlayerResponse;
  }

  function getVideoId(response) {
    return response && response.videoDetails && response.videoDetails.videoId ||
      new URLSearchParams(window.location.search).get("v") ||
      "";
  }

  function getRenderer(response) {
    return response &&
      response.captions &&
      response.captions.playerCaptionsTracklistRenderer;
  }

  function publish() {
    const response = getPlayerResponse();
    const videoId = getVideoId(response);
    const renderer = getRenderer(response);
    if (!renderer) {
      window.postMessage({
        source: SOURCE,
        type: RESPONSE_TYPE,
        payload: { videoId, captionTracks: [], translationLanguages: [] }
      }, window.location.origin);
      return;
    }

    const captionTracks = (renderer.captionTracks || []).map((track) => ({
      baseUrl: track.baseUrl || "",
      languageCode: track.languageCode || "",
      name: textOf(track.name),
      kind: track.kind || "",
      vssId: track.vssId || "",
      isTranslatable: Boolean(track.isTranslatable)
    })).filter((track) => track.baseUrl);

    const translationLanguages = (renderer.translationLanguages || []).map((language) => ({
      languageCode: language.languageCode || "",
      name: textOf(language.languageName)
    })).filter((language) => language.languageCode);

    window.postMessage({
      source: SOURCE,
      type: RESPONSE_TYPE,
      payload: { videoId, captionTracks, translationLanguages }
    }, window.location.origin);
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.source !== SOURCE) {
      return;
    }

    if (event.data.type === REQUEST_TYPE) {
      publish();
    }

    if (event.data.type === PRIME_TYPE) {
      primeCaptions(event.data.payload);
    }
  });

  function primeCaptions(track) {
    const player = document.getElementById("movie_player");
    if (!player || typeof player.toggleSubtitlesOn !== "function") return;

    const wasOn = typeof player.isSubtitlesOn === "function" ? player.isSubtitlesOn() : false;
    try {
      if (track && typeof player.setOption === "function") {
        player.setOption("captions", "track", {
          languageCode: track.sourceLanguageCode || track.languageCode,
          kind: track.kind || undefined,
          vssId: track.vssId || undefined
        });
        if (track.translationLanguageCode) {
          try {
            player.setOption("captions", "translationLanguage", {
              languageCode: track.translationLanguageCode
            });
          } catch (error) {
          }
        }
      }
      player.toggleSubtitlesOn();
    } catch (error) {
      return;
    }

    if (!wasOn && typeof player.toggleSubtitles === "function") {
      setTimeout(() => {
        try {
          if (player.isSubtitlesOn && player.isSubtitlesOn()) {
            player.toggleSubtitles();
          }
        } catch (error) {
        }
      }, 900);
    }
  }

  document.addEventListener("yt-navigate-finish", () => {
    setTimeout(publish, 150);
    setTimeout(publish, 700);
    setTimeout(publish, 1500);
  });
  setTimeout(publish, 0);
  setTimeout(publish, 1000);
})();

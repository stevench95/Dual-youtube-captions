(function () {
  "use strict";

  const DYCO = (window.DYCO = window.DYCO || {});

  function findCaptionAt(captions, time, cursor) {
    if (!Array.isArray(captions) || captions.length === 0) {
      return { index: -1, caption: null };
    }

    let index = Number.isInteger(cursor) ? cursor : -1;
    if (index >= 0 && index < captions.length) {
      const current = captions[index];
      if (time >= current.start && time < current.end) {
        return { index, caption: current };
      }
      if (index + 1 < captions.length) {
        const next = captions[index + 1];
        if (time >= next.start && time < next.end) {
          return { index: index + 1, caption: next };
        }
      }
    }

    let low = 0;
    let high = captions.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const caption = captions[mid];

      if (time < caption.start) {
        high = mid - 1;
      } else if (time >= caption.end) {
        low = mid + 1;
      } else {
        return { index: mid, caption };
      }
    }

    return { index: low > 0 ? low - 1 : -1, caption: null };
  }

  function createRafSync(video, onTick) {
    let rafId = 0;
    let active = false;
    let lastTime = -1;

    const tick = () => {
      if (!active) return;

      const time = video.currentTime || 0;
      if (Math.abs(time - lastTime) >= 0.05) {
        lastTime = time;
        onTick(time);
      }

      rafId = requestAnimationFrame(tick);
    };

    return {
      start() {
        if (active) return;
        active = true;
        rafId = requestAnimationFrame(tick);
      },
      stop() {
        active = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      },
      flush() {
        lastTime = -1;
        onTick(video.currentTime || 0);
      }
    };
  }

  DYCO.timeSync = {
    createRafSync,
    findCaptionAt
  };
})();

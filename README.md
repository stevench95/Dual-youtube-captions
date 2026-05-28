# Dual YouTube Caption Overlay

A ***Manifest V3 Chrome extension*** that displays two YouTube-provided caption tracks at the same time.

The extension reads YouTube official caption metadata, including auto-generated captions and YouTube auto-translate tracks. ***It does not use external translation APIs and does not scrape YouTube's native caption DOM.***

![Dual YouTube Caption Overlay screenshot 1](./1.jpg)

![Dual YouTube Caption Overlay screenshot 2](./2.jpg)

## Features

- Select a primary and secondary caption track.
- Supports manual captions, auto-generated captions, and YouTube auto-translate.
- Uses bundled OpenCC conversion as a workaround for Traditional Chinese auto-translate timing issues.
- Displays both captions in a custom overlay that follows the video.
- Adds a `Dual` control inside the YouTube player UI when available.
- Stores user settings with `chrome.storage.local`.
- Adjustable font size and caption background opacity.
- Keyboard shortcut: `Alt+D` toggles the overlay.

## Install

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this project folder.
5. Open or refresh a YouTube video page.

After editing extension files, reload the extension from `chrome://extensions` and refresh the YouTube tab.

## Usage

1. Open a YouTube video with captions.
2. Move the mouse over the YouTube player controls.
3. Click the `Dual` button.
4. Choose the primary and secondary caption tracks.
5. Adjust font size or background opacity if needed.

If the `Dual` button cannot be inserted into YouTube's native controls, the extension shows a small floating fallback button near the video.

## How It Works

The content script reads YouTube caption metadata from the player response, fetches official timedtext caption data, parses the caption timing, and renders two selected caption tracks in a custom overlay.

For Traditional Chinese auto-translate, the extension avoids YouTube's native Traditional Chinese timedtext path when possible. It requests Simplified Chinese (`zh-Hans`) instead, then converts the caption text locally to Traditional Chinese (`zh-Hant`) with the bundled OpenCC converter.

## Privacy

The extension only requests captions from YouTube's own caption endpoints. It does not send caption text to external translation APIs, AI services, or third-party servers.

## Dependencies

This extension does not require an npm install or build step. The OpenCC-compatible converter is bundled in `utils/zhHansToHant.js` and loaded locally by the extension.

## Project Structure

```text
manifest.json
background.js
bridge.js
content.js
overlay.css
popup.html
popup.js
utils/
  captionParser.js
  timeSync.js
  zhHansToHant.js
  zhHansToHantAdapter.js
```

## Troubleshooting

- If captions do not appear, reload the extension in `chrome://extensions` and refresh the YouTube tab.
- If YouTube rate-limits caption requests, wait briefly before refreshing captions.
- Some videos do not expose usable caption timing data, especially for auto-translated Traditional Chinese.

## Notes

- Captions are fetched only from YouTube caption endpoints.
- Some videos require YouTube's own timedtext request token. The extension may briefly prime YouTube captions internally so the official caption URL can be captured.
- Live streams and videos without available caption data may not show dual captions.
- YouTube changes its internal player behavior frequently, so reload the extension and refresh the page after updates.

## Known Issue: Auto-Generated to Traditional Chinese

When using YouTube auto-generated captions translated to Traditional Chinese, captions may appear later than Simplified Chinese, freeze for a while, or suddenly output many translated lines at once.

This is usually caused by YouTube's own auto-translate timing data, not by this extension. The translated text can arrive without stable per-line timestamps, with delayed chunking, or with extra Simplified-to-Traditional conversion latency. When the timing data is missing, delayed, or grouped into large chunks, the extension can only render the captions after YouTube provides usable timed caption data.

### Technical Background

YouTube has not officially documented this behavior. Based on observed timedtext responses, two likely causes are:

1. **Missing Timestamps in Network Requests:**
   Simplified Chinese responses (`zh-Hans` / `zh-CN`) often provide more stable timing data than Traditional Chinese responses (`zh-Hant` / `zh-TW`). Traditional Chinese responses may lack precise alignment or arrive with delayed grouped segments.

2. **Two-Step Chinese Variant Handling:**
   YouTube may internally produce Simplified Chinese first, then convert or adapt the output for Traditional Chinese. That extra variant step can add latency or produce less stable caption chunks.

_Note: This explanation is based on observed YouTube caption behavior. YouTube's underlying caption and translation systems are not publicly documented._

### Current Workaround

For Traditional Chinese auto-translate, the extension currently requests YouTube's Simplified Chinese translation (`zh-Hans`) first, then converts the caption text locally to Traditional Chinese (`zh-Hant`) with the bundled OpenCC converter. This avoids relying on YouTube's native Traditional Chinese auto-translate path, which often has worse timing data.

This is a temporary workaround. The long-term fix still depends on YouTube improving its own Traditional Chinese auto-translate timing and caption data.

# 🤖 AFK DM Automation V5

A Chrome extension that automatically updates Instagram DM message drafts with percentage progression at a 50-second interval.

**Version:** 5.0.0  
**Platform:** Google Chrome  
**Interface:** Chrome Side Panel  
**Status:** V5 Release

---

## ✨ Features

- ⏱️ **50-Second Interval** — Updates the message draft every 50 seconds.
- 📊 **Percentage Progression** — Automatically progresses from 1% to 100%.
- 💬 **Custom Message** — Use your own text, including emojis.
- 🔄 **Automatic Draft Replacement** — Replaces the existing text in the Instagram message composer with the latest percentage draft.
- 🔍 **Automatic Zoom** — Sets the target Instagram tab zoom to 100% while running.
- ↩️ **Zoom Restoration** — Restores the previous zoom when paused, reset, completed, or stopped by an error.
- ▶️ **Start / Pause / Reset** — Control the automation from the side panel.
- 🎨 **Custom Logo & Interface** — Modern dark-themed interface.

## 🖥️ How It Works

1. Enter your custom message.
2. Open the intended Instagram chat.
3. Click **Start**.
4. The extension immediately inserts your message with `1%`.
5. Every 50 seconds, it replaces the draft with the next percentage.
6. The process stops automatically at `100%`.

**Example:**

```text
Pre Happy Birthday 1%
Pre Happy Birthday 2%
Pre Happy Birthday 3%
...
Pre Happy Birthday 100%
```

## 📥 Installation

1. Download the latest V5 ZIP from the Releases page.
2. Extract the ZIP file.
3. Open Google Chrome.
4. Visit `chrome://extensions`.
5. Enable **Developer mode**.
6. Remove any older version of the extension.
7. Click **Load unpacked**.
8. Select the extracted `AFK-DM-Automation-V5` folder containing `manifest.json`.
9. Open Instagram and navigate to the intended chat.
10. Refresh Instagram and open the extension side panel.
11. Enter your message and click **Start**.

## ⚠️ Important Notice

- This extension only inserts and replaces message drafts.
- It does **NOT** automatically click Send or press Enter.
- You must manually review and send each message.
- Any unsent text in the message composer will be erased during an update.
- Keep the same Instagram chat tab active while the automation runs.
- The extension pauses if the original Instagram tab is no longer active or its URL changes.
- Instagram may change its interface, which can affect compatibility.

Use responsibly and only message people who expect to receive your messages. Follow Instagram's rules.

## 🛠️ Technologies

- HTML5
- CSS3
- JavaScript
- Chrome Extension Manifest V3
- Chrome Storage API
- Chrome Alarms API
- Chrome Tabs API
- Chrome Side Panel API

## 👨‍💻 Developer

**Jadid Shahriar**

GitHub: [@jadidshahriar67-cpu](https://github.com/jadidshahriar67-cpu)

---

**AFK DM Automation V5 — Timed Draft Assistant.**

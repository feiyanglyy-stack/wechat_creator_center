<p align="center">
  <img src="assets/banner.png" alt="WeChat Creator Center · 谋士智能创作中心">
</p>

# 🔮 WeChat Creator Center · 谋士智能创作中心

**English** · [中文](README.md)

A desktop-grade co-writing suite for **WeChat Official Account** long-form articles — combining **live mobile typography preview**, **block-based paragraph editing**, an **AI writing copilot**, and **one-click push to the draft box**.

Typography is tuned for in-depth technical posts (snug line-height, flush first lines, full-width H2 underlines, quote boxes, WeChat-style small text) to closely match how WeChat renders on mobile.

> Pure front-end (HTML/CSS/JS) + a local Python server. No cloud, no account — all your data stays on your own machine.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 📱 **Live mobile preview** | WeChat-native font size (16px), line-height (1.75), letter spacing, light/dark modes, full-width H2 dividers and quote boxes — aligned to the Official Account backend rendering. Edit title, author, date and account name in real time. |
| 📖 **Block-based editor** | Auto-parses an article into paragraph / heading / quote / image / video / table cards. `🔼`/`🔽` to reorder, `➕` to insert below, `❌` to delete. |
| 🤖 **AI writing copilot** | Works with any OpenAI-compatible model (DeepSeek by default). Without an API key, a local "🦊 AI assistant" simulates replies offline; with a key it connects to the real model to polish titles, expand intros and distill takeaways. |
| 💾 **Local Headless CMS** | A background server on `127.0.0.1:8080` writes your edits back to `output/pushed_article.html` with one click. |
| 🚀 **One-click draft push** | `push_to_draft.py` reads your local article, uploads referenced images to the WeChat CDN, and pushes the rich article straight into your Official Account draft box. |

---

## 🚀 Quick Start

Two ways to use it — pick whichever fits:

### Option A: Download the standalone EXE (easiest, recommended)

1. Go to the repo's **[Releases](../../releases)** page and download the latest `wechat_creator_center.exe`.
2. Double-click to run. A standalone desktop window opens and the local CMS service starts in the background. Portable, no install.
3. *Note: the binary is unsigned, so Windows SmartScreen may warn on first run — click "More info" → "Run anyway".*

### Option B: Run with Python (uses your default browser)

1. Install [Python 3.8+](https://www.python.org/downloads/), checking **Add Python to PATH**.
2. Double-click **`双击启动创作中心.bat`** in the repo root (or run `python local_server.py`).
3. It starts a local server on `127.0.0.1:8080` and opens the Creator Center in your default browser.
4. **Browser mode uses only the Python standard library — no `pip install` needed, and no antivirus false positives.**

---

## ⚙️ Configuring WeChat credentials (only for draft push)

If you only need to lay out + copy rich text into the WeChat backend manually, **no setup is required** — skip this section.

To use `push_to_draft.py` for one-click draft push:

1. In the Creator Center's "🔑 WeChat API Credentials" card, enter your `AppID` and `AppSecret` and save — it writes `output/wechat.env` automatically.
   - Or copy [`wechat.env.example`](wechat.env.example) to `output/wechat.env` and fill it in.
   - Credentials: WeChat Official Accounts Platform → Settings & Development → Basic configuration → Developer ID / Developer password.
2. WeChat requires your server's egress IP to be in the "IP allowlist" (Basic configuration page), or it will refuse to issue an access token.

> ⚠️ **`output/wechat.env` holds sensitive secrets — it is git-ignored. Never commit or share it.**

---

## 📋 Draft push usage

```bash
pip install requests          # the push feature needs requests
# 1) In the "Block editor" tab, click "Save to local Headless CMS" -> exports output/pushed_article.html
# 2) Open push_to_draft.py and edit the CONFIG block (title / author / digest / cover image)
python push_to_draft.py
```

The script discovers local images referenced in the article, uploads them to the WeChat CDN, swaps in the URLs, and pushes the article to your draft box. Then review and broadcast it from the Official Account backend.

---

## 📂 Project layout

```text
wechat_creator_center/
├── index.html                  # Front-end (ships with a sample article as a demo)
├── style.css                   # Glassmorphic UI + WeChat-native dark-mode styles
├── script.js                   # Reverse parsing, block cards, AI integration, persistence
├── local_server.py             # Browser-mode local server (stdlib only, Option B)
├── app_launcher.py             # Standalone EXE: pywebview window + CMS server (Option A)
├── push_to_draft.py            # One-click WeChat draft push (generic)
├── package_desktop_app.py      # PyInstaller packaging script
├── wechat_creator_center.spec  # PyInstaller config
├── 双击启动创作中心.bat          # Option B launcher
├── wechat.env.example          # Credentials template
├── requirements.txt            # Optional deps (packaging / push)
├── *.png                       # Demo article images
├── LICENSE                     # MIT
└── output/                     # Generated at runtime (credentials / exported article); git-ignored
```

---

## 🛠️ Build the EXE yourself (optional)

```bash
pip install pywebview pyinstaller
python package_desktop_app.py
# Output: dist/wechat_creator_center.exe
```

Or just push a `v*` tag — the included GitHub Actions workflow builds the Windows EXE and attaches it to the release automatically.

---

## 🧱 Tech stack

- **Front-end**: HTML5 + vanilla CSS3 (glassmorphism) + vanilla JavaScript (zero deps)
- **Local server**: Python standard-library `http.server`
- **Desktop packaging**: [`pywebview`](https://pywebview.flowrl.com/) (native WebView) + [`PyInstaller`](https://pyinstaller.org/)
- **Push**: [`requests`](https://requests.readthedocs.io/) + the official WeChat Official Accounts API

---

## 📄 License

[MIT](LICENSE) — free to use, modify, distribute and use commercially; just keep the copyright notice.

---

## 🙋 Notes

- The sample article and images only demonstrate the layout — replace them freely with your own content in the UI.
- Fully local: nothing is collected or uploaded; credentials live only in your local `output/` directory.
- Issues / PRs welcome.

# 送信者 Sender-san

A dark-themed, Japanese-aesthetic web app that helps developers automate professional outreach to companies — for job hunting, investor pitching, or offering freelance/contract services. Fully client-side: all data lives in your browser, encrypted with your PIN. No backend, no server, no data leaves your machine.

---

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Google AI Studio account** → Gemini API key — [aistudio.google.com](https://aistudio.google.com)
- **ContactOut account** → API key — [contactout.com](https://contactout.com)
- **Google Cloud project** with Gmail API enabled → OAuth 2.0 Client ID (see below)

### Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **Gmail API** under "APIs & Services → Library"
4. Go to "APIs & Services → Credentials"
5. Create **OAuth 2.0 Client ID** → Web application
6. Add your app URL to "Authorised JavaScript origins":
   - Local: `http://localhost:5173`
   - Production: `https://yourusername.github.io`
7. Copy the **Client ID** — you'll enter it during first-run setup

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173/sender-san/](http://localhost:5173/sender-san/)

---

## GitHub Pages Deployment

1. Fork this repo on GitHub
2. In `vite.config.js`, the `base` is already set to `/sender-san/`
3. Run:
   ```bash
   npm run deploy
   ```
4. In your repo settings → Pages, set source to the `gh-pages` branch
5. Add your `https://yourusername.github.io` to your Google OAuth Client's authorised origins

Your app will be live at `https://yourusername.github.io/sender-san/`

---

## First Run

On first load you'll go through a 4-step setup:

1. **CV Upload** — upload your PDF or DOCX CV. Parsed entirely in your browser.
2. **Your Info** — GitHub, LinkedIn, skills, location, work preferences.
3. **AI Analysis** — Gemini analyses your CV and builds your career profile. All editable.
4. **Keys & PIN** — enter your API keys and create a 6-digit PIN.

Your PIN is used to derive an AES-256 encryption key via PBKDF2 (100,000 iterations). The key is never stored — only held in memory for your session. All IndexedDB data is AES-GCM encrypted.

### Backup & Restore

- **Export**: History page → "Export backup" — downloads an encrypted JSON file. Not human-readable without your PIN.
- **Import**: History page → "Import backup" — restore from a previous export.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 (HashRouter) |
| Storage | IndexedDB via `idb`, AES-GCM encrypted |
| AI | Google Gemini 1.5 Pro with Search Grounding |
| Email | Gmail API via OAuth 2.0 |
| Email Discovery | ContactOut API |
| File Parsing | pdfjs-dist + mammoth |

---

## Contributing

Contributions welcome. Open an issue or pull request on GitHub.

---

## License

MIT — see [LICENSE](LICENSE)

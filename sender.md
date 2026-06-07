# Sender-san — Full Project Specification for Claude Code

> **"送信者" — Mr. Sender**
> A dark-themed, Japanese-aesthetic web app that helps developers automate professional outreach to companies — for job hunting, investor pitching, or offering freelance/contract services.

---

## Overview

Sender-san is a fully client-side web application. There is no backend server. All data lives in the user's browser via IndexedDB. All AI is powered by Groq API (Llama 3.3 70B). Email sending goes through Gmail OAuth (Google Identity Services + Gmail REST API). ContactOut API handles email discovery as a fallback when the LLM cannot find a verified contact email.

---

## Tech Stack

| Layer           | Choice                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Framework       | React 18 + Vite                                                                                     |
| Styling         | Tailwind CSS v3                                                                                     |
| Routing         | React Router v6 — **HashRouter** (required for GitHub Pages static hosting)                         |
| Storage         | IndexedDB via `idb` npm package, AES-GCM encrypted via Web Crypto API                               |
| AI              | Groq API (`groq-sdk`) — Llama 3.3 70B (`llama-3.3-70b-versatile`), free tier, no credit card needed |
| Email Auth      | Gmail API via OAuth 2.0 (`@react-oauth/google`), refresh token stored encrypted in IndexedDB        |
| Email Discovery | ContactOut API (REST, called from browser with user-provided API key)                               |
| File Parsing    | `pdfjs-dist` for PDF CVs, `mammoth` for .docx CVs                                                   |
| Scheduling      | No server cron — IndexedDB timestamps gate daily sends. User manually triggers each day's batch.    |
| Deployment      | GitHub Pages via `gh-pages` npm package                                                             |

---

## Design System

### Colors

| Token        | Value     | Usage                                                   |
| ------------ | --------- | ------------------------------------------------------- |
| Background   | `#0D0D0D` | App background                                          |
| Surface      | `#161616` | Cards, panels                                           |
| Border       | `#2A2A2A` | Card borders, dividers                                  |
| Primary      | `#C0392B` | Crimson red — torii gate red. CTAs, active nav, accents |
| Secondary    | `#C9A84C` | Muted gold — decorative highlights                      |
| Text Primary | `#F0F0F0` | Body text                                               |
| Text Muted   | `#888888` | Labels, secondary info                                  |

### Typography

- **UI Font**: `Geist` — all interface text
- **Decorative Font**: `Noto Serif JP` — used **sparingly** as large watermark kanji behind section headers only. Never for body text.

### Kanji Watermarks (section backgrounds)

| Section         | Kanji | Meaning          |
| --------------- | ----- | ---------------- |
| Outreach / Send | 送信  | Send / Transmit  |
| Jobs            | 仕事  | Work             |
| Investors       | 投資  | Investment       |
| Services        | 提供  | Offer / Provide  |
| History         | 履歴  | History / Record |

Watermarks: large (12–16rem), opacity ~0.04, positioned absolute behind section heading, non-interactive, `user-select: none`.

### Logo

Text logo, top-left of app header:

- `送信者` in Noto Serif JP (small, ~1rem)
- `Sender-san` in Geist next to it, crimson `#C0392B`

### General Aesthetic Rules

- Dark mode only — no light mode toggle
- Active nav items: crimson underline, no background highlight
- Smooth `200ms ease` transitions on all interactive elements
- No heavy animations — micro-interactions only
- Cards: `#161616` background, `1px solid #2A2A2A` border, `8px` border radius
- Buttons: crimson primary, `#2A2A2A` secondary/ghost
- Mobile responsive — Tailwind responsive layout throughout

---

## Encryption Implementation

### PIN Setup (first run)

- User creates a 6-digit numeric PIN during onboarding
- PIN is used to derive the encryption key — it is **never stored anywhere**

### Key Derivation

```
PBKDF2(PIN, salt, 100_000 iterations, SHA-256) → 256-bit AES-GCM key
```

- `salt`: random 16-byte `Uint8Array`, stored **unencrypted** in IndexedDB `meta` store
- Key lives in React `CryptoContext` (memory only) for the duration of the session
- On tab close / page unload: React state is destroyed, key is gone

### Encryption / Decryption Helpers (`src/crypto/encryption.js`)

- `deriveKey(pin, salt)` → `CryptoKey`
- `encrypt(key, data)` → `{ iv: Uint8Array, ciphertext: ArrayBuffer }` — store as base64 strings
- `decrypt(key, iv, ciphertext)` → original data
- Every write to IndexedDB calls `encrypt()`. Every read calls `decrypt()`.

### Wrong PIN Handling

- 5 consecutive wrong PIN attempts: show a **warning modal** — "This will permanently delete all local data"
- On user confirmation: wipe all IndexedDB stores, reset app to first-run state
- Attempt counter stored in `meta` store (unencrypted)

---

## IndexedDB Schema

**Database name**: `sender_san_db` | **Version**: `1`

Use the `idb` library for all operations.

| Store       | Encrypted | Contents                                                                                                        |
| ----------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| `meta`      | ❌ No     | `{ salt: Uint8Array (base64), setup_complete: boolean, last_send_timestamp: ISO string, pin_attempts: number }` |
| `profile`   | ✅ Yes    | Career profile JSON blob                                                                                        |
| `keys`      | ✅ Yes    | `{ gemini_key, contactout_key, google_client_id }`                                                              |
| `mission`   | ✅ Yes    | Active mission brief JSON blob                                                                                  |
| `companies` | ✅ Yes    | Array of company + enriched contacts + generated emails                                                         |
| `history`   | ✅ Yes    | Array of send log records                                                                                       |

All encrypted values stored as `{ iv: string (base64), ciphertext: string (base64) }`.

---

## Project File Structure

```
sender-san/
├── public/
│   └── favicon.svg              # Torii gate SVG icon
├── src/
│   ├── main.jsx                 # React root, GoogleOAuthProvider wrapper
│   ├── App.jsx                  # HashRouter, routes, PIN gate logic
│   ├── crypto/
│   │   └── encryption.js        # PBKDF2 key derivation, AES-GCM encrypt/decrypt
│   ├── db/
│   │   └── indexeddb.js         # idb setup, all read/write helpers (always encrypt on write)
│   ├── api/
│   │   ├── gemini.js            # All Gemini API calls
│   │   ├── contactout.js        # ContactOut search + verify, rate-limited queue
│   │   └── gmail.js             # OAuth, token refresh, RFC 2822 email send
│   ├── context/
│   │   ├── CryptoContext.jsx    # Holds derived AES key in memory, PIN verify logic
│   │   └── ProfileContext.jsx   # Decrypted profile available session-wide
│   ├── pages/
│   │   ├── PINGate.jsx          # PIN entry screen shown on every app load
│   │   ├── Setup/
│   │   │   ├── SetupFlow.jsx    # Multi-step onboarding controller
│   │   │   ├── Step1Upload.jsx  # CV upload + parse
│   │   │   ├── Step2Links.jsx   # Platform links + personal info
│   │   │   ├── Step3Analysis.jsx # AI career analysis + profile review/edit
│   │   │   └── Step4Keys.jsx   # API keys entry
│   │   ├── Dashboard.jsx        # Home after login
│   │   ├── Mission/
│   │   │   ├── MissionFlow.jsx  # Multi-step mission controller
│   │   │   ├── Step1Goal.jsx    # Goal type selection (Job / Investor / Services)
│   │   │   ├── Step2Params.jsx  # Goal-specific params
│   │   │   ├── Step3Brief.jsx   # AI mission brief review
│   │   │   └── Step4Discover.jsx # Company + contact discovery progress
│   │   ├── Queue.jsx            # All 100 companies, batches, statuses
│   │   ├── Send.jsx             # Daily batch trigger + email previews
│   │   └── History.jsx          # Send history, stats, export/import
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Tag.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── CountdownTimer.jsx
│   │   ├── CompanyCard.jsx      # Expandable company row in queue
│   │   ├── ContactRow.jsx       # Individual contact with email, activity score
│   │   ├── EmailPreview.jsx     # Generated email subject + body, editable
│   │   └── MissionBriefCard.jsx # Dossier-style mission summary card
│   └── styles/
│       └── globals.css          # Tailwind base, Geist + Noto Serif JP imports, custom scrollbar
├── vite.config.js               # base: '/sender-san/'
├── index.html
├── tailwind.config.js           # Design tokens
├── package.json                 # Scripts: dev, build, predeploy, deploy
├── .gitignore
├── LICENSE                      # MIT
└── README.md                    # Full setup + deployment guide
```

---

## Page-by-Page Specification

---

### Page 0: PIN Gate (`PINGate.jsx`)

Shown on every app load before any other page.

- If `setup_complete` is `false` in `meta` store → redirect to `/setup`
- Otherwise: show 6-digit PIN entry keypad (numeric, large touch targets)
- On submit: attempt to derive key + decrypt `profile` store. If decryption succeeds → unlock app, store key in `CryptoContext`, redirect to `/`
- Wrong PIN: increment `pin_attempts` in `meta`, show attempt count remaining
- 5 wrong attempts: show wipe warning modal → on confirm, clear all stores, redirect to `/setup`

---

### Page 1: Setup (`/setup`) — First Run Onboarding

Multi-step flow. Redirect here if `setup_complete === false`. Once completed, never shown again unless user resets.

---

#### Step 1 — CV Upload

- Drag-and-drop zone + file picker button
- Accepted formats: `.pdf`, `.docx`
- Parse client-side:
  - PDF → `pdfjs-dist`: extract all text content page by page, join into single string
  - DOCX → `mammoth`: extract raw text
- Show character count + first 300 chars preview so user can confirm it parsed correctly
- Store raw CV text in component state (not IndexedDB yet — flows into Step 3)
- Loading state: `"読み込み中... Reading your CV"`

---

#### Step 2 — Platform Links + Personal Info

Input fields:

| Field                            | Required                                                      |
| -------------------------------- | ------------------------------------------------------------- |
| Full name                        | Yes                                                           |
| Current location (city, country) | Yes                                                           |
| GitHub profile URL               | Yes                                                           |
| LinkedIn profile URL             | Yes                                                           |
| Primary tech stack / skills      | Yes — comma-separated tag input with autocomplete suggestions |
| Years of experience              | Yes — number input                                            |
| Preferred work type              | Yes — multi-select chips: Remote / Hybrid / On-site           |
| Personal blog / portfolio URL    | No                                                            |
| Dev.to or Hashnode URL           | No                                                            |
| Extra platform (label + URL)     | No — up to 3, add/remove dynamically                          |

---

#### Step 3 — AI Career Analysis

Send to Gemini 1.5 Pro:

**System prompt:**

```
You are a professional career analyst. Analyse the provided CV text and platform links. Return ONLY a valid JSON object matching the schema below. No markdown, no explanation, no preamble — raw JSON only.
```

**User message:** CV text + all links + skills input + years of experience + location + work preference

**Expected response schema:**

```json
{
  "name": "string",
  "title": "string — inferred professional title e.g. Senior Flutter Engineer",
  "summary": "string — 3 sentences, professional bio in first person",
  "skills": ["array of skill tag strings"],
  "experience_years": "number",
  "notable_projects": [
    { "name": "string", "description": "string — one sentence" }
  ],
  "industries_worked_in": ["array of industry strings"],
  "career_level": "junior | mid | senior | lead | principal",
  "strengths": ["array of 3–5 key professional strengths"],
  "github_url": "string",
  "linkedin_url": "string",
  "other_links": ["array of additional URLs"],
  "location": "string",
  "work_preference": ["remote", "hybrid", "on-site"]
}
```

**UI during analysis:**

- Full-screen loading with kanji watermark `分析` (Analyse) and progress message cycling:
  - `"Parsing your career history..."`
  - `"Identifying your strengths..."`
  - `"Building your profile..."`

**After response:**

- Display extracted profile in a review card
- Every field is inline-editable (click to edit, click away to save)
- Skills shown as removable tags with an "add skill" input
- "Looks good" confirm button → proceed to Step 4

---

#### Step 4 — API Keys Setup

Input fields (all `type="password"`, toggle show/hide):

| Key                    | Label                  | Notes                                             |
| ---------------------- | ---------------------- | ------------------------------------------------- |
| Gemini API Key         | Google AI Studio Key   | Link to `aistudio.google.com`                     |
| ContactOut API Key     | ContactOut Key         | Link to `https://contactout.com/api-feature`      |
| Google OAuth Client ID | Google Cloud Client ID | Collapsible step-by-step guide inline (see below) |

**Collapsible Google OAuth setup guide:**

```
1. Go to console.cloud.google.com
2. Create a new project (or select existing)
3. Enable Gmail API under "APIs & Services > Library"
4. Go to "APIs & Services > Credentials"
5. Create OAuth 2.0 Client ID → Web application
6. Add your app URL to "Authorised JavaScript origins"
   (e.g. https://yourusername.github.io)
7. Copy the Client ID and paste it above
```

**On confirm:**

- Create 6-digit PIN (two inputs, must match)
- Derive key from PIN + fresh random salt
- Encrypt profile JSON → save to `profile` store
- Encrypt keys JSON → save to `keys` store
- Set `meta.setup_complete = true`
- Redirect to `/`

---

### Page 2: Dashboard (`/`)

Shown after successful PIN entry.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  Logo                          Nav links    │
├─────────────────────────────────────────────┤
│  こんにちは, [Name].                          │
│  [Professional Title]                       │
├──────────────┬──────────────────────────────┤
│ Profile Card │  Mission Status Card         │
│ (collapsed)  │  Active mission summary      │
│ [Edit]       │  Companies queued: 100       │
│              │  Sent today: 0/30            │
│              │  Next send window: 18:32:44  │
├──────────────┴──────────────────────────────┤
│  [New Mission]  [View Queue]  [Send Today's Batch]  [History]  │
└─────────────────────────────────────────────┘
```

**Mission Status card fields:**

- Goal type badge (Job / Investor / Services)
- Mission headline from brief
- Companies queued count
- Emails sent today vs. limit (30 max — 10 companies × 3 contacts)
- Total emails sent all time
- Countdown timer to next send window (24h since `last_send_timestamp`)
- If no active mission: show "Start your first mission" CTA

**Profile card (collapsed):** name, title, top 5 skills as tags, career level badge. Expand button shows full profile. Edit button opens inline edit mode.

---

### Page 3: New Mission (`/mission/new`)

Multi-step flow. One active mission at a time — if one exists, prompt to archive it before starting new.

---

#### Step 1 — Goal Selection

Three large cards, select one:

**1. Find a Job — 仕事を探す**

- Sub-options: Full-time / Contract / Both (radio chips)
- Target role (pre-filled from profile title, editable text input)
- Preferred company size: Startup / Mid-size / Enterprise / Any (multi-select chips)
- Remote preference (pre-filled from profile, editable)

**2. Pitch to Investors — 投資家へ**

- Project / product name (text input)
- One-line pitch (text input, 120 char limit)
- Stage: Idea / MVP / Early Revenue / Scaling (radio chips)
- Funding amount sought (optional, text input)
- Industry / sector (text input)

**3. Offer Services — サービスを提供する**

- Service type: Freelance Contract / Consulting / Technical Partnership (radio chips)
- Specific service offering (text input, e.g. "Flutter mobile development for fintech")
- Target company profile (text input, e.g. "Fintech startups building mobile-first apps")
- Budget expectation (optional): Hourly rate or project range
- Availability: Immediately / Within 2 weeks / Within a month (radio chips)
- Contract duration: Short-term / Long-term / Either (radio chips)

---

#### Step 2 — AI Mission Brief

Send to Gemini: career profile + goal type + all goal params.

**System prompt:**

```
You are a professional outreach strategist. Based on the developer profile and mission parameters provided, generate a mission brief as a JSON object matching the schema. Return ONLY valid JSON, no markdown, no preamble.
```

**Response schema:**

```json
{
  "mission_type": "job | investor | services",
  "headline": "string — one punchy sentence describing this mission",
  "target_profile": "string — description of the ideal target company",
  "value_proposition": "string — what this person uniquely brings",
  "search_keywords": [
    "array of 5–10 search keyword strings for finding companies"
  ],
  "ideal_contact_roles": ["e.g. Engineering Manager, CTO, Head of Mobile"],
  "email_tone": "formal | semi-formal | conversational",
  "created_at": "ISO 8601 timestamp"
}
```

**UI — Mission Brief Card (dossier style):**

- Dark card with gold `#C9A84C` top border
- `MISSION BRIEF` label in small caps, muted
- Headline displayed large (1.5rem, bold, white)
- All other fields shown as labelled rows, all inline-editable
- "Confirm Mission" button

On confirm: encrypt + save to `mission` store.

---

#### Step 3 — Company Discovery

Runs immediately after mission brief is confirmed. Shows live streaming progress.

**Gemini call setup:**

- Enable `google_search_retrieval` tool (Search Grounding)
- Enable function calling with this tool definition:

```json
{
  "name": "add_company",
  "description": "Add a discovered company to the outreach list",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "website": { "type": "string" },
      "description": {
        "type": "string",
        "description": "One sentence about what the company does"
      },
      "why_relevant": {
        "type": "string",
        "description": "Why this company fits the mission target profile"
      },
      "industry": { "type": "string" },
      "size_estimate": {
        "type": "string",
        "enum": ["startup", "mid-size", "enterprise", "unknown"]
      }
    },
    "required": ["name", "website", "description", "why_relevant", "industry"]
  }
}
```

**Prompt to Gemini:**

```
You are a company research agent. Using Google Search, find 100 companies that match this target profile: [target_profile from mission brief].

The developer's profile: [career profile summary + skills].
Mission type: [job | investor | services].
Search keywords to guide your research: [search_keywords from mission brief].

For each company found, call the add_company function. Focus on real, active companies. Prioritise companies likely to be actively hiring or needing these services based on recent news, funding, or growth signals.
```

**UI during discovery:**

- Progress counter: `"Discovering companies... 47 / 100"`
- Companies appear in a live-updating list as Gemini calls `add_company`
- Each row shows: company name, industry tag, size badge, one-line "why relevant"
- User can skip individual companies during discovery (mark as skipped, replace from overflow list)

---

#### Step 4 — Contact Enrichment

Sequential background process. Shows progress bar.

For each company (100 total), in order:

**Step A — Identify target contacts via Gemini + Search Grounding:**

Prompt:

```
Search for people at [company name] ([website]) who match these roles: [ideal_contact_roles].
Find their full name, current job title, LinkedIn URL, and any public email address.
Also check their recent online activity: GitHub last commit, LinkedIn last post, Twitter/X last post.
Return as JSON array.
```

Expected per-contact output:

```json
{
  "name": "string",
  "role": "string",
  "email": "string | null",
  "email_confidence": "high | medium | low | none",
  "linkedin_url": "string | null",
  "github_url": "string | null",
  "last_active_github": "string | null — e.g. '3 days ago'",
  "last_active_linkedin": "string | null",
  "last_active_twitter": "string | null"
}
```

**Step B — ContactOut fallback (if email not found or confidence < high):**

Call ContactOut Person Search API:

- Endpoint: `POST https://api.contactout.com/v1/people/search`
- Body: `{ "name": "Full Name", "company_domain": "company.com" }`
- Auth: `Authorization: Bearer [contactout_key]`
- If a result is returned, extract email

**Step C — Email Verification:**

- Call ContactOut email verification endpoint with any email found (via Gemini or ContactOut search)
- Mark `email_verified: true/false` based on response

**Step D — Activity Score:**

Calculate `activity_score` (1–10):

| Condition                             | Score |
| ------------------------------------- | ----- |
| Active on any platform in last 7 days | 9–10  |
| Active in last 2–4 weeks              | 7–8   |
| Active in last 1–2 months             | 5–6   |
| Active in last 3–6 months             | 3–4   |
| No recent activity found              | 1–2   |

**Step E — Per-company finalisation:**

- Sort contacts by `activity_score` descending
- Keep top 3 contacts per company
- Discard the rest

**Step F — Save to IndexedDB:**

Final company record shape:

```json
{
  "id": "uuid",
  "name": "string",
  "website": "string",
  "description": "string",
  "why_relevant": "string",
  "industry": "string",
  "size_estimate": "string",
  "batch_number": "1–10",
  "status": "pending | sent | skipped",
  "contacts": [
    {
      "name": "string",
      "role": "string",
      "email": "string | null",
      "email_source": "gemini | contactout | unknown",
      "email_verified": "boolean",
      "linkedin_url": "string | null",
      "last_active_github": "string | null",
      "last_active_linkedin": "string | null",
      "last_active_twitter": "string | null",
      "activity_score": "1–10",
      "email_subject": "string | null",
      "email_body": "string | null",
      "sent": "boolean",
      "sent_at": "ISO string | null"
    }
  ]
}
```

Assign `batch_number` 1–10 sequentially (10 companies per batch).

**ContactOut rate limiting:**

- Minimum 1 second delay between ContactOut API calls
- Cache all results in IndexedDB — never look up the same person twice

---

### Page 4: Outreach Queue (`/queue`)

Display all 100 companies.

**Table columns:**

- Company name
- Industry
- Contacts found (e.g. 3/3, 2/3, 0/3)
- Email status: All Verified ✓ / Partial ⚠ / None ✗
- Batch # (Day 1 – Day 10)
- Status badge: Pending / Sent / Skipped

**Filters:** by status, by batch number, by email coverage

**Sorting:** by activity score average, by batch number, by company name

**Expanded company row:**

- Company description + "why relevant" note
- 3 contact cards each showing: name, role, email (masked: `d***@company.com`), email source badge, activity score bar (1–10), last active times per platform, LinkedIn button
- Email preview collapsed — "Preview Email" button expands it (generates email on demand if not yet generated)
- "Skip Company" button — removes from queue, does not replace (user manages their own list)
- "Move to Batch" dropdown — reassign to different batch day

**Batch summary at top:** `Batch 1 — 10 companies — 28 contacts with verified emails — Scheduled: Today`

---

### Page 5: Daily Send (`/send`)

User manually visits this page to trigger the day's send.

**Eligibility check on page load:**

- Has an active mission with a pending batch? If no → show "No batch ready"
- Has 24 hours passed since `last_send_timestamp`? If no → show countdown timer, disable send button
- Gmail OAuth token present? If no → show "Connect Gmail" button first

**Layout:**

Show today's batch: 10 companies × up to 3 contacts = up to 30 emails.

For each company:

- Company name + industry tag
- For each contact: name, role, email, activity score
- "Preview Email" toggle → shows subject + body (generated by Gemini if not already cached)
- User can edit subject or body in a textarea before sending
- Individual contact can be unchecked to skip

**Email Generation (per company + contact, if not cached):**

Gemini prompt:

```
Write a professional outreach email from [sender name] to [contact name], [contact role] at [company name].

Sender profile: [career summary, skills, career level]
Mission: [mission type + headline + value proposition]
Company: [company name] — [company description] — [why relevant]
Email tone: [email_tone from mission brief]

Requirements:
- Subject line: concise, specific, not generic
- Body: 150–200 words maximum
- Semi-formal, human, not salesy
- Mention something specific about the company (use the description/why_relevant)
- Clear call to action at the end (e.g. "Would you be open to a 15-minute call?")
- Sign off with sender's name and a link to their GitHub or LinkedIn

Return ONLY a JSON object: { "subject": "string", "body": "string" }
```

Cache generated emails in the company's contact record in IndexedDB.

**Send button — "Send Today's Batch 送信":**

- First time: triggers Gmail OAuth popup (Google Identity Services)
- Stores access token + refresh token encrypted in IndexedDB
- On subsequent sends: silently refreshes token if expired
- Sends emails one by one with `randomBetween(8000, 12000)ms` delay between each
- Live progress: `"Sending to Stripe — John Smith... ✓"`
- On completion:
  - Mark all sent contacts `sent: true`, `sent_at: ISO timestamp`
  - Mark company `status: "sent"`
  - Update `meta.last_send_timestamp`
  - Show summary: `"Batch complete. 28 emails sent to 10 companies."`

---

### Page 6: History (`/history`)

Timeline of all batches sent.

**Per batch entry:**

- Date sent
- Batch number
- Companies contacted
- Emails sent count
- Reply rate — user manually marks replies received (dropdown: 0 / 1 / 2 / 3...)
- Expand to see full company + contact list for that batch

**Aggregate stats (top of page):**

- Total companies approached
- Total emails sent
- Self-reported replies received
- Reply rate percentage

**Export / Import:**

- `Export Backup` button → downloads all IndexedDB data as a single encrypted JSON file (`sender-san-backup-[date].json`)
- `Import Backup` button → file picker, restore from a previously exported file
- Both export and import keep data encrypted — backup file is not human-readable without the PIN

---

## API Integration Details

---

### Gemini API (`src/api/gemini.js`)

All calls use `@google/generative-ai` SDK. Model: `gemini-1.5-pro`.

**Key configurations:**

- **Career analysis + email generation:** Standard `generateContent`, expect JSON response, strip any markdown fences before `JSON.parse()`
- **Mission brief:** Same as above
- **Company discovery:** Use `tools` with both `google_search_retrieval` and the `add_company` function definition. Handle streaming response, process each `functionCall` part as it arrives.
- **Contact research:** Use `google_search_retrieval` only, expect JSON array in text response
- **Error handling:** All calls wrapped in try/catch. On failure: show user-friendly error toast, allow retry.

**Never hardcode the API key.** Read it at call time from decrypted `keys` store via `CryptoContext`.

---

### ContactOut API (`src/api/contactout.js`)

**Endpoints to implement:**

1. **Person Search**
   - `POST https://api.contactout.com/v1/people/search`
   - Headers: `Authorization: Bearer [key]`, `Content-Type: application/json`
   - Body: `{ "name": "Full Name", "company_domain": "company.com" }`
   - Returns profile + email if found

2. **Email Verification** _(check ContactOut docs for exact endpoint — implement based on their current API reference)_
   - Verify any email address found (by Gemini or ContactOut search)
   - Mark `email_verified: true/false` based on deliverability response

**Rate limiting:**

- Internal queue — minimum `1000ms` between each API call
- Cache all results by `name + domain` key in IndexedDB
- Never call ContactOut twice for the same person

---

### Gmail API (`src/api/gmail.js`)

**OAuth flow:**

- Use `@react-oauth/google` `useGoogleLogin` hook
- Scope required: `https://www.googleapis.com/auth/gmail.send`
- On success: encrypt and store `{ access_token, refresh_token, expiry }` in `keys` store

**Token refresh:**

- Check `expiry` before each send batch
- If expired: call `https://oauth2.googleapis.com/token` with `refresh_token` to get a new `access_token`
- Update stored token silently

**Sending an email:**

- Construct RFC 2822 email string:

  ```
  From: [Sender Name] <[gmail address]>
  To: [recipient email]
  Subject: [subject]
  Content-Type: text/plain; charset=UTF-8

  [body]
  ```

- Base64url encode the string
- `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
- Body: `{ "raw": "[base64url encoded email]" }`
- Headers: `Authorization: Bearer [access_token]`

**Send delay:** `await sleep(randomBetween(8000, 12000))` between every individual email to avoid spam detection.

---

## GitHub Pages Deployment

**`vite.config.js`:**

```js
export default defineConfig({
  base: "/sender-san/",
  plugins: [react()],
});
```

**`package.json` scripts:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

**Routing:** Use `HashRouter` from React Router. This handles client-side navigation without a server. All routes become `/#/route` which GitHub Pages serves correctly.

**Deploy command:** `npm run deploy`

---

## README.md Requirements

The README must include:

1. **What Sender-san is** — one paragraph
2. **Prerequisites:**
   - Node.js 18+
   - A Google AI Studio account → Gemini API key (link: `aistudio.google.com`)
   - A ContactOut account → API key (link: `contactout.com`)
   - A Google Cloud project with Gmail API enabled → OAuth 2.0 Client ID (step-by-step)
3. **Local development setup:** `npm install`, `npm run dev`
4. **GitHub Pages deployment:** fork repo → `npm run deploy` → enable Pages from `gh-pages` branch in repo settings → update OAuth authorised origins
5. **First run:** how PIN setup works, what gets stored and where, how to back up and restore
6. **Tech stack** summary
7. **Contributing** section (open source)
8. **License:** MIT

---

## Other Important Requirements

1. **No API keys hardcoded ever.** All keys come from user input at setup, stored encrypted in IndexedDB, read at runtime via `CryptoContext`.

2. **Error handling everywhere.** Every API call (Gemini, ContactOut, Gmail) has try/catch with a user-visible toast or inline error. The app must never silently fail or crash.

3. **No `.env` files.** Since this is a static site with user-supplied keys, there is no build-time environment configuration. The `README` explains this architecture.

4. **Mobile responsive.** All pages must work on mobile screen widths using Tailwind responsive utilities. The queue page may scroll horizontally on mobile for the table.

5. **Accessible.** Use semantic HTML, proper `aria-label` on icon buttons, keyboard-navigable modals.

6. **Open source ready.** MIT `LICENSE` file, clean `.gitignore` (no node_modules, no dist), meaningful commit messages in the initial scaffold.

---

## Build Order for Claude Code

Build in this exact order, as each layer depends on the previous:

1. Scaffold full project structure + install all dependencies
2. Tailwind config with design tokens (colors, fonts)
3. `globals.css` — font imports, custom dark scrollbar, base styles
4. `src/crypto/encryption.js` — PBKDF2 + AES-GCM helpers
5. `src/db/indexeddb.js` — idb setup + all encrypted read/write helpers
6. `CryptoContext.jsx` — key in memory, PIN verify
7. `ProfileContext.jsx` — decrypted profile session state
8. All UI primitives in `src/components/ui/`
9. `PINGate.jsx`
10. `Setup/` — all 4 steps + `SetupFlow.jsx` controller
11. `Dashboard.jsx`
12. `src/api/gemini.js` — all Gemini call functions
13. `src/api/contactout.js` — search + verify + rate-limit queue
14. `src/api/gmail.js` — OAuth + send
15. `Mission/` — all 4 steps + `MissionFlow.jsx` controller
16. `Queue.jsx` + `CompanyCard.jsx` + `ContactRow.jsx`
17. `Send.jsx` + `EmailPreview.jsx`
18. `History.jsx`
19. `App.jsx` — wire all routes
20. `README.md` + `LICENSE` + deployment config

---

_End of Sender-san specification._

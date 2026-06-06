import Groq from 'groq-sdk'

const MODEL = 'llama-3.3-70b-versatile'

function getClient(apiKey) {
  return new Groq({ apiKey, dangerouslyAllowBrowser: true })
}

function stripFences(text) {
  return text.replace(/```json\n?|\n?```/g, '').trim()
}

async function chat(apiKey, prompt, temperature = 0.7) {
  const client = getClient(apiKey)
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature,
  })
  return res.choices[0].message.content
}

async function tavilySearch(tavilyKey, query, maxResults = 6) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
      include_answer: false,
    }),
  })
  if (!res.ok) throw new Error(`Tavily ${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

function formatResults(results) {
  return results
    .map(r => `- ${r.title}\n  ${(r.content ?? '').slice(0, 280)}`)
    .join('\n')
}

export async function generateMissionBrief(apiKey, profile, goalType, goalParams) {
  const prompt = `You are a professional outreach strategist. Based on the developer profile and mission parameters provided, generate a mission brief as a JSON object matching the schema. Return ONLY valid JSON, no markdown, no preamble.

Schema:
{
  "mission_type": "job | investor | services",
  "headline": "string",
  "target_profile": "string",
  "value_proposition": "string",
  "search_keywords": ["string"],
  "ideal_contact_roles": ["string"],
  "email_tone": "formal | semi-formal | conversational",
  "created_at": "ISO 8601 timestamp"
}

Developer profile:
${JSON.stringify(profile, null, 2)}

Mission type: ${goalType}
Mission parameters:
${JSON.stringify(goalParams, null, 2)}`

  const text = await chat(apiKey, prompt)
  const parsed = JSON.parse(stripFences(text))
  parsed.created_at = new Date().toISOString()
  return parsed
}

export async function discoverCompanies(apiKey, tavilyKey, mission, profile, onCompany) {
  let searchContext = ''

  if (tavilyKey) {
    try {
      const keywords = mission.search_keywords?.slice(0, 3).join(' ') ?? ''
      const [r1, r2] = await Promise.all([
        tavilySearch(tavilyKey, `${keywords} companies`, 8),
        tavilySearch(tavilyKey, `${mission.target_profile} companies`, 8),
      ])
      const hits = [...r1, ...r2].filter((r, i, a) => a.findIndex(x => x.url === r.url) === i)
      if (hits.length > 0) {
        searchContext = `\n\nReal web search results — prioritise companies mentioned here:\n${formatResults(hits)}`
      }
    } catch {
      // Tavily unavailable — fall back to LLM knowledge
    }
  }

  const prompt = `You are a company research agent. Find up to 30 real companies that match this target profile: ${mission.target_profile}.

Developer skills: ${profile.skills?.join(', ')}. Mission type: ${mission.mission_type}.
Search keywords: ${mission.search_keywords?.join(', ')}.${searchContext}

Return ONLY a valid JSON array (no markdown, no preamble) of company objects:
[{
  "name": "string",
  "website": "string",
  "description": "string (one sentence about what the company does)",
  "why_relevant": "string (why this company fits the target profile)",
  "industry": "string",
  "size_estimate": "startup | mid-size | enterprise | unknown"
}]

Focus on real, active companies. Prioritise companies likely to be actively hiring or needing these services.`

  const text = await chat(apiKey, prompt, 0.8)
  const companies = JSON.parse(stripFences(text))

  for (let i = 0; i < companies.length; i++) {
    onCompany(companies[i], i + 1)
    await new Promise(r => setTimeout(r, 40))
  }

  return companies
}

export async function findContacts(apiKey, tavilyKey, company, idealRoles) {
  let searchContext = ''

  if (tavilyKey) {
    try {
      const roleQuery = idealRoles.slice(0, 2).join(' OR ')
      const results = await tavilySearch(
        tavilyKey,
        `${company.name} ${roleQuery} team`,
        6,
      )
      if (results.length > 0) {
        searchContext = `\n\nWeb search results about this company's team (use these to find real people):\n${formatResults(results)}`
      }
    } catch {
      // Tavily unavailable — fall back to LLM knowledge
    }
  }

  const prompt = `Find 2-3 people at ${company.name} (${company.website}) who match these roles: ${idealRoles.join(', ')}.${searchContext}

Return ONLY a valid JSON array (no markdown, no preamble):
[{
  "name": "string",
  "role": "string",
  "email": "string | null",
  "email_confidence": "high | medium | low | none",
  "linkedin_url": "string | null",
  "github_url": "string | null",
  "last_active_github": "string | null",
  "last_active_linkedin": "string | null",
  "last_active_twitter": "string | null"
}]

Only include people you are confident exist at this company. Return [] if unsure.`

  try {
    const text = await chat(apiKey, prompt, 0.5)
    return JSON.parse(stripFences(text))
  } catch {
    return []
  }
}

export async function generateEmail(apiKey, sender, contact, company, mission) {
  const prompt = `Write a professional outreach email from ${sender.name} to ${contact.name}, ${contact.role} at ${company.name}.

Sender profile: ${sender.title}, skills: ${sender.skills?.join(', ')}, level: ${sender.career_level}
Mission: ${mission.mission_type} — ${mission.headline} — ${mission.value_proposition}
Company: ${company.name} — ${company.description} — ${company.why_relevant}
Email tone: ${mission.email_tone}

Requirements:
- Subject line: concise, specific, not generic
- Body: 150–200 words maximum
- Semi-formal, human, not salesy
- Mention something specific about the company (use the description/why_relevant)
- Clear call to action at the end (e.g. "Would you be open to a 15-minute call?")
- Sign off with sender's name and a link to their GitHub or LinkedIn

Return ONLY a JSON object: { "subject": "string", "body": "string" }`

  const text = await chat(apiKey, prompt, 0.8)
  return JSON.parse(stripFences(text))
}

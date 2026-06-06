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

export async function discoverCompanies(apiKey, mission, profile, onCompany) {
  const prompt = `You are a company research agent. Find up to 30 real companies that match this target profile: ${mission.target_profile}.

Developer skills: ${profile.skills?.join(', ')}. Mission type: ${mission.mission_type}.
Search keywords: ${mission.search_keywords?.join(', ')}.

Return ONLY a valid JSON array (no markdown, no preamble) of company objects:
[{
  "name": "string",
  "website": "string",
  "description": "string (one sentence about what the company does)",
  "why_relevant": "string (why this company fits the target profile)",
  "industry": "string",
  "size_estimate": "startup | mid-size | enterprise | unknown"
}]

Focus on real, active companies. Prioritise companies likely to be actively hiring or needing these services based on their known growth stage, tech stack, or recent activity.`

  const text = await chat(apiKey, prompt, 0.8)
  const companies = JSON.parse(stripFences(text))

  for (let i = 0; i < companies.length; i++) {
    onCompany(companies[i], i + 1)
    await new Promise(r => setTimeout(r, 40))
  }

  return companies
}

export async function findContacts(apiKey, company, idealRoles) {
  const prompt = `Find 2-3 people at ${company.name} (${company.website}) who match these roles: ${idealRoles.join(', ')}.

Use your knowledge of this company. Return ONLY a valid JSON array (no markdown, no preamble):
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

Only include people you are reasonably confident exist at this company. Return an empty array [] if unsure.`

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

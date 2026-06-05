import { GoogleGenerativeAI } from '@google/generative-ai'

function getClient(apiKey) {
  return new GoogleGenerativeAI(apiKey)
}

function stripFences(text) {
  return text.replace(/```json\n?|\n?```/g, '').trim()
}

export async function generateMissionBrief(apiKey, profile, goalType, goalParams) {
  const genAI = getClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

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

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(stripFences(text))
  parsed.created_at = new Date().toISOString()
  return parsed
}

export async function discoverCompanies(apiKey, mission, profile, onCompany) {
  const genAI = getClient(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    tools: [
      {
        googleSearchRetrieval: {},
      },
      {
        functionDeclarations: [
          {
            name: 'add_company',
            description: 'Add a discovered company to the outreach list',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                website: { type: 'string' },
                description: { type: 'string', description: 'One sentence about what the company does' },
                why_relevant: { type: 'string', description: 'Why this company fits the mission target profile' },
                industry: { type: 'string' },
                size_estimate: { type: 'string', enum: ['startup', 'mid-size', 'enterprise', 'unknown'] },
              },
              required: ['name', 'website', 'description', 'why_relevant', 'industry'],
            },
          },
        ],
      },
    ],
  })

  const prompt = `You are a company research agent. Using Google Search, find 100 companies that match this target profile: ${mission.target_profile}.

The developer's profile: ${profile.title}, skills: ${profile.skills?.join(', ')}. ${profile.summary}
Mission type: ${mission.mission_type}.
Search keywords: ${mission.search_keywords?.join(', ')}.

For each company found, call the add_company function. Focus on real, active companies. Prioritise companies likely to be actively hiring or needing these services based on recent news, funding, or growth signals.`

  const companies = []

  try {
    let response = await model.generateContent(prompt)
    let candidate = response.response.candidates?.[0]

    while (candidate) {
      const parts = candidate.content?.parts ?? []
      let hasFunction = false

      for (const part of parts) {
        if (part.functionCall?.name === 'add_company') {
          hasFunction = true
          const company = part.functionCall.args
          companies.push(company)
          onCompany(company, companies.length)

          if (companies.length >= 100) break
        }
      }

      if (!hasFunction || companies.length >= 100) break

      // Send function responses back
      const functionResponses = parts
        .filter(p => p.functionCall?.name === 'add_company')
        .map(p => ({
          functionResponse: {
            name: 'add_company',
            response: { result: 'Company added successfully' },
          },
        }))

      if (functionResponses.length === 0) break

      response = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'model', parts },
          { role: 'user', parts: functionResponses },
        ],
      })
      candidate = response.response.candidates?.[0]
    }
  } catch (e) {
    if (companies.length === 0) throw e
  }

  return companies
}

export async function findContacts(apiKey, company, idealRoles) {
  const genAI = getClient(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    tools: [{ googleSearchRetrieval: {} }],
  })

  const prompt = `Search for people at ${company.name} (${company.website}) who match these roles: ${idealRoles.join(', ')}.
Find their full name, current job title, LinkedIn URL, and any public email address.
Also check their recent online activity: GitHub last commit, LinkedIn last post, Twitter/X last post.

Return as a raw JSON array only (no markdown, no preamble):
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
}]`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return JSON.parse(stripFences(text))
  } catch {
    return []
  }
}

export async function generateEmail(apiKey, sender, contact, company, mission) {
  const genAI = getClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

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

  const result = await model.generateContent(prompt)
  return JSON.parse(stripFences(result.response.text()))
}

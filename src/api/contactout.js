// Rate-limited queue: minimum 1 second between ContactOut API calls
let lastCallTime = 0
const MIN_DELAY_MS = 1000

async function rateLimitedFetch(url, options) {
  const now = Date.now()
  const elapsed = now - lastCallTime
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed))
  }
  lastCallTime = Date.now()
  return fetch(url, options)
}

export async function searchPerson(apiKey, name, companyDomain) {
  const res = await rateLimitedFetch('https://api.contactout.com/v1/people/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, company_domain: companyDomain }),
  })

  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`ContactOut search failed: ${res.status}`)
  }

  const data = await res.json()
  const email = data?.profile?.emails?.[0] ?? data?.email ?? null
  return { email, raw: data }
}

export async function verifyEmail(apiKey, email) {
  try {
    const res = await rateLimitedFetch(`https://api.contactout.com/v1/email/verify?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return false
    const data = await res.json()
    return data?.deliverable === true || data?.status === 'valid'
  } catch {
    return false
  }
}

export function getDomainFromWebsite(website) {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return website
  }
}

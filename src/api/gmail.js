export function buildRFC2822(from, fromEmail, to, subject, body) {
  const message = [
    `From: ${from} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `MIME-Version: 1.0`,
    '',
    body,
  ].join('\r\n')
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function sendGmailMessage(accessToken, raw) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gmail send failed: ${res.status}`)
  }
  return res.json()
}

export async function getGmailProfile(accessToken) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to get Gmail profile')
  return res.json()
}

export async function refreshAccessToken(refreshToken, clientId) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json()
}

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

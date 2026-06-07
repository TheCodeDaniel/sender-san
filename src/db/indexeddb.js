import { openDB } from 'idb'

const DB_NAME = 'sender_san_db'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
        if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile')
        if (!db.objectStoreNames.contains('keys')) db.createObjectStore('keys')
        if (!db.objectStoreNames.contains('mission')) db.createObjectStore('mission')
        if (!db.objectStoreNames.contains('companies')) db.createObjectStore('companies')
        if (!db.objectStoreNames.contains('history')) db.createObjectStore('history')
      },
    })
  }
  return dbPromise
}

// META
export async function getMeta() {
  const db = await getDB()
  return (await db.get('meta', 'data')) ?? {}
}

export async function setMeta(updates) {
  const db = await getDB()
  const existing = await getMeta()
  await db.put('meta', { ...existing, ...updates }, 'data')
}

// PROFILE
export async function getProfile() {
  const db = await getDB()
  return (await db.get('profile', 'data')) ?? null
}

export async function setProfile(profile) {
  const db = await getDB()
  await db.put('profile', profile, 'data')
}

// KEYS
export async function getKeys() {
  const db = await getDB()
  return (await db.get('keys', 'data')) ?? null
}

export async function setKeys(keys) {
  const db = await getDB()
  await db.put('keys', keys, 'data')
}

export async function updateKeys(updates) {
  const existing = (await getKeys()) ?? {}
  return setKeys({ ...existing, ...updates })
}

// MISSION
export async function getMission() {
  const db = await getDB()
  return (await db.get('mission', 'data')) ?? null
}

export async function setMission(mission) {
  const db = await getDB()
  await db.put('mission', mission, 'data')
}

// COMPANIES
export async function getCompanies() {
  const db = await getDB()
  return (await db.get('companies', 'data')) ?? []
}

export async function setCompanies(companies) {
  const db = await getDB()
  await db.put('companies', companies, 'data')
}

export async function updateCompany(id, updates) {
  const companies = await getCompanies()
  const idx = companies.findIndex(c => c.id === id)
  if (idx === -1) return
  companies[idx] = { ...companies[idx], ...updates }
  return setCompanies(companies)
}

export async function deleteCompany(id) {
  const companies = await getCompanies()
  return setCompanies(companies.filter(c => c.id !== id))
}

export async function updateContact(companyId, contactIdx, updates) {
  const companies = await getCompanies()
  const company = companies.find(c => c.id === companyId)
  if (!company) return
  company.contacts[contactIdx] = { ...company.contacts[contactIdx], ...updates }
  return setCompanies(companies)
}

// HISTORY
export async function getHistory() {
  const db = await getDB()
  return (await db.get('history', 'data')) ?? []
}

export async function addHistoryEntry(entry) {
  const history = await getHistory()
  history.unshift(entry)
  const db = await getDB()
  await db.put('history', history, 'data')
}

export async function updateHistoryEntry(id, updates) {
  const history = await getHistory()
  const idx = history.findIndex(h => h.id === id)
  if (idx === -1) return
  history[idx] = { ...history[idx], ...updates }
  const db = await getDB()
  await db.put('history', history, 'data')
}

// SETUP DRAFT
export async function getSetupDraft() {
  const db = await getDB()
  return (await db.get('meta', 'draft')) ?? null
}

export async function setSetupDraft(draft) {
  const db = await getDB()
  await db.put('meta', draft, 'draft')
}

export async function clearSetupDraft() {
  const db = await getDB()
  await db.delete('meta', 'draft')
}

// WIPE
export async function wipeAllData() {
  dbPromise = null
  await indexedDB.deleteDatabase(DB_NAME)
}

// BACKUP / RESTORE
export async function exportBackup() {
  const db = await getDB()
  const meta = await db.get('meta', 'data')
  const profile = await db.get('profile', 'data')
  const keys = await db.get('keys', 'data')
  const mission = await db.get('mission', 'data')
  const companies = await db.get('companies', 'data')
  const history = await db.get('history', 'data')
  return JSON.stringify({ meta, profile, keys, mission, companies, history })
}

export async function importBackup(jsonString) {
  const data = JSON.parse(jsonString)
  const db = await getDB()
  if (data.meta) await db.put('meta', data.meta, 'data')
  if (data.profile) await db.put('profile', data.profile, 'data')
  if (data.keys) await db.put('keys', data.keys, 'data')
  if (data.mission) await db.put('mission', data.mission, 'data')
  if (data.companies) await db.put('companies', data.companies, 'data')
  if (data.history) await db.put('history', data.history, 'data')
}

// ContactOut cache
export async function getCachedContactOut(cacheKey) {
  const keys = (await getKeys()) ?? {}
  return keys._contactout_cache?.[cacheKey] ?? null
}

export async function setCachedContactOut(cacheKey, result) {
  const keys = (await getKeys()) ?? {}
  const cache = keys._contactout_cache ?? {}
  cache[cacheKey] = result
  await updateKeys({ _contactout_cache: cache })
}

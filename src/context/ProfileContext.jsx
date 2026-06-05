import { createContext, useContext, useState, useCallback } from 'react'
import { getProfile, setProfile } from '../db/indexeddb.js'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(null)

  const loadProfile = useCallback(async () => {
    const p = await getProfile()
    setProfileState(p)
    return p
  }, [])

  const saveProfile = useCallback(async (data) => {
    await setProfile(data)
    setProfileState(data)
  }, [])

  const updateProfile = useCallback(async (updates) => {
    const updated = { ...profile, ...updates }
    await saveProfile(updated)
  }, [profile, saveProfile])

  return (
    <ProfileContext.Provider value={{ profile, loadProfile, saveProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

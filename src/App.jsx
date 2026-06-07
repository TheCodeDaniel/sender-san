import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useEffect, useState } from 'react'
import { getMeta, getKeys } from './db/indexeddb.js'
import Layout from './components/Layout.jsx'
import SetupFlow from './pages/Setup/SetupFlow.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MissionFlow from './pages/Mission/MissionFlow.jsx'
import Queue from './pages/Queue.jsx'
import Send from './pages/Send.jsx'
import History from './pages/History.jsx'
import Spinner from './components/ui/Spinner.jsx'

function OAuthWrapper({ children }) {
  const [clientId, setClientId] = useState('')

  useEffect(() => {
    getKeys().then(keys => {
      if (keys?.google_client_id) setClientId(keys.google_client_id)
    })
  }, [])

  return (
    <GoogleOAuthProvider clientId={clientId || 'placeholder'}>
      {children}
    </GoogleOAuthProvider>
  )
}

function AppRoutes() {
  const [initializing, setInitializing] = useState(true)
  const [setupComplete, setSetupComplete] = useState(false)

  useEffect(() => {
    getMeta().then(meta => {
      setSetupComplete(!!meta.setup_complete)
    }).finally(() => setInitializing(false))
  }, [])

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <OAuthWrapper>
      <Routes>
        <Route path="/setup" element={<SetupFlow />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mission/new" element={<MissionFlow />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/send" element={<Send />} />
          <Route path="/history" element={<History />} />
        </Route>
        <Route path="*" element={<Navigate to={setupComplete ? '/' : '/setup'} replace />} />
      </Routes>
    </OAuthWrapper>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ProfileProvider>
        <AppRoutes />
      </ProfileProvider>
    </HashRouter>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../context/ProfileContext.jsx'
import { getMission, setMission, getKeys } from '../../db/indexeddb.js'
import Step1Goal from './Step1Goal.jsx'
import Step2Brief from './Step2Brief.jsx'
import Step3Discover from './Step3Discover.jsx'
import Step4Enrich from './Step4Enrich.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { NavBar } from '../Dashboard.jsx'

const STEPS = ['Goal', 'Mission Brief', 'Discover', 'Enrich']

export default function MissionFlow() {
  const navigate = useNavigate()
  const { profile, loadProfile } = useProfile()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})
  const [keys, setKeys] = useState(null)
  const [existingMission, setExistingMission] = useState(null)
  const [archiveModal, setArchiveModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadProfile(), getMission(), getKeys()])
      .then(([, mission, k]) => {
        if (mission) setExistingMission(mission)
        setKeys(k)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && existingMission) setArchiveModal(true)
  }, [loading, existingMission])

  const archiveAndStart = async () => {
    await setMission(null)
    setExistingMission(null)
    setArchiveModal(false)
  }

  const next = (updates) => {
    setData(d => ({ ...d, ...updates }))
    setStep(s => s + 1)
  }

  const back = () => setStep(s => s - 1)

  const saveMissionAndProceed = async ({ brief }) => {
    await setMission({ ...data.brief, ...brief })
    next({ brief })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-smooth ${i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white' : 'bg-border text-text-muted'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6 relative overflow-hidden">
          <div className="kanji-watermark" style={{ top: '-2rem', right: '-2rem' }}>
            {['仕事', '任務', '探索', '充実'][step]}
          </div>

          {step === 0 && <Step1Goal onNext={next} profile={profile} />}
          {step === 1 && (
            <Step2Brief
              data={data}
              apiKey={keys?.groq_key}
              profile={profile}
              onNext={saveMissionAndProceed}
              onBack={back}
            />
          )}
          {step === 2 && (
            <Step3Discover
              brief={data.brief}
              apiKey={keys?.groq_key}
              profile={profile}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            <Step4Enrich
              companies={data.discoveredCompanies ?? []}
              brief={data.brief}
              apiKey={keys?.groq_key}
              contactoutKey={keys?.contactout_key}
              onDone={() => navigate('/queue')}
            />
          )}
        </div>
      </main>

      <Modal
        open={archiveModal}
        title="Active mission exists"
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate('/')}>Keep current</Button>
            <Button onClick={archiveAndStart}>Archive & start new</Button>
          </>
        }
      >
        <p>You already have an active mission: <strong className="text-text-primary">{existingMission?.headline}</strong></p>
        <p className="mt-2">Archiving will keep your history but clear the current queue for a fresh start.</p>
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../context/ProfileContext.jsx'
import { setKeys, setMeta, getProfile, getKeys, getSetupDraft, setSetupDraft, clearSetupDraft } from '../../db/indexeddb.js'
import Step1Upload from './Step1Upload.jsx'
import Step2Links from './Step2Links.jsx'
import Step3Analysis from './Step3Analysis.jsx'
import Step4Keys from './Step4Keys.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

const STEPS = ['CV Upload', 'Your Info', 'AI Analysis', 'API Keys']

export default function SetupFlow() {
  const navigate = useNavigate()
  const { saveProfile } = useProfile()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    getSetupDraft()
      .then(async draft => {
        if (draft?.data) {
          setData(draft.data)
          if (typeof draft?.step === 'number') setStep(draft.step)
        } else {
          // No draft — try to pre-fill from already-saved profile and keys
          const [storedProfile, storedKeys] = await Promise.all([getProfile(), getKeys()])
          if (storedProfile || storedKeys) {
            setData({ profile: storedProfile ?? undefined, savedKeys: storedKeys ?? undefined })
          }
        }
      })
      .finally(() => setDraftLoaded(true))
  }, [])

  const next = (updates) => {
    const newData = { ...data, ...updates }
    setData(newData)
    const newStep = step + 1
    setStep(newStep)
    setSetupDraft({ step: newStep, data: newData })
  }

  const back = () => setStep(s => s - 1)

  const complete = async ({ keys }) => {
    setSaving(true)
    setError('')
    try {
      await saveProfile({ ...data.profile, _raw_cv: data.cvText })
      await setKeys(keys)
      await setMeta({ setup_complete: true })
      // Keep all data in draft (step reset to 0) so next setup visit is pre-filled
      await setSetupDraft({ step: 0, data: { ...data, savedKeys: keys } })
      navigate('/', { replace: true })
    } catch (e) {
      setError('Setup failed. Please try again.')
      setSaving(false)
    }
  }

  const resetDraft = async () => {
    await clearSetupDraft()
    setData({})
    setStep(0)
  }

  const initialKeysForStep4 = {
    groq_key: data.tempGroqKey ?? data.savedKeys?.groq_key ?? '',
    contactout_key: data.savedKeys?.contactout_key ?? '',
    google_client_id: data.savedKeys?.google_client_id ?? '',
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <span className="font-jp text-text-muted text-sm">送信者</span>
          <span className="ml-2 text-primary font-semibold text-xl">Sender-san</span>
          <p className="text-text-muted text-sm mt-2">First-time setup</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-smooth ${i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white' : 'bg-border text-text-muted'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 transition-smooth ${i < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6 relative overflow-hidden">
          <div className="kanji-watermark" style={{ top: '-2rem', right: '-2rem' }}>設定</div>

          {!draftLoaded || saving ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <Spinner size="lg" />
              <p className="text-text-muted">{saving ? 'Saving your profile…' : 'Loading…'}</p>
            </div>
          ) : (
            <>
              {step === 0 && (
                <Step1Upload
                  onNext={next}
                  initialCvText={data.cvText ?? ''}
                  initialFileName={data.fileName ?? ''}
                />
              )}
              {step === 1 && (
                <Step2Links
                  onNext={next}
                  onBack={back}
                  initialForm={data.links ?? null}
                />
              )}
              {step === 2 && (
                <Step3Analysis
                  data={data}
                  onNext={next}
                  onBack={back}
                />
              )}
              {step === 3 && (
                <Step4Keys
                  onNext={complete}
                  onBack={back}
                  initialKeys={initialKeysForStep4}
                />
              )}
            </>
          )}

          {error && <p className="text-primary text-sm mt-4 text-center">{error}</p>}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={resetDraft}
            className="text-xs text-text-muted opacity-40 hover:opacity-100 hover:text-primary transition-smooth"
          >
            Clear saved form data
          </button>
        </div>
      </div>
    </div>
  )
}

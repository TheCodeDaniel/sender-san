import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../context/ProfileContext.jsx'
import { setKeys, setMeta, getSetupDraft, setSetupDraft, clearSetupDraft } from '../../db/indexeddb.js'
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
      .then(draft => {
        if (draft?.data) setData(draft.data)
        if (typeof draft?.step === 'number') setStep(draft.step)
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
      await clearSetupDraft()
      navigate('/', { replace: true })
    } catch (e) {
      setError('Setup failed. Please try again.')
      setSaving(false)
    }
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
                  initialKeys={{ gemini_key: data.tempGeminiKey ?? '' }}
                />
              )}
            </>
          )}

          {error && <p className="text-primary text-sm mt-4 text-center">{error}</p>}
        </div>
      </div>
    </div>
  )
}

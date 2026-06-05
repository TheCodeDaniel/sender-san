import { useState, useCallback } from 'react'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

async function parsePDF(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(item => item.str).join(' ') + '\n'
  }
  return text
}

async function parseDOCX(file) {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export default function Step1Upload({ onNext }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cvText, setCvText] = useState('')
  const [fileName, setFileName] = useState('')

  const processFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only .pdf and .docx files are supported')
      return
    }
    setLoading(true)
    setError('')
    try {
      const text = ext === 'pdf' ? await parsePDF(file) : await parseDOCX(file)
      setCvText(text)
      setFileName(file.name)
    } catch (e) {
      setError('Failed to parse file. Please try a different file.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [])

  const onFileChange = (e) => processFile(e.target.files[0])

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-1">Upload your CV</h2>
      <p className="text-text-muted text-sm mb-6">We'll parse it to build your profile. Supported: PDF, DOCX.</p>

      {!cvText ? (
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-card p-12 text-center transition-smooth cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-text-muted'}`}
          onClick={() => document.getElementById('cv-file').click()}
        >
          <div className="text-4xl mb-3">📄</div>
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="text-text-muted text-sm">読み込み中... Reading your CV</p>
            </div>
          ) : (
            <>
              <p className="text-text-primary font-medium mb-1">Drop your CV here</p>
              <p className="text-text-muted text-sm">or click to browse</p>
            </>
          )}
          <input id="cv-file" type="file" accept=".pdf,.docx" onChange={onFileChange} className="hidden" />
        </div>
      ) : (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-text-primary font-medium">{fileName}</p>
              <p className="text-text-muted text-xs">{cvText.length.toLocaleString()} characters extracted</p>
            </div>
            <button onClick={() => { setCvText(''); setFileName('') }} className="text-text-muted hover:text-primary transition-smooth text-sm">
              Change
            </button>
          </div>
          <div className="bg-background rounded p-3 text-text-muted text-xs font-mono max-h-32 overflow-y-auto border border-border">
            {cvText.slice(0, 300)}…
          </div>
        </div>
      )}

      {error && <p className="text-primary text-sm mt-3">{error}</p>}

      <div className="flex justify-end mt-6">
        <Button disabled={!cvText} onClick={() => onNext({ cvText })}>
          Next →
        </Button>
      </div>
    </div>
  )
}

import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6 z-10">
        {title && <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>}
        <div className="text-text-muted text-sm leading-relaxed">{children}</div>
        {footer && <div className="mt-6 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  )
}

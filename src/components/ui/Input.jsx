import { forwardRef, useState } from 'react'

const Input = forwardRef(function Input({ label, error, type = 'text', className = '', showToggle, ...props }, ref) {
  const [shown, setShown] = useState(false)
  const inputType = showToggle ? (shown ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && <label className="block text-sm text-text-muted mb-1">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={`input-base ${error ? 'border-primary' : ''} ${showToggle ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShown(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-smooth text-xs"
            aria-label={shown ? 'Hide' : 'Show'}
          >
            {shown ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>
      {error && <p className="text-primary text-xs mt-1">{error}</p>}
    </div>
  )
})

export default Input

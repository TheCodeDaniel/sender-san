import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NAV = [
  { label: 'Dashboard', path: '/' },
  { label: 'Queue', path: '/queue' },
  { label: 'Send', path: '/send' },
  { label: 'History', path: '/history' },
]

const SECONDARY_NAV = [
  { label: 'New Mission', path: '/mission/new' },
  { label: 'Setup', path: '/setup' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = window.location.hash.replace('#', '') || '/'

  const NavLink = ({ path, label }) => {
    const active = current === path
    return (
      <button
        onClick={() => { navigate(path); setMobileOpen(false) }}
        className={`w-full text-left px-3 py-2.5 rounded-card text-sm font-medium transition-smooth
          ${active
            ? 'bg-primary text-white'
            : 'text-text-muted hover:bg-background hover:text-text-primary'
          }`}
      >
        {label}
      </button>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <p className="font-jp text-text-muted text-xs tracking-wide">送信者</p>
        <p className="text-text-primary font-semibold text-lg leading-tight">Sender-san</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(l => <NavLink key={l.path} {...l} />)}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-0.5">
        {SECONDARY_NAV.map(l => <NavLink key={l.path} {...l} />)}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-surface border border-border rounded-card p-2 shadow-sm"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <div className="w-5 h-0.5 bg-text-primary mb-1" />
        <div className="w-5 h-0.5 bg-text-primary mb-1" />
        <div className="w-5 h-0.5 bg-text-primary" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-surface border-r border-border flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside className={`fixed left-0 top-0 h-full w-56 bg-surface border-r border-border flex flex-col z-50 transition-transform md:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  )
}

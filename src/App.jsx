import { useState } from 'react'
import ResearchHub from './components/ResearchHub'
import RiskEngine from './components/RiskEngine'
import Timeline from './components/Timeline'
import Explorer from './pages/Explorer'

const NAV_ITEMS = [
  { id: 'explorer', label: 'Explorer' },
  { id: 'risk-engine', label: 'Risk Engine' },
  { id: 'research-hub', label: 'Research Hub' },
  { id: 'timeline', label: 'Timeline' },
]

function App() {
  const [activeSection, setActiveSection] = useState('explorer')
  const activeLabel = NAV_ITEMS.find(item => item.id === activeSection)?.label

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-standard)] bg-[var(--bg-secondary)] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.24),inset_0_-1px_0_rgba(200,169,107,0.14)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--accent-gold)]/35 bg-[var(--bg-raised)] text-sm font-semibold text-[var(--accent-gold)] shadow-[inset_0_1px_0_rgba(243,231,208,0.07)]">
              T
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight text-[var(--accent-brass)]">ThemisOS</span>
            <span className="mt-0.5 border-l border-[var(--border-standard)] pl-3 text-xs text-[var(--text-muted)]">AI Governance Intelligence</span>
          </div>

          <nav aria-label="Primary navigation" className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`shrink-0 rounded-md border px-3 py-2 text-sm transition-colors ${
                  activeSection === item.id
                    ? 'border-[var(--accent-gold)]/55 bg-[var(--accent-navy)] text-[var(--accent-brass)] shadow-[inset_0_1px_0_rgba(224,201,138,0.14)]'
                    : 'border-[var(--border-standard)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>ThemisOS</span>
          <span>/</span>
          <span className="text-[var(--accent-gold)]">{activeLabel}</span>
        </div>

        {activeSection === 'explorer' && <Explorer />}
        {activeSection === 'risk-engine' && <RiskEngine />}
        {activeSection === 'research-hub' && <ResearchHub />}
        {activeSection === 'timeline' && <Timeline />}
      </main>
    </div>
  )
}

export default App

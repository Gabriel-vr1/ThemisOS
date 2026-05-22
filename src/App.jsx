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
    <div className="min-h-screen bg-[#0B1020] text-[#F3F0E8]">
      <header className="border-b border-[#202B43] bg-[#0B1020] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#C6A664]/30 bg-[#1A2438] text-sm font-semibold text-[#C6A664] shadow-[inset_0_1px_0_rgba(243,240,232,0.06)]">
              T
            </span>
            <span className="text-lg font-semibold tracking-tight text-[#F3F0E8]">ThemisOS</span>
            <span className="mt-0.5 border-l border-[#202B43] pl-3 text-xs text-[#8E96A8]">AI Governance Intelligence</span>
          </div>

          <nav aria-label="Primary navigation" className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`shrink-0 rounded-md border px-3 py-2 text-sm transition-colors ${
                  activeSection === item.id
                    ? 'border-[#C6A664]/50 bg-[#1E2A44] text-[#F3F0E8] shadow-[inset_0_1px_0_rgba(216,188,122,0.12)]'
                    : 'border-[#202B43] bg-[#121A2B] text-[#8E96A8] hover:border-[#3D4D7A] hover:text-[#F3F0E8]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-xs text-[#8E96A8]">
          <span>ThemisOS</span>
          <span>/</span>
          <span className="text-[#C6A664]">{activeLabel}</span>
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

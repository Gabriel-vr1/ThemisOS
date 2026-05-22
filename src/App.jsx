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
    <div className="min-h-screen bg-[#0E0B09] text-[#F3E7D0]">
      <header className="border-b border-[#4A3727] bg-[#15110E] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.24),inset_0_-1px_0_rgba(200,169,107,0.14)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#C8A96B]/35 bg-[#2A201A] text-sm font-semibold text-[#C8A96B] shadow-[inset_0_1px_0_rgba(243,231,208,0.07)]">
              T
            </span>
            <span className="text-lg font-semibold tracking-tight text-[#F3E7D0]">ThemisOS</span>
            <span className="mt-0.5 border-l border-[#4A3727] pl-3 text-xs text-[#8B7A65]">AI Governance Intelligence</span>
          </div>

          <nav aria-label="Primary navigation" className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`shrink-0 rounded-md border px-3 py-2 text-sm transition-colors ${
                  activeSection === item.id
                    ? 'border-[#C8A96B]/55 bg-[#2A201A] text-[#F3E7D0] shadow-[inset_0_1px_0_rgba(224,201,138,0.14)]'
                    : 'border-[#4A3727] bg-[#15110E] text-[#8B7A65] hover:border-[#7A6038] hover:bg-[#1E1713] hover:text-[#F3E7D0]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-xs text-[#8B7A65]">
          <span>ThemisOS</span>
          <span>/</span>
          <span className="text-[#C8A96B]">{activeLabel}</span>
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

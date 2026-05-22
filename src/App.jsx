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
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 py-4 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight text-white">ThemisOS</span>
            <span className="text-xs text-gray-500 mt-0.5">AI Governance Intelligence</span>
          </div>

          <nav aria-label="Primary navigation" className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`shrink-0 rounded-md border px-3 py-2 text-sm transition-colors ${
                  activeSection === item.id
                    ? 'border-blue-500/40 bg-blue-500/15 text-blue-100'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
          <span>ThemisOS</span>
          <span>/</span>
          <span className="text-gray-300">{activeLabel}</span>
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

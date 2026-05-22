import { useState } from 'react'
import Explorer from './pages/Explorer'

const NAV_ITEMS = [
  { id: 'explorer', label: 'Explorer' },
  { id: 'risk-engine', label: 'Risk Engine' },
  { id: 'research-hub', label: 'Research Hub' },
  { id: 'timeline', label: 'Timeline' },
]

const PLACEHOLDERS = {
  'risk-engine': {
    title: 'Risk Engine',
    eyebrow: 'Coming next',
    description: 'A guided assessment workspace for mapping AI systems to EU AI Act risk tiers, obligations, evidence, and review steps.',
    points: [
      'Structured intake for AI system purpose, users, context, and deployment environment.',
      'Risk-tier guidance linked back to Explorer classifications and article references.',
      'Assessment outputs designed for governance review and audit preparation.',
    ],
  },
  'research-hub': {
    title: 'Research Hub',
    eyebrow: 'Planned knowledge layer',
    description: 'A legal intelligence workspace for collecting regulatory sources, guidance, enforcement updates, and internal research notes.',
    points: [
      'Curated EU AI Act references, guidance, and implementation materials.',
      'Searchable research summaries organized by risk tier, domain, and obligation.',
      'Space for future citations, briefings, and policy analysis workflows.',
    ],
  },
  timeline: {
    title: 'Timeline',
    eyebrow: 'Implementation view',
    description: 'A clear view of EU AI Act milestones, enforcement dates, and compliance windows across obligations and system categories.',
    points: [
      'Chronological view of key implementation and enforcement dates.',
      'Links from deadlines to affected risk tiers, systems, and obligations.',
      'Future filters for teams tracking readiness across multiple AI systems.',
    ],
  },
}

function PlaceholderPage({ page }) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">{page.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{page.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">{page.description}</p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {page.points.map(point => (
            <div key={point} className="rounded-lg border border-gray-800 bg-gray-950/60 p-4">
              <p className="text-sm leading-relaxed text-gray-300">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

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

        {activeSection === 'explorer' ? (
          <Explorer />
        ) : (
          <PlaceholderPage page={PLACEHOLDERS[activeSection]} />
        )}
      </main>
    </div>
  )
}

export default App

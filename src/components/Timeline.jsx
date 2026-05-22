import { useMemo, useState } from 'react'
import data from '../data/eu-ai-act.json'

function getMilestoneStatus(date) {
  const milestoneDate = new Date(`${date}T00:00:00`)
  const now = new Date()

  if (milestoneDate <= now) return 'In force'
  return 'Upcoming'
}

function getSignificance(milestone) {
  const text = `${milestone.label} ${milestone.description}`.toLowerCase()

  if (text.includes('prohibited')) {
    return 'Prohibited AI practices become enforceable, creating the first major compliance deadline.'
  }

  if (text.includes('gpai') || text.includes('general-purpose')) {
    return 'General-purpose AI providers need to prepare model documentation, transparency, and systemic-risk controls where applicable.'
  }

  if (text.includes('high-risk embedded')) {
    return 'High-risk AI embedded in regulated products reaches a later compliance deadline tied to sector product rules.'
  }

  if (text.includes('high-risk')) {
    return 'Core high-risk and transparency obligations become operational for many deployers and providers.'
  }

  return 'The Act enters the implementation period and starts the countdown for phased obligations.'
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function Timeline() {
  const milestones = useMemo(() => data.implementation_timeline.map(milestone => ({
    ...milestone,
    year: milestone.date.slice(0, 4),
    status: getMilestoneStatus(milestone.date),
    significance: getSignificance(milestone),
  })), [])

  const years = [...new Set(milestones.map(milestone => milestone.year))]
  const [activeYear, setActiveYear] = useState('all')
  const [selectedId, setSelectedId] = useState(milestones[0]?.date)

  const filteredMilestones = activeYear === 'all'
    ? milestones
    : milestones.filter(milestone => milestone.year === activeYear)

  const selectedMilestone = milestones.find(milestone => milestone.date === selectedId) || filteredMilestones[0]

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Implementation Timeline</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">EU AI Act milestones</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            Track the phased implementation of the EU AI Act from entry into force through major enforcement deadlines.
          </p>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveYear('all')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-all ${
              activeYear === 'all'
                ? 'border-gray-500 bg-gray-700 text-white'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            All years
          </button>
          {years.map(year => (
            <button
              key={year}
              onClick={() => setActiveYear(year)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-all ${
                activeYear === year
                  ? 'border-blue-500 bg-blue-500/20 text-blue-200'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {filteredMilestones.map((milestone, index) => {
            const selected = selectedMilestone?.date === milestone.date

            return (
              <button
                key={milestone.date}
                onClick={() => setSelectedId(milestone.date)}
                className={`group grid gap-4 rounded-xl border p-4 text-left transition-colors md:grid-cols-[120px_minmax(0,1fr)] ${
                  selected
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-gray-800 bg-gray-950/50 hover:border-gray-700'
                }`}
              >
                <div>
                  <p className="text-2xl font-semibold text-white">{milestone.year}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(milestone.date)}</p>
                  <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    milestone.status === 'In force'
                      ? 'bg-green-500/15 text-green-300'
                      : 'bg-blue-500/15 text-blue-300'
                  }`}>
                    {milestone.status}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 hidden h-full w-px bg-gray-800 md:block" />
                  <div className="absolute -left-[29px] top-1 hidden h-2 w-2 rounded-full bg-blue-400 md:block" />
                  <p className="text-sm font-semibold text-white">{index + 1}. {milestone.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{milestone.description}</p>
                  <p className="mt-3 text-xs leading-relaxed text-gray-300">
                    <span className="font-semibold text-gray-500">Significance: </span>
                    {milestone.significance}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {selectedMilestone && (
        <aside className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Selected Milestone</p>
          <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950/70 p-4">
            <p className="text-3xl font-semibold text-white">{selectedMilestone.year}</p>
            <p className="mt-1 text-sm text-blue-300">{formatDate(selectedMilestone.date)}</p>
            <h2 className="mt-4 text-base font-semibold text-white">{selectedMilestone.label}</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">{selectedMilestone.description}</p>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Enforcement Significance</h3>
              <p className="mt-2 rounded-md border border-gray-800 bg-gray-950/60 p-3 text-xs leading-relaxed text-gray-300">
                {selectedMilestone.significance}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status</h3>
              <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                selectedMilestone.status === 'In force'
                  ? 'bg-green-500/15 text-green-300'
                  : 'bg-blue-500/15 text-blue-300'
              }`}>
                {selectedMilestone.status}
              </p>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}

export default Timeline

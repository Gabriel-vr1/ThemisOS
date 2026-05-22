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
      <section className="rounded-xl border border-[#3B2A20] bg-[#1B120E] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A45C]">Implementation Timeline</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#F4E8D0]">EU AI Act milestones</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#A99573]">
            Track the phased implementation of the EU AI Act from entry into force through major enforcement deadlines.
          </p>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveYear('all')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-all ${
              activeYear === 'all'
                ? 'border-[#7A6235] bg-[#3B2A20] text-[#F4E8D0]'
                : 'border-[#3B2A20] text-[#A99573] hover:border-[#7A6235] hover:text-[#D8C7A3]'
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
                  ? 'border-[#7A6235] bg-[#7A6235]/20 text-[#F4E8D0]'
                  : 'border-[#3B2A20] text-[#A99573] hover:border-[#7A6235] hover:text-[#D8C7A3]'
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
                    ? 'border-[#7A6235]/50 bg-[#7A6235]/10'
                    : 'border-[#3B2A20] bg-[#2E1D16]/60 hover:border-[#7A6235]'
                }`}
              >
                <div>
                  <p className="text-2xl font-semibold text-[#F4E8D0]">{milestone.year}</p>
                  <p className="mt-1 text-xs text-[#A99573]">{formatDate(milestone.date)}</p>
                  <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    milestone.status === 'In force'
                      ? 'bg-[#2F6B45]/15 text-[#D8C7A3]'
                      : 'bg-[#7A6235]/15 text-[#E0C078]'
                  }`}>
                    {milestone.status}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 hidden h-full w-px bg-[#261812] md:block" />
                  <div className="absolute -left-[29px] top-1 hidden h-2 w-2 rounded-full bg-[#C9A45C] md:block" />
                  <p className="text-sm font-semibold text-[#F4E8D0]">{index + 1}. {milestone.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#A99573]">{milestone.description}</p>
                  <p className="mt-3 text-xs leading-relaxed text-[#D8C7A3]">
                    <span className="font-semibold text-[#A99573]">Significance: </span>
                    {milestone.significance}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {selectedMilestone && (
        <aside className="rounded-xl border border-[#3B2A20] bg-[#1B120E] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A99573]">Selected Milestone</p>
          <div className="mt-3 rounded-lg border border-[#3B2A20] bg-[#2E1D16]/70 p-4">
            <p className="text-3xl font-semibold text-[#F4E8D0]">{selectedMilestone.year}</p>
            <p className="mt-1 text-sm text-[#E0C078]">{formatDate(selectedMilestone.date)}</p>
            <h2 className="mt-4 text-base font-semibold text-[#F4E8D0]">{selectedMilestone.label}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#A99573]">{selectedMilestone.description}</p>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A99573]">Enforcement Significance</h3>
              <p className="mt-2 rounded-md border border-[#3B2A20] bg-[#2E1D16]/75 p-3 text-xs leading-relaxed text-[#D8C7A3]">
                {selectedMilestone.significance}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A99573]">Status</h3>
              <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                selectedMilestone.status === 'In force'
                  ? 'bg-[#2F6B45]/15 text-[#D8C7A3]'
                  : 'bg-[#7A6235]/15 text-[#E0C078]'
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

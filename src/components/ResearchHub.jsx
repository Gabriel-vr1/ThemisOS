import { useMemo, useState } from 'react'
import data from '../data/eu-ai-act.json'

const KNOWLEDGE_SECTIONS = [
  {
    id: 'concepts',
    label: 'Core EU AI Act concepts',
    items: [
      {
        title: 'Risk-based regulation',
        body: 'The EU AI Act classifies AI systems by risk level, with stricter obligations for systems that can affect safety, rights, access to services, or democratic values.',
        tags: ['risk', 'classification', 'framework'],
      },
      {
        title: 'Provider and deployer roles',
        body: 'Providers place AI systems on the market or put them into service. Deployers use AI systems under their authority. Duties can differ depending on the role.',
        tags: ['roles', 'provider', 'deployer'],
      },
      {
        title: 'Intended purpose',
        body: 'Classification depends heavily on the system purpose, context, users, affected people, and the decisions or outputs the AI supports.',
        tags: ['purpose', 'classification'],
      },
    ],
  },
  {
    id: 'terms',
    label: 'Key legal terms',
    items: [
      {
        title: 'High-risk AI system',
        body: 'An AI system that falls into listed sensitive domains or regulated product contexts and may significantly affect health, safety, or fundamental rights.',
        tags: ['high risk', 'annex iii'],
      },
      {
        title: 'Conformity assessment',
        body: 'A pre-market process used to show that a high-risk AI system meets applicable requirements before deployment or market placement.',
        tags: ['assessment', 'compliance'],
      },
      {
        title: 'Human oversight',
        body: 'Controls and procedures that allow humans to understand, monitor, intervene, or override AI-supported decisions where required.',
        tags: ['oversight', 'governance'],
      },
      {
        title: 'General-purpose AI',
        body: 'Broadly capable AI models that can be integrated into many downstream systems and may carry transparency and documentation obligations.',
        tags: ['gpai', 'foundation models'],
      },
    ],
  },
  {
    id: 'obligations',
    label: 'Governance obligations',
    items: [
      {
        title: 'Risk management system',
        body: 'High-risk systems need a structured process to identify, assess, reduce, and monitor risks throughout the lifecycle.',
        tags: ['risk management', 'high risk'],
      },
      {
        title: 'Data governance',
        body: 'Training, validation, and testing data should be relevant, representative, and managed to reduce foreseeable bias and quality issues.',
        tags: ['data', 'bias'],
      },
      {
        title: 'Technical documentation',
        body: 'Providers should maintain documentation that explains system design, intended purpose, limitations, performance, and compliance controls.',
        tags: ['documentation', 'audit'],
      },
      {
        title: 'Transparency and user information',
        body: 'Some systems must disclose AI interaction or label synthetic content so affected people can understand the nature of the system or output.',
        tags: ['transparency', 'article 50'],
      },
    ],
  },
  {
    id: 'notes',
    label: 'Useful study notes',
    items: [
      {
        title: 'Ask what the AI system does, not only what model it uses',
        body: 'A general model can be embedded in a low-risk assistant, a transparency-obligation chatbot, or a high-risk decision workflow depending on use.',
        tags: ['study', 'classification'],
      },
      {
        title: 'Risk tiers can stack',
        body: 'Transparency obligations may apply alongside high-risk obligations. The highest applicable risk signal usually drives the compliance posture.',
        tags: ['study', 'risk tiers'],
      },
      {
        title: 'Article references are starting points',
        body: 'Use article and annex references to orient research, then confirm against the final legal text and sector-specific rules.',
        tags: ['research', 'articles'],
      },
    ],
  },
]

function buildTierItems() {
  return data.risk_tiers.map(tier => ({
    title: tier.label,
    body: tier.description,
    tags: [tier.id, tier.article_reference, tier.enforcement_date],
    color: tier.color,
    meta: `${tier.article_reference} | Enforcement: ${tier.enforcement_date}`,
  }))
}

function matchesQuery(item, query) {
  if (!query) return true

  const text = [item.title, item.body, item.meta, ...(item.tags || [])].join(' ').toLowerCase()
  return text.includes(query)
}

function ResearchHub() {
  const [activeSection, setActiveSection] = useState('all')
  const [query, setQuery] = useState('')

  const sections = useMemo(() => [
    KNOWLEDGE_SECTIONS[0],
    {
      id: 'tiers',
      label: 'Risk tiers explained',
      items: buildTierItems(),
    },
    ...KNOWLEDGE_SECTIONS.slice(1),
  ], [])

  const filteredSections = sections
    .filter(section => activeSection === 'all' || section.id === activeSection)
    .map(section => ({
      ...section,
      items: section.items.filter(item => matchesQuery(item, query.trim().toLowerCase())),
    }))
    .filter(section => section.items.length > 0)

  const resultCount = filteredSections.reduce((count, section) => count + section.items.length, 0)

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-[#3B2A20] bg-[#1B120E] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A45C]">Research Hub</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#F4E8D0]">AI governance knowledge base</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#A99573]">
            A compact study workspace for EU AI Act concepts, risk classification, legal terms, and governance obligations.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search concepts, terms, articles, obligations..."
            className="w-full rounded-md border border-[#3B2A20] bg-[#120D0A] px-3 py-2 text-sm text-[#F4E8D0] outline-none transition-colors placeholder:text-[#A99573] focus:border-[#7A6235]"
          />

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveSection('all')}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-all ${
                activeSection === 'all'
                  ? 'border-[#7A6235] bg-[#3B2A20] text-[#F4E8D0]'
                  : 'border-[#3B2A20] text-[#A99573] hover:border-[#7A6235] hover:text-[#D8C7A3]'
              }`}
            >
              All topics
            </button>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-all ${
                  activeSection === section.id
                    ? 'border-[#7A6235] bg-[#7A6235]/20 text-[#F4E8D0]'
                    : 'border-[#3B2A20] text-[#A99573] hover:border-[#7A6235] hover:text-[#D8C7A3]'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-[#A99573]">
            <span>{resultCount} knowledge item{resultCount === 1 ? '' : 's'}</span>
            {(query || activeSection !== 'all') && (
              <button
                onClick={() => {
                  setQuery('')
                  setActiveSection('all')
                }}
                className="text-[#A99573] transition-colors hover:text-[#F4E8D0]"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {filteredSections.length > 0 ? (
        filteredSections.map(section => (
          <section key={section.id} className="rounded-xl border border-[#3B2A20] bg-[#1B120E] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A99573]">{section.label}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map(item => (
                <article key={`${section.id}-${item.title}`} className="rounded-lg border border-[#3B2A20] bg-[#2E1D16]/75 p-4 shadow-[inset_0_1px_0_rgba(243,240,232,0.035)]">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#F4E8D0]">{item.title}</h3>
                    {item.color && (
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: item.color }} />
                    )}
                  </div>
                  {item.meta && <p className="mt-2 text-xs text-[#E0C078]">{item.meta}</p>}
                  <p className="mt-3 text-sm leading-relaxed text-[#A99573]">{item.body}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.tags.map(tag => (
                      <span key={tag} className="rounded-full border border-[#3B2A20] px-2 py-1 text-xs text-[#A99573]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : (
        <section className="rounded-xl border border-[#3B2A20] bg-[#1B120E] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.22)] text-center">
          <p className="text-sm font-semibold text-[#F4E8D0]">No research notes found</p>
          <p className="mt-2 text-xs text-[#A99573]">Try another search term or clear the topic filter.</p>
        </section>
      )}
    </div>
  )
}

export default ResearchHub

import { useMemo, useState } from 'react'
import data from '../data/eu-ai-act.json'

const TIER_ORDER = ['minimal', 'limited', 'high', 'unacceptable']

const QUESTIONS = [
  {
    id: 'biometricPublic',
    label: 'Real-time biometric identification in public spaces',
    description: 'The system identifies people remotely using biometric data in publicly accessible spaces.',
    tier: 'unacceptable',
    articles: ['Article 5(1)(h)'],
    obligations: ['Generally prohibited, with narrow law-enforcement exceptions requiring strict authorization.'],
    reason: 'Real-time remote biometric identification in public spaces is treated as a prohibited practice in most contexts.',
  },
  {
    id: 'manipulationOrScoring',
    label: 'Social scoring, manipulation, or exploitative targeting',
    description: 'The system scores people for unrelated treatment or manipulates vulnerable users in harmful ways.',
    tier: 'unacceptable',
    articles: ['Article 5(1)(a)-(c)'],
    obligations: ['Prohibited where the practice materially distorts behavior or leads to unjustified detrimental treatment.'],
    reason: 'The EU AI Act prohibits manipulative practices and public-authority social scoring that undermine rights or dignity.',
  },
  {
    id: 'employment',
    label: 'Employment or hiring decisions',
    description: 'The system screens, ranks, evaluates, monitors, or selects workers or candidates.',
    tier: 'high',
    articles: ['Annex III, Point 4(a)', 'Articles 9-15'],
    obligations: ['Risk management', 'Data governance and bias mitigation', 'Human oversight', 'Transparency to affected people'],
    reason: 'AI used for recruitment, worker evaluation, or employment decisions is commonly classified as high-risk.',
  },
  {
    id: 'education',
    label: 'Education access or assessment',
    description: 'The system determines access, evaluates learning outcomes, grades work, or monitors students.',
    tier: 'high',
    articles: ['Annex III, Point 3', 'Articles 9-15'],
    obligations: ['Risk management', 'Representative data', 'Human review', 'Transparency to students or guardians'],
    reason: 'Education access and assessment systems can materially affect a person’s educational trajectory.',
  },
  {
    id: 'healthcare',
    label: 'Healthcare, diagnosis, triage, or medical devices',
    description: 'The system supports diagnosis, triage, treatment, surgery, or patient care decisions.',
    tier: 'high',
    articles: ['Annex III, Point 5(a)', 'Articles 9-15'],
    obligations: ['Clinical validation', 'Risk management', 'Logging and traceability', 'Human oversight'],
    reason: 'Healthcare AI can directly affect health and safety, making it a strong high-risk signal.',
  },
  {
    id: 'justice',
    label: 'Law enforcement, migration, or justice use',
    description: 'The system assists policing, border control, courts, sentencing, risk assessment, or migration decisions.',
    tier: 'high',
    articles: ['Annex III, Points 6-8', 'Articles 9-15'],
    obligations: ['Strict human oversight', 'Explainability', 'Bias testing', 'Technical documentation and logging'],
    reason: 'Justice, border, and law-enforcement contexts carry significant fundamental-rights risk.',
  },
  {
    id: 'credit',
    label: 'Credit, lending, or financial access',
    description: 'The system evaluates creditworthiness, eligibility, repayment risk, or access to financial services.',
    tier: 'high',
    articles: ['Annex III, Point 5(b)', 'Articles 9-15'],
    obligations: ['Data quality controls', 'Transparency to affected people', 'Human oversight', 'Output logging'],
    reason: 'Creditworthiness systems can affect access to essential financial services.',
  },
  {
    id: 'infrastructure',
    label: 'Critical infrastructure',
    description: 'The system manages or materially affects electricity, water, transport, or other critical infrastructure.',
    tier: 'high',
    articles: ['Annex III, Point 2', 'Articles 9-15'],
    obligations: ['Fail-safe mechanisms', 'Continuous monitoring', 'Cybersecurity controls', 'Human override'],
    reason: 'Critical infrastructure AI can affect public safety and essential services.',
  },
  {
    id: 'transparency',
    label: 'Chatbots, deepfakes, or AI-generated content',
    description: 'Users interact with AI, or the system generates synthetic audio, video, images, or text that may need disclosure.',
    tier: 'limited',
    articles: ['Article 50'],
    obligations: ['Disclose AI interaction', 'Label synthetic or manipulated content where required', 'Use clear user-facing transparency notices'],
    reason: 'Transparency obligations usually point to limited-risk classification unless a higher-risk use also applies.',
  },
]

function getTierMeta(tierId) {
  return data.risk_tiers.find(tier => tier.id === tierId)
}

function classifyRisk(answers) {
  const selectedSignals = QUESTIONS.filter(question => answers[question.id])
  const highestTier = selectedSignals.reduce((current, signal) => (
    TIER_ORDER.indexOf(signal.tier) > TIER_ORDER.indexOf(current) ? signal.tier : current
  ), 'minimal')

  const tierMeta = getTierMeta(highestTier)
  const matchingSignals = selectedSignals.filter(signal => signal.tier === highestTier)

  if (selectedSignals.length === 0) {
    return {
      tier: tierMeta,
      reasoning: ['No high-risk, limited-risk, or prohibited signals were selected. The system may be minimal risk under the EU AI Act, though other laws and product-specific rules may still apply.'],
      articles: [tierMeta.article_reference],
      obligations: ['No mandatory EU AI Act obligations identified from this basic questionnaire.', 'Voluntary codes of conduct and good governance practices are still encouraged.'],
      signals: [],
    }
  }

  return {
    tier: tierMeta,
    reasoning: matchingSignals.map(signal => signal.reason),
    articles: [...new Set(matchingSignals.flatMap(signal => signal.articles))],
    obligations: [...new Set(matchingSignals.flatMap(signal => signal.obligations))],
    signals: selectedSignals,
  }
}

function RiskEngine() {
  const [answers, setAnswers] = useState({})
  const result = useMemo(() => classifyRisk(answers), [answers])
  const selectedCount = result.signals.length

  function toggleAnswer(id) {
    setAnswers(current => ({
      ...current,
      [id]: !current[id],
    }))
  }

  function resetAnswers() {
    setAnswers({})
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-xl border border-[#202B43] bg-[#121A2B] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C6A664]">Risk Classification Engine</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#F3F0E8]">Assess a hypothetical AI system</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#8E96A8]">
              Select the contexts that apply. ThemisOS will estimate the likely EU AI Act risk tier and surface useful references from the current knowledge base.
            </p>
          </div>
          <button
            onClick={resetAnswers}
            className="self-start rounded-md border border-[#202B43] px-3 py-2 text-sm text-[#C7C2B5] transition-colors hover:border-[#3D4D7A] hover:text-[#F3F0E8]"
          >
            Reset
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {QUESTIONS.map(question => {
            const checked = Boolean(answers[question.id])
            const tier = getTierMeta(question.tier)

            return (
              <button
                key={question.id}
                onClick={() => toggleAnswer(question.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  checked
                    ? 'border-[#3D4D7A]/60 bg-[#3D4D7A]/10'
                    : 'border-[#202B43] bg-[#0B1020]/50 hover:border-[#3D4D7A]'
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#F3F0E8]">{question.label}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#8E96A8]">{question.description}</p>
                  </div>
                  <span className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${checked ? 'border-[#C6A664] bg-[#C6A664]' : 'border-[#3D4D7A]'}`} />
                </div>
                <span
                  className="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                  style={{ background: `${tier.color}22`, color: tier.color }}
                >
                  {tier.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <aside className="rounded-xl border border-[#202B43] bg-[#121A2B] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8E96A8]">Estimated Result</p>
        <div className="mt-3 rounded-lg border border-[#202B43] bg-[#0B1020]/70 p-4">
          <span
            className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
            style={{ background: `${result.tier.color}26`, color: result.tier.color }}
          >
            {result.tier.label}
          </span>
          <p className="mt-3 text-sm leading-relaxed text-[#C7C2B5]">{result.tier.description}</p>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E96A8]">Reasoning</h2>
            <ul className="mt-2 space-y-2">
              {result.reasoning.map(reason => (
                <li key={reason} className="rounded-md border border-[#202B43] bg-[#0B1020]/60 p-3 text-xs leading-relaxed text-[#C7C2B5]">
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E96A8]">Relevant References</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.articles.map(article => (
                <span key={article} className="rounded-md border border-[#3D4D7A]/20 bg-[#3D4D7A]/10 px-2 py-1.5 text-xs text-[#D8BC7A]">
                  {article}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E96A8]">Likely Obligations</h2>
            <ul className="mt-2 space-y-2">
              {result.obligations.map(obligation => (
                <li key={obligation} className="flex gap-2 rounded-md border border-[#202B43] bg-[#0B1020]/60 p-3 text-xs leading-relaxed text-[#C7C2B5]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C6A664]" />
                  {obligation}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-[#202B43] bg-[#0B1020]/70 p-3">
            <p className="text-xs leading-relaxed text-[#8E96A8]">
              {selectedCount} signal{selectedCount === 1 ? '' : 's'} selected. This is an educational screening tool, not legal advice. A final classification requires legal review of the exact system, provider/deployer role, intended purpose, users, market context, and applicable exceptions.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default RiskEngine

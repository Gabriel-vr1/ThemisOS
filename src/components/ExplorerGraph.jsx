import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/eu-ai-act.json'

const TIER_COLORS = {
  unacceptable: '#A32D2D',
  high: '#BA7517',
  limited: '#185FA5',
  minimal: '#3B6D11',
}

const TIER_LABELS = {
  unacceptable: 'Unacceptable Risk',
  high: 'High Risk',
  limited: 'Limited Risk',
  minimal: 'Minimal Risk',
}

const LABEL_LIMIT = 28

function truncateLabel(label) {
  return label.length > LABEL_LIMIT ? `${label.slice(0, LABEL_LIMIT - 1)}...` : label
}

function ExplorerGraph() {
  const svgRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [activeTier, setActiveTier] = useState(null)

  useEffect(() => {
    const width = svgRef.current.clientWidth
    const height = 600

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const visibleTiers = activeTier
      ? data.risk_tiers.filter(t => t.id === activeTier)
      : data.risk_tiers

    const visibleUseCases = activeTier
      ? data.use_cases.filter(u => u.tier === activeTier)
      : data.use_cases

    const nodes = [
      ...visibleTiers.map(t => ({
        id: t.id,
        label: t.label,
        type: 'tier',
        color: t.color,
        tier: t.id,
        tierLabel: t.label,
        data: t,
      })),
      ...visibleUseCases.map(u => ({
        id: u.id,
        label: u.short_label,
        type: 'usecase',
        tier: u.tier,
        color: TIER_COLORS[u.tier],
        tierLabel: TIER_LABELS[u.tier],
        data: u,
      })),
    ]

    const links = visibleUseCases.map(u => ({
      source: u.tier,
      target: u.id,
    }))

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => TIER_COLORS[d.source.id] || '#444')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1)

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on('click', (event, d) => {
        setSelected({
          ...d.data,
          nodeType: d.type,
          color: d.color,
          tier: d.tier,
          tierLabel: d.tierLabel,
        })
      })

    node.append('circle')
      .attr('r', d => d.type === 'tier' ? 28 : 16)
      .attr('fill', d => d.color)
      .attr('fill-opacity', d => d.type === 'tier' ? 0.9 : 0.7)
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => d.type === 'tier' ? 2 : 1)

    const label = node.append('g')
      .attr('pointer-events', 'none')
      .attr('transform', d => d.type === 'tier' ? 'translate(0,0)' : 'translate(0,30)')

    label.filter(d => d.type === 'usecase')
      .append('rect')
      .attr('x', -72)
      .attr('y', -10)
      .attr('width', 144)
      .attr('height', 20)
      .attr('rx', 4)
      .attr('fill', '#111827')
      .attr('fill-opacity', 0.92)
      .attr('stroke', '#374151')
      .attr('stroke-opacity', 0.75)

    label.append('text')
      .text(d => d.type === 'tier'
        ? TIER_LABELS[d.id].split(' ')[0]
        : truncateLabel(d.label)
      )
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', d => d.type === 'tier' ? '11px' : '10px')
      .attr('font-weight', d => d.type === 'tier' ? 700 : 500)

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => simulation.stop()
  }, [activeTier])

  return (
    <div className="flex gap-6">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTier(null)}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-600 transition-all"
            style={{
              color: activeTier === null ? '#fff' : '#9ca3af',
              background: activeTier === null ? '#374151' : 'transparent',
            }}
          >
            All
          </button>
          {data.risk_tiers.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTier(activeTier === t.id ? null : t.id)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: t.color,
                color: activeTier === t.id ? '#fff' : t.color,
                background: activeTier === t.id ? t.color : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
          {data.risk_tiers.map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: t.color }}
              />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <svg ref={svgRef} className="w-full" style={{ height: 600 }} />
        </div>
      </div>

      {selected && (
        <div className="w-80 shrink-0 rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 660 }}>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-white leading-snug">{selected.label}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
          </div>

          {selected.tierLabel && (
            <span className="text-xs px-2 py-1 rounded-full self-start font-medium"
              style={{ background: selected.color + '33', color: selected.color }}>
              {selected.tierLabel}
            </span>
          )}

          {selected.nodeType === 'usecase' && selected.domains && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Domains</p>
              <p className="text-xs text-gray-300">{selected.domains.join(', ')}</p>
            </div>
          )}

          {selected.description && (
            <p className="text-xs text-gray-400 leading-relaxed">{selected.description}</p>
          )}

          {selected.article_reference && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Article Reference</p>
              <p className="text-xs text-blue-400">{selected.article_reference}</p>
            </div>
          )}

          {selected.key_obligations && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Obligations</p>
              <ul className="flex flex-col gap-1">
                {selected.key_obligations.map((o, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-amber-500 mt-0.5">—</span>{o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.obligations && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Obligations</p>
              <ul className="flex flex-col gap-1">
                {selected.obligations.map((o, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-red-500 mt-0.5">—</span>{o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.real_world_examples && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Real World Examples</p>
              <ul className="flex flex-col gap-1">
                {selected.real_world_examples.map((e, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-gray-600 mt-0.5">•</span>{e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.enforcement_date && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Enforcement Date</p>
              <p className="text-xs text-green-400">{selected.enforcement_date}</p>
            </div>
          )}

          {selected.penalty_max && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Maximum Penalty</p>
              <p className="text-xs text-red-400">{selected.penalty_max}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExplorerGraph

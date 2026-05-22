import { useCallback, useEffect, useRef, useState } from 'react'
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
const TIER_ORDER = ['unacceptable', 'high', 'limited', 'minimal']

function truncateLabel(label) {
  return label.length > LABEL_LIMIT ? `${label.slice(0, LABEL_LIMIT - 1)}...` : label
}

function getTierAnchors(tiers, width, height) {
  const paddingX = Math.max(130, width * 0.16)
  const paddingY = 125
  const centerX = width / 2
  const centerY = height / 2
  const orderedTiers = [...tiers].sort((a, b) => TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id))

  if (orderedTiers.length === 1) {
    return {
      [orderedTiers[0].id]: { x: centerX, y: centerY },
    }
  }

  const positions = [
    { x: paddingX, y: paddingY },
    { x: width - paddingX, y: paddingY },
    { x: paddingX, y: height - paddingY },
    { x: width - paddingX, y: height - paddingY },
  ]

  return orderedTiers.reduce((anchors, tier, index) => {
    anchors[tier.id] = positions[index] || { x: centerX, y: centerY }
    return anchors
  }, {})
}

function getSeedPosition(anchor, index, total, radius) {
  const angle = ((Math.PI * 2) / Math.max(total, 1)) * index - Math.PI / 2
  const ring = radius + (index % 3) * 18

  return {
    x: anchor.x + Math.cos(angle) * ring,
    y: anchor.y + Math.sin(angle) * ring,
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function ExplorerGraph() {
  const graphContainerRef = useRef(null)
  const svgRef = useRef(null)
  const zoomRef = useRef(null)
  const selectedIdRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [activeTier, setActiveTier] = useState(null)
  const [graphWidth, setGraphWidth] = useState(0)
  const [tooltip, setTooltip] = useState(null)

  const resetView = useCallback(() => {
    if (!zoomRef.current) return

    const { svg, zoom } = zoomRef.current
    svg.transition()
      .duration(350)
      .call(zoom.transform, d3.zoomIdentity)
  }, [])

  useEffect(() => {
    selectedIdRef.current = selected?.id || null
  }, [selected])

  useEffect(() => {
    if (!graphContainerRef.current) return undefined

    const observer = new ResizeObserver(entries => {
      const nextWidth = Math.floor(entries[0].contentRect.width)
      setGraphWidth(nextWidth)
    })

    observer.observe(graphContainerRef.current)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || graphWidth <= 0) return undefined

    const width = graphWidth
    const height = 600

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

    const graphLayer = svg.append('g')

    const zoom = d3.zoom()
      .scaleExtent([0.55, 2.8])
      .on('zoom', event => {
        graphLayer.attr('transform', event.transform)
      })

    svg
      .call(zoom)
      .on('dblclick.zoom', null)

    zoomRef.current = { svg, zoom }

    const visibleTiers = activeTier
      ? data.risk_tiers.filter(t => t.id === activeTier)
      : data.risk_tiers

    const visibleUseCases = activeTier
      ? data.use_cases.filter(u => u.tier === activeTier)
      : data.use_cases

    const tierAnchors = getTierAnchors(visibleTiers, width, height)
    const tierUseCaseCounts = visibleUseCases.reduce((counts, useCase) => {
      counts[useCase.tier] = (counts[useCase.tier] || 0) + 1
      return counts
    }, {})
    const tierUseCaseIndexes = {}

    const nodes = [
      ...visibleTiers.map(t => ({
        id: t.id,
        label: t.label,
        type: 'tier',
        color: t.color,
        tier: t.id,
        tierLabel: t.label,
        x: tierAnchors[t.id].x,
        y: tierAnchors[t.id].y,
        data: t,
      })),
      ...visibleUseCases.map(u => {
        const tierIndex = tierUseCaseIndexes[u.tier] || 0
        const seed = getSeedPosition(
          tierAnchors[u.tier],
          tierIndex,
          tierUseCaseCounts[u.tier],
          activeTier ? 115 : 88
        )

        tierUseCaseIndexes[u.tier] = tierIndex + 1

        return {
          id: u.id,
          label: u.short_label,
          type: 'usecase',
          tier: u.tier,
          color: TIER_COLORS[u.tier],
          tierLabel: TIER_LABELS[u.tier],
          x: Math.max(80, Math.min(width - 80, seed.x)),
          y: Math.max(80, Math.min(height - 80, seed.y)),
          data: u,
        }
      }),
    ]

    const links = visibleUseCases.map(u => ({
      source: u.tier,
      target: u.id,
    }))

    function setNodeState(selection, state) {
      selection.select('circle')
        .attr('fill-opacity', d => {
          if (state === 'hover') return 1
          if (state === 'selected') return 1
          return d.type === 'tier' ? 0.9 : 0.7
        })
        .attr('stroke', d => {
          if (state === 'hover' || state === 'selected') return '#f9fafb'
          return d.color
        })
        .attr('stroke-width', d => {
          if (state === 'hover') return d.type === 'tier' ? 4 : 3
          if (state === 'selected') return d.type === 'tier' ? 5 : 4
          return d.type === 'tier' ? 2 : 1
        })

      selection.select('rect')
        .attr('stroke', state === 'hover' || state === 'selected' ? '#f9fafb' : '#374151')
        .attr('fill-opacity', state === 'hover' || state === 'selected' ? 1 : 0.92)
    }

    function resetNodeStates() {
      node.each(function (d) {
        setNodeState(d3.select(this), d.id === selectedIdRef.current ? 'selected' : 'default')
      })
    }

    const simulation = d3.forceSimulation(nodes)
      .alpha(0.9)
      .alphaDecay(0.035)
      .velocityDecay(0.42)
      .force('link', d3.forceLink(links).id(d => d.id).distance(activeTier ? 125 : 95).strength(0.55))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'tier' ? -700 : -135))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('clusterX', d3.forceX(d => tierAnchors[d.tier]?.x || width / 2).strength(d => d.type === 'tier' ? 0.34 : 0.12))
      .force('clusterY', d3.forceY(d => tierAnchors[d.tier]?.y || height / 2).strength(d => d.type === 'tier' ? 0.34 : 0.12))
      .force('collision', d3.forceCollide().radius(d => d.type === 'tier' ? 72 : 56).strength(0.9))

    const link = graphLayer.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => TIER_COLORS[d.source.id] || '#444')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1)

    const node = graphLayer.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          event.sourceEvent.stopPropagation()
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          event.sourceEvent.stopPropagation()
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          event.sourceEvent.stopPropagation()
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        const clicked = {
          ...d.data,
          nodeType: d.type,
          color: d.color,
          tier: d.tier,
          tierLabel: d.tierLabel,
        }

        node.each(function (nodeDatum) {
          setNodeState(d3.select(this), nodeDatum.id === d.id ? 'selected' : 'default')
        })

        selectedIdRef.current = d.id
        setSelected(clicked)
      })
      .on('mouseenter', function (event, d) {
        setNodeState(d3.select(this), d.id === selectedIdRef.current ? 'selected' : 'hover')
        setTooltip({
          x: event.offsetX,
          y: event.offsetY,
          title: d.data.label,
          tierLabel: d.tierLabel,
          color: d.color,
          description: d.data.description,
          article: d.data.article_reference,
        })
      })
      .on('mousemove', event => {
        setTooltip(current => current && {
          ...current,
          x: event.offsetX,
          y: event.offsetY,
        })
      })
      .on('mouseleave', function () {
        resetNodeStates()
        setTooltip(null)
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

    resetNodeStates()

    simulation.on('tick', () => {
      nodes.forEach(d => {
        d.x = clamp(d.x, 75, width - 75)
        d.y = clamp(d.y, 65, height - 70)
      })

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
      zoomRef.current = null
    }
  }, [activeTier, graphWidth])

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
        <div ref={graphContainerRef} className="relative rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <button
            onClick={resetView}
            className="absolute right-3 top-3 z-10 rounded-md border border-gray-700 bg-gray-950/90 px-3 py-1.5 text-xs text-gray-200 shadow-lg transition-colors hover:border-gray-500 hover:bg-gray-800"
          >
            Reset view
          </button>
          <svg ref={svgRef} className="w-full" style={{ height: 600 }} />
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 w-64 rounded-md border border-gray-700 bg-gray-950/95 p-3 text-xs shadow-xl"
              style={{
                left: Math.min(tooltip.x + 14, Math.max(graphWidth - 280, 12)),
                top: Math.max(tooltip.y - 12, 12),
              }}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: tooltip.color }}
                />
                <span className="font-semibold text-white">{tooltip.title}</span>
              </div>
              <p className="mb-2 text-gray-400">{tooltip.tierLabel}</p>
              {tooltip.description && (
                <p className="line-clamp-3 leading-relaxed text-gray-300">{tooltip.description}</p>
              )}
              {tooltip.article && (
                <p className="mt-2 text-blue-400">{tooltip.article}</p>
              )}
            </div>
          )}
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

import { useCallback, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import data from '../data/eu-ai-act.json'

const TIER_COLORS = {
  unacceptable: '#8F2D3F',
  high: '#B07A2A',
  limited: '#355C8A',
  minimal: '#3F6B4E',
}

const TIER_LABELS = {
  unacceptable: 'Unacceptable Risk',
  high: 'High Risk',
  limited: 'Limited Risk',
  minimal: 'Minimal Risk',
}

const LABEL_LIMIT = 28
const TIER_ORDER = ['unacceptable', 'high', 'limited', 'minimal']
const DOMAIN_LABELS = data.domains.reduce((labels, domain) => {
  labels[domain.id] = domain.label
  return labels
}, {})

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

function getDomainLabels(domains = []) {
  return domains.map(domain => DOMAIN_LABELS[domain] || domain)
}

function matchesSearch(useCase, searchTerm) {
  if (!searchTerm) return true

  const haystack = [
    useCase.label,
    useCase.short_label,
    useCase.description,
    useCase.article_reference,
    ...getDomainLabels(useCase.domains),
    ...useCase.domains,
  ].join(' ').toLowerCase()

  return haystack.includes(searchTerm)
}

function ExplorerGraph() {
  const graphContainerRef = useRef(null)
  const svgRef = useRef(null)
  const zoomRef = useRef(null)
  const selectedIdRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [activeTier, setActiveTier] = useState(null)
  const [activeDomain, setActiveDomain] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [graphWidth, setGraphWidth] = useState(0)
  const [layoutVersion, setLayoutVersion] = useState(0)
  const [tooltip, setTooltip] = useState(null)

  const resetView = useCallback(() => {
    if (!zoomRef.current) return

    const { svg, zoom } = zoomRef.current
    svg.transition()
      .duration(350)
      .call(zoom.transform, d3.zoomIdentity)
  }, [])

  const resetLayout = useCallback(() => {
    setSelected(null)
    setTooltip(null)
    setLayoutVersion(version => version + 1)
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

    const searchTerm = searchQuery.trim().toLowerCase()

    const visibleUseCases = activeTier
      ? data.use_cases.filter(u => u.tier === activeTier)
      : data.use_cases

    const filteredUseCases = visibleUseCases.filter(useCase => {
      const matchesDomain = activeDomain ? useCase.domains.includes(activeDomain) : true
      return matchesDomain && matchesSearch(useCase, searchTerm)
    })

    const hasUseCaseFilters = Boolean(activeDomain || searchTerm)
    const visibleTierIds = new Set(filteredUseCases.map(useCase => useCase.tier))
    const visibleTiers = activeTier
      ? data.risk_tiers.filter(t => t.id === activeTier && (!hasUseCaseFilters || visibleTierIds.has(t.id)))
      : data.risk_tiers.filter(t => !hasUseCaseFilters || visibleTierIds.has(t.id))

    const tierAnchors = getTierAnchors(visibleTiers, width, height)
    const tierUseCaseCounts = filteredUseCases.reduce((counts, useCase) => {
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
      ...filteredUseCases.map(u => {
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

    const links = filteredUseCases.map(u => ({
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
          if (state === 'hover' || state === 'selected') return '#F3E7D0'
          return d.color
        })
        .attr('stroke-width', d => {
          if (state === 'hover') return d.type === 'tier' ? 4 : 3
          if (state === 'selected') return d.type === 'tier' ? 5 : 4
          return d.type === 'tier' ? 2 : 1
        })

      selection.select('rect')
        .attr('stroke', state === 'hover' || state === 'selected' ? '#C8A96B' : '#4A3727')
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
      .force('clusterX', d3.forceX(d => tierAnchors[d.tier]?.x || width / 2).strength(d => d.type === 'tier' ? 0.2 : 0.045))
      .force('clusterY', d3.forceY(d => tierAnchors[d.tier]?.y || height / 2).strength(d => d.type === 'tier' ? 0.2 : 0.045))
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
          d.fx = clamp(d.x, 75, width - 75)
          d.fy = clamp(d.y, 65, height - 70)
        })
        .on('drag', (event, d) => {
          event.sourceEvent.stopPropagation()
          d.fx = clamp(event.x, 75, width - 75)
          d.fy = clamp(event.y, 65, height - 70)
        })
        .on('end', event => {
          event.sourceEvent.stopPropagation()
          if (!event.active) simulation.alphaTarget(0)
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
      .on('dblclick', (event, d) => {
        event.stopPropagation()
        d.fx = null
        d.fy = null
        simulation.alphaTarget(0.18).restart()
        window.setTimeout(() => simulation.alphaTarget(0), 220)
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
      .attr('fill', '#1E1713')
      .attr('fill-opacity', 0.92)
      .attr('stroke', '#4A3727')
      .attr('stroke-opacity', 0.75)

    label.append('text')
      .text(d => d.type === 'tier'
        ? TIER_LABELS[d.id].split(' ')[0]
        : truncateLabel(d.label)
      )
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#F3E7D0')
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
  }, [activeDomain, activeTier, graphWidth, layoutVersion, searchQuery])

  const searchTerm = searchQuery.trim().toLowerCase()
  const baseUseCases = activeTier
    ? data.use_cases.filter(useCase => useCase.tier === activeTier)
    : data.use_cases
  const filteredUseCases = baseUseCases.filter(useCase => {
    const matchesDomain = activeDomain ? useCase.domains.includes(activeDomain) : true
    return matchesDomain && matchesSearch(useCase, searchTerm)
  })
  const isEmpty = filteredUseCases.length === 0

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="grid gap-3 rounded-lg border border-[#4A3727] bg-[#15110E]/95 p-3 shadow-[inset_0_1px_0_rgba(243,231,208,0.035)]">
          <input
            value={searchQuery}
            onChange={event => {
              setSearchQuery(event.target.value)
              setSelected(null)
              setTooltip(null)
            }}
            placeholder="Search use cases, domains, articles..."
            className="w-full rounded-md border border-[#4A3727] bg-[#0E0B09] px-3 py-2 text-sm text-[#F3E7D0] outline-none transition-colors placeholder:text-[#8B7A65] focus:border-[#7A6038]"
          />

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setActiveTier(null)
                setSelected(null)
                setTooltip(null)
              }}
              className="shrink-0 rounded-full border border-[#7A6038] px-3 py-1.5 text-xs transition-all"
              style={{
                color: activeTier === null ? '#F3E7D0' : '#8B7A65',
                background: activeTier === null ? '#2A201A' : 'transparent',
              }}
            >
              All tiers
            </button>
            {data.risk_tiers.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTier(activeTier === t.id ? null : t.id)
                  setSelected(null)
                  setTooltip(null)
                }}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs transition-all"
                style={{
                  borderColor: t.color,
                  color: activeTier === t.id ? '#F3E7D0' : t.color,
                  background: activeTier === t.id ? t.color : 'transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setActiveDomain(null)
                setSelected(null)
                setTooltip(null)
              }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-all ${
                activeDomain === null
                  ? 'border-[#7A6038] bg-[#4A3727] text-[#F3E7D0]'
                  : 'border-[#4A3727] text-[#8B7A65] hover:border-[#7A6038] hover:text-[#D0BFA3]'
              }`}
            >
              All domains
            </button>
            {data.domains.map(domain => (
              <button
                key={domain.id}
                onClick={() => {
                  setActiveDomain(activeDomain === domain.id ? null : domain.id)
                  setSelected(null)
                  setTooltip(null)
                }}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-all ${
                  activeDomain === domain.id
                    ? 'border-[#7A6038] bg-[#7A6038]/20 text-[#F3E7D0]'
                    : 'border-[#4A3727] text-[#8B7A65] hover:border-[#7A6038] hover:text-[#D0BFA3]'
                }`}
              >
                {domain.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-[#8B7A65]">
            <span>{filteredUseCases.length} matching use case{filteredUseCases.length === 1 ? '' : 's'}</span>
            {(activeTier || activeDomain || searchQuery) && (
              <button
                onClick={() => {
                  setActiveTier(null)
                  setActiveDomain(null)
                  setSearchQuery('')
                  setSelected(null)
                  setTooltip(null)
                }}
                className="text-[#8B7A65] transition-colors hover:text-[#F3E7D0]"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8B7A65]">
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
        <div ref={graphContainerRef} className="relative overflow-hidden rounded-xl border border-[#2C3346] bg-[#211A24] shadow-[0_22px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(243,231,208,0.035)]">
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              onClick={resetView}
              disabled={isEmpty}
              className="rounded-md border border-[#4A3727] bg-[#15110E]/95 px-3 py-1.5 text-xs text-[#D0BFA3] shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition-colors hover:border-[#C8A96B]/60 hover:bg-[#2A201A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset View
            </button>
            <button
              onClick={resetLayout}
              disabled={isEmpty}
              className="rounded-md border border-[#C8A96B]/45 bg-[#2A201A] px-3 py-1.5 text-xs font-medium text-[#F3E7D0] shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition-colors hover:border-[#E0C98A] hover:bg-[#3A281E] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset Layout
            </button>
          </div>
          <svg ref={svgRef} className="w-full" style={{ height: 600 }} />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#2A201A]/70 px-6 text-center">
              <div className="max-w-sm rounded-lg border border-[#4A3727] bg-[#15110E]/95 p-5 shadow-xl">
                <p className="text-sm font-semibold text-[#F3E7D0]">No matching use cases</p>
                <p className="mt-2 text-xs leading-relaxed text-[#8B7A65]">
                  Try clearing the search, choosing another domain, or switching risk tiers.
                </p>
              </div>
            </div>
          )}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 w-64 rounded-md border border-[#7A6038]/60 bg-[#15110E]/95 p-3 text-xs shadow-xl"
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
                <span className="font-semibold text-[#F3E7D0]">{tooltip.title}</span>
              </div>
              <p className="mb-2 text-[#8B7A65]">{tooltip.tierLabel}</p>
              {tooltip.description && (
                <p className="line-clamp-3 leading-relaxed text-[#D0BFA3]">{tooltip.description}</p>
              )}
              {tooltip.article && (
                <p className="mt-2 text-[#C8A96B]">{tooltip.article}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="flex max-h-none w-full shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border border-[#2C3346] bg-[#211A24] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(243,231,208,0.035)] xl:max-h-[660px] xl:w-80">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#F3E7D0] leading-snug">{selected.label}</h2>
            <button onClick={() => setSelected(null)} className="text-[#8B7A65] hover:text-[#F3E7D0] text-lg leading-none">×</button>
          </div>

          {selected.tierLabel && (
            <span className="text-xs px-2 py-1 rounded-full self-start font-medium"
              style={{ background: selected.color + '33', color: selected.color }}>
              {selected.tierLabel}
            </span>
          )}

          {selected.nodeType === 'usecase' && selected.domains && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B7A65]">Domains</p>
              <div className="flex flex-wrap gap-1.5">
                {getDomainLabels(selected.domains).map(domain => (
                  <span key={domain} className="rounded-full border border-[#4A3727] px-2 py-1 text-xs text-[#D0BFA3]">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selected.description && (
            <p className="text-xs text-[#8B7A65] leading-relaxed">{selected.description}</p>
          )}

          {selected.article_reference && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8B7A65]">Article Reference</p>
              <p className="rounded-md border border-[#7A6038]/20 bg-[#7A6038]/10 px-2 py-1.5 text-xs text-[#E0C98A]">{selected.article_reference}</p>
            </div>
          )}

          {selected.key_obligations && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B7A65]">Key Obligations</p>
              <ul className="flex flex-col gap-2">
                {selected.key_obligations.map((o, i) => (
                  <li key={i} className="flex gap-2 rounded-md border border-[#4A3727] bg-[#2A201A]/75 p-2 text-xs text-[#D0BFA3]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8A96B]" />{o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.obligations && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B7A65]">Obligations</p>
              <ul className="flex flex-col gap-2">
                {selected.obligations.map((o, i) => (
                  <li key={i} className="flex gap-2 rounded-md border border-[#4A3727] bg-[#2A201A]/75 p-2 text-xs text-[#D0BFA3]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8F2D3F]" />{o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.real_world_examples && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B7A65]">Real World Examples</p>
              <ul className="flex flex-col gap-2">
                {selected.real_world_examples.map((e, i) => (
                  <li key={i} className="flex gap-2 rounded-md border border-[#4A3727] bg-[#2A201A]/75 p-2 text-xs text-[#D0BFA3]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B7A65]" />{e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.enforcement_date && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8B7A65]">Enforcement Date</p>
              <p className="rounded-md border border-[#3F6B4E]/20 bg-[#3F6B4E]/10 px-2 py-1.5 text-xs text-[#D0BFA3]">{selected.enforcement_date}</p>
            </div>
          )}

          {selected.penalty_max && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8B7A65]">Maximum Penalty</p>
              <p className="rounded-md border border-[#8F2D3F]/20 bg-[#8F2D3F]/10 px-2 py-1.5 text-xs text-[#D0BFA3]">{selected.penalty_max}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExplorerGraph

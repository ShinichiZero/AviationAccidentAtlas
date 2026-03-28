<script>
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import {
    insightData,
    filteredAccidents,
    filterAircraft,
    filterCause,
    filterSeverity,
    sidePanelOpen
  } from '$lib/stores/filters.js';

  let svgEl;
  let panelEl;

  // ── D3 Chart ───────────────────────────────────────────────────────────────
  const MARGIN = { top: 24, right: 16, bottom: 36, left: 44 };

  function drawChart(data) {
    if (!svgEl || !data?.length) return;

    const container = svgEl.parentElement;
    const W = container?.clientWidth  ?? 320;
    const H = 200;

    const width  = W - MARGIN.left - MARGIN.right;
    const height = H - MARGIN.top  - MARGIN.bottom;

    // Clear previous render
    d3.select(svgEl).selectAll('*').remove();

    const svg = d3.select(svgEl)
      .attr('width',  W)
      .attr('height', H)
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('aria-label', 'Accident frequency timeline');

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, (d) => d.year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .nice()
      .range([height, 0]);

    // Area fill
    const area = d3.area()
      .x((d) => x(d.year))
      .y0(height)
      .y1((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    // Line
    const line = d3.line()
      .x((d) => x(d.year))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    // Gradient
    const gradId = 'area-gradient';
    const defs   = svg.append('defs');
    const grad   = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.6);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.05);

    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradId})`)
      .attr('d', area);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6))
      .call((axis) => {
        axis.select('.domain').attr('stroke', '#30363d');
        axis.selectAll('.tick line').attr('stroke', '#30363d');
        axis.selectAll('.tick text').attr('fill', '#8b949e').attr('font-size', '10px');
      });

    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call((axis) => {
        axis.select('.domain').attr('stroke', '#30363d');
        axis.selectAll('.tick line').attr('stroke', '#30363d');
        axis.selectAll('.tick text').attr('fill', '#8b949e').attr('font-size', '10px');
      });

    // Y-label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -MARGIN.left + 10)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .attr('font-size', '10px')
      .text('Accidents');
  }

  // Re-draw on data change
  $: if (svgEl) drawChart($insightData);

  // Stats
  $: totalFiltered = $filteredAccidents.length;
  $: fatalCount    = $filteredAccidents.filter((f) => f.properties.severity === 'fatal').length;

  function close() {
    sidePanelOpen.set(false);
  }
</script>

{#if $sidePanelOpen}
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <aside
    bind:this={panelEl}
    class="side-panel"
    aria-label="Accident insights panel"
    tabindex="-1"
  >
    <div class="panel-header">
      <h2 class="panel-title">Accident Insights</h2>
      <button class="close-btn" on:click={close} aria-label="Close insights panel">✕</button>
    </div>

    <!-- Summary stats -->
    <div class="stats-row">
      <div class="stat">
        <span class="stat-value">{totalFiltered.toLocaleString()}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat fatal">
        <span class="stat-value">{fatalCount.toLocaleString()}</span>
        <span class="stat-label">Fatal</span>
      </div>
    </div>

    <!-- Filter chips -->
    <div class="filters-row">
      {#if $filterAircraft}
        <span class="chip">Aircraft: {$filterAircraft}</span>
      {/if}
      {#if $filterCause}
        <span class="chip">Cause: {$filterCause}</span>
      {/if}
      {#if $filterSeverity !== 'all'}
        <span class="chip">Severity: {$filterSeverity}</span>
      {/if}
      {#if !$filterAircraft && !$filterCause && $filterSeverity === 'all'}
        <span class="chip chip-neutral">All accidents</span>
      {/if}
    </div>

    <!-- D3 frequency chart -->
    <div class="chart-container">
      <p class="chart-title">Frequency by Year</p>
      <svg bind:this={svgEl}></svg>
    </div>
  </aside>
{/if}

<style>
  .side-panel {
    position: fixed;
    top: 16px;
    right: 16px;
    width: min(320px, calc(100vw - 32px));
    max-height: calc(100vh - 120px);
    background: rgba(13, 17, 23, 0.92);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 16px;
    z-index: 90;
    overflow-y: auto;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
    animation: slideIn 0.25s ease;
    color: #f0f6fc;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0);    }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .panel-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: #f0f6fc;
  }

  .close-btn {
    background: none;
    border: none;
    color: #8b949e;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 4px 8px;
    border-radius: 6px;
    line-height: 1;
    transition: color 0.15s, background 0.15s;
  }

  .close-btn:hover {
    color: #f0f6fc;
    background: rgba(255, 255, 255, 0.08);
  }

  .stats-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .stat {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 10px;
    text-align: center;
  }

  .stat.fatal .stat-value { color: #ef4444; }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f0f6fc;
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #8b949e;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .filters-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .chip {
    font-size: 0.72rem;
    padding: 3px 8px;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 999px;
    color: #93c5fd;
  }

  .chip-neutral {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    color: #8b949e;
  }

  .chart-container {
    margin-top: 4px;
  }

  .chart-title {
    font-size: 0.75rem;
    color: #8b949e;
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  svg {
    display: block;
    width: 100%;
    overflow: visible;
  }
</style>

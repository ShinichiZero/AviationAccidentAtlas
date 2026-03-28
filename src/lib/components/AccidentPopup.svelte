<script>
  import { selectedId, filteredAccidents } from '$lib/stores/filters.js';

  // Derive the selected accident from the store
  $: selected = $selectedId
    ? $filteredAccidents.find((f) => f.properties.id === $selectedId) ?? null
    : null;

  $: p = selected?.properties ?? null;
  $: coords = selected?.geometry?.coordinates ?? null;
  $: description = `${p?.description ?? ''}`.trim();
  $: cause = `${p?.cause ?? ''}`.trim();

  function dismiss() {
    selectedId.set(null);
  }

  const SEVERITY_EMOJI = { fatal: '🔴', serious: '🟠', minor: '🔵' };
</script>

{#if p}
  <div
    class="popup"
    role="dialog"
    aria-modal="true"
    aria-label="Accident details: {p.id}"
  >
    <div class="popup-header">
      <span class="severity-badge severity-{p.severity}">
        {SEVERITY_EMOJI[p.severity] ?? '⚪'} {p.severity}
      </span>
      <button class="close-btn" on:click={dismiss} aria-label="Close accident detail">✕</button>
    </div>

    <h3 class="popup-title">{p.aircraft || 'Unknown aircraft'}</h3>
    <p class="popup-meta">{p.date} · {[p.city, p.state, p.country].filter(Boolean).join(', ')}</p>

    <dl class="popup-stats">
      {#if p.fatals > 0}
        <div class="dl-row">
          <dt>Fatalities</dt>
          <dd class="fatal">{p.fatals}</dd>
        </div>
      {/if}
      {#if p.serious > 0}
        <div class="dl-row">
          <dt>Serious injuries</dt>
          <dd class="serious">{p.serious}</dd>
        </div>
      {/if}
      <div class="dl-row">
        <dt>Phase</dt>
        <dd>{p.phase || '—'}</dd>
      </div>
      <div class="dl-row">
        <dt>Weather</dt>
        <dd>{p.weather || '—'}</dd>
      </div>
      <div class="dl-row">
        <dt>Damage</dt>
        <dd>{p.damage || '—'}</dd>
      </div>
      {#if coords?.length === 2}
        <div class="dl-row">
          <dt>Location</dt>
          <dd>{coords[1].toFixed(4)}, {coords[0].toFixed(4)}</dd>
        </div>
      {/if}
    </dl>

    {#if description}
      <p class="cause"><strong>Description:</strong> {description}</p>
    {/if}

    {#if cause && cause !== description}
      <p class="cause"><strong>Probable Cause:</strong> {cause}</p>
    {/if}
  </div>
{/if}

<style>
  .popup {
    position: fixed;
    bottom: 140px;
    left: 50%;
    transform: translateX(-50%);
    width: min(380px, calc(100vw - 32px));
    background: rgba(13, 17, 23, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 16px;
    z-index: 95;
    color: #f0f6fc;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7);
    animation: popIn 0.2s ease;
  }

  @keyframes popIn {
    from { opacity: 0; transform: translateX(-50%) scale(0.95); }
    to   { opacity: 1; transform: translateX(-50%) scale(1);    }
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .severity-badge {
    font-size: 0.72rem;
    padding: 3px 10px;
    border-radius: 999px;
    text-transform: capitalize;
    font-weight: 600;
  }

  .severity-fatal   { background: rgba(239, 68, 68,  0.2); color: #fca5a5; border: 1px solid #ef444460; }
  .severity-serious { background: rgba(249, 115, 22, 0.2); color: #fdba74; border: 1px solid #f9731660; }
  .severity-minor   { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid #3b82f660; }

  .close-btn {
    background: none;
    border: none;
    color: #8b949e;
    cursor: pointer;
    font-size: 1rem;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
    line-height: 1;
  }

  .close-btn:hover {
    color: #f0f6fc;
    background: rgba(255, 255, 255, 0.08);
  }

  .popup-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 4px;
    color: #f0f6fc;
  }

  .popup-meta {
    font-size: 0.78rem;
    color: #8b949e;
    margin: 0 0 12px;
  }

  .popup-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 0 0 12px;
  }

  .dl-row {
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    padding: 6px 10px;
  }

  dt {
    font-size: 0.65rem;
    color: #8b949e;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }

  dd {
    margin: 0;
    font-size: 0.85rem;
    color: #f0f6fc;
    font-weight: 500;
  }

  dd.fatal   { color: #fca5a5; }
  dd.serious { color: #fdba74; }

  .cause {
    font-size: 0.78rem;
    color: #c9d1d9;
    margin: 0;
    line-height: 1.5;
    padding: 10px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
  }

  .cause strong {
    color: #8b949e;
  }
</style>

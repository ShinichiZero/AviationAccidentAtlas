<script>
  import {
    filterAircraft,
    filterCause,
    filterSeverity,
    yearRange,
    sidePanelOpen
  } from '$lib/stores/filters.js';

  let aircraftInput = '';
  let causeInput    = '';

  // Debounce filter updates to avoid re-rendering on every keystroke
  let aircraftTimer;
  let causeTimer;

  function onAircraftInput(e) {
    clearTimeout(aircraftTimer);
    aircraftTimer = setTimeout(() => {
      filterAircraft.set(e.target.value.trim());
      if (e.target.value.trim()) sidePanelOpen.set(true);
    }, 300);
  }

  function onCauseInput(e) {
    clearTimeout(causeTimer);
    causeTimer = setTimeout(() => {
      filterCause.set(e.target.value.trim());
      if (e.target.value.trim()) sidePanelOpen.set(true);
    }, 300);
  }

  function onSeverityChange(e) {
    filterSeverity.set(e.target.value);
  }

  function reset() {
    filterAircraft.set('');
    filterCause.set('');
    filterSeverity.set('all');
    aircraftInput = '';
    causeInput    = '';
  }
</script>

<section class="filter-panel" aria-label="Accident filters">
  <h3 class="panel-heading">Filters</h3>

  <div class="field">
    <label for="aircraft-filter">Aircraft</label>
    <input
      id="aircraft-filter"
      type="text"
      placeholder="e.g. Boeing 737"
      bind:value={aircraftInput}
      on:input={onAircraftInput}
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  <div class="field">
    <label for="cause-filter">Cause</label>
    <input
      id="cause-filter"
      type="text"
      placeholder="e.g. Engine Failure"
      bind:value={causeInput}
      on:input={onCauseInput}
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  <div class="field">
    <label for="severity-filter">Severity</label>
    <select id="severity-filter" on:change={onSeverityChange} bind:value={$filterSeverity}>
      <option value="all">All</option>
      <option value="fatal">Fatal</option>
      <option value="serious">Serious</option>
      <option value="minor">Minor</option>
    </select>
  </div>

  <button class="reset-btn" on:click={reset} aria-label="Reset all filters">Reset</button>
</section>

<style>
  .filter-panel {
    position: fixed;
    top: 16px;
    left: 16px;
    width: min(220px, calc(100vw - 32px));
    background: rgba(13, 17, 23, 0.88);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 14px;
    z-index: 90;
    color: #f0f6fc;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  }

  .panel-heading {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8b949e;
    margin: 0 0 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }

  label {
    font-size: 0.72rem;
    color: #8b949e;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input, select {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #f0f6fc;
    font-size: 0.85rem;
    padding: 8px 10px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus, select:focus {
    border-color: rgba(59, 130, 246, 0.6);
  }

  input::placeholder {
    color: #484f58;
  }

  select option {
    background: #0d1117;
    color: #f0f6fc;
  }

  .reset-btn {
    width: 100%;
    padding: 8px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #8b949e;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    margin-top: 2px;
  }

  .reset-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f0f6fc;
  }
</style>

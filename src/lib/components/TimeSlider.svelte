<script>
  import { yearRange, currentYear } from '$lib/stores/filters.js';
  import { MILESTONES, isMilestone, hapticPulse } from '$lib/data/milestones.js';

  const MIN_YEAR = 1982;
  const MAX_YEAR = new Date().getFullYear();

  let isDragging = false;
  let lastHapticYear = null;

  // Convert a year to a 0–100 percentage position
  function yearToPercent(year) {
    return ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
  }

  // Convert a slider value (0–100) to a year
  function percentToYear(pct) {
    return Math.round(MIN_YEAR + (pct / 100) * (MAX_YEAR - MIN_YEAR));
  }

  function onInput(event) {
    const val   = +event.target.value;
    const year  = percentToYear(val);
    currentYear.set(year);
    yearRange.update((r) => ({ ...r, max: year }));

    // Trigger haptic feedback when crossing a milestone
    if (year !== lastHapticYear && isMilestone(year)) {
      hapticPulse(year);
      lastHapticYear = year;
    }
  }

  // Milestone tooltip label
  $: milestoneLabel = isMilestone($currentYear) ? MILESTONES[$currentYear] : null;
</script>

<section class="time-slider-wrapper" aria-label="Time slider — filter accidents by year">
  <!-- Year readout -->
  <div class="year-display" aria-live="polite">
    <span class="year-value">{$currentYear}</span>
    {#if milestoneLabel}
      <span class="milestone-label" role="status">{milestoneLabel}</span>
    {/if}
  </div>

  <!-- Range -->
  <div class="slider-track-wrapper">
    <!-- Milestone tick marks -->
    {#each Object.keys(MILESTONES) as y}
      <div
        class="milestone-tick"
        style="left: {yearToPercent(+y)}%"
        title="{MILESTONES[+y]}"
        aria-hidden="true"
      ></div>
    {/each}

    <input
      type="range"
      class="slider"
      min="0"
      max="100"
      step="0.5"
      value={yearToPercent($currentYear)}
      on:input={onInput}
      on:mousedown={() => { isDragging = true;  }}
      on:mouseup  ={() => { isDragging = false; }}
      on:touchstart={() => { isDragging = true;  }}
      on:touchend  ={() => { isDragging = false; }}
      aria-label="Year slider"
      aria-valuemin={MIN_YEAR}
      aria-valuemax={MAX_YEAR}
      aria-valuenow={$currentYear}
    />
  </div>

  <!-- Year endpoints -->
  <div class="year-labels" aria-hidden="true">
    <span>{MIN_YEAR}</span>
    <span>{MAX_YEAR}</span>
  </div>
</section>

<style>
  .time-slider-wrapper {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 16px);
    left: 50%;
    transform: translateX(-50%);
    width: min(96vw, 700px);
    padding: 12px 16px 8px;
    background: rgba(13, 17, 23, 0.88);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 100;
    box-shadow: 0 4px 32px rgba(0, 0, 0, 0.5);
    user-select: none;
    touch-action: none;
  }

  .year-display {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 4px;
  }

  .year-value {
    font-size: 2rem;
    font-weight: 700;
    color: #f0f6fc;
    line-height: 1;
    min-width: 4.5ch;
    font-variant-numeric: tabular-nums;
  }

  .milestone-label {
    font-size: 0.75rem;
    color: #f97316;
    animation: fadeIn 0.3s ease;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  .slider-track-wrapper {
    position: relative;
    padding: 4px 0;
  }

  .milestone-tick {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(249, 115, 22, 0.7);
    border-radius: 1px;
    pointer-events: none;
    transform: translateX(-50%);
    z-index: 1;
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 48px;       /* large touch target */
    background: transparent;
    cursor: pointer;
    position: relative;
    z-index: 2;
    touch-action: none;
  }

  .slider::-webkit-slider-runnable-track {
    height: 6px;
    background: linear-gradient(to right, #3b82f6, #ef4444);
    border-radius: 3px;
  }

  .slider::-moz-range-track {
    height: 6px;
    background: linear-gradient(to right, #3b82f6, #ef4444);
    border-radius: 3px;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f0f6fc;
    border: 3px solid #3b82f6;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    margin-top: -11px;
    cursor: grab;
  }

  .slider:active::-webkit-slider-thumb {
    cursor: grabbing;
    background: #3b82f6;
  }

  .slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f0f6fc;
    border: 3px solid #3b82f6;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    cursor: grab;
  }

  .year-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #8b949e;
    margin-top: 2px;
  }
</style>

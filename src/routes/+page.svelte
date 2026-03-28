<script>
  import { onMount } from 'svelte';
  import Globe         from '$lib/components/Globe.svelte';
  import TimeSlider    from '$lib/components/TimeSlider.svelte';
  import SidePanel     from '$lib/components/SidePanel.svelte';
  import FilterPanel   from '$lib/components/FilterPanel.svelte';
  import AccidentPopup from '$lib/components/AccidentPopup.svelte';
  import { accidentsGeoJSON, sidePanelOpen, filteredAccidents } from '$lib/stores/filters.js';
  import { base } from '$app/paths';

  let loading = true;
  let error   = null;

  onMount(async () => {
    try {
      const res = await fetch(`${base}/data/accidents.geojson`);
      if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
      const data = await res.json();
      accidentsGeoJSON.set(data);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  function handleAccidentSelect(feature) {
    // When a Boeing 737 + Engine Failure is selected, auto-open side panel
    const p = feature?.properties;
    if (p?.aircraft?.includes('737') && p?.cause?.toLowerCase().includes('engine')) {
      sidePanelOpen.set(true);
    }
  }

  $: count = $filteredAccidents.length;
</script>

<svelte:head>
  <title>Aviation Accident Atlas</title>
</svelte:head>

<main class="app">
  {#if loading}
    <div class="loader" aria-label="Loading accident data">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading accident data…</p>
    </div>
  {:else if error}
    <div class="error-banner" role="alert">
      <p>⚠️ {error}</p>
    </div>
  {/if}

  <!-- Full-screen globe -->
  <Globe onAccidentSelect={handleAccidentSelect} />

  <!-- Header bar -->
  <header class="app-header">
    <div class="logo">
      <span class="logo-icon" aria-hidden="true">✈</span>
      <span class="logo-text">Aviation Accident Atlas</span>
    </div>
    <div class="header-right">
      <span class="record-count" aria-live="polite">{count.toLocaleString()} accidents</span>
      <button
        class="insights-btn"
        on:click={() => sidePanelOpen.update((v) => !v)}
        aria-pressed={$sidePanelOpen}
        aria-label="Toggle insights panel"
      >
        📊 Insights
      </button>
    </div>
  </header>

  <!-- Filter controls (top-left) -->
  <FilterPanel />

  <!-- Insights side panel (top-right) -->
  <SidePanel />

  <!-- Accident detail popup -->
  <AccidentPopup />

  <!-- Time slider (bottom) -->
  <TimeSlider />
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background: #0d1117;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    color: #f0f6fc;
    overscroll-behavior: none;
    -webkit-tap-highlight-color: transparent;
  }

  .app {
    position: relative;
    width: 100vw;
    height: 100dvh;
    overflow: hidden;
  }

  .app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: rgba(13, 17, 23, 0.80);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 80;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    font-weight: 600;
    color: #f0f6fc;
  }

  .logo-icon {
    font-size: 1.25rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .record-count {
    font-size: 0.78rem;
    color: #8b949e;
    font-variant-numeric: tabular-nums;
  }

  .insights-btn {
    padding: 6px 14px;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 8px;
    color: #93c5fd;
    font-size: 0.82rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }

  .insights-btn:hover,
  .insights-btn[aria-pressed="true"] {
    background: rgba(59, 130, 246, 0.35);
    color: #bfdbfe;
  }

  .loader {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0d1117;
    z-index: 200;
    gap: 16px;
    color: #8b949e;
    font-size: 0.9rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(59, 130, 246, 0.3);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-banner {
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 10px;
    padding: 10px 20px;
    color: #fca5a5;
    font-size: 0.85rem;
    z-index: 150;
  }
</style>

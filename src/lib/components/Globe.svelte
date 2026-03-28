<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { mapZoom, mapCenter, selectedId, filteredAccidents, filterAircraft, filterCause } from '$lib/stores/filters.js';

  let mapContainer;
  let map;
  let supercluster;
  let ScLib; // supercluster constructor

  // ── Props ──────────────────────────────────────────────────────────────────
  /** @type {import('svelte').Snippet} */
  export let onAccidentSelect = (feature) => {};

  // Source / layer IDs
  const SOURCE_ID  = 'accidents';
  const CLUSTER_ID = 'clusters';
  const COUNT_ID   = 'cluster-count';
  const POINT_ID   = 'unclustered-point';

  const SEVERITY_COLORS = {
    fatal:   '#ef4444',
    serious: '#f97316',
    minor:   '#3b82f6'
  };

  const FALLBACK_STYLE = {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#020617' }
      }
    ]
  };

  // ── Reactive: rebuild source data when filtered set changes ───────────────
  let unsubscribe;

  onMount(async () => {
    // Dynamic imports so MapTiler SDK isn't bundled in SSR
    const [{ Map, config, MapStyle }, SC] = await Promise.all([
      import('@maptiler/sdk'),
      import('supercluster')
    ]);

    ScLib = SC.default ?? SC;

    // Configure MapTiler API key (set in .env or GitHub Actions secret)
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY ?? '';
    config.apiKey = apiKey;

    const hasApiKey = Boolean(apiKey?.trim());
    const style = hasApiKey
      ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${apiKey}`
      : FALLBACK_STYLE;

    map = new Map({
      container: mapContainer,
      style,
      center: [$mapCenter.lng, $mapCenter.lat],
      zoom: $mapZoom,
      projection: 'globe',        // 🌍 Enable globe projection
      antialias: true,
      touchZoomRotate: true,
      dragRotate: true,
      touchPitch: true,
      cooperativeGestures: false  // allow single-finger pan on mobile
    });

    map.on('load', () => {
      // Add atmosphere / space background for the globe
      if (typeof map.setFog === 'function') {
        map.setFog({
          color: 'rgb(10, 15, 30)',
          'high-color': 'rgb(30, 50, 120)',
          'horizon-blend': 0.04,
          'space-color': 'rgb(0, 0, 20)',
          'star-intensity': 0.6
        });
      }

      // Initialise empty GeoJSON sources
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 40,
        generateId: true
      });

      // Cluster circles
      map.addLayer({
        id: CLUSTER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#4ade80',   // green  <  10
            10,  '#facc15',  // yellow < 50
            50,  '#f97316',  // orange < 200
            200, '#ef4444'   // red   >= 200
          ],
          'circle-radius': [
            'step', ['get', 'point_count'],
            14,
            10, 22,
            50, 32,
            200, 44
          ],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff30'
        }
      });

      // Cluster count labels (requires glyphs from a hosted style)
      if (hasApiKey) {
        map.addLayer({
          id: COUNT_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12
          },
          paint: { 'text-color': '#000000' }
        });
      }

      // Individual accident points
      map.addLayer({
        id: POINT_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match', ['get', 'severity'],
            'fatal',   SEVERITY_COLORS.fatal,
            'serious', SEVERITY_COLORS.serious,
            SEVERITY_COLORS.minor
          ],
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            2,  3,
            8,  6,
            14, 10
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff60'
        }
      });

      // ── Interactions ─────────────────────────────────────────────────────
      // Expand cluster on click
      map.on('click', CLUSTER_ID, (e) => {
        const feature  = e.features[0];
        const clusterId = feature.properties.cluster_id;
        map.getSource(SOURCE_ID).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: feature.geometry.coordinates, zoom });
        });
      });

      // Select individual accident
      map.on('click', POINT_ID, (e) => {
        const f = e.features[0];
        selectedId.set(f.properties.id);
        onAccidentSelect(f);
      });

      // Cursor
      map.on('mouseenter', CLUSTER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', CLUSTER_ID, () => { map.getCanvas().style.cursor = '';        });
      map.on('mouseenter', POINT_ID,   () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', POINT_ID,   () => { map.getCanvas().style.cursor = '';        });

      // Sync store on map move
      map.on('moveend', () => {
        const { lng, lat } = map.getCenter();
        mapCenter.set({ lng, lat });
        mapZoom.set(map.getZoom());
      });

      const updateSourceData = (features) => {
        const source = map.getSource(SOURCE_ID);
        if (!source) return;
        source.setData({ type: 'FeatureCollection', features });
      };

      // Ensure source receives the latest available data immediately
      updateSourceData(get(filteredAccidents));

      // Subscribe to filtered data
      unsubscribe = filteredAccidents.subscribe(updateSourceData);
    });
  });

  onDestroy(() => {
    unsubscribe?.();
    map?.remove();
  });
</script>

<div bind:this={mapContainer} class="globe-container" aria-label="Aviation accident globe map"></div>

<style>
  .globe-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>

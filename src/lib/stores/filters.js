import { writable, derived } from 'svelte/store';

// ── Year range filter ──────────────────────────────────────────────────────
export const yearRange = writable({ min: 1982, max: new Date().getFullYear() });
export const currentYear = writable(new Date().getFullYear());

// ── Text / attribute filters ───────────────────────────────────────────────
export const filterAircraft = writable('');
export const filterCause    = writable('');
export const filterSeverity = writable('all'); // 'all' | 'fatal' | 'serious' | 'minor'

// ── Map state ──────────────────────────────────────────────────────────────
export const mapZoom     = writable(2);
export const mapCenter   = writable({ lng: 0, lat: 20 });
export const selectedId  = writable(null);

// ── Loaded accident features (raw GeoJSON FeatureCollection) ───────────────
export const accidentsGeoJSON = writable(null);

// ── Derived: filtered accidents matching all active filter criteria ─────────
export const filteredAccidents = derived(
  [accidentsGeoJSON, yearRange, filterAircraft, filterCause, filterSeverity],
  ([$geoJSON, $yearRange, $aircraft, $cause, $severity]) => {
    if (!$geoJSON) return [];
    return $geoJSON.features.filter((f) => {
      const p = f.properties;
      const year = p.year ?? new Date(p.date ?? '').getFullYear();
      if (year < $yearRange.min || year > $yearRange.max) return false;
      if ($aircraft && !`${p.aircraft ?? ''}`.toLowerCase().includes($aircraft.toLowerCase())) return false;
      if ($cause    && !`${p.cause    ?? ''}`.toLowerCase().includes($cause.toLowerCase()))    return false;
      if ($severity !== 'all' && p.severity !== $severity) return false;
      return true;
    });
  }
);

// ── Derived: insight panel data for D3 chart ───────────────────────────────
// Groups filtered accidents by year for the frequency timeline
export const insightData = derived(filteredAccidents, ($features) => {
  const byYear = {};
  for (const f of $features) {
    const p    = f.properties;
    const year = p.year ?? new Date(p.date ?? '').getFullYear();
    if (isFinite(year)) byYear[year] = (byYear[year] ?? 0) + 1;
  }
  return Object.entries(byYear)
    .map(([year, count]) => ({ year: +year, count }))
    .sort((a, b) => a.year - b.year);
});

// ── Side-panel open/close ──────────────────────────────────────────────────
export const sidePanelOpen = writable(false);

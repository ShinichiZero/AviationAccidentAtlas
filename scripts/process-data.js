#!/usr/bin/env node
/**
 * NTSB Data Processing Script
 *
 * This script downloads/processes NTSB accident data and outputs a
 * quantized GeoJSON file for use in the Aviation Accident Atlas.
 *
 * The NTSB provides data at:
 *   https://data.ntsb.gov/carol-main-public/api/Query/Export
 *
 * Usage:
 *   node scripts/process-data.js
 *
 * Outputs:
 *   static/data/accidents.geojson   — quantized GeoJSON (production)
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'accidents.geojson');

// Precision for quantized coordinates (4 decimal places ≈ 11m accuracy)
const COORD_PRECISION = 4;

/**
 * Quantize a coordinate value to reduce file size while preserving visual accuracy.
 * @param {number} value
 * @returns {number}
 */
function quantize(value) {
  const factor = Math.pow(10, COORD_PRECISION);
  return Math.round(value * factor) / factor;
}

/**
 * Fetch NTSB data via the CAROL Query API.
 * This is a best-effort fetch; if the API is unavailable the script
 * falls back to any existing cached data.
 */
async function fetchNTSBData() {
  // NTSB CAROL export endpoint – returns CSV for all accidents
  const url = 'https://data.ntsb.gov/carol-main-public/api/Query/GetResultData';
  const payload = {
    QueryId: null,
    QueryText: '',
    SortBy: [{ ColumnId: 'NtsbNo', Order: 'Descending' }],
    FilterBy: [],
    Columns: [
      'NtsbNo', 'EventDate', 'City', 'State', 'Country',
      'Latitude', 'Longitude', 'AirportId', 'AirportName',
      'AircraftDamage', 'AircraftMakeModel', 'InjurySeverity',
      'TotalFatalInjuries', 'TotalSeriousInjuries',
      'WeatherCondition', 'BroadPhaseOfFlight', 'ProbableCause'
    ],
    StartRow: 0,
    RowCount: 100000
  };

  console.log('Fetching NTSB accident data…');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000)
  });

  if (!res.ok) throw new Error(`NTSB API error: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Convert NTSB API rows to a GeoJSON FeatureCollection with quantized coordinates.
 */
function toGeoJSON(rows) {
  const features = [];

  for (const row of rows) {
    const lat = parseFloat(row.Latitude);
    const lng = parseFloat(row.Longitude);

    // Skip records without valid coordinates
    if (!isFinite(lat) || !isFinite(lng)) continue;
    if (lat === 0 && lng === 0) continue;

    const date = row.EventDate ?? '';
    const year = date ? new Date(date).getFullYear() : null;
    if (!year || year < 1982) continue;

    const fatals = parseInt(row.TotalFatalInjuries ?? '0', 10) || 0;
    const serious = parseInt(row.TotalSeriousInjuries ?? '0', 10) || 0;

    let severity;
    if (fatals > 0)       severity = 'fatal';
    else if (serious > 0) severity = 'serious';
    else                  severity = 'minor';

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [quantize(lng), quantize(lat)]
      },
      properties: {
        id:       row.NtsbNo,
        date:     date.slice(0, 10),
        year,
        city:     row.City ?? '',
        state:    row.State ?? '',
        country:  row.Country ?? '',
        aircraft: row.AircraftMakeModel ?? '',
        damage:   row.AircraftDamage ?? '',
        severity,
        fatals,
        serious,
        weather:  row.WeatherCondition ?? '',
        phase:    row.BroadPhaseOfFlight ?? '',
        cause:    (row.ProbableCause ?? '').slice(0, 200)
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  let data;
  try {
    const result = await fetchNTSBData();
    const rows = result?.Results ?? result?.Data ?? result?.data ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('No rows returned from NTSB API');
    }
    console.log(`Received ${rows.length} records from NTSB`);
    data = toGeoJSON(rows);
  } catch (err) {
    console.error('Failed to fetch live data:', err.message);
    if (existsSync(OUTPUT_FILE)) {
      console.log('Using existing cached data.');
      process.exit(0);
    }
    console.log('No cache found — writing empty placeholder.');
    data = { type: 'FeatureCollection', features: [] };
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(data));
  console.log(`Written ${data.features.length} features → ${OUTPUT_FILE}`);
}

main();

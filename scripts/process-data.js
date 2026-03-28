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

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'static', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'accidents.geojson');
const START_DATE = new Date('1985-01-01T00:00:00Z');
const END_DATE = new Date('2026-03-28T23:59:59Z');

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
      'TotalMinorInjuries', 'TotalUninjured',
      'WeatherCondition', 'BroadPhaseOfFlight', 'ProbableCause',
      'OperatorName', 'RegistrationNumber'
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

    const rawDate = row.EventDate ?? '';
    const eventDate = rawDate ? new Date(rawDate) : null;
    if (!eventDate || Number.isNaN(eventDate.getTime())) continue;
    if (eventDate < START_DATE || eventDate > END_DATE) continue;
    const year = eventDate.getUTCFullYear();

    const fatals = parseInt(row.TotalFatalInjuries ?? '0', 10) || 0;
    const serious = parseInt(row.TotalSeriousInjuries ?? '0', 10) || 0;
    const minor = parseInt(row.TotalMinorInjuries ?? '0', 10) || 0;
    const uninjured = parseInt(row.TotalUninjured ?? '0', 10) || 0;

    let severity;
    if (fatals > 0)       severity = 'fatal';
    else if (serious > 0) severity = 'serious';
    else                  severity = 'minor';

    const cause = `${row.ProbableCause ?? ''}`.trim();
    const injurySummary = [
      `${fatals} fatal`,
      `${serious} serious`,
      `${minor} minor`,
      `${uninjured} uninjured`
    ].join(', ');
    const description = cause || `Injury summary: ${injurySummary}`;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [quantize(lng), quantize(lat)]
      },
      properties: {
        id:       row.NtsbNo || `${eventDate.toISOString().slice(0, 10)}-${quantize(lat)}-${quantize(lng)}`,
        date:     eventDate.toISOString().slice(0, 10),
        year,
        city:     row.City ?? '',
        state:    row.State ?? '',
        country:  row.Country ?? '',
        aircraft: row.AircraftMakeModel ?? '',
        operator: row.OperatorName ?? '',
        registration: row.RegistrationNumber ?? '',
        airportId: row.AirportId ?? '',
        airportName: row.AirportName ?? '',
        damage:   row.AircraftDamage ?? '',
        severity,
        fatals,
        serious,
        minor,
        uninjured,
        weather:  row.WeatherCondition ?? '',
        phase:    row.BroadPhaseOfFlight ?? '',
        cause:    cause.slice(0, 1200),
        description: description.slice(0, 1200)
      }
    });
  }

  const uniqueFeatures = Array.from(
    new Map(
      features.map((feature) => {
        const key = `${feature.properties.id}::${feature.properties.date}::${feature.geometry.coordinates.join(',')}`;
        return [key, feature];
      })
    ).values()
  ).sort((a, b) => b.properties.date.localeCompare(a.properties.date));

  return {
    type: 'FeatureCollection',
    features: uniqueFeatures
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

/**
 * Haptic-feedback milestone definitions.
 *
 * Each entry maps a year to a short description.  When the TimeSlider
 * crosses one of these years the Vibration API is triggered with a
 * distinctive pattern so the user "feels" the milestone.
 */
export const MILESTONES = {
  1985: 'Japan Air 123 — deadliest single-aircraft accident',
  1988: 'Pan Am 103 — Lockerbie bombing',
  1989: 'United 232 — Sioux City hydraulic failure',
  1994: 'USAir 427 — rudder hardover mystery',
  1996: 'ValuJet 592 / TWA 800 — Everglades & Atlantic losses',
  2001: 'September 11 attacks',
  2009: 'Air France 447 — Atlantic high-altitude stall',
  2010: 'Polish Air Force — Smolensk crash',
  2014: 'Malaysia Airlines MH370 & MH17',
  2015: 'Germanwings 9525 — deliberate crash',
  2018: 'Lion Air 610 — first 737 MAX accident',
  2019: 'Ethiopian Airlines 302 — second 737 MAX accident',
  2024: '737 MAX door-plug blowout (Alaska Airlines)'
};

/**
 * Returns true if the given year is a milestone.
 * @param {number} year
 */
export function isMilestone(year) {
  return year in MILESTONES;
}

/**
 * Trigger haptic feedback via the Vibration API (no-ops on unsupported devices).
 * @param {number} year
 */
export function hapticPulse(year) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  // Milestone = triple short pulse; otherwise a single very short tick
  const pattern = isMilestone(year) ? [50, 30, 50, 30, 100] : [10];
  navigator.vibrate(pattern);
}

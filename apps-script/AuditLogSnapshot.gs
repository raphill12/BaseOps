// ─── Base Operations · Daily Audit Log Snapshot ──────────────────────────────
// Paste the full contents of this file into the workbook's Apps Script editor:
//   Extensions ▸ Apps Script  (replace anything in Code.gs)
//
// Then run these two functions ONCE from the editor to set up:
//   1. snapshotAuditLog  — run manually first to confirm it works + authorize
//   2. installTrigger    — schedules the nightly 02:00 run going forward
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_ID     = '1SO7-3IUEKUtuXIr6JSQeXYaat-x1nNkYHi6O1-CR-y0';
const ACT_TAB      = 'Act_Data';
const LT_TAB       = 'LT_Inputs';
const AUDIT_TAB    = 'Audit_Log';
const ARR_LABEL    = 'Total ARR';
const CASH_LABEL   = 'Ending Cash';
const SCENARIO     = 'Act/Fcst';
const DEC26_HDR    = 'Dec-26';
const MO           = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HEADERS      = ['date', 'fy26ARR', 'fy26Cash', 'cashOutDate', 'note'];

// ─── Main entry point (called nightly by the time-driven trigger) ─────────────
function snapshotAuditLog() {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  const tab = ss.getSheetByName(AUDIT_TAB) || ss.insertSheet(AUDIT_TAB);

  // Ensure header row exists
  if (tab.getLastRow() === 0) {
    tab.appendRow(HEADERS);
  }

  const today = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');

  // Skip if today's snapshot already exists (idempotent)
  const lastRow  = tab.getLastRow();
  const existing = lastRow > 1
    ? tab.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(v => String(v).trim())
    : [];
  if (existing.includes(today)) {
    Logger.log('Already snapshotted ' + today + ' — skipping.');
    return;
  }

  const fy26ARR     = lookupActValue(ss, ARR_LABEL);
  const fy26Cash    = lookupActValue(ss, CASH_LABEL);
  const cashOutDate = lookupCashOutDate(ss);

  // Insert newest-first: row 2 (immediately below the header)
  tab.insertRowBefore(2);
  tab.getRange(2, 1, 1, 5).setValues([[today, fy26ARR, fy26Cash, cashOutDate, '']]);

  Logger.log('Snapshot written: ' + today + ' | ARR=' + fy26ARR + ' | Cash=' + fy26Cash + ' | CashOut=' + cashOutDate);
}

// ─── Read the Dec-26 value for a given metric label from Act_Data ─────────────
function lookupActValue(ss, label) {
  const sh     = ss.getSheetByName(ACT_TAB);
  const values = sh.getDataRange().getValues();
  const header = values[0];

  const dec26Col = header.findIndex(h => String(h).trim() === DEC26_HDR);
  if (dec26Col < 0) {
    Logger.log('WARNING: ' + DEC26_HDR + ' column not found in ' + ACT_TAB);
    return null;
  }

  for (let i = 1; i < values.length; i++) {
    const rowLabel    = String(values[i][0]).trim();
    const rowScenario = String(values[i][1]).trim();
    if (rowLabel === label && rowScenario === SCENARIO) {
      const v = values[i][dec26Col];
      return (typeof v === 'number' && !isNaN(v)) ? v : null;
    }
  }
  Logger.log('WARNING: row "' + label + '" / "' + SCENARIO + '" not found in ' + ACT_TAB);
  return null;
}

// ─── Read cash-out date from LT_Inputs col G, format as "Mon-YY" ─────────────
function lookupCashOutDate(ss) {
  const values = ss.getSheetByName(LT_TAB).getDataRange().getValues();
  for (const row of values) {
    if (row.some(c => /cash.?out/i.test(String(c || '')))) {
      const raw = row[6];   // column G
      if (!raw) return null;
      // Cell may be a plain string ("Mar-28") or a Date object if the cell
      // is formatted as a date in Sheets — handle both.
      if (raw instanceof Date) {
        return MO[raw.getMonth()] + '-' + String(raw.getFullYear()).slice(-2);
      }
      return String(raw).trim() || null;
    }
  }
  Logger.log('WARNING: cash-out date row not found in ' + LT_TAB);
  return null;
}

// ─── Run ONCE to install the nightly trigger ──────────────────────────────────
// Safe to re-run: removes any existing snapshotAuditLog triggers first.
function installTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'snapshotAuditLog')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('snapshotAuditLog')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();

  Logger.log('Trigger installed: snapshotAuditLog runs daily at 02:00 (' + SpreadsheetApp.openById(SHEET_ID).getSpreadsheetTimeZone() + ')');
}

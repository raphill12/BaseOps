# Audit Log Snapshot — Setup & Debugging

## First-time setup

1. Open the workbook → **Extensions ▸ Apps Script**
2. Delete everything in `Code.gs`, paste the full contents of `AuditLogSnapshot.gs`, and **Save** (⌘S / Ctrl+S)
3. In the function dropdown at the top, select **`snapshotAuditLog`** and click **Run**
   - Accept any authorization prompts — this proves the script has sheet access
   - Check the **Execution Log** panel at the bottom: you should see a "Snapshot written" line
   - Switch to the Audit_Log tab in the sheet and confirm a new row appeared at row 2
4. Switch the dropdown to **`installTrigger`** and click **Run**
   - The Execution Log should say "Trigger installed: snapshotAuditLog runs daily at 02:00 …"

## Verifying the trigger is armed

- Click the **clock icon** (Triggers) in the left sidebar
- You should see one row: handler `snapshotAuditLog`, source `Time-driven`, type `Day timer`, time `2am to 3am`
- If the row is missing, re-run `installTrigger`

## Debugging if it runs but produces no new rows

1. Click the **list icon** (Executions) in the left sidebar
2. Find the most recent `snapshotAuditLog` execution and click it
3. If the status is **Failed**, the error message tells you exactly what's wrong
4. Common causes:
   - `Dec-26 column not found` → the Act_Data header row uses a different format; check for trailing spaces
   - `row "Total ARR" / "Act/Fcst" not found` → confirm col A and col B labels match exactly
   - `cash-out date row not found` → confirm LT_Inputs has a row with the text "cash-out" in any cell
   - Authorization expired → re-run `snapshotAuditLog` manually once and re-authorize

## Expected Audit_Log column layout

| A | B | C | D | E |
|---|---|---|---|---|
| date (yyyy-MM-dd) | fy26ARR (number) | fy26Cash (number) | cashOutDate (Mon-YY, e.g. Mar-28) | note (text) |

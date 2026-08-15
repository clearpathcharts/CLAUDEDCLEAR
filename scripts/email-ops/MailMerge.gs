/**
 * ClearPath Trader — Gmail Mail Merge from Google Sheets
 *
 * Setup:
 * 1. Open your mail-merge Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this entire file, Save
 * 4. Reload the Sheet → menu "ClearPath Mail" appears
 * 5. ClearPath Mail → Send mail merge (sends rows where sendStatus is blank)
 *
 * Required columns (row 1 headers):
 *   email | subject | body | sendStatus
 * Optional columns used in {{tokens}} inside subject/body:
 *   firstName, displayName, tempPassword, activateUrl, affiliateTermsUrl, activationKey
 *
 * Safety:
 * - Skips rows with empty email/subject/body
 * - Skips rows where sendStatus is already "SENT"
 * - Writes SENT + timestamp back to sendStatus
 * - Uses your signed-in Gmail (Workspace or personal)
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ClearPath Mail')
    .addItem('Send mail merge (pending rows)', 'sendMailMerge')
    .addItem('Dry run (count pending only)', 'dryRunMailMerge')
    .addToUi();
}

function dryRunMailMerge() {
  const pending = collectPendingRows_();
  SpreadsheetApp.getUi().alert(
    'Dry run',
    pending.length + ' row(s) ready to send. Nothing was emailed.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function sendMailMerge() {
  const ui = SpreadsheetApp.getUi();
  const pending = collectPendingRows_();
  if (!pending.length) {
    ui.alert('No pending rows', 'Every row is already SENT or missing email/subject/body.', ui.ButtonSet.OK);
    return;
  }

  const confirm = ui.alert(
    'Send ClearPath mail merge?',
    'About to send ' + pending.length + ' email(s) from your Gmail.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  let sent = 0;
  let failed = 0;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = getHeaders_(sheet);

  for (var i = 0; i < pending.length; i++) {
    var row = pending[i];
    try {
      var subject = renderTemplate_(row.values.subject || '', row.values);
      var body = renderTemplate_(row.values.body || '', row.values);
      GmailApp.sendEmail(row.values.email, subject, body, {
        name: 'ClearPath Trader',
        replyTo: Session.getActiveUser().getEmail(),
      });
      sheet.getRange(row.rowNumber, headers.sendStatus + 1).setValue('SENT ' + new Date().toISOString());
      sent++;
      Utilities.sleep(400); // gentle pacing
    } catch (err) {
      sheet.getRange(row.rowNumber, headers.sendStatus + 1).setValue('ERROR: ' + err);
      failed++;
    }
  }

  ui.alert('Mail merge complete', 'Sent: ' + sent + '\nFailed: ' + failed, ui.ButtonSet.OK);
}

function collectPendingRows_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = mapHeaders_(data[0]);
  if (headers.email < 0 || headers.subject < 0 || headers.body < 0 || headers.sendStatus < 0) {
    throw new Error('Sheet needs headers: email, subject, body, sendStatus');
  }

  var pending = [];
  for (var r = 1; r < data.length; r++) {
    var values = {};
    for (var key in headers) {
      if (headers[key] >= 0) values[key] = String(data[r][headers[key]] || '').trim();
    }
    if (!values.email || values.email.indexOf('@') < 0) continue;
    if (!values.subject || !values.body) continue;
    if (String(values.sendStatus || '').toUpperCase().indexOf('SENT') === 0) continue;
    pending.push({ rowNumber: r + 1, values: values });
  }
  return pending;
}

function getHeaders_(sheet) {
  return mapHeaders_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
}

function mapHeaders_(headerRow) {
  var map = {
    email: -1,
    firstName: -1,
    displayName: -1,
    tempPassword: -1,
    activationKey: -1,
    activateUrl: -1,
    affiliateTermsUrl: -1,
    subject: -1,
    body: -1,
    sendStatus: -1,
  };
  for (var c = 0; c < headerRow.length; c++) {
    var h = String(headerRow[c] || '').trim();
    if (map.hasOwnProperty(h)) map[h] = c;
  }
  return map;
}

function renderTemplate_(template, values) {
  return String(template).replace(/\{\{(\w+)\}\}/g, function (_m, key) {
    return values[key] != null ? String(values[key]) : '';
  });
}

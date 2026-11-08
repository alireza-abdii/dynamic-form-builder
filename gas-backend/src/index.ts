export function doGet(e?: GoogleAppsScript.Events.DoGet) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Google Apps Script backend active' }))
    .setMimeType(ContentService.MimeType.JSON);
}

export function doPost(e?: GoogleAppsScript.Events.DoPost) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

export function setupSpreadsheet() {
  console.log('Setup spreadsheet invoked.');
}

export function setupCheck() {
  console.log('Setup check invoked.');
}


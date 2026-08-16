function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_NAMES).forEach((key) => {
    const sheetName = SHEET_NAMES[key];
    const headers = SHEET_HEADERS[sheetName];
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      const needsReset = existingHeaders.length !== headers.length ||
        headers.some((h, i) => existingHeaders[i] !== h);
      if (needsReset) {
        sheet.clear();
        sheet.appendRow(headers);
        sheet.setFrozenRows(1);
      }
    }
  });

  const settingsSheet = getSheet(SHEET_NAMES.SETTINGS);
  clearSheet(settingsSheet);
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    appendRow(settingsSheet, [key, value]);
  });

  const syncMetaSheet = getSheet(SHEET_NAMES.SYNC_META);
  clearSheet(syncMetaSheet);
  appendRow(syncMetaSheet, ['serverRevision', '0']);

  Logger.log('Spreadsheet initialized successfully.');
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    if (headers) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function findRowById(sheet, id) {
  if (!id) return -1;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return i + 1;
    }
  }
  return -1;
}

function appendRow(sheet, values) {
  sheet.appendRow(values);
  return sheet.getLastRow();
}

function updateRow(sheet, rowIndex, values) {
  const numCols = values.length;
  sheet.getRange(rowIndex, 1, 1, numCols).setValues([values]);
}

function getAllRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1);
}

function clearSheet(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

function rowsToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = data[i][index];
    });
    rows.push(obj);
  }
  return rows;
}

function getServerRevision() {
  const sheet = getSheet(SHEET_NAMES.SYNC_META);
  const rows = getAllRows(sheet);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'serverRevision') {
      return parseInt(rows[i][1], 10) || 0;
    }
  }
  return 0;
}

function setServerRevision(revision) {
  const sheet = getSheet(SHEET_NAMES.SYNC_META);
  const rows = getAllRows(sheet);
  let found = false;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'serverRevision') {
      updateRow(sheet, i + 2, ['serverRevision', String(revision)]);
      found = true;
      break;
    }
  }
  if (!found) {
    appendRow(sheet, ['serverRevision', String(revision)]);
  }
}

const MEMORY_SHEET_NAME = 'Memories';
const MEMORY_FOLDER_NAME = 'Wedding Memory Uploads';
const SEATING_SHEET_NAME = 'Seating Chart';

function authorizeWeddingMemoryUploads() {
  getOrCreateMemoryFolder_();
  return 'Drive upload access is authorized.';
}

function doPost(e) {
  try {
    const p = e.parameter || {};
    if (p.action === 'memory') {
      return saveMemory_(p);
    }
    return saveRsvp_(p);
  } catch (err) {
    return json_({ status: 'error', message: err.message });
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'rsvps') {
    const payload = { status: 'ok', rsvps: getRsvps_() };
    if (p.callback) {
      return jsonp_(p.callback, payload);
    }
    return json_(payload);
  }

  if (p.action === 'seating') {
    const payload = { status: 'ok', seating: getSeatingChart_() };
    if (p.callback) {
      return jsonp_(p.callback, payload);
    }
    return json_(payload);
  }

  if (p.action === 'memories') {
    const payload = { status: 'ok', memories: getApprovedMemories_() };
    if (p.callback) {
      return jsonp_(p.callback, payload);
    }
    return json_(payload);
  }

  if (p.action === 'adminMemories') {
    const payload = { status: 'ok', memories: getAllMemories_() };
    if (p.callback) {
      return jsonp_(p.callback, payload);
    }
    return json_(payload);
  }

  if (p.action === 'memoryApproval') {
    const payload = setMemoryApproval_(p);
    if (p.callback) {
      return jsonp_(p.callback, payload);
    }
    return json_(payload);
  }

  return ContentService
    .createTextOutput('Wedding endpoint OK - RSVP POST, RSVP read, and approved memories are available.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function saveRsvp_(p) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([
    new Date(),
    p.name || '',
    p.response || '',
    p.meal || '',
    p.side || '',
    p.dietary || '',
    p.notes || '',
    p.userAgent || ''
  ]);
  return json_({ status: 'ok' });
}

function saveMemory_(p) {
  const sheet = getOrCreateMemorySheet_();
  const photo = savePhotoSafely_(p);
  sheet.appendRow([
    new Date(),
    p.name || '',
    p.memory || '',
    p.song || '',
    photo.url || '',
    photo.id || '',
    'FALSE',
    p.userAgent || '',
    photo.error || ''
  ]);
  return json_({ status: 'ok' });
}

function getOrCreateMemorySheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MEMORY_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MEMORY_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Name',
      'Memory',
      'Song Recommendation',
      'Photo URL',
      'Photo File ID',
      'Approved',
      'UserAgent',
      'Photo Error'
    ]);
  } else if (sheet.getLastColumn() < 9) {
    sheet.getRange(1, 9).setValue('Photo Error');
  }
  return sheet;
}

function savePhotoSafely_(p) {
  try {
    return savePhoto_(p);
  } catch (err) {
    return {
      id: '',
      url: '',
      error: err && err.message ? err.message : String(err)
    };
  }
}

function savePhoto_(p) {
  if (!p.photoBase64) {
    return { id: '', url: '' };
  }

  const bytes = Utilities.base64Decode(p.photoBase64);
  const contentType = p.photoType || 'image/jpeg';
  const name = p.photoName || ('memory-' + Date.now() + '.jpg');
  const blob = Utilities.newBlob(bytes, contentType, name);
  const folder = getOrCreateMemoryFolder_();
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    id: file.getId(),
    url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000'
  };
}

function getOrCreateMemoryFolder_() {
  const folders = DriveApp.getFoldersByName(MEMORY_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(MEMORY_FOLDER_NAME);
}

function getApprovedMemories_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MEMORY_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  return rows
    .filter(row => String(row[6]).toLowerCase() === 'true' || String(row[6]).toLowerCase() === 'yes')
    .map(row => ({
      timestamp: row[0],
      name: row[1],
      memory: row[2],
      song: row[3],
      photoUrl: row[4],
      photoFileId: row[5]
    }))
    .reverse();
}

function getAllMemories_() {
  const sheet = getOrCreateMemorySheet_();
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  return rows
    .map((row, index) => ({
      rowNumber: index + 2,
      timestamp: row[0] instanceof Date ? row[0].toISOString() : row[0],
      name: row[1],
      memory: row[2],
      song: row[3],
      photoUrl: row[4],
      photoFileId: row[5],
      approvalStatus: row[6],
      approved: String(row[6]).toLowerCase() === 'true' || String(row[6]).toLowerCase() === 'yes',
      userAgent: row[7],
      photoError: row[8]
    }))
    .reverse();
}

function setMemoryApproval_(p) {
  const rowNumber = Number(p.row || p.rowNumber);
  if (!rowNumber || rowNumber < 2) {
    return { status: 'error', message: 'Missing memory row number.' };
  }

  const sheet = getOrCreateMemorySheet_();
  if (rowNumber > sheet.getLastRow()) {
    return { status: 'error', message: 'Memory row was not found.' };
  }

  const requested = String(p.approved || '').toLowerCase();
  const statusValue = requested === 'not approved' || requested === 'not-approved' || requested === 'rejected'
    ? 'NOT APPROVED'
    : (requested === 'true' || requested === 'yes' ? 'TRUE' : 'FALSE');
  sheet.getRange(rowNumber, 7).setValue(statusValue);
  return { status: 'ok', rowNumber, approved: statusValue === 'TRUE', approvalStatus: statusValue };
}

function getRsvps_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (!sheet || sheet.getLastRow() < 1) {
    return [];
  }

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const defaultHeaders = [
    'Timestamp',
    'Name',
    'Response',
    'Meal Preference',
    'Side',
    'Dietary Restrictions',
    'Notes',
    'UserAgent'
  ];
  const firstRow = values[0].map(value => String(value || '').trim());
  const hasHeaders = firstRow.some(value => ['timestamp', 'name', 'response'].indexOf(value.toLowerCase()) !== -1);
  const headers = hasHeaders ? firstRow : defaultHeaders;
  const rows = hasHeaders ? values.slice(1) : values;
  const canonicalHeaders = defaultHeaders.concat([
    'Meal',
    'Meal Selection',
    'Meal Choice',
    'Meal Option',
    'Entree',
    'Entree Choice',
    'Main Course',
    'Dinner',
    'Dinner Choice',
    'Food Choice',
    'Side Preference',
    'Side Choice',
    'Side Option'
  ]);

  function simplified_(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function firstValueByHeader_(item, wanted) {
    const wantedKeys = wanted.map(simplified_);
    const keys = Object.keys(item);
    for (let i = 0; i < keys.length; i++) {
      const key = simplified_(keys[i]);
      if (wantedKeys.indexOf(key) !== -1 || wantedKeys.some(wantedKey => key.indexOf(wantedKey) !== -1)) {
        const value = item[keys[i]];
        if (String(value || '').trim() !== '') return value;
      }
    }
    return '';
  }

  return rows
    .filter(row => row.some(value => String(value || '').trim() !== ''))
    .map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header || ('Column ' + (index + 1))] = row[index] instanceof Date
          ? row[index].toISOString()
          : row[index];
      });
      canonicalHeaders.forEach((header, index) => {
        if (item[header] == null && row[index] != null) {
          item[header] = row[index] instanceof Date ? row[index].toISOString() : row[index];
        }
      });
      item['Meal Preference'] = firstValueByHeader_(item, [
        'Meal Preference',
        'Meal',
        'Meal Selection',
        'Meal Choice',
        'Meal Option',
        'Entree',
        'Entree Choice',
        'Main Course',
        'Dinner',
        'Dinner Choice',
        'Food Choice'
      ]) || item['Meal Preference'] || row[3] || '';
      item.Side = firstValueByHeader_(item, [
        'Side',
        'Side Preference',
        'Side Choice',
        'Side Option'
      ]) || item.Side || row[4] || '';
      return item;
    });
}

function getSeatingChart_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SEATING_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
    return [];
  }

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const headers = values[0].map(value => String(value || '').trim());
  const seats = [];

  headers.forEach((tableName, columnIndex) => {
    if (!tableName) return;
    for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
      const guestName = String(values[rowIndex][columnIndex] || '').trim();
      if (!guestName) continue;
      seats.push({
        Name: guestName,
        Table: tableName,
        Seat: rowIndex,
        'RSVP Status': '',
        Meal: '',
        Notes: ''
      });
    }
  });

  return seats;
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(callback, payload) {
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

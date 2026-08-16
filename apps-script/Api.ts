function handleGetData() {
  const response = {
    serverRevision: getServerRevision(),
    lists: getEntityData(SHEET_NAMES.LISTS),
    sections: getEntityData(SHEET_NAMES.SECTIONS),
    stores: getEntityData(SHEET_NAMES.STORES),
    products: getEntityData(SHEET_NAMES.PRODUCTS),
    listItems: getEntityData(SHEET_NAMES.LIST_ITEMS),
    settings: getEntityData(SHEET_NAMES.SETTINGS),
  };

  return jsonResponse(response);
}

/**
 * Process batched sync request.
 * Optimized: applies all entity changes first, then writes the change log in bulk.
 */
function handlePostSync(body) {
  const deviceId = body.deviceId || 'unknown';
  const baseRevision = body.baseRevision || 0;
  const clientChanges = body.changes || [];

  const currentRevision = getServerRevision();

  let serverChanges = [];
  if (baseRevision < currentRevision) {
    serverChanges = getChangesSince(baseRevision);
  }

  let acceptedIds = [];
  let acceptedChanges = []; // collect for bulk log write
  let conflicts = [];

  // Always process client changes, regardless of revision gap
  for (let i = 0; i < clientChanges.length; i++) {
    const change = clientChanges[i];
    const serverData = findServerData(change.entityType, change.entityId);

    if (hasConflict(change, serverData)) {
      const resolution = resolveConflict(change, serverData);
      if (resolution.winner === 'client') {
        applyChange(change);
        acceptedChanges.push(change);
        acceptedIds.push(change.id);
      }
      conflicts.push({
        changeId: change.id,
        entityType: change.entityType,
        entityId: change.entityId,
        resolution: resolution.winner,
        reason: resolution.reason,
      });
    } else {
      const applied = applyChange(change);
      if (applied) {
        acceptedChanges.push(change);
        acceptedIds.push(change.id);
      }
    }
  }

  // Batch write all change log entries at once
  if (acceptedChanges.length > 0) {
    logChangesBatch(deviceId, acceptedChanges);
  }

  const finalRevision = getServerRevision();

  // Return server changes since the client's base revision
  if (baseRevision < finalRevision) {
    serverChanges = getChangesSince(baseRevision);
  }

  const response = {
    success: true,
    serverRevision: finalRevision,
    acceptedChanges: acceptedIds,
    changes: serverChanges,
  };

  if (conflicts.length > 0) {
    response.conflicts = conflicts;
  }

  return jsonResponse(response);
}

function getEntityData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

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

function findServerData(entityType, entityId) {
  let sheetName;
  switch (entityType) {
    case ENTITY_TYPES.LIST:
      sheetName = SHEET_NAMES.LISTS;
      break;
    case ENTITY_TYPES.SECTION:
      sheetName = SHEET_NAMES.SECTIONS;
      break;
    case ENTITY_TYPES.STORE:
      sheetName = SHEET_NAMES.STORES;
      break;
    case ENTITY_TYPES.PRODUCT:
      sheetName = SHEET_NAMES.PRODUCTS;
      break;
    case ENTITY_TYPES.LIST_ITEM:
      sheetName = SHEET_NAMES.LIST_ITEMS;
      break;
    default:
      return null;
  }

  const sheet = getSheet(sheetName);
  const rowIndex = findRowById(sheet, entityId);
  if (rowIndex === -1) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const row = data[rowIndex - 1];
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = row[index];
  });
  return obj;
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getNextRevision() {
  const sheet = getSheet(SHEET_NAMES.CHANGES);
  const lastRow = sheet.getLastRow();
  let nextRev = 1;

  if (lastRow > 1) {
    const data = sheet.getDataRange().getValues();
    let maxRev = 0;
    for (let i = 1; i < data.length; i++) {
      const rev = parseInt(data[i][0], 10);
      if (!isNaN(rev) && rev > maxRev) {
        maxRev = rev;
      }
    }
    nextRev = maxRev + 1;
  }

  setServerRevision(nextRev);
  return nextRev;
}

function logChange(deviceId, entityType, entityId, operation, payload) {
  const revision = getNextRevision();
  const timestamp = new Date().toISOString();
  const changeId = Utilities.getUuid();
  const payloadJson = JSON.stringify(payload);

  const sheet = getSheet(SHEET_NAMES.CHANGES);
  appendRow(sheet, [
    revision,
    changeId,
    timestamp,
    deviceId,
    entityType,
    entityId,
    operation,
    payloadJson,
  ]);

  return revision;
}

function getChangesSince(revision) {
  const sheet = getSheet(SHEET_NAMES.CHANGES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const changes = [];

  for (let i = 1; i < data.length; i++) {
    const rowRev = parseInt(data[i][0], 10);
    if (!isNaN(rowRev) && rowRev > revision) {
      const change = {};
      headers.forEach((header, index) => {
        change[header] = data[i][index];
      });
      try {
        change.payload = JSON.parse(change.payload);
      } catch (e) {
      }
      changes.push(change);
    }
  }

  return changes;
}

function applyChange(change) {
  const { entityType, entityId, operation, data } = change;

  switch (entityType) {
    case ENTITY_TYPES.LIST:
      return applyEntityChange(SHEET_NAMES.LISTS, entityId, operation, data, [
        'id', 'name', 'status', 'sort_order', 'created_at', 'updated_at',
        'started_at', 'archived_at', 'deleted_at',
      ]);
    case ENTITY_TYPES.SECTION:
      return applyEntityChange(SHEET_NAMES.SECTIONS, entityId, operation, data, [
        'id', 'list_id', 'name', 'sort_order', 'active', 'created_at',
        'updated_at', 'deleted_at',
      ]);
    case ENTITY_TYPES.STORE:
      return applyEntityChange(SHEET_NAMES.STORES, entityId, operation, data, [
        'id', 'name', 'sort_order', 'active', 'created_at', 'updated_at',
        'deleted_at',
      ]);
    case ENTITY_TYPES.PRODUCT:
      return applyEntityChange(SHEET_NAMES.PRODUCTS, entityId, operation, data, [
        'id', 'name', 'default_section_id', 'default_store_id', 'active',
        'created_at', 'updated_at', 'deleted_at',
      ]);
    case ENTITY_TYPES.LIST_ITEM:
      return applyEntityChange(SHEET_NAMES.LIST_ITEMS, entityId, operation, data, [
        'id', 'list_id', 'product_id', 'name_snapshot', 'section_id', 'store_id',
        'quantity', 'unit', 'completed', 'completed_at', 'sort_order',
        'created_at', 'updated_at', 'deleted_at',
      ]);
    default:
      Logger.log('Unknown entity type: ' + entityType);
      return false;
  }
}

function applyEntityChange(sheetName, entityId, operation, data, columns) {
  const sheet = getSheet(sheetName);
  const now = new Date().toISOString();

  if (operation === OPERATIONS.CREATE) {
    const row = columns.map((col) => {
      if (col === 'id') return entityId;
      if (col === 'created_at') return data[col] || now;
      if (col === 'updated_at') return now;
      if (col === 'active' || col === 'completed') {
        return data[col] !== undefined ? data[col] : (col === 'active' ? true : false);
      }
      return data[col] !== undefined ? data[col] : null;
    });
    appendRow(sheet, row);
    return true;
  }

  if (operation === OPERATIONS.UPDATE) {
    const rowIndex = findRowById(sheet, entityId);
    if (rowIndex === -1) {
      return applyEntityChange(sheetName, entityId, OPERATIONS.CREATE, data, columns);
    }

    const existingRow = sheet.getRange(rowIndex, 1, 1, columns.length).getValues()[0];
    const updatedRow = columns.map((col, index) => {
      if (col === 'updated_at') return now;
      if (data[col] !== undefined) return data[col];
      return existingRow[index];
    });

    updateRow(sheet, rowIndex, updatedRow);
    return true;
  }

  if (operation === OPERATIONS.DELETE) {
    const rowIndex = findRowById(sheet, entityId);
    if (rowIndex === -1) return false;

    const existingRow = sheet.getRange(rowIndex, 1, 1, columns.length).getValues()[0];
    const deletedRow = columns.map((col, index) => {
      if (col === 'deleted_at') return now;
      if (col === 'updated_at') return now;
      return existingRow[index];
    });

    updateRow(sheet, rowIndex, deletedRow);
    return true;
  }

  return false;
}

function acceptClientChanges(changes, deviceId) {
  const acceptedIds = [];

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const applied = applyChange(change);

    if (applied) {
      logChange(
        deviceId,
        change.entityType,
        change.entityId,
        change.operation,
        change.data
      );
      acceptedIds.push(change.id);
    }
  }

  return {
    acceptedIds: acceptedIds,
    serverRevision: getServerRevision(),
  };
}

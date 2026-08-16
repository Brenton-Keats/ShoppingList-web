const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

const SHEET_NAMES = {
  LISTS: 'Lists',
  SECTIONS: 'Sections',
  STORES: 'Stores',
  PRODUCTS: 'Products',
  LIST_ITEMS: 'ListItems',
  CHANGES: 'Changes',
  SETTINGS: 'Settings',
  SYNC_META: 'SyncMeta',
};

const SHEET_HEADERS = {
  [SHEET_NAMES.LISTS]: [
    'id', 'name', 'status', 'sort_order', 'created_at', 'updated_at',
    'started_at', 'archived_at', 'deleted_at',
  ],
  [SHEET_NAMES.SECTIONS]: [
    'id', 'list_id', 'name', 'sort_order', 'active', 'created_at',
    'updated_at', 'deleted_at',
  ],
  [SHEET_NAMES.STORES]: [
    'id', 'name', 'sort_order', 'active', 'created_at', 'updated_at',
    'deleted_at',
  ],
  [SHEET_NAMES.PRODUCTS]: [
    'id', 'name', 'default_section_id', 'default_store_id', 'active',
    'created_at', 'updated_at', 'deleted_at',
  ],
  [SHEET_NAMES.LIST_ITEMS]: [
    'id', 'list_id', 'product_id', 'name_snapshot', 'section_id', 'store_id',
    'quantity', 'unit', 'completed', 'completed_at', 'sort_order',
    'created_at', 'updated_at', 'deleted_at',
  ],
  [SHEET_NAMES.CHANGES]: [
    'revision', 'id', 'timestamp', 'device_id', 'entity_type', 'entity_id',
    'operation', 'payload',
  ],
  [SHEET_NAMES.SETTINGS]: ['key', 'value'],
  [SHEET_NAMES.SYNC_META]: ['key', 'value'],
};

const DEFAULT_SETTINGS = {
  default_list_name: 'Weekly Shopping',
  default_sync_interval: '30',
  suggestion_window: '4',
  suggestion_threshold: '0.5',
};

const CORS_ORIGIN = '*';

const ENTITY_TYPES = {
  LIST: 'List',
  SECTION: 'Section',
  STORE: 'Store',
  PRODUCT: 'Product',
  LIST_ITEM: 'ListItem',
};

const OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

const LIST_STATUSES = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
};

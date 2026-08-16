/**
 * @typedef {Object} List
 * @property {string} id
 * @property {string} name
 * @property {string} status
 * @property {number} sort_order
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string|null} started_at
 * @property {string|null} archived_at
 * @property {string|null} deleted_at
 */

/**
 * @typedef {Object} Section
 * @property {string} id
 * @property {string} list_id
 * @property {string} name
 * @property {number} sort_order
 * @property {boolean} active
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string|null} deleted_at
 */

/**
 * @typedef {Object} Store
 * @property {string} id
 * @property {string} name
 * @property {number} sort_order
 * @property {boolean} active
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string|null} deleted_at
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string|null} default_section_id
 * @property {string|null} default_store_id
 * @property {boolean} active
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string|null} deleted_at
 */

/**
 * @typedef {Object} ListItem
 * @property {string} id
 * @property {string} list_id
 * @property {string} product_id
 * @property {string} name_snapshot
 * @property {string|null} section_id
 * @property {string|null} store_id
 * @property {number|null} quantity
 * @property {string|null} unit
 * @property {boolean} completed
 * @property {string|null} completed_at
 * @property {number} sort_order
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string|null} deleted_at
 */

/**
 * @typedef {Object} ChangeRecord
 * @property {number} revision
 * @property {string} id
 * @property {string} timestamp
 * @property {string} device_id
 * @property {string} entity_type
 * @property {string} entity_id
 * @property {string} operation
 * @property {string} payload
 */

/**
 * @typedef {Object} Setting
 * @property {string} key
 * @property {string} value
 */

/**
 * @typedef {Object} SyncMeta
 * @property {string} key
 * @property {string} value
 */

/**
 * @typedef {Object} ClientChange
 * @property {string} id
 * @property {string} entityType
 * @property {string} entityId
 * @property {string} operation
 * @property {Object} data
 * @property {string} [timestamp]
 */

/**
 * @typedef {Object} SyncRequest
 * @property {string} deviceId
 * @property {number} baseRevision
 * @property {ClientChange[]} changes
 */

/**
 * @typedef {Object} SyncResponse
 * @property {boolean} success
 * @property {number} serverRevision
 * @property {string[]} acceptedChanges
 * @property {ChangeRecord[]} changes
 * @property {Object[]} [conflicts]
 */

/**
 * @typedef {Object} DataDumpResponse
 * @property {number} serverRevision
 * @property {List[]} lists
 * @property {Section[]} sections
 * @property {Store[]} stores
 * @property {Product[]} products
 * @property {ListItem[]} listItems
 * @property {Setting[]} settings
 */

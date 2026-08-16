function resolveConflict(clientChange, serverData) {
  const clientData = clientChange.data || {};
  const clientTs = clientChange.timestamp || clientData.updated_at || null;
  const serverTs = serverData.updated_at || serverData.created_at || null;

  if (clientChange.operation === OPERATIONS.DELETE) {
    return {
      winner: 'client',
      resolvedData: clientData,
      reason: 'delete_tombstone_wins',
    };
  }

  if (serverData.deleted_at) {
    return {
      winner: 'client',
      resolvedData: clientData,
      reason: 'resurrection_after_delete',
    };
  }

  if (clientTs && serverTs) {
    const clientTime = new Date(clientTs).getTime();
    const serverTime = new Date(serverTs).getTime();

    if (clientTime > serverTime) {
      return {
        winner: 'client',
        resolvedData: clientData,
        reason: 'later_timestamp',
      };
    } else if (serverTime > clientTime) {
      return {
        winner: 'server',
        resolvedData: serverData,
        reason: 'later_timestamp',
      };
    }
  }

  return {
    winner: 'server',
    resolvedData: serverData,
    reason: 'default_server_wins',
  };
}

function hasConflict(clientChange, serverData) {
  if (!serverData) return false;

  if (clientChange.operation === OPERATIONS.DELETE && !serverData.deleted_at) {
    return true;
  }

  if (clientChange.operation === OPERATIONS.UPDATE) {
    const clientTs = clientChange.timestamp || clientChange.data.updated_at;
    const serverTs = serverData.updated_at;
    if (clientTs && serverTs) {
      return new Date(serverTs).getTime() > new Date(clientTs).getTime();
    }
  }

  return false;
}

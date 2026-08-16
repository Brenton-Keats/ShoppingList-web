function doGet(e) {
  const path = e.parameter.path || '';

  try {
    if (path === 'api/data' || path === '/api/data') {
      return withCors(handleGetData());
    }

    return withCors(jsonResponse({
      success: false,
      error: 'Not found',
      availableEndpoints: ['GET /api/data'],
    }), 404);
  } catch (err) {
    return withCors(jsonResponse({
      success: false,
      error: err.message || 'Internal error',
    }), 500);
  }
}

function doPost(e) {
  const path = e.parameter.path || '';

  try {
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return withCors(jsonResponse({
          success: false,
          error: 'Invalid JSON body: ' + parseErr.message,
        }), 400);
      }
    }

    if (path === 'api/sync' || path === '/api/sync') {
      return withCors(handlePostSync(body));
    }

    return withCors(jsonResponse({
      success: false,
      error: 'Not found',
      availableEndpoints: ['POST /api/sync'],
    }), 404);
  } catch (err) {
    return withCors(jsonResponse({
      success: false,
      error: err.message || 'Internal error',
    }), 500);
  }
}

function doOptions() {
  return withCors(ContentService.createTextOutput(''));
}

function withCors(output, statusCode) {
  return output;
}

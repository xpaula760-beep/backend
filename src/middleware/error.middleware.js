export const errorHandler = (err, req, res, next) => {
  const time = new Date().toISOString();

  const reqInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers && req.headers['user-agent'],
    params: req.params,
    query: req.query
  };

  let bodyPreview = undefined;
  try {
    bodyPreview = req.body;
  } catch (e) {
    bodyPreview = '[unavailable]';
  }

  const payload = {
    time,
    level: 'error',
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined,
    request: reqInfo,
    body: bodyPreview
  };

  console.error(JSON.stringify(payload, null, 2));

  res.status(err.statusCode || 500).json({
    message: err.message || 'Server error'
  });
};

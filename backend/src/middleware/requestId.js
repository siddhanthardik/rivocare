const { v4: uuidv4 } = require('uuid');

module.exports = function requestId(req, res, next) {
  try {
    const id = uuidv4();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
  } catch (e) {
    // never fail the request chain due to request id generation
  }
  return next();
};

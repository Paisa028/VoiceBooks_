const { config } = require('../config.js');

const notFound = (req, res) => res.status(404).json({ message: 'Not found' });

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body is not valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
  console.error(err);
  res.status(500).json({ message: config.isProd ? 'Something went wrong on our side.' : err.message });
}

module.exports = { notFound, errorHandler };

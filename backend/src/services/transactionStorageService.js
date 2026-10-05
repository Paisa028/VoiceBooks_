const { config } = require('../config');
module.exports = config.databaseProvider === 'firebase' ? require('../firebase/transactions') : require('./sqliteTransactionStorageService');

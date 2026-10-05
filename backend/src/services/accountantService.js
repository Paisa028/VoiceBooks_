const { config } = require('../config');
module.exports = config.databaseProvider === 'firebase' ? require('../firebase/accountant') : require('./sqliteAccountantService');

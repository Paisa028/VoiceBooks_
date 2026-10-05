// Local development only: a demo project never contacts hosted Firebase.
process.env.DATABASE_PROVIDER = 'firebase';
process.env.FIREBASE_PROJECT_ID = 'demo-voicebooks';
process.env.DATA_CONNECT_EMULATOR_HOST = '127.0.0.1:9399';
process.env.NODE_ENV = 'development';
require('../src/server');

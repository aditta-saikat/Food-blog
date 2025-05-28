const admin = require('firebase-admin');

const serviceAccount = require('../config/foodblog-313a0-firebase-adminsdk-fbsvc-c1fceee95b.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
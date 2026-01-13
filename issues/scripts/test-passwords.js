const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const path = require('path');

require('dotenv').config();

async function testPasswords() {
  const uri = process.env.MONGODB_URI;
  const options = {};

  if (process.env.MONGODB_CERT_PATH) {
    const certPath = path.resolve(process.env.MONGODB_CERT_PATH);
    options.tls = true;
    options.tlsCertificateKeyFile = certPath;
    options.authMechanism = 'MONGODB-X509';
    options.authSource = '$external';
  }

  const client = new MongoClient(uri, options);
  const testPasswords = ['rand0mnumber', 'Rand0mNumber!', 'se266ly', 'se266ly_JM', 'Rand0mNumb3r', 'rand0mnumb3r', 'Rand0mNumb3r!'];
  const email = 'james@wrangl.ca';

  try {
    await client.connect();

    const db = client.db('issues');
    const user = await db.collection('users').findOne({ email: email });

    if (!user || !user.password) {
      console.log('❌ User or password not found');
      return;
    }

    console.log('Testing common passwords for: ' + email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, user.password);
      if (match) {
        console.log('✅ MATCH FOUND!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email:    ' + email);
        console.log('Password: ' + pwd);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🔗 Login at: http://localhost:3000/login');
        await client.close();
        return;
      } else {
        console.log('❌ ' + pwd);
      }
    }

    console.log('\n⚠️  None of the common passwords matched.');
    console.log('You may need to provide specific passwords to test.');

    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPasswords();

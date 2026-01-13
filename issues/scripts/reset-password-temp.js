const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const path = require('path');

require('dotenv').config();

async function resetPassword() {
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
  const newPassword = 'admin123';
  const email = 'james@wrangl.ca';

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('issues');
    const usersCollection = db.collection('users');

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await usersCollection.updateOne(
      { email: email },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Password reset successful!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email:    ' + email);
      console.log('Password: ' + newPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🔗 Login at: http://localhost:3000/login');
    } else {
      console.log('❌ User not found or password unchanged');
    }

    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();

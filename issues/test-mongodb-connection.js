const { MongoClient } = require('mongodb');
const fs = require('fs');

async function testConnection() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://cluster0.rrp7vpi.mongodb.net/issues?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0';
  const certPath = process.env.MONGODB_CERT_PATH || './Certs/X509-cert-5964230336800025568.pem';

  console.log('Testing MongoDB connection...');
  console.log('URI:', uri.replace(/\/\/.*@/, '//<credentials>@'));
  console.log('Cert path:', certPath);
  console.log('Cert exists:', fs.existsSync(certPath));

  const options = {
    tls: true,
    tlsCertificateKeyFile: certPath,
    authMechanism: 'MONGODB-X509',
    authSource: '$external',
    serverSelectionTimeoutMS: 10000,
  };

  try {
    console.log('\nAttempting connection with X.509...');
    const client = new MongoClient(uri, options);
    await client.connect();
    console.log('✓ Connected successfully!');

    const db = client.db('issues');
    const result = await db.command({ ping: 1 });
    console.log('✓ Ping successful:', result);

    await client.close();
  } catch (error) {
    console.error('✗ Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.message || error.cause);
    }
    process.exit(1);
  }
}

testConnection();

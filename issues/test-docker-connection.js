const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_CERT_PATH = process.env.MONGODB_CERT_PATH;

console.log('🔍 Testing MongoDB Connection from Docker...\n');
console.log('URI:', MONGODB_URI ? MONGODB_URI.replace(/mongodb\+srv:\/\/([^@]+@)?/, 'mongodb+srv://***@') : 'NOT SET');
console.log('Cert path:', MONGODB_CERT_PATH || 'NOT SET');
console.log('');

async function testConnection() {
  let client = null;

  try {
    // Check if cert file exists
    if (!MONGODB_CERT_PATH) {
      throw new Error('MONGODB_CERT_PATH not set');
    }

    if (!fs.existsSync(MONGODB_CERT_PATH)) {
      throw new Error(`Certificate file not found: ${MONGODB_CERT_PATH}`);
    }

    console.log('✅ Certificate file exists');

    // Test reading the cert
    const certContent = fs.readFileSync(MONGODB_CERT_PATH, 'utf8');
    console.log('✅ Certificate file readable');
    console.log(`📄 Certificate size: ${certContent.length} bytes`);
    console.log('');

    console.log('⏳ Connecting to MongoDB...');

    client = new MongoClient(MONGODB_URI, {
      tls: true,
      tlsCertificateKeyFile: MONGODB_CERT_PATH,
      serverSelectionTimeoutMS: 15000,
    });

    await client.connect();
    console.log('✅ Connected to MongoDB!');

    const db = client.db('issues');
    const users = await db.collection('users').countDocuments();
    console.log(`✅ Found ${users} users in database`);

    console.log('\n🎉 Connection successful!');
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testConnection();

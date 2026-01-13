const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB Connection...\n');

  // Check if MONGODB_URI is set
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('Please set up your .env file with the correct MongoDB connection string');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  const options = {};

  // Configure X.509 certificate authentication if cert path is provided
  if (process.env.MONGODB_CERT_PATH) {
    try {
      const certPath = path.resolve(process.env.MONGODB_CERT_PATH);
      console.log(`📋 Using certificate: ${certPath}`);
      
      // Check if certificate file exists
      if (!fs.existsSync(certPath)) {
        console.error(`❌ Certificate file not found: ${certPath}`);
        process.exit(1);
      }

      const cert = fs.readFileSync(certPath, 'utf8');
      console.log('✅ Certificate file loaded successfully');
      
      // Configure TLS and X.509 authentication
      options.tls = true;
      options.tlsCertificateKeyFile = certPath;
      options.authMechanism = 'MONGODB-X509';
      options.authSource = '$external';
      
      console.log('🔐 X.509 certificate authentication configured');
    } catch (error) {
      console.error('❌ Error reading MongoDB certificate:', error.message);
      process.exit(1);
    }
  } else {
    console.log('🔑 Using regular authentication (no certificate path provided)');
  }

  console.log(`🌐 Connecting to: ${uri.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`); // Hide credentials

  const client = new MongoClient(uri, options);

  try {
    console.log('⏳ Establishing connection...');
    
    // Test connection
    await client.connect();
    console.log('✅ MongoDB connection successful!');

    // Test database access
    const db = client.db();
    console.log('✅ Database access successful');

    // Test basic operations
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`);
    
    if (collections.length > 0) {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
    } else {
      console.log('   (No collections found - this is expected for a new database)');
    }

    // Test write operation (create a test collection)
    console.log('🧪 Testing write operation...');
    const testCollection = db.collection('connection-test');
    
    // Insert a test document
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'MongoDB connection test'
    };
    
    const result = await testCollection.insertOne(testDoc);
    console.log(`✅ Write operation successful (inserted ID: ${result.insertedId})`);

    // Test read operation
    const foundDoc = await testCollection.findOne({ _id: result.insertedId });
    console.log('✅ Read operation successful');

    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Cleanup successful');

    // Drop test collection if it's empty
    const count = await testCollection.countDocuments();
    if (count === 0) {
      await testCollection.drop();
      console.log('✅ Test collection dropped');
    }

    console.log('\n🎉 All tests passed! MongoDB connection is working correctly.');
    
    // Display connection info
    console.log('\n📋 Connection Information:');
    console.log(`   Connection Type: ${process.env.MONGODB_CERT_PATH ? 'X.509 Certificate' : 'Regular'}`);
    console.log(`   Database: ${db.databaseName}`);
    
    // Try to get server status (may fail due to permissions)
    try {
      const admin = db.admin();
      const serverStatus = await admin.serverStatus();
      console.log(`   MongoDB Version: ${serverStatus.version}`);
    } catch (permError) {
      console.log(`   MongoDB Version: Not available (insufficient permissions)`);
    }

  } catch (error) {
    console.error('\n❌ MongoDB connection test failed:');
    console.error(`   Error: ${error.message}`);
    
    // Provide specific troubleshooting advice
    if (error.message.includes('certificate')) {
      console.log('\n💡 Certificate Troubleshooting:');
      console.log('   - Verify certificate file path is correct');
      console.log('   - Ensure certificate file is readable');
      console.log('   - Check certificate is not expired');
      console.log('   - Verify connection string includes authMechanism=MONGODB-X509');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Network Troubleshooting:');
      console.log('   - Check network connectivity');
      console.log('   - Verify MongoDB server is running');
      console.log('   - Check firewall settings');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication Troubleshooting:');
      console.log('   - Verify credentials are correct');
      console.log('   - Check user permissions');
      console.log('   - Ensure auth source is correct');
    }
    
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

// Run the test
testMongoDBConnection().catch(console.error);
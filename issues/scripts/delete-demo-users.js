/**
 * Delete demo accounts from database
 * Run with: node scripts/delete-demo-users.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function deleteDemoUsers() {
  console.log('🗑️  Deleting demo accounts...\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

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

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const db = client.db('issues');
    const usersCollection = db.collection('users');

    // Demo accounts to delete
    const demoEmails = [
      'admin@example.com',
      'dev@example.com',
      'viewer@example.com'
    ];

    console.log('Deleting the following demo accounts:');
    demoEmails.forEach(email => console.log(`  - ${email}`));
    console.log('');

    const result = await usersCollection.deleteMany({
      email: { $in: demoEmails }
    });

    console.log(`✅ Deleted ${result.deletedCount} demo account(s)\n`);

    // List remaining users
    const remainingUsers = await usersCollection.find({}).toArray();
    console.log(`📋 Remaining users (${remainingUsers.length}):`);
    remainingUsers.forEach(user => {
      console.log(`   ${user.name} (${user.email}) - ${user.role}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

deleteDemoUsers().catch(console.error);

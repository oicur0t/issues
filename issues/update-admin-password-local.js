/**
 * Script to update admin user password
 * Run locally with: node update-admin-password-local.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_CERT_PATH = process.env.MONGODB_CERT_PATH;
const SALT_ROUNDS = 12;

async function updateAdminPassword() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in environment');
    process.exit(1);
  }

  let client;

  try {
    // MongoDB connection options for X.509
    const options = {};

    if (MONGODB_CERT_PATH && fs.existsSync(MONGODB_CERT_PATH)) {
      options.tls = true;
      options.tlsCertificateKeyFile = MONGODB_CERT_PATH;
    }

    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db('issues');
    const usersCollection = db.collection('users');

    // Find all admin users without passwords
    const adminUsers = await usersCollection.find({
      role: 'admin',
      $or: [
        { password: { $exists: false } },
        { password: null }
      ]
    }).toArray();

    if (adminUsers.length === 0) {
      console.log('No admin users found without passwords.');
      console.log('All admin users already have passwords set.');
      return;
    }

    console.log(`Found ${adminUsers.length} admin user(s) without passwords:\n`);

    // Set default password
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

    for (const user of adminUsers) {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✓ Updated password for: ${user.email}`);
    }

    console.log('\n✅ Password update complete!');
    console.log('\nYou can now log in with:');
    adminUsers.forEach(user => {
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${defaultPassword}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed.');
    }
  }
}

updateAdminPassword();

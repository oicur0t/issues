/**
 * Automatically set passwords for users that don't have them
 * Run with: node scripts/fix-user-passwords-auto.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Password123';

async function fixUserPasswords() {
  console.log('🔐 Setting passwords for users without passwords...\n');

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

    // Find users without passwords
    const usersWithoutPasswords = await usersCollection.find({
      $or: [
        { password: { $exists: false } },
        { password: null }
      ]
    }).toArray();

    if (usersWithoutPasswords.length === 0) {
      console.log('✅ All users have passwords set!');
      return;
    }

    console.log(`Found ${usersWithoutPasswords.length} user(s) without passwords:\n`);
    usersWithoutPasswords.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log(`\n🔒 Setting password "${DEFAULT_PASSWORD}" for all users...\n`);

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    for (const user of usersWithoutPasswords) {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Password set for: ${user.email}`);
    }

    console.log('\n🎉 All users now have passwords!');
    console.log('\n📋 Updated Accounts:');
    usersWithoutPasswords.forEach(user => {
      console.log(`   ${user.email} / ${DEFAULT_PASSWORD}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixUserPasswords().catch(console.error);

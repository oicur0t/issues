/**
 * Initialize demo users for the application
 * Run with: node scripts/init-demo-users.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

const SALT_ROUNDS = 12;

async function initDemoUsers() {
  console.log('🔧 Initializing Demo Users...\n');

  // Check if MONGODB_URI is set
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  const options = {};

  // Configure X.509 certificate authentication if cert path is provided
  if (process.env.MONGODB_CERT_PATH) {
    try {
      const certPath = path.resolve(process.env.MONGODB_CERT_PATH);
      console.log(`📋 Using certificate: ${certPath}`);

      if (!fs.existsSync(certPath)) {
        console.error(`❌ Certificate file not found: ${certPath}`);
        process.exit(1);
      }

      options.tls = true;
      options.tlsCertificateKeyFile = certPath;
      options.authMechanism = 'MONGODB-X509';
      options.authSource = '$external';

      console.log('🔐 X.509 certificate authentication configured');
    } catch (error) {
      console.error('❌ Error reading MongoDB certificate:', error.message);
      process.exit(1);
    }
  }

  const client = new MongoClient(uri, options);

  try {
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const db = client.db('issues');
    const usersCollection = db.collection('users');

    // Define demo users
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      },
      {
        name: 'Developer User',
        email: 'dev@example.com',
        password: 'dev123',
        role: 'developer',
        isActive: true
      },
      {
        name: 'Viewer User',
        email: 'viewer@example.com',
        password: 'viewer123',
        role: 'viewer',
        isActive: true
      }
    ];

    console.log('\n📝 Processing users...\n');

    for (const user of demoUsers) {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({
        email: user.email.toLowerCase().trim()
      });

      if (existingUser) {
        console.log(`👤 User exists: ${user.email}`);

        // Update password if user exists but has no password
        if (!existingUser.password) {
          const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
          await usersCollection.updateOne(
            { _id: existingUser._id },
            {
              $set: {
                password: hashedPassword,
                updatedAt: new Date()
              }
            }
          );
          console.log(`   ✅ Password set for ${user.email}`);
        } else {
          console.log(`   ℹ️  Password already set`);
        }
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
        const newUser = {
          name: user.name,
          email: user.email.toLowerCase().trim(),
          password: hashedPassword,
          role: user.role,
          isActive: user.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await usersCollection.insertOne(newUser);
        console.log(`✅ Created user: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password: ${user.password}`);
      }
    }

    console.log('\n🎉 Demo users initialization completed!');
    console.log('\n📋 Available Accounts:');
    console.log('   Admin:     admin@example.com / admin123');
    console.log('   Developer: dev@example.com / dev123');
    console.log('   Viewer:    viewer@example.com / viewer123');

  } catch (error) {
    console.error('\n❌ Failed to initialize demo users:');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

// Run the initialization
initDemoUsers().catch(console.error);

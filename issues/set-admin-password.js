/**
 * Quick script to set password for the admin user
 * Run with: node set-admin-password.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/issuetracker';
const SALT_ROUNDS = 12;

async function setAdminPassword() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find admin users without passwords
    const adminUsers = await usersCollection
      .find({
        role: 'admin',
        $or: [
          { password: { $exists: false } },
          { password: null }
        ]
      })
      .toArray();

    if (adminUsers.length === 0) {
      console.log('No admin users found without passwords');
      return;
    }

    console.log(`Found ${adminUsers.length} admin user(s) without passwords`);

    // Set password to "admin123" for each admin
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

      console.log(`✓ Set password for admin: ${user.email}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${defaultPassword}`);
    }

    console.log('\n✅ Done! You can now log in with the credentials above.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setAdminPassword();

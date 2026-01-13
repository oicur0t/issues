/**
 * Migration script to add passwords to existing users
 * Run with: npx tsx scripts/add-passwords-to-users.ts
 */

import { getCollection } from '../lib/mongodb'
import bcrypt from 'bcrypt'
import { ObjectId } from 'mongodb'

const SALT_ROUNDS = 12

// Default passwords for existing users (should be changed after first login)
const DEFAULT_PASSWORDS: Record<string, string> = {
  'admin@example.com': 'admin123',
  'dev@example.com': 'dev123',
  'tester@example.com': 'tester123',
  'viewer@example.com': 'viewer123',
}

async function addPasswordsToUsers() {
  try {
    console.log('Starting password migration...')

    const usersCollection = await getCollection('users')

    // Find all users without passwords
    const usersWithoutPasswords = await usersCollection
      .find({ password: { $exists: false } })
      .toArray()

    console.log(`Found ${usersWithoutPasswords.length} users without passwords`)

    for (const user of usersWithoutPasswords) {
      const email = user.email.toLowerCase()

      // Use default password if available, otherwise generate one
      let plainPassword = DEFAULT_PASSWORDS[email]

      if (!plainPassword) {
        // For unknown users, generate a random password
        plainPassword = `temp_${Math.random().toString(36).substring(2, 15)}`
        console.log(`Generated temporary password for ${email}: ${plainPassword}`)
        console.log('⚠️  IMPORTANT: User must be given this password or create a new one')
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS)

      // Update user with hashed password
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      )

      console.log(`✓ Updated password for ${email}`)
    }

    console.log('\n✅ Password migration complete!')
    console.log('\nDefault login credentials:')
    Object.entries(DEFAULT_PASSWORDS).forEach(([email, password]) => {
      console.log(`  ${email} / ${password}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

addPasswordsToUsers()

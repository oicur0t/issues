import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcrypt'
import * as fs from 'fs'
import * as path from 'path'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cluster0.rrp7vpi.mongodb.net/issues?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0'
const MONGODB_CERT_PATH = process.env.MONGODB_CERT_PATH || './Certs/X509-cert-5964230336800025568.pem'
const SALT_ROUNDS = 10

// Demo users with their passwords
const DEMO_USERS = [
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'dev@example.com', password: 'dev123' },
  { email: 'viewer@example.com', password: 'viewer123' }
]

async function addDemoPasswords() {
  let client: MongoClient | null = null

  try {
    console.log('🔌 Connecting to MongoDB...')
    console.log('URI:', MONGODB_URI.replace(/mongodb\+srv:\/\/([^@]+@)?/, 'mongodb+srv://***@'))
    console.log('Cert path:', MONGODB_CERT_PATH)

    // Check if certificate file exists
    const certPath = path.resolve(MONGODB_CERT_PATH)
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`)
    }

    console.log('✅ Certificate file found')

    // Read the certificate
    const cert = fs.readFileSync(certPath)

    // Create MongoDB client with certificate
    client = new MongoClient(MONGODB_URI, {
      tls: true,
      tlsCertificateKeyFile: certPath,
      serverSelectionTimeoutMS: 10000,
    })

    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db('issues')
    const usersCollection = db.collection('users')

    // Check existing users
    const existingUsers = await usersCollection.find({}).toArray()
    console.log(`\n📊 Found ${existingUsers.length} users in database`)

    for (const user of existingUsers) {
      console.log(`  - ${user.email} (${user.role}) - has password: ${!!user.password}`)
    }

    console.log('\n🔐 Hashing passwords...')
    const updates = []

    for (const demoUser of DEMO_USERS) {
      const hashedPassword = await bcrypt.hash(demoUser.password, SALT_ROUNDS)

      const result = await usersCollection.updateOne(
        { email: demoUser.email },
        {
          $set: {
            password: hashedPassword,
            isActive: true,
            updatedAt: new Date()
          }
        }
      )

      if (result.matchedCount > 0) {
        console.log(`✅ Updated password for ${demoUser.email}`)
        updates.push(demoUser.email)
      } else {
        console.log(`⚠️  User not found: ${demoUser.email}`)
      }
    }

    console.log(`\n✅ Successfully updated ${updates.length} user password(s)`)
    console.log('\n🎉 Demo accounts ready:')
    console.log('  - admin@example.com / admin123')
    console.log('  - dev@example.com / dev123')
    console.log('  - viewer@example.com / viewer123')

  } catch (error) {
    console.error('\n❌ Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      if ('code' in error) {
        console.error('Code:', error.code)
      }
    }
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('\n🔌 Disconnected from MongoDB')
    }
  }
}

addDemoPasswords()

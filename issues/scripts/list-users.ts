import { MongoClient } from 'mongodb'
import * as fs from 'fs'
import * as path from 'path'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cluster0.rrp7vpi.mongodb.net/issues?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0'
const MONGODB_CERT_PATH = process.env.MONGODB_CERT_PATH || './Certs/X509-cert-5964230336800025568.pem'

async function listUsers() {
  let client: MongoClient | null = null

  try {
    const certPath = path.resolve(MONGODB_CERT_PATH)
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`)
    }

    client = new MongoClient(MONGODB_URI, {
      tls: true,
      tlsCertificateKeyFile: certPath,
      serverSelectionTimeoutMS: 10000,
    })

    await client.connect()
    const db = client.db('issues')
    const usersCollection = db.collection('users')

    const users = await usersCollection.find({}).toArray()

    console.log(`\n📊 Found ${users.length} user(s) in database:\n`)

    for (const user of users) {
      console.log(`  👤 ${user.email}`)
      console.log(`     Name: ${user.name}`)
      console.log(`     Role: ${user.role}`)
      console.log(`     Has password: ${!!user.password}`)
      console.log(`     Active: ${user.isActive !== false}`)
      console.log(`     Created: ${user.createdAt}`)
      console.log()
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

listUsers()

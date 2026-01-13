import { MongoClient } from 'mongodb'

async function getApiKey() {
  const uri = process.env.MONGODB_URI || 'mongodb://wopr-wsl:27017'
  const client = new MongoClient(uri, {
    tls: true,
    tlsCertificateKeyFile: '/certs/client.pem',
    tlsCAFile: '/certs/ca.pem',
    authMechanism: 'MONGODB-X509'
  })

  try {
    await client.connect()
    const db = client.db('issue_tracker')
    const users = db.collection('users')
    
    // Get the first admin user
    const adminUser = await users.findOne({ role: 'admin' })
    
    if (!adminUser) {
      console.error('No admin user found')
      process.exit(1)
    }
    
    console.log(adminUser.apiKey)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

getApiKey()

import { MongoClient, Db } from 'mongodb'
import { readFileSync } from 'fs'
import { join } from 'path'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options: any = {
  // Add default options for better SSL/TLS compatibility
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

// Configure X.509 certificate authentication if cert path is provided
if (process.env.MONGODB_CERT_PATH) {
  try {
    const certPath = process.env.MONGODB_CERT_PATH
    const certContent = readFileSync(certPath, 'utf8')

    // Split certificate and private key
    const certMatch = certContent.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/)
    const keyMatch = certContent.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/)

    if (!certMatch || !keyMatch) {
      throw new Error('Invalid certificate format - missing cert or key')
    }

    options.tls = true
    options.tlsCertificateKeyFile = certPath
    // Note: authMechanism and authSource are already in the URI, don't duplicate
    // Relax TLS validation for M10 compatibility
    options.tlsAllowInvalidCertificates = true
    options.tlsAllowInvalidHostnames = true

    console.log('MongoDB X.509 authentication configured')
    console.log('URI:', uri.replace(/mongodb\+srv:\/\/([^@]+@)?/, 'mongodb+srv://***@'))
    console.log('Cert path:', certPath)
    console.log('Cert found:', !!certMatch)
    console.log('Key found:', !!keyMatch)
    console.log('Options:', JSON.stringify(options, null, 2))
  } catch (error) {
    console.error('Error configuring MongoDB certificate:', error)
    throw new Error('Failed to configure MongoDB certificate: ' + (error as Error).message)
  }
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

/**
 * Gets a database instance from the MongoDB connection
 * @param dbName - The name of the database to use
 * @returns Promise<Db> - MongoDB database instance
 */
export async function getDatabase(dbName: string = 'issues'): Promise<Db> {
  const client = await clientPromise
  return client.db(dbName)
}

/**
 * Helper function to get a collection from the database
 * @param collectionName - The name of the collection
 * @param dbName - The name of the database (optional, defaults to 'issue-tracker')
 * @returns Promise<Collection> - MongoDB collection instance
 */
export async function getCollection(collectionName: string, dbName?: string) {
  const db = await getDatabase(dbName)
  return db.collection(collectionName)
}

/**
 * Closes the MongoDB connection (useful for testing)
 */
export async function closeConnection(): Promise<void> {
  const client = await clientPromise
  await client.close()
}
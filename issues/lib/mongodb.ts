import { MongoClient, Db } from 'mongodb'
import { readFileSync } from 'fs'
import { createConnectionManager } from './db-connection'

function buildClient(): MongoClient {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
  }

  const options: any = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // Atlas may pause/resume clusters to save cost: keep probing so a resumed
    // cluster is picked up quickly instead of waiting on a long backoff.
    heartbeatFrequencyMS: 10000,
  }

  // Configure X.509 certificate authentication if cert path is provided
  const certPath = process.env.MONGODB_CERT_PATH
  if (certPath) {
    const certContent = readFileSync(certPath, 'utf8')
    if (
      !/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/.test(certContent) ||
      !/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/.test(certContent)
    ) {
      throw new Error('Failed to configure MongoDB certificate: missing cert or key in ' + certPath)
    }

    options.tls = true
    options.tlsCertificateKeyFile = certPath
    // authMechanism and authSource are already in the URI, don't duplicate.
    // Relax TLS validation for M10 compatibility
    options.tlsAllowInvalidCertificates = true
    options.tlsAllowInvalidHostnames = true
  }

  return new MongoClient(uri, options)
}

// Keep one manager per process, including across dev-mode hot reloads.
const globalWithMongo = global as typeof global & {
  _mongoConnection?: ReturnType<typeof createConnectionManager<MongoClient>>
}

const connection =
  globalWithMongo._mongoConnection ??
  (globalWithMongo._mongoConnection = createConnectionManager<MongoClient>({
    connect: async () => {
      const client = buildClient()
      try {
        return await client.connect()
      } catch (error) {
        await client.close().catch(() => {})
        throw error
      }
    },
    close: client => client.close(),
    onError: error => {
      console.error(
        '[MongoDB] Connection failed; will retry on the next request:',
        error instanceof Error ? error.message : error
      )
    },
  }))

/**
 * Resolves a connected client, reconnecting if the last attempt failed.
 * Prefer getDatabase()/getCollection().
 */
export function getClient(): Promise<MongoClient> {
  return connection.get()
}

/**
 * Gets a database instance from the MongoDB connection
 * @param dbName - The name of the database to use
 * @returns Promise<Db> - MongoDB database instance
 */
export async function getDatabase(dbName: string = 'issues'): Promise<Db> {
  const client = await getClient()
  return client.db(dbName)
}

/**
 * Helper function to get a collection from the database
 * @param collectionName - The name of the collection
 * @param dbName - The name of the database (optional, defaults to 'issues')
 * @returns Promise<Collection> - MongoDB collection instance
 */
export async function getCollection(collectionName: string, dbName?: string) {
  const db = await getDatabase(dbName)
  return db.collection(collectionName)
}

/**
 * Closes the MongoDB connection (useful for testing). The next call reconnects.
 */
export async function closeConnection(): Promise<void> {
  await connection.reset()
}

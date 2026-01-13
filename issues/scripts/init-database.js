const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

async function initializeDatabase() {
  console.log('🔧 Initializing Database Collections...\n');

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

    // Use the 'issues' database
    const db = client.db('issues');
    console.log('📊 Using database: issues');

    // Collections to create
    const collections = ['users', 'issues', 'wiki'];

    for (const collectionName of collections) {
      console.log(`\n🔍 Checking collection: ${collectionName}`);
      
      // Check if collection exists
      const collections = await db.listCollections({ name: collectionName }).toArray();
      
      if (collections.length === 0) {
        console.log(`📝 Creating collection: ${collectionName}`);
        await db.createCollection(collectionName);
        console.log(`✅ Collection '${collectionName}' created successfully`);
        
        // Insert a sample document to verify the collection works
        const collection = db.collection(collectionName);
        
        if (collectionName === 'users') {
          // Insert a sample user
          const sampleUser = {
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await collection.insertOne(sampleUser);
          console.log(`👤 Sample user inserted into ${collectionName}`);
        } else if (collectionName === 'issues') {
          // Insert a sample issue
          const sampleIssue = {
            title: 'Sample Issue',
            description: 'This is a sample issue for testing',
            status: 'open',
            priority: 'medium',
            reporterId: new ObjectId('507f1f77bcf86cd799439011'), // Mock user ID
            tags: ['sample', 'test'],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await collection.insertOne(sampleIssue);
          console.log(`🐛 Sample issue inserted into ${collectionName}`);
        } else if (collectionName === 'wiki') {
          // Insert a sample wiki page
          const sampleWiki = {
            title: 'Welcome to Wiki',
            slug: 'welcome-to-wiki',
            content: '# Welcome to the Wiki\n\nThis is a sample wiki page.',
            summary: 'Welcome page for the wiki',
            authorId: new ObjectId('507f1f77bcf86cd799439011'), // Mock user ID
            tags: ['welcome', 'sample'],
            isPublished: true,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await collection.insertOne(sampleWiki);
          console.log(`📚 Sample wiki page inserted into ${collectionName}`);
        }
      } else {
        console.log(`✅ Collection '${collectionName}' already exists`);
        
        // Count documents in the collection
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📊 Collection '${collectionName}' has ${count} documents`);
      }
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Database: issues');
    console.log('   - Collections: users, issues, wiki');
    console.log('   - Sample data inserted for testing');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

// Run the initialization
initializeDatabase().catch(console.error);
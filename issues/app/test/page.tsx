export default async function TestPage() {
  try {
    console.log('🔍 [DEBUG] TestPage: Starting')
    
    // Test basic imports
    const { getCurrentSession } = await import('@/lib/auth')
    console.log('🔍 [DEBUG] TestPage: Auth imported')
    
    // Test session
    const session = await getCurrentSession()
    console.log('🔍 [DEBUG] TestPage: Session checked:', !!session)
    
    // Test MongoDB import
    const { getCollection } = await import('@/lib/mongodb')
    console.log('🔍 [DEBUG] TestPage: MongoDB imported')
    
    return (
      <div className="p-8">
        <h1>Test Page</h1>
        <p>Session: {session ? 'Found' : 'Not found'}</p>
        <p>Imports successful</p>
      </div>
    )
  } catch (error) {
    console.error('🔍 [DEBUG] TestPage: ERROR:', error)
    return (
      <div className="p-8">
        <h1>Test Page Error</h1>
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
}
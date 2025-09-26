/**
 * Database Configuration Utility
 * Constructs DATABASE_URL from separate environment variables for better security
 */

export function getDatabaseUrl(): string {
  // Check if DATABASE_URL is already set (for backward compatibility)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Construct DATABASE_URL from separate variables
  const dbHost = process.env.DB_HOST
  const dbPort = process.env.DB_PORT || '5432'
  const dbName = process.env.DB_NAME
  const dbUsername = process.env.DB_USERNAME
  const dbPassword = process.env.DB_PASSWORD

  // Validate required variables
  if (!dbHost || !dbName || !dbUsername || !dbPassword) {
    throw new Error(
      'Database configuration incomplete. Please set DB_HOST, DB_NAME, DB_USERNAME, and DB_PASSWORD environment variables, or provide DATABASE_URL directly.',
    )
  }

  // Construct the PostgreSQL connection string
  const databaseUrl = `postgresql://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`

  console.log(
    `Database connection configured: postgresql://${dbUsername}:****@${dbHost}:${dbPort}/${dbName}`,
  )

  return databaseUrl
}

// Set DATABASE_URL in process.env if not already set
if (!process.env.DATABASE_URL) {
  try {
    process.env.DATABASE_URL = getDatabaseUrl()
  } catch (error) {
    console.warn('Could not construct DATABASE_URL:', error)
  }
}

export default getDatabaseUrl

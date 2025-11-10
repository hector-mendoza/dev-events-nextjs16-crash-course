/*
 * Mongoose connection helper for Next.js (TypeScript)
 * --------------------------------------------------
 * - Caches the connection across hot-reloads in development to avoid
 *   creating multiple connections.
 * - Provides strong typing (no `any`).
 * - Fails fast when the connection string is missing.
 */

import mongoose, { type ConnectOptions, type Mongoose } from 'mongoose';

/**
 * Shape of the cached Mongoose connection stored on the global object.
 */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Augment the Node.js global object with our cache. Using a globally cached
 * connection prevents creating multiple connections during development (HMR).
 */
declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

// Read the connection string from environment variables.
const MONGODB_URI = process.env.MONGODB_URI;

// Validate configuration up-front for fail-fast behavior and clearer errors.
if (!MONGODB_URI) {
  throw new Error(
    'Missing environment variable: MONGODB_URI. Define it in .env.local (do not commit secrets).'
  );
}

// After the check above, `uri` is guaranteed to be defined.
const uri: string = MONGODB_URI;

// Reuse the cached connection in development; initialize the cache if absent.
const cached: MongooseCache = globalThis.__mongooseCache ?? { conn: null, promise: null };
// Persist the cache on the global object for subsequent imports.
globalThis.__mongooseCache = cached;

/**
 * Mongoose connection options tuned for serverless/Next.js environments.
 * - bufferCommands: false makes model operations fail fast if not connected.
 * - maxPoolSize/serverSelectionTimeoutMS/socketTimeoutMS: sensible defaults.
 *
 * Adjust as needed for your deployment (Atlas/self-hosted/replicasets, etc.).
 */
const options: ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  // If your URI does not include a database name, you may set it here:
  // dbName: 'my-database',
};

/**
 * Establish (or reuse) a Mongoose connection.
 *
 * This function caches the connection across hot reloads in development to
 * prevent creating new connections on every HMR update.
 *
 * Usage:
 *   await connectToDatabase();
 *   // then import/define your models
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // Reuse an existing connection if available.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection attempt is in-flight, await it.
  if (!cached.promise) {
    // Optional: enable Mongoose debug logs in development if explicitly requested.
    if (process.env.NODE_ENV !== 'production' && process.env.MONGOOSE_DEBUG === 'true') {
      mongoose.set('debug', true);
    }

    cached.promise = mongoose.connect(uri, options);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;

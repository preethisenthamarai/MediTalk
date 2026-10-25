import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var ${key}. Copy server/.env.example to server/.env and fill it in.`);
    process.exit(1);
  }
}

/**
 * Repairs common MONGODB_URI mistakes so the server doesn't die with "URI malformed":
 *  - password containing raw special characters (%, $, @, :, / ...) that were never URL-encoded
 *  - no database name in the URI (Mongo would silently use the default "test" database)
 * Already-valid URIs are returned unchanged. Best practice is still to encode it in .env.
 */
export function normalizeMongoUri(uri) {
  const m = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:@\/]+):(.+)@([^@\/?]+)(\/[^?]*)?(\?.*)?$/);
  if (!m) return uri; // unrecognised shape (e.g. no credentials) - leave untouched
  const [, scheme, user, pass, host, dbPath = '', query = ''] = m;
  let safePass = pass;
  try {
    decodeURIComponent(pass);
    if (/[@\/:?#\[\]]/.test(pass)) throw new Error('reserved char');
  } catch {
    safePass = encodeURIComponent(pass);
    console.warn('[env] MONGODB_URI password had un-encoded special characters - auto-encoded it. Please fix server/.env too.');
  }
  let db = dbPath;
  if (!db || db === '/') {
    db = '/telemed';
    console.warn('[env] MONGODB_URI had no database name - using "telemed".');
  }
  return `${scheme}${user}:${safePass}@${host}${db}${query}`;
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  mongoUri: normalizeMongoUri(process.env.MONGODB_URI),
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  translation: {
    provider: (process.env.TRANSLATION_PROVIDER || 'mymemory').toLowerCase(),
    myMemoryEmail: process.env.MYMEMORY_EMAIL || '',
    googleKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
    libreUrl: process.env.LIBRETRANSLATE_URL || '',
    libreKey: process.env.LIBRETRANSLATE_API_KEY || '',
    timeoutMs: Number(process.env.TRANSLATION_TIMEOUT_MS) || 5000,
  },
};

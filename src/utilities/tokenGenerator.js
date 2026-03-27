const jwt = require("jsonwebtoken");

const getSecret = () => {
  const key = process.env.TOKEN_SECRET || "PRIVATEKEY";
  const salt = process.env.JWT_SALT || "SALT";
  return key + salt;
};

// ── Token duration ──────────────────────────────────────────────
// Default 24h; override with JWT_EXPIRES_IN env var (e.g. "7d", "2h")
const TOKEN_DURATION = process.env.JWT_EXPIRES_IN || "24h";

/**
 * Generate a signed JWT with an expiry.
 * Previously tokens had no expiresIn, making them valid forever.
 */
const generateJWTToken = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_DURATION });
};

/**
 * Verify and decode a JWT. Automatically handles:
 *  - "Bearer " prefix stripping (was causing silent failures in createProject)
 *  - Expiry validation (built into jwt.verify when expiresIn is set)
 *
 * Returns decoded payload on success, null on any failure.
 */
const verifyJWTToken = async (token) => {
  try {
    const cleanToken = extractBearerToken(token);
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(cleanToken, getSecret(), (err, decodedUser) => {
        if (err) return reject(err);
        resolve(decodedUser);
      });
    });
    return decoded;
  } catch (error) {
    // Only log in non-production; in prod, failed tokens are normal (expired, tampered)
    if (process.env.ENV !== "PROD") {
      console.log("JWT verification failed:", error.message);
    }
    return null;
  }
};

/**
 * Check if a decoded JWT is expired.
 * Previously called decodedJWT.getExpiresAt() which doesn't exist —
 * decoded JWTs are plain objects with an `exp` field (Unix timestamp).
 */
const isJWTExpired = (decodedJWT) => {
  if (!decodedJWT || !decodedJWT.exp) return true;
  return decodedJWT.exp < Math.floor(Date.now() / 1000);
};

/**
 * Strip "Bearer " prefix from an Authorization header value.
 * Handles undefined/null safely.
 */
const extractBearerToken = (raw) => {
  if (!raw) return "";
  if (raw.startsWith("Bearer ")) return raw.slice(7);
  return raw;
};

module.exports = {
  generateJWTToken,
  verifyJWTToken,
  isJWTExpired,
  extractBearerToken,
};

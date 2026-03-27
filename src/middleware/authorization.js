const { createAnonimousAccount } = require("../controllers/authController");
const { verifyJWTToken } = require("../utilities/tokenGenerator");
const prisma = require("../db/prismaClient");

/**
 * strictAuthorize — requires a valid JWT.
 * Returns 401 if token is missing or invalid. Used for protected routes.
 */
const strictAuthorize = async (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(401).json({ message: "Authorization token required." });
    }

    // verifyJWTToken now handles Bearer prefix internally
    const user = await verifyJWTToken(token);
    if (!user) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }

    req.user = user;
    next();
};

/**
 * authenticate — soft auth, attaches user if token is valid, null otherwise.
 * Never blocks the request.
 */
const authenticate = async (req, res, next) => {
    const token = req.headers["authorization"];
    if (token) {
        const user = await verifyJWTToken(token);
        req.user = user || null;
    } else {
        req.user = null;
    }
    next();
};


// If you are not logged in an account will be created for you
/**
 * authorize — ensures req.user is always set.
 * If token is valid -> use that user.
 * If token is invalid/missing -> create anonymous account.
 *
 * BUG FIXES:
 * 1. Previously checked `user === false` but verifyJWTToken returns null -> anon path never triggered.
 * 2. `let user = await createAnonimousAccount()` shadowed outer `user` -> req.user was never set.
 * 3. When user existed in JWT but was deleted from DB, anon was created but not attached to req.user.
 */
const authorize = async (req, res, next) => {
    try {
        const token = req.headers["authorization"];

        if (token) {
            const decoded = await verifyJWTToken(token);

            if (decoded) {
                // Token is valid — verify the user still exists in DB
                const realUser = await prisma.user.findUnique({
                    where: { id: decoded.id },
                });

                if (realUser) {
                    req.user = decoded;
                    return next();
                }
                // User was deleted from DB — fall through to create anonymous
            }
            // Token invalid or user gone — fall through to create anonymous
        }

        // No token, invalid token, or deleted user -> create anonymous account
        const anonResult = await createAnonimousAccount();
        req.user = anonResult.user;
        return next();
    } catch (e) {
        console.error("authorize middleware error:", e);
        return res.status(500).json({ message: "Authentication failed." });
    }
};

module.exports = {
    strictAuthorize,
    authorize,
    authenticate,
};

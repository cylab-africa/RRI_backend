const tokenKey = process.env.TOKEN_SECRET;
const salt = process.env.JWT_SALT;
const jwt = require("jsonwebtoken");

const generateJWTToken = (payload) => {
  const SECRET_KEY = tokenKey || "PRIVATEKEY";
  const SALT = salt || "SALT";

  const token = jwt.sign(payload, SECRET_KEY + SALT, {
    expiresIn: "7d",
  });
  return token;
};

const verifyJWTToken = async(token) => {
  const SECRET_KEY = process.env.TOKEN_SECRET || "PRIVATEKEY";
  const SALT = process.env.JWT_SALT || "SALT";

  try {
    const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, SECRET_KEY + SALT, (err, decodedUser) => {
            if (err) return reject(err);
            resolve(decodedUser);
        });
    });
    return decoded;
  } catch (error) {
    console.log('error: ',error)
    return null;
  }
};

const isJWTExpired = (decodedJWT) => {
  let expiresAt = decodedJWT.getExpiresAt();
  return expiresAt.before(new Date());
};
module.exports = {
  verifyJWTToken,
  generateJWTToken,
  isJWTExpired,
};

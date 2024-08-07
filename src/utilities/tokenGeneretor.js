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

const verifyJWTToken = (token) => {
  try {
    const SECRET_KEY = tokenKey || "PRIVATEKEY";
    const SALT = salt || "SALT";
    const decoded = jwt.verify(token, SECRET_KEY + SALT);
    return decoded;
  } catch (error) {
    return false;
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

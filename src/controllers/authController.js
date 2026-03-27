const prisma = require("../db/prismaClient");
const { generateJWTToken } = require("../utilities/tokenGenerator");
const { verifyToken } = require("../utilities/authUtilities");
const crypto = require("crypto");

const createAccount = async (req, res) => {
  const { email, firstName, lastName, googleCredential } = req.body;
  if (!email || !firstName || !lastName || !googleCredential) {
    return res.status(400).json({
      error: "email, firstName, lastName, and googleCredential are required",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const createdUser = await prisma.user.create({
      data: {
        email: email,
        firstName: firstName || null,
        password: "",
        lastName: lastName || "",
        googleCredential: googleCredential || null,
      },
    });

    const accessToken = generateJWTToken({
      id: createdUser.id,
      email: email,
      firstName: firstName,
      lastName: lastName,
    });

    return res.status(201).json({
      accessToken: accessToken,
      user: createdUser,
      userRegistered: true,
      googleCredential: createdUser.googleCredential || null,
      success: true,
    });
  } catch (err) {
    console.error("Error during user signup:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const checkUser = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });

  try {
    const userInfo = await verifyToken(token);
    const userEmail = userInfo.email;

    const userExists = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        googleCredential: true,
        createdAt: true,
      },
    });

    if (userExists) {
      const accessToken = generateJWTToken({
        id: userExists.id,
        email: userExists.email,
        firstName: userExists.firstName,
        lastName: userExists.lastName,
      });
      return res.json({
        accessToken: accessToken,
        user: userExists,
        userRegistered: true,
        googleCredential: userExists.googleCredential || null,
      });
    } else {
      return res.json({
        userRegistered: false,
        googleCredential: null,
      });
    }
  } catch (err) {
    console.error("Error during user verification:", err);
    return res.status(500).json({ userRegistered: false, error: "Internal server error" });
  }
};

/**
 * Create an anonymous account.
 *
 * BUG FIX: Previously used `Math.random() * 100000 + userCount` which could
 * collide under concurrent requests. Now uses crypto.randomUUID() for uniqueness.
 */
const createAnonimousAccount = async () => {
  const randEmail = `anon-${crypto.randomUUID()}@local.local`;
  const user = await prisma.user.create({
    data: { email: randEmail, password: "", firstName: "Anonymous", lastName: "" },
  });
  const simpleUser = { id: user.id, firstName: user.firstName, createdAt: user.createdAt };
  const token = generateJWTToken(simpleUser);

  return { token: token, user: user };
};

module.exports = {
  createAccount,
  createAnonimousAccount,
  checkUser,
};

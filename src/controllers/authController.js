
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken');
const { generateJWTToken } = require('../utilities/tokenGeneretor');
const { verifyToken } = require('../utilities/authUtilities');
const token = process.env.TOKEN_SECRET;
const prisma = new PrismaClient()


const createAccount = async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    googleCredential
  } = req.body;
  if (!email || !firstName || !lastName || !googleCredential) return res.status(400).json({ error: 'email and firstName and lastName and googleCredential are required' });

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }


    // Insert user into the database with Prisma
    const createdUser = await prisma.user.create({
      data: {
        email: email,
        firstName: firstName || null, // Nullable
        password: "",
        lastName: lastName || "",
        googleCredential: googleCredential || null              // Nullable
      },
    });
    const accessToken = generateJWTToken({
      id: createdUser.id,
      email:email,
      firstName:firstName,
      lastName:lastName
    })

    // const accessToken = jwt.sign(userExists, process.env.TOKEN_SECRET, { expiresIn: '1h'});
    // Send success response
    return res.status(201).json({
      accessToken: accessToken,
      user: createdUser,
      userRegistered: true,
      googleCredential: createdUser.googleCredential || null,
      success: true
    });
  } catch (err) {
    console.error("Error during user signup", err);
    return res.status(500).json({ success: false });
  }
};
const checkUser = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    // Verify token and get user info
    const userInfo = await verifyToken(token);
    const userEmail = userInfo.email;

    // Check if the user exists in the database using Prisma
    const userExists = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
      select: {
        id:true,
        email: true,
        firstName: true,
        lastName: true,
        googleCredential: true,  // Select the googleCredential field
        createdAt: true,
      },
    });


    // If user exists, return their information and googleCredential
    if (userExists) {
      const accessToken = generateJWTToken({
        id:userExists.id,
        email:userExists.email,
        firstName:userExists.firstName,
        lastName:userExists.lastName
      });
      return res.json({
        accessToken: accessToken,
        user: userExists,
        userRegistered: true,
        googleCredential: userExists.googleCredential || null  // Include googleCredential in response
      });
    } else {
      // If user does not exist, send response indicating they are not registered
      return res.json({
        userRegistered: false,
        googleCredential: null
      });
    }
  } catch (err) {
    console.error("Error during user verification:", err);
    return res.status(500).json({ userRegistered: false, error: 'Internal server error' });
  }
};

const createAnonimousAccount = async () => {
  const userCount = await prisma.user.count()
  const randEmail = `${parseInt(Math.random() * 100000)}${userCount}@local.local`
  const user = await prisma.user.create({ data: { email: randEmail, password: "", firstName: "Anonymous", lastName: "" } })
  const simpleUser = { id: user.id, firstName: user.firstName, createdAt: user.createdAt }
  const token = generateJWTToken(simpleUser)

  return { token: token, user: user };
}

module.exports = {
  createAccount,
  createAnonimousAccount,
  checkUser
};

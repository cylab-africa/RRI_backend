const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to check if user exists in the database using Prisma
async function checkUserInDatabase(email) {
    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    return !!user; // Return true if the user exists, false otherwise
}
const { OAuth2Client } = require('google-auth-library');
const { generateJWTToken } = require('./tokenGeneretor');
const client = new OAuth2Client('675234645346-4gm06orkd6a46m9vn1k0nm0lmr693pj3.apps.googleusercontent.com');

async function verifyToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: '675234645346-4gm06orkd6a46m9vn1k0nm0lmr693pj3.apps.googleusercontent.com', // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    return payload; // This contains user info
}

async function authenticateCreateUser(token){
    console.log('token: ',token)
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
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          googleCredential: true,  // Select the googleCredential field
          createdAt: true,
        },
      });
  
  
      // If user exists, return their information and googleCredential
      if (userExists) {
        const accessToken = generateJWTToken(userExists)
        console.log(userExists)
        return {
          accessToken: accessToken,
          user: userExists,
          userRegistered: true,
          googleCredential: userExists.googleCredential || null  // Include googleCredential in response
        };
      } else {
        // If user does not exist, send response indicating they are not registered
        return {
          userRegistered: false,
          googleCredential: null
        };
      }
    } catch (err) {
      console.error("Error during user verification:", err);
      return { userRegistered: false, error: 'Internal server error' };
    }
}

module.exports = {
    checkUserInDatabase,
    verifyToken,
    authenticateCreateUser
};
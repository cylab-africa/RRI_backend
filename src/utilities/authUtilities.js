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
const client = new OAuth2Client('675234645346-4gm06orkd6a46m9vn1k0nm0lmr693pj3.apps.googleusercontent.com');

async function verifyToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: '675234645346-4gm06orkd6a46m9vn1k0nm0lmr693pj3.apps.googleusercontent.com', // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    return payload; // This contains user info
}

module.exports = {
    checkUserInDatabase,
    verifyToken
};
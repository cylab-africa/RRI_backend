const { createAnonimousAccount } = require("../controllers/authController");
const { verifyJWTToken, isJWTExpired } = require("../utilities/tokenGeneretor");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// You need to be logged in
const strictAuthorize = async (req, res, next) => {
    const token = req.headers["authorization"];
    console.log('authorization: ',token)
    if (token) {
        const user = await verifyJWTToken(token);
        if (user) {
            // const actualUser = await prisma.user.findUnique({where:{id:user.id}})
            req.user = user
            // console.log(req.user)
        } else {
            return res.status(401).send({ "message": "Invalid token provided." })
        }
    }else{
        return res.status(401).send({ "message": "Invalid token provided." })
    }
    next();
}

module.exports = {
    strictAuthorize
}
const { createAnonimousAccount } = require("../controllers/authController");
const { verifyJWTToken } = require("../utilities/tokenGeneretor");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()


const strictAuthorize = async(req, res, next)=>{
    const token = req.headers["authorization"];
    if(token){
        const user = verifyJWTToken(token);
        if(user){
            // const actualUser = await prisma.user.findUnique({where:{id:user.id}})
            req.user = user
            // console.log(req.user)
        }else{
            return res.status(401).send({"message":"Invalid token provided."})
        }
    }else{
        
        return res.status(401).send({"message":"You do not have access to this page."})
    }
    return next()
}
const authorize = async (req, res, next)=>{

    const token = req.headers["authorization"];
    // console.log("The token ", token)

    if(token){
        const user = verifyJWTToken(token);
        if(user){
            // const actualUser = await prisma.user.findUnique({where:{id:user.id}})
            req.user = user
            // console.log(req.user)
        }else{
            return res.status(401).send({"message":"Invalid token provided."})

        }
    }else{
        let user = await createAnonimousAccount();
        delete user.user.password
        // 202 to be used when an anonymous account is created
        return res.status(202).send({"message":"Account created. Please use the token provided for anonymous authentication.", "data":user})
    }
    return next()
}

module.exports = {
    authorize,
    strictAuthorize
}
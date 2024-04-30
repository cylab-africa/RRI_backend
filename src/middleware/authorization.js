const { createAnonimousAccount } = require("../controllers/authController");
const { verifyJWTToken, isJWTExpired } = require("../utilities/tokenGeneretor");
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
    try{

        const token = req.headers["authorization"];
        // console.log("The token ", token)

        if(token){
            
            const user = verifyJWTToken(token);
            if(user === false){
                let user = await createAnonimousAccount();
                delete user.user.password
                // 202 to be used when an anonymous account is created
                return res.status(202).send({"message":"Account created. Please use the token provided for anonymous authentication.", "data":user})
            }
            if(user){
                req.user = user
                let realUser = await prisma.user.findUnique({where:{id:user.id}})
                if(realUser === null){
                    let user = await createAnonimousAccount();
                    delete user.user.password
                    // 202 to be used when an anonymous account is created
                    return res.status(202).send({"message":"Account created. Please use the token provided for anonymous authentication.", "data":user})
       
                }
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
    }catch(e){
        // console.error(e)
       
        return res.status(500).send({"message":"Something went wrong!"})
    }
}

module.exports = {
    authorize,
    strictAuthorize
}

const { PrismaClient } = require('@prisma/client')

const testGetWay= async(req, res)=>{
    try{
        const prisma = new PrismaClient()

        // const user = await prisma.user.create({data:{email:"test@test.test", password:"123"}})
        const users = await prisma.user.findMany({})
        // console.log(user)
        return res.status(200).send({"users":[]})
    }catch(e){
        return res.status(200).send({"error":e})
    }
} 



module.exports = {
    testGetWay,
    
  };
  
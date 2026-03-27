
const prisma = require('../db/prismaClient');

const testGetWay= async(req, res)=>{
    try{
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
  
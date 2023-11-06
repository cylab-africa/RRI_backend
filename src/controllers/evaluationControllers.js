
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()


const createLayer = async(req, res)=>{
    try{
        // Check if there is already some layers in the DB
        const layers = await prisma.layer.findMany({})
        if (layers.length === 3){
            return res.status(200).send({"layers": layers})
        }

        const layer1 = await prisma.layer.create({data:{name:"LAYER 1"}})
        const layer2 = await prisma.layer.create({data:{name:"LAYER 2"}})
        const layer3 = await prisma.layer.create({data:{name:"LAYER 3"}})
        
        // console.log(user)
        return res.status(200).send({"layers":[layer1, layer2, layer3]})
    }catch(e){
        return res.status(200).send({"error":e})
    }
} 



module.exports = {
    createLayer,
  };
  
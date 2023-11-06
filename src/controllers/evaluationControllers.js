
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const createLayers = async()=>{
    const layer1 = await prisma.layer.create({data:{name:"LAYER 1"}})
    const layer2 = await prisma.layer.create({data:{name:"LAYER 2"}})
    const layer3 = await prisma.layer.create({data:{name:"LAYER 3"}})
    return [layer1, layer2, layer3]
}

const createQuestionsCheckIfExist = async()=>{
    const questions = await prisma.question.findMany({})
    if(questions.length > 0){
        return 
    }

    const layers = await prisma.layer.findMany({})
    
    await prisma.question.createMany({data:[
        {layerId:layers[0].id, question:"What social problem does your innovation address, and how does it positively impact the local community or sociaty as a whole?"},
        {layerId:layers[0].id, question:"How do you involve the local community in the design and implementation of your innovation?"},
        {layerId:layers[0].id, question:"Can you provide insights into the ethical considerations that have guided the development and deployment of your innovation?"},
        {layerId:layers[0].id, question:"What gouvenment mechanisms are in place to ensure responsible decision-making and compliance with relevant regulations and ethical guidelines?"},    
    ]})

    await prisma.question.createMany({data:[
        {layerId:layers[1].id, question:"This is just some questions for layer 2, and how does it positively impact the local community or sociaty as a whole?"},
        {layerId:layers[1].id, question:"Layer 2 has three questions only in the design and implementation of your innovation?"},
        {layerId:layers[1].id, question:"Can you provide insights into the ethical considerations that have guided the development and deployment of your innovation?"},
    ]})

    await prisma.question.createMany({data:[
        {layerId:layers[2].id, question:"Layer three questions, and how does it positively impact the local community or sociaty as a whole?"},
        {layerId:layers[2].id, question:"Layer 3 has two questions only in the design and implementation of your innovation?"},
    ]})

   return
}

const getLayers = async(req, res)=>{
    try{
        // Check if there is already some layers in the DB
        const layers = await prisma.layer.findMany({})
        if (layers.length === 3){

            return res.status(200).send({"layers": layers})
        }
        const createdLayers = await createLayers()
               
        // console.log(user)
        return res.status(200).send({"layers":createdLayers})
    }catch(e){
        return res.status(200).send({"error":e})
    }
} 

const getQuestions = async(req, res)=>{
    try{
        // Get the layer id (This is not mandatory)
        const {id} = req.query
        // Get all layers and questions to check if they exist
        const layerCount = await prisma.layer.count()
        const questionCount = await prisma.question.count()
        // If not
        if (layerCount !== 3 || questionCount === 0 ){
            // Create layers
            await createLayers()
            // Check if questions exist or create them
            await createQuestionsCheckIfExist()
        }
        let questions = []
        if(id){
             questions = await prisma.question.findMany({
                where:{
                    layerId:parseInt(id)
                }
             })
        }else{
            questions = await prisma.question.findMany({})

        }
        return res.status(200).send({"questions": questions})

    }catch(e){
        console.log(e)
        return res.status(200).send({"error":e})
    }
}


module.exports = {
    getLayers,
    getQuestions
  };
  
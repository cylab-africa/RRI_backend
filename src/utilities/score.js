const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()


const calculateScore =(layerOneScores, layerTwoScores=null, layerThreeScores=null)=>{
    console.log(layerOneScores)
    console.log(layerTwoScores)
    console.log(layerThreeScores)



    let layerOneScore = 0 
    let layerTwoScore = 0 
    let layerThreeScore = 0

    let sum = 0
    layerOneScores.forEach((e)=>{
        sum +=e.score
    })

    layerOneScore = sum*50/(layerOneScores.length*10)

    if(layerTwoScores!== null || layerTwoScores.length !==0){
        let sum = 0
        layerTwoScores.forEach((e)=>{
            sum +=e.score
        })
        layerTwoScore = sum*30/(layerTwoScores.length*10)
    }

    if(layerThreeScores!== null || layerThreeScores.length!==0){
        let sum = 0
            layerThreeScores.forEach((e)=>{
            sum +=e.score
        })
        layerThreeScore = sum*20/(layerThreeScores.length*10)
    }
    console.log(layerOneScore, layerTwoScore, layerThreeScore)
    return layerOneScore + layerTwoScore + layerThreeScore;
}


const submittedScoresCheck= async(answers, evaluation)=>{
    let response = {status:true}
    for (let i = 0 ; i < answers.length; i++){
        let question = await prisma.question.findUnique({where:{id:answers[i].id}, include:{layer:true}})
        // console.log(evaluation.layersDone)
        if(evaluation.layersDone === 0){
            return response
        }

        if((evaluation.layersDone === 1 & question.layer.value > 1) || (evaluation.layersDone === 2 & question.layer.value > 2) ){
            response =  {status:true}
        }else{
            // console.log("It is here ... .... .... ... ")
            response = {status:false}
            break;
        }
    }
    return response
}



module.exports = {
    submittedScoresCheck,
    calculateScore
}
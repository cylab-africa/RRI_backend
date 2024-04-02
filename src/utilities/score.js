const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()


const calculateScore =(layerOneAnswers, layerTwoAnswers=null, layerThreeAnswers=null)=>{
    // console.log(layerOneScores)
    // console.log(layerTwoScores)
    // console.log(layerThreeScores)



    let layerOneScore = 0 
    let layerTwoScore = 0 
    let layerThreeScore = 0

    let sum = 0
    layerOneAnswers.forEach((e)=>{
        score = (e.score * e.weight)/10
        sum +=score 
    })

    layerOneScore = sum*50/(layerOneAnswers.length*10)

    if(layerTwoAnswers!== null || layerTwoAnswers.length !==0){
        let sum = 0
        layerTwoAnswers.forEach((e)=>{
            score = (e.score * e.weight)/10
            sum +=score
        })
        layerTwoScore = sum*30/(layerTwoAnswers.length*10)
    }

    if(layerThreeAnswers!== null || layerThreeAnswers.length!==0){
        let sum = 0
            layerThreeAnswers.forEach((e)=>{
            score = (e.score * e.weight)/10
            sum +=score
        })
        layerThreeScore = sum*20/(layerThreeAnswers.length*10)
    }
    // console.log(layerOneScore, layerTwoScore, layerThreeScore)
    return [layerOneScore, layerTwoScore, layerThreeScore, (layerOneScore + layerTwoScore + layerThreeScore)];
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
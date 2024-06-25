
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken');
const { generateJWTToken } = require('../utilities/tokenGeneretor');
const token = process.env.TOKEN_SECRET;
const prisma = new PrismaClient()

const createAccount = async(req, res)=>{
   
} 

const createAnonimousAccount = async()=>{
  const userCount = await prisma.user.count()
  const randEmail = `${parseInt(Math.random()*100000)}${userCount}@local.local`
  const user = await prisma.user.create({data:{email:randEmail, password:"", firstName:"Anonymous", lastName:""}})
  const simpleUser = {id:user.id, firstName:user.firstName, createdAt:user.createdAt}
  const token =  generateJWTToken(simpleUser)

  return {token:token, user:user};
}

module.exports = {
    createAccount,
    createAnonimousAccount
  };
  
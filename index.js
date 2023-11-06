var express = require('express');
var app = express();
const {testGetWay} = require('./src/controllers/testController')
const {getLayers, getQuestions} = require('./src/controllers/evaluationControllers')
// Configurations


// Routes
app.get('/', testGetWay)
app.get("/layer", getLayers)
app.get('/questions', getQuestions)


var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("The app listening at http://%s:%s", host, port)
})
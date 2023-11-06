var express = require('express');
var app = express();
const {testGetWay} = require('./src/controllers/testController')
const {createLayer} = require('./src/controllers/evaluationControllers')
// Configurations


// Routes
app.get('/', testGetWay)
app.get("/layer", createLayer)



var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("The app listening at http://%s:%s", host, port)
})
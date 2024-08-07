var express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
var app = express();
const {testGetWay} = require('./src/controllers/testController')
const {getLayers, getQuestions, submitAnswers, createProject, getEvaluations, getProjects, generateReport} = require('./src/controllers/evaluationControllers');
const { authorize, strictAuthorize } = require('./src/middleware/authorization');
// require('./auth/auth')
const PORT = process.env.PORT
const ORIGIN = process.env.WEBSITE
const ENV = process.env.ENV
// Configurations

// Migrate the database

if (ENV==='TEST'){
   app.use(cors({
      origin: "*",
   }));
}else{
   app.use(cors({
      origin: ORIGIN,
   }));
}

app.use(express.json());
app.use(cookieParser())
// Routes
app.get('/api/', testGetWay)
app.get("/api/layer", getLayers)
app.get('/api/questions', getQuestions)
app.post('/api/answers', authorize, submitAnswers)
app.post('/api/project', authorize, createProject)
app.get("/api/evaluation", strictAuthorize, getEvaluations)
app.get("/api/projects", strictAuthorize, getProjects)
app.get("/api/report/:pid", strictAuthorize, generateReport)

var server = app.listen(PORT, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("The app listening at http://%s:%s", host, port)
})
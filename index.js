var express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
var app = express();
const {testGetWay} = require('./src/controllers/testController')
const {getLayers, getQuestions, submitAnswers, createProject, getEvaluations, getProjects} = require('./src/controllers/evaluationControllers');
const { authorize, strictAuthorize } = require('./src/middleware/authorization');

// Configurations

// Migrate the database


app.use(cors({
   origin: '*',
}));

app.use(express.json());
app.use(cookieParser())
// Routes
app.get('/', testGetWay)
app.get("/layer", getLayers)
app.get('/questions', getQuestions)
app.post('/answers', authorize, submitAnswers)
app.post('/project', authorize, createProject)
app.get("/evaluation", strictAuthorize, getEvaluations)
app.get("/projects", strictAuthorize, getProjects)

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("The app listening at http://%s:%s", host, port)
})
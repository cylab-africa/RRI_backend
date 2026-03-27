const { reInitDB } = require('../utilities/addQuestions')

const  initApp =  async(req, res) => {
    try {
      await reInitDB();
      return res.status(200).json({ success: true, message: "Database reinitialized successfully"})
    } catch (e){
        console.log("Error reinitializing Database", e)
        return res.status(500).json({ success: false, error: {message: "Error reinitializing Database", err: e.toString()}});
    }
}


module.exports = { initApp, };
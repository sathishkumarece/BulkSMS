const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const axios = require('axios')
const splitFile = require('./splitFile')

const app = express()

app.use(bodyParser.urlencoded({ extended: 'true' })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json()) // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })) // parse application/vnd.api+json as json
app.use(methodOverride())

var port = process.env.PORT || 8080
app.listen(port, () => {
  console.log('Server started!!!')
})

var splitFileCount;
const smsLiveURL = 'http://www.smslive247.com/http/index.aspx'
app.get('/sendSMS', (req, res) => {
  axios
    .post(smsLiveURL, null, {
      params: {
        cmd: 'login',
        owneremail: process.env.EMAIL,
        subacct: process.env.SUBACC,
        subacctpwd: process.env.SUBACCPWD
      },
    })
    .then((response) => {
      // If request is good...
      console.log(response.data)
      let sessionId = response.data.split(':')[1].trim();
      console.log("sessionId: " +sessionId);
      sendSMSBulk(sessionId);
    })
    .catch((error) => {
      console.log('error ' + error)
    })
})

app.get('/splitFile', (req, res)=>{
  (async() => {
    const result = await splitFile(process.env.INDIR, 'input.txt', process.env.OUTDIR);
    splitFileCount = parseInt(result.split(':')[1]);
    console.log(splitFileCount);
    res.send(result);
  })();
})

function sendSMSBulk(sessionId){
  const promiseArray = [];
  for (let index = 0; index < splitFileCount; index++) {
        promiseArray.push(sendSMS(sessionId, index+1))
  }
  Promise.all(promiseArray).then(value => {
    console.log(value);
  })  
}

function sendSMS(sessionId, num){
  const promise = new Promise((resolve, reject)=>{
    axios
    .post(smsLiveURL, null, {
      params: {
        cmd: 'sendmsg',
        sessionid: sessionId,
        message: "This is text sms",
        sender: process.env.SENDER,
        sendto: `${process.env.APPURL}/bulk/input${num}.txt`,
        // sendto: '2348080086841',
        msgtype: 0
      },
    })
    .then((response) => {
      // If request is good...
      console.log(response.data)
      resolve(response.data)
    })
    .catch((error) => {
      console.log('error ' + error)
      reject(error)
    })
  })
  return promise;
}

app.get('/bulk/:filename', (req, res) => {
  console.log(req.params.filename);
  // res.send("Done")
  const file = `${process.env.OUTDIR}/${req.params.filename}`;
  res.download(file)
})

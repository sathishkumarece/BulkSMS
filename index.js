const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const axios = require('axios')
const querystring = require('querystring')
const fs = require('fs')
const path = require('path')
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

var splitFileCount = 1;
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
      console.log(new Date() + " sessionId: " +sessionId);
      sendSMSBulk(sessionId, res);
    })
    .catch((error) => {
      console.log(new Date() + ' error ' + error)
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

function sendSMSBulk(sessionId, res){
  const message = fs.readFileSync(path.join(process.env.INDIR, process.env.MSGFILE), "utf8")
  const promiseArray = [];
  for (let index = 0; index < splitFileCount; index++) {
        promiseArray.push(sendSMS(sessionId, index+1, message))
  }
  Promise.all(promiseArray).then(value => {
    console.log(new Date() + value);
    res.send(value);
  })  
}

function sendSMS(sessionId, num, message){
  const promise = new Promise((resolve, reject)=>{
    axios
    .post(smsLiveURL, null, {
      params: {
        cmd: 'sendmsg',
        sessionid: sessionId,
        message: message,
        sender: process.env.SENDER,
        sendto: `${process.env.APPURL}/bulk/input${num}.txt`,
        msgtype: 0
      },
    })
    .then((response) => {
      // If request is good...
      console.log(new Date() + ' MSG trigger response: '+response.data + ' for Num: '+num)
      resolve(response.data + ' for Num: '+num)
    })
    .catch((error) => {
      console.log( new Date() + ' error ' + error)
      reject(error)
    })
  })
  return promise;
}

app.get('/bulk/:filename', (req, res) => {
  console.log(new Date() + ' FileName: '+req.params.filename);
  // res.send("Done")
  const file = path.join(process.env.OUTDIR, req.params.filename);
  res.download(file)
})

app.get('/getBalance', (req, res)=>{
  axios
    .post(smsLiveURL, null, {
      params: {
        cmd: 'querybalance',
        sessionid: process.env.SESSIONID
      },
    })
    .then((response) => {
      // If request is good...
      console.log(new Date() + ' Msg balance: ' + response.data)
      res.send('Msg balance: ' + response.data)
    })
    .catch((error) => {
      console.log(new Date() + ' error ' + error)
      res.send('error ' + error)
    })
})

app.get('/getMsgCharge/:msgId', (req, res)=>{
  axios
    .post(smsLiveURL, null, {
      params: {
        cmd: 'querymsgcharge',
        sessionid: process.env.SESSIONID,
        messageid: req.params.msgId
      },
    })
    .then((response) => {
      // If request is good...
      console.log(new Date() + ' Msg charge: ' + response.data + ' for Msg Id: ' + req.params.msgId)
      res.send('Msg charge: ' + response.data+ ' for Msg Id: ' + req.params.msgId)
    })
    .catch((error) => {
      console.log(new Date() + ' error ' + error)
      res.send('error ' + error)
    })
})

app.get('/getMsgStatus/:msgId', (req, res)=>{
  axios
    .post(smsLiveURL, null, {
      params: {
        cmd: 'querymsgstatus',
        sessionid: process.env.SESSIONID,
        messageid: req.params.msgId
      },
    })
    .then((response) => {
      // If request is good...
      console.log(new Date() + ' Msg status: ' + response.data + ' for Msg Id: ' + req.params.msgId)
      res.send('Msg status: ' + response.data+ ' for Msg Id: ' + req.params.msgId)
    })
    .catch((error) => {
      console.log(new Date() + ' error ' + error)
      res.send('error ' + error)
    })
})

app.get('/getCoverage/:phno', (req, res)=>{
  axios
    .post(smsLiveURL, null, {
      params: {
        cmd: 'querycoverage',
        sessionid: process.env.SESSIONID,
        msisdn: req.params.phno
      },
    })
    .then((response) => {
      // If request is good...
      console.log(new Date() + ' ' + response.data + ' for Phone number: ' + req.params.phno)
      res.send(response.data+ ' for Phone number: ' + req.params.phno)
    })
    .catch((error) => {
      console.log(new Date() + ' error ' + error)
      res.send('error ' + error)
    })
})
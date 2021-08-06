const OAuth = require('oauth')
const fs = require('fs')
const neo4j = require('neo4j-driver')
var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors');
const e = require('express');
var app = express()
app.use(cors())
var jsonParser = bodyParser.json()
 


global.count = 0
global.PTR = 7
global.level1 = []
var oauth

/****************** Api  Connection ******************/
url = "https://api.twitter.com/1.1/friends/list.json?"
lookup = "https://api.twitter.com/1.1/users/lookup.json?"
const config = require('./config.json')


/****************** neo4j  Connection ******************/
const {uri, user, psw} = require('./neo4j_config.json')
const neo4jFunctions = require('./neo4jFunctions')


/********* Creating the oauthenication part  **************/
twitterAuth  = require ('./twitterAuth.js')
const twitterfunctions = require('./twitterfunctions')
oauth  = twitterAuth.getOauth(global.PTR) // first time 

 



 setInterval(neo4jFunctions.calculate, 21600000); //Timer for calculations


/********* Api to calculate all the values again in neo4j**************/
app.post('/load2neo4j/calculate',async function(req, res){
  
  await neo4jFunctions.calculate()
  .then(()=>{
    res.send("Done calculations")
  })
  .catch(e=>{
    res.send(e)
  })
})




/********* Api to export 2 level followers to neo4j**************/
app.post('/load2neo4j/all',jsonParser, async  function (req, res) {
  screenName = req.body.screenName
  await twitterfunctions.checkExistance(screenName)
  .then(async ()=>{
    console.log("Processing Started")
    await twitterfunctions.get2LevelFollowers(screenName)
    .then(()=>{
      res.send("Done successfully")
    })
    .catch(e=>{
      res.send(e)
    })
  })
  .catch(e=>{
    res.send(e)
  })
})




/********* Api to get All details of a specific profile at a specific time**************/
app.get('/getData/profile/Time', async  function (req, res) {
  screenName = req.query.screenName
  hours = req.query.time
  query = ` MATCH(n:Profile{screenName:'`+screenName+`'})<-[d:Data]-(q:Date{date:date()})
            WHERE  duration.inSeconds(q.dateTime, dateTime()).hours <=`+String(hours)+`
            and duration.inSeconds(q.dateTime, dateTime()).hours >=`+String(hours-6)+`
            RETURN n, d
            LIMIT 1`
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    result = {
      "Properties": response.records[0]._fields[0].properties,
      "calculated": response.records[0]._fields[1].properties
    }
    res.send(result)
  })
  .catch(e=>{
    res.send(e)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})



/********* Api to get All details of a specific profile**************/
app.get('/getData/profile', async  function (req, res) {
  screenName = req.query.screenName
  query = ` MATCH(n:Profile{screenName:'`+screenName+`'})<-[d:Data]-(q:Date{date:date()})
            WHERE  duration.inSeconds(q.dateTime, dateTime()).hours <=6
            RETURN n, d
            LIMIT 1`
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    result = {
      "Properties": response.records[0]._fields[0].properties,
      "calculated": response.records[0]._fields[1].properties
    }
    res.send(result)
  })
  .catch(e=>{
    res.send(e)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})

/********* Api to add new api key to the config file**************/
app.post('/create/apikey',jsonParser, function(req, res){
  var json = {
    TWITTER_CONSUMER_KEY : req.body.consumerKey,
    TWITTER_CONSUMER_SECRET : req.body.consumerSecret,
    TWITTER_ACCESS_KEY : req.body.accessKey,
    TWITTER_ACCESS_TOKEN_SECRET :  req.body.accessSecret
  }
  config.push(json)
  fs.writeFile('./config.json', JSON.stringify(config), err => {
    if (err) {
        res.send('Error writing file: ', err)
    } else {
        res.send("Successfully added new key to file")
    }
})
})


/********* Api to add new property to the existing node in neo4j**************/
app.post('/updateProfile/add/property',jsonParser,async function(req, res){
  console.log("called")
  query = `
      MATCH(n:Profile{screenName:'`+req.body.screenName+`'})
      set n.`+req.body.newProp+` = True
      RETURN n
  `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.records.length == 0)
        res.send("No such user found")
      else{
      res.send("Profile Updated")
    }
  })
  .catch(e=>{
    res.send(e)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})

/********* Api to add new label of IgnoreProcess  to the existing node in neo4j**************/
app.post('/updateProfile/add/label/IgnoreProcess',jsonParser,async function(req, res){
  console.log("called")
  query = `
      MATCH(n:Profile{screenName:'`+req.body.screenName+`'})
      set n:IgnoreProcess
      RETURN n
  `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.records.length == 0)
        res.send("No such user found")
      else{
      res.send("Profile Updated")
    }
  })
  .catch(e=>{
    res.send(e)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})

/********* Api to add new tag to the existing node in neo4j**************/
app.post('/updateProfile/add/tag',jsonParser,async function(req, res){
  query = `
      MATCH(n:Profile{screenName:'`+req.body.screenName+`'}) 
      set n.tags = ( case exists(n.tags) 
      when true
        THEN n.tags + "`+req.body.tag+`"
      else
        [] + "`+req.body.tag+`"
      end)
      RETURN n
  `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.summary.updateStatistics._stats.propertiesSet == 0){
      res.send("No such user found")
    }
    else{
      res.send("Profile Updated")
    }
    
  })
  .catch(e=>{
    res.send(e)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})


/********* Api to delete tag to the existing node in neo4j**************/
app.post('/updateProfile/delete/tag',jsonParser,async function(req, res){
  query = `
      MATCH(n:Profile{screenName:'`+req.body.screenName+`'}) 
      SET n.tags = [x IN n.tags WHERE x <> "`+req.body.tag+`"]
      RETURN n
  `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.summary.updateStatistics._stats.propertiesSet == 0){
      res.send("No such user found")
    }
    else{
      res.send("Profile Updated")
    }
    
  })
  .catch(e=>{
    res.send(e)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})


/***** Find the  labels count*/
app.get('/allProfileCount',async function(req,res){
  query = `
      MATCH (a) WITH DISTINCT LABELS(a) AS temp, COUNT(a) AS tempCnt
      UNWIND temp AS label
      RETURN label, SUM(tempCnt) AS cnt
      `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    var txt = "{"
    for(i = 0;i<response.records.length;i++){
      txt += "\""+response.records[i]._fields[0]+"\": \""+response.records[i]._fields[1]+"\","
    }
    txt = txt.slice(0, -1) 
    txt+="}"
    res.send(JSON.parse(txt))

  })
  .catch(e=>{
  res.send(e)
  })
  .finally(()=>{
  session.close()
  })
})

/**** Get profile according to the tag given***/
app.get('/getData/profile/Tag',async function(req,res){
  query = `
      MATCH(n:Profile{screenName:'test'})
      WHERE "`+req.query.tag+`" IN n.tags
      RETURN n
      `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    var results = []
    for(i = 0;i<response.records.length;i++){
      results.push(response.records[i]._fields[0].properties)
      }
    res.send(results)

  })
  .catch(e=>{
  res.send(e)
  })
  .finally(()=>{
  session.close()
  })
})


/****** api to get All profiles for a specific label******/
app.get('/getData/profile/label',async function(req,res){
  query = `
      MATCH(n:Profile:`+req.query.label+`)
      RETURN n
      `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    var results = []
    for(i = 0;i<response.records.length;i++){
      results.push(response.records[i]._fields[0].properties)
      }
    res.send(results)

  })
  .catch(e=>{
  res.send(e)
  })
  .finally(()=>{
  session.close()
  })
})

/****** api to get All profiles for a specific property******/
app.get('/getData/profile/prop',async function(req,res){
  query = `
      MATCH(n:Profile{`+req.query.prop+`:true})
      RETURN n
      `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    var results = []
    for(i = 0;i<response.records.length;i++){
      results.push(response.records[i]._fields[0].properties)
      }
    res.send(results)

  })
  .catch(e=>{
  res.send(e)
  })
  .finally(()=>{
  session.close()
  })
})

/****** default Api ******/
app.get('',function(req, res){
  msg = `
  Welcome to the twitter apis\n 
  Visit: 
  https://docs.google.com/document/d/1wh60XtV7MnTmyewUvAoUN0av-2ie5dX5QsgulNdhzac/edit?usp=sharing 
  to view all the details about the document
  `
  res.send(msg)
})



app.listen(8080)
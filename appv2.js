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
global.PTR = 0
// global.level1 = []
var oauth



/****************** Api  Connection ******************/
url = "https://api.twitter.com/1.1/friends/list.json?"
lookup = "https://api.twitter.com/1.1/users/lookup.json?"
const config = require('./config.json')


/****************** neo4j  Connection ******************/
const {uri, user, psw} = require('./neo4j_config.json')
const neo4jFunctions = require('./neo4jFunctions.js')


/********* Creating the oauthenication part  **************/
twitterAuth  = require ('./twitterAuth.js');
const twitterfunctions = require("./twitterFunctions.js");
oauth  = twitterAuth.getOauth(global.PTR) // first time 

 


/****Timer for calculations ********/
 setInterval(neo4jFunctions.calculate, 21600000); 



/********* Api to calculate all the values again in neo4j**************/
app.post('/load2neo4j/calculate',async function(req, res){
  
  await neo4jFunctions.calculate()
  .then(()=>{
    results = {
      status: 201,
      description:"Done calculations"
    }
    res.send(results)
  })
  .catch(e=>{
    results = {
      status: 500,
      description:e
    }
    res.send(results)
  })
})

/********* Api to discover new level 0 profiles from neo4j data**************/
app.get('/discover/level0',jsonParser, async  function (req, res) {
  try{
    skip =  req.query.page*req.query.limit;
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
    query =`
    MATCH(n:Level1)<-[d:Data]-(q:Date)
    WHERE not n:IgnoreDiscover and  duration.inSeconds(q.dateTime, dateTime()).hours <=6 
    WITH n,d ORDER BY d.TS_Value DESC LIMIT 100
    RETURN n.screenName
    ORDer by n.followingCount DESC
    SKIP `+skip+`
    LIMIT `+req.query.limit+`
    `
    session = driver.session()
    await session.run(query)
    .then(response=>{
      if(response.records.length == 0){
        result = {
          status:204,
          description: "No such profiles found"
        }
      }
      else{
        result = []
        for(i=0;i<response.records.length;i++)
          result.push(response.records[i]._fields[0])
         res.send({status:200, data:result})
      }
     
    })
    .catch(e=>{
      results = {
        status: 500,
        description:e
      }
      res.send(results)
    })
    .finally(()=>{
        session.close()
    })

}
catch(e){
  console.log(e)
  results = {
    status: 500,
    description:e
  }
  res.send(results)
}

})

/********* Api to export 2 level followers to neo4j**************/
app.post('/load2neo4j/all',jsonParser, async  function (req, res) {

  screenName = req.body.screenName
  res.send("process started for "+screenName);
  await twitterfunctions.checkExistance(screenName)
  .then(async ()=>{
    fs.appendFile('./log.txt',"\n Process Started for "+screenName+ " at " + new Date() , err => {
      if (err) {
          console.log('Error writing file: ', err)
          results = {
            status: 500,
            description:err
          }
          // res.send(results)
         
      }
    })
    
    await twitterfunctions.get2LevelFollowers(screenName)
    .then(()=>{
      results = {
        status: 200,
        description:"Done successfully"
      }
      // res.send(results)
    })
    .catch(e=>{
      fs.appendFile('./log.txt',"\n "+ JSON.stringify(e) , err => {
        if (err) {
            console.log('Error writing file: ', err)
            results = {
              status: 500,
              description:err
            }
            // res.send(results)
          }
      })
      results = {
        status: 500,
        description:e
      }
      // res.send(results)
    })
  })
  .catch(e=>{
    fs.appendFile('./log.txt',"\n "+ e , err => {
      if (err) {
          console.log('Error writing file: ', err)
          results = {
            status: 500,
            description:e
          }
          // res.send(results)
      }
    })
  })
})




/********* Api to get All details of a specific profile at a specific time**************/
app.get('/getData/profile/Time', async  function (req, res) {
  // screenName = req.query.screenName
  hours = req.query.time
  skip =  req.query.page*req.query.limit;
  
  // {screenName:'`+screenName+`'}
  query = ` MATCH(n:Profile)<-[d:Data]-(q:Date)
            WHERE  duration.inSeconds(q.dateTime, dateTime()).hours <=`+String(hours)+`
            and duration.inSeconds(q.dateTime, dateTime()).hours >=`+String(hours-6)+`
            RETURN n, d
            ORDER BY `+req.query.score+` `+req.query.order+` 
            SKIP `+skip+`
            LIMIT `+req.query.limit+`
             `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.records.length == 0){
      results = {
        status: 204,
        description:"No such user found"
      }
      res.send(results)
    }
    else{
      var results = []
      for(i =0;i<response.records.length;i++)
      {
        Properties = response.records[i]._fields[0].properties
        Properties["createdAt"] = Properties.createdAt.day +"-"+Properties.createdAt.month+ "-" +Properties.createdAt.year
        Properties["storedOn"] = Properties.storedOn.day +"-"+Properties.storedOn.month+ "-" +Properties.storedOn.year
        if(Properties.hasOwnProperty('tags')){
          Properties["tags"] =Properties.tags.toString()
        }
        else{
          Properties["tags"] = "None"
        }
        
        calculated= response.records[i]._fields[1].properties
        labels= response.records[i]._fields[0].labels
        Properties["labels"] = labels.toString()
        result = Object.assign(Properties, calculated)
        results.push(results)
        
      }
      res.send({status:200,data:results})
    }
    
  })
  .catch(e=>{
    results = {
      status: 500,
      description:e
    }
    res.send(results)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})

/********* Api to get All details of a specific profile at a specific time**************/
app.get('/getData/profile/specificScore', async  function (req, res) {
  score = req.query.score
  hours = req.query.time
  skip =  req.query.page*req.query.limit;
  
  query = ` MATCH(n:Profile)<-[d6:Data]-(q:Date)
            where duration.inSeconds(q.dateTime, dateTime()).hours<6 and duration.inSeconds(q.dateTime, dateTime()).hours>=0
            OPTIONAL MATCH(n)<-[d12:Data]-(q2:Date)
            WHERE  duration.inSeconds(q.dateTime, dateTime()).hours <=`+String(hours)+`
            and duration.inSeconds(q.dateTime, dateTime()).hours >=`+String(hours-6)+`
            RETURN n,d6.`+score+`,((-d6.`+score+`+d12.`+score+`)/d6.`+score+`)*100 as change 
            ORDER BY `+req.query.score+` `+req.query.order+` 
            SKIP `+skip+`
            LIMIT `+req.query.limit+``
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.records.length == 0){
      results = {
        status: 204,
        description:"No such user found"
      }
      res.send(results)
    }
    else{
      var results = []
      for(i =0;i<response.records.length;i++)
      {
        Properties = response.records[i]._fields[0].properties
        Properties["createdAt"] = Properties.createdAt.day +"-"+Properties.createdAt.month+ "-" +Properties.createdAt.year
        Properties["storedOn"] = Properties.storedOn.day +"-"+Properties.storedOn.month+ "-" +Properties.storedOn.year
        if(Properties.hasOwnProperty('tags')){
          Properties["tags"] =Properties.tags.toString()
        }
        else{
          Properties["tags"] = "None"
        }
        
        current= response.records[i]._fields[1]
        Properties["current"] = current
        change= response.records[i]._fields[2]
        Properties["change"] = change
        labels= response.records[i]._fields[0].labels
        Properties["labels"] = labels.toString()
        results.push(Properties)
        
      }
      res.send({status:200,data: results})
    }
    
  })
  .catch(e=>{
    results = {
      status: 500,
      description:e
    }
    res.send(results)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})



/********* Api to get All details of a specific profile**************/
app.get('/getData/profile', async  function (req, res) {
  skip =  req.query.page*req.query.limit;
  screenName = req.query.screenName
  query = ` MATCH(n:Profile{screenName:'`+screenName+`'})<-[d:Data]-(q:Date)
            WHERE  duration.inSeconds(q.dateTime, dateTime()).hours <=6
            RETURN n, d
            ORDER BY `+req.query.score+` `+req.query.order+`            
            SKIP `+skip+`
            LIMIT `+req.query.limit+``
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.records.length == 0){
      results = {
        status: 204,
        description:"no such user found"
      }
      res.send(results)
    }
    else{
        Properties= response.records[0]._fields[0].properties
        Properties["createdAt"] = Properties.createdAt.day +"-"+Properties.createdAt.month+ "-" +Properties.createdAt.year
        Properties["storedOn"] = Properties.storedOn.day +"-"+Properties.storedOn.month+ "-" +Properties.storedOn.year
        if(Properties.hasOwnProperty('tags')){
          Properties["tags"] =Properties.tags.toString()
        }
        else{
          Properties["tags"] = "None"
        }
        
        calculated= response.records[0]._fields[1].properties
        result = Object.assign(Properties, calculated)
        final = []
        for (key in results) {
          final.push({"label":key,"value":result[key]})
        }  
      res.send({status:200,data:final})
    }
    
  })
  .catch(e=>{
    results = {
    status: 500,
    description:e
  }
  res.send(results)
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
      results = {
        status: 500,
        description:err
      }
      res.send(results)
       
    } else {
      results = {
        status: 200,
        description:"Successfully added new key to file"
      }
      res.send(results)
      
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
app.post('/updateProfile/add/label',jsonParser,async function(req, res){
  console.log("called")
  query = `
      MATCH(n:Profile{screenName:'`+req.body.screenName+`'})
      set n:`+req.body.label+`
      RETURN n
  `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.records.length == 0){
      results = {
        status: 204,
        description:"No such user found"
      }
      res.send(results)
    }
      else{
        results = {
          status: 200,
          description:"Profile Updated"
        }
        res.send(results)
    }
  })
  .catch(e=>{
    results = {
      status: 500,
      description:e
    }
    res.send(results)
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
      results = {
        status: 204,
        description:"No such user found"
      }
      res.send(results)
    }
    else{
      results = {
        status: 200,
        description:"Profile Updated"
      }
      res.send(results)
    }
    
  })
  .catch(e=>{
    results = {
      status: 500,
      description:e
    }
    res.send(results)
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
      results = {
        status: 204,
        description:"No such user found"
      }
      res.send(results)
    }
    else{
      results = {
        status: 200,
        description:"Profile Updated"
      }
      res.send(results)
    }
    
  })
  .catch(e=>{
    results = {
    status: 500,
    description:e
  }
  res.send(results)
    console.log(e)
  })
  .finally(()=>{
    session.close()
  })
})


/***** Find the  labels count*/
app.get('/allProfileCount',async function(req,res){
  query = `
      MATCH (a) 
      WHere not a:Date WITH DISTINCT LABELS(a) AS temp, COUNT(a) AS tempCnt
      UNWIND temp AS label
      RETURN label, SUM(tempCnt) AS count
      `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    // res.send(response)
    var txt = "["
    for(i = 0;i<response.records.length;i++){
      txt += "{\"label\":\""+response.records[i]._fields[0]+"\",\"count\": \""+response.records[i]._fields[1]+"\"},"
    }
    txt = txt.slice(0, -1) 
    txt+="]"
    res.send({status:200,data:JSON.parse(txt)})

  })
  .catch(e=>{
    results = {
      status: 500,
      description:e
    }
    res.send(results)
  })
  .finally(()=>{
  session.close()
  })
})

/**** Get profile according to the tag given***/
app.get('/getData/profile/Tag',async function(req,res){
  skip =  req.query.page*req.query.limit;
  
  query = `
      MATCH(n:Profile)
      WHERE "`+req.query.tag+`" IN n.tags
      RETURN n
      ORDER BY `+req.query.score+` `+req.query.order+` 
      SKIP `+skip+`
      LIMIT `+req.query.limit+`
      `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.records.length== 0){
      results = {
        status: 204,
        description:"No such user found"
      }
      res.send(results)
    }
    else{
      var results = []
      for(i = 0;i<response.records.length;i++){
        Properties = response.records[i]._fields[0].properties
        Properties["createdAt"] = Properties.createdAt.day +"-"+Properties.createdAt.month+ "-" +Properties.createdAt.year
          Properties["storedOn"] = Properties.storedOn.day +"-"+Properties.storedOn.month+ "-" +Properties.storedOn.year
          if(Properties.hasOwnProperty('tags')){
            Properties["tags"] =Properties.tags.toString()
          }
          else{
            Properties["tags"] = "None"
          }
          
        results.push(Properties)
        }
        res.send({status:200,data:results})
    }
    

  })
  .catch(e=>{
    results = {
    status: 500,
    description:e
  }
  res.send(results)
  })
  .finally(()=>{
  session.close()
  })
})


/****** api to get All profiles for a specific label******/
app.get('/getData/profile/label',async function(req,res){
  skip =  req.query.page*req.query.limit;
  
  queryrun = `
      MATCH(n:Profile:`+req.query.label+`)
      RETURN n
      ORDER BY `+req.query.score+` `+req.query.order+` 
      SKIP `+skip+`
      LIMIT `+req.query.limit+`
      `
      
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(queryrun)
  .then(response=>{
    if(response.records.length== 0){
      results = {
        status: 204,
        description:"No such user found"
      }
      res.send(results)
      
    }
    else{
    var results = []
    for(i = 0;i<response.records.length;i++){
      
      Properties = response.records[i]._fields[0].properties
      
      Properties["createdAt"] = Properties.createdAt.day +"-"+Properties.createdAt.month+ "-" +Properties.createdAt.year
      Properties["storedOn"] = Properties.storedOn.day +"-"+Properties.storedOn.month+ "-" +Properties.storedOn.year
      if(Properties.hasOwnProperty('tags')){
        Properties["tags"] =Properties.tags.toString()
      }
      else{
        Properties["tags"] = "None"
      }
      
      results.push(Properties)
      
      }
    res.send({status:200,data:results})
    }
  })
  .catch(e=>{
    console.log(e)
    results = {
      status: 500,
      description:e
    }
    res.send(results)
  })
  .finally(()=>{
  session.close()
  })
})

/****** api to get All profiles for a specific property******/
app.get('/getData/profile/prop',async function(req,res){
  skip =  req.query.page*req.query.limit;
  query = `
      MATCH(n:Profile{`+req.query.prop+`:true})
      RETURN n
      ORDER BY `+req.query.score+` `+req.query.order+` 
      SKIP `+skip+`
      LIMIT `+req.query.limit+`
     
      `
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
  await session.run(query)
  .then(response=>{
    if(response.records.length== 0)
    res.send("No such user found")
    else{
    var results = []
    for(i = 0;i<response.records.length;i++){
      
      Properties = response.records[i]._fields[0].properties
      
      Properties["createdAt"] = Properties.createdAt.day +"-"+Properties.createdAt.month+ "-" +Properties.createdAt.year
      Properties["storedOn"] = Properties.storedOn.day +"-"+Properties.storedOn.month+ "-" +Properties.storedOn.year
      if(Properties.hasOwnProperty('tags')){
        Properties["tags"] =Properties.tags.toString()
      }
      else{
        Properties["tags"] = "None"
      }
      
      results.push(Properties)
      
      }
    res.send(results)
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

/****get log file */
app.get('/Download/log',function(req, res){
  res.status(200)
        .sendFile(`log.txt`, { root: __dirname })
})

/****** default Api ******/
app.get('/',function(req, res){
  msg = `
  Welcome to the twitter apis\n 
  Visit: 
  https://docs.google.com/document/d/1wh60XtV7MnTmyewUvAoUN0av-2ie5dX5QsgulNdhzac/edit?usp=sharing 
  to view all the details about the document
  `
  res.send(msg)
})



app.listen(process.env.PORT || 8080)
console.log("Node started at 8080")

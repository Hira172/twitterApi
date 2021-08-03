const OAuth = require('oauth')
const fs = require('fs')
const neo4j = require('neo4j-driver')
const { promisify } = require('util')
var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors');
const e = require('express');
var app = express()
app.use(cors())
var jsonParser = bodyParser.json()
 


var count = 0
var PTR = 5
var level1 = []
var oauth

/****************** Api  Connection ******************/
url = "https://api.twitter.com/1.1/friends/list.json?"
lookup = "https://api.twitter.com/1.1/users/lookup.json?"
const config = require('./config.json')
// const { json } = require('neo4j-driver-core')


/****************** neo4j  Connection ******************/
// uri = "neo4j+s://c769464a.databases.neo4j.io:7687"
// user = "neo4j"
// psw = "tGHL7urcs5CYQzRGQgK1LJzlubN37-kYBdNHsijw8yw"


uri = "bolt://localhost:7687"
user = "neo4j"
psw = "123"

/********* fucntion that is Creating the oauthenication part  **************/
async function getOauth(){
  oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    config[PTR].TWITTER_CONSUMER_KEY,
    config[PTR].TWITTER_CONSUMER_SECRET,
    '1.0A', null, 'HMAC-SHA1'
  )
}
getOauth() // first time 


/********* Fucntion to switch keys used in the authetication **************/
async function switchKeys(){
  if(count>14){
    console.log("switched "+count)
    count = 0
    PTR++
    getOauth()
    if(PTR>config[PTR].TWITTER_CONSUMER_KEY.length){
      PTR = 0
    }
  }
}



/********* Fucntion takes username and gets the followers for that user**************/
async function getFollowers (username,level) {
  // console.log("fucntion call")
  var cursor  = -1
  switchKeys()
  const get = promisify(oauth.get.bind(oauth))
  while(cursor != 0){
    // console.log("Api called in cursor "+username)
    await get(
      url+`screen_name=${username} &count=200 &cursor=`+cursor,
      config[PTR].TWITTER_ACCESS_KEY,
      config[PTR].TWITTER_ACCESS_TOKEN_SECRET,
    )
    .then(body=>JSON.parse(body))
    .then(async response=>{
      // console.log("Got data from Api sucessfully")
      cursor = response.next_cursor
      count++;
      json = response.users
      
      // send data to neo4j
      const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
      session = driver.session()
      var query = "MATCH(n:Profile{screenName:'"+username+"'})\n "
      for(i =0;i<json.length;i++){
        level1.push(json[i].screen_name)
        var createdate = new Date(json[i].created_at)
        query += "MERGE(m"+i+":Profile{id:"+json[i].id+",name:'"+json[i].name.replace(/'/g, " ")+"',screenName:'"+json[i].screen_name.replace("'", " ")+"', url:'"+json[i].url+"'}) "
        query+= "\nON CREATE SET m"+i+".storedOn = date()"
        query+= "\nset m"+i+" :Level"+level+", m"+i+".createdAt=date('"+createdate.getFullYear()+"-"+(createdate.getMonth()+1)+"-"+createdate.getDate()+"'),  m"+i+".listedCount="+json[i].listed_count+",  m"+i+".followerCount="+json[i].followers_count+", m"+i+".followingCount="+json[i].friends_count+", m"+i+".favouritesCount="+json[i].favourites_count+", m"+i+".statusCount="+json[i].statuses_count
        query += "\n MERGE(n)-[:Follows]->(m"+i+") \n"
      }
      query += "RETURN 1"
      session = driver.session()
      await session.run(query)
      .then( ()=>{
        console.log("level "+level+": "+response.users.length+" nodes loaded for user: "+username)
      })
      .catch(e=>{
        throw e;
      })
      .finally(()=>{
        session.close()
      })
      
    })
    .catch(e=>{
      throw e;
    })
  }
 
}


/********* Fucntion takes username and gets all the information for that user**************/
async function getInfo (username) {
  switchKeys()
  const get = promisify(oauth.get.bind(oauth))
  await get(
    lookup+`screen_name=${username} `,
    TWITTER_ACCESS_KEY[PTR],
    TWITTER_ACCESS_TOKEN_SECRET[PTR],
  )
  .then(body=>JSON.parse(body))
  .then(async json=>{

      count++;
      // send data to neo4j
      const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
      var createdate = new Date(json[0].created_at)
      var query = "MERGE(n:Profile{id:"+json[0].id+",name:'"+json[0].name+"',screenName:'"+json[0].screen_name+"', url:'"+json[0].url+"'})"
      query+= "\nON CREATE SET n.storedOn = date()"
      query+= "\nset n :Level0, n.createdAt=date('"+createdate.getFullYear()+"-"+(createdate.getMonth()+1)+"-"+createdate.getDate()+"'), n.listedCount="+json[0].listed_count+", n.followerCount="+json[0].followers_count+",n.followingCount="+json[0].friends_count+",n.favouritesCount="+json[0].favourites_count+",n.statusCount="+json[0].statuses_count
      session = driver.session()
      await session.run(query)
      .then(response=>{
        console.log("Level 0 added to Neo4j")
      })
      .catch(e=>{
        throw e;
      })
      .finally(()=>{
        session.close()
      })
    
    
  })
  .catch(e=>{
    throw e;
  })
}

async function checkExistance (username) {
  query = `MATCH(n:Level0{screenName:'`+username+`'})
           RETURN 1`
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
  session = driver.session()
      await session.run(query)
      .then(response=>{
        if ( response.records[0].keys[0] == 1)
          throw "The data for the user have already been loaded"
      })
      .catch(e=>{
        throw e;
      })
      .finally(()=>{
        session.close()
      })
}

/********* Function that calculate all the requirements for process 3 **************/
async function calculate(){
  console.log("starting calculations")
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
  query =`
      MATCH(n:Level0)-[:Follows]->(m:Level1)
      WITH m, count(m) as AsLevel1 where not m:ignoreCal
      MERGE (q:Date{date:date(),time:dateTime().hour})
      set q.dateTime = dateTime(), q.test = "tysfdh"
      MERGE (m)<-[d:Data{accountAge: duration.inDays(date(m.createdAt),date()).days}]-(q)
      SET d.mutualCount=AsLevel1
      WITH q
      MATCH(m:Profile)
      where not m:ignoreCal
      MERGE (m)<-[d:Data{accountAge: duration.inDays(date(m.createdAt),date()).days}]-(q)
      SET d.mutualCount =  (case d.mutualCount when null then 1 else d.mutualCount end) ,  d.discoveredAge= (case  duration.inDays(date(m.storedOn),date()).days when 0 then 1 else  duration.inDays(date(m.storedOn),date()).days end)
      SET d.reputation = d.mutualCount*m.listedCount, d.hidden = toFloat(d.reputation)/toFloat(m.followerCount), d.AA_Viral = toFloat(m.followerCount)/toFloat(d.accountAge), d.AA_Adoption = toFloat(d.mutualCount)/toFloat(d.accountAge), d.AA_Hotness = toFloat(d.reputation) / toFloat(d.accountAge), d.AA_Gem = toFloat(d.hidden) / toFloat(d.accountAge), d.DA_Viral = toFloat(m.followerCount) / toFloat(d.discoveredAge), d.DA_Adoption = toFloat(d.mutualCount) / toFloat(d.discoveredAge), d.DA_Hotness = toFloat(d.reputation) / toFloat(d.discoveredAge), d.TS_Viral = d.AA_Viral + d.DA_Viral,d.TS_Adoption = d.AA_Adoption + d.DA_Adoption, d.TS_Hotness = d.AA_Hotness + d.DA_Hotness, d.TS_Gem = d.AA_Gem + d.DA_Gem, d.TS_Value = d.TS_Hotness + d.TS_Gem, d.TS_Score = d.TS_Viral + d.TS_Adoption + d.TS_Hotness + d.TS_Gem
    `
  // console.log(query)
  session = driver.session()
  await session.run(query)
  .then(response=>{
    console.log("All calculations done")
  })
  .catch(e=>{
    throw e;
  })
  .finally(()=>{
    session.close()
  })
 
}

/********* Main algorithm ***********/
//  'muazam172'
async function get2LevelFollowers(username){
    await getInfo(username)
    .then(async ()=>{
      console.log("starting to work at Level 1")
      await getFollowers (username,level=1) 
      .then(async ()=>{
        console.log("done with Level1 and started working on level2")
        for(i =0;i<level1.length;i++){
          await getFollowers (username,level=2)
          .catch(e=>{
            console.log(e)
            throw e;
          })
        } 
      })
      .catch(e=>{
        console.log(e)
        throw e;
      })
    })
    .then(async ()=>{
      await calculate()
      .catch(e=>{
        console.log(e)
        throw e;
      })
    })
    .then(()=>{
      console.log("Done")
    })
    .catch(e=>{
      console.log(e)
      throw e;
    })
    
}


setInterval(calculate, 21600000); //Timer for calculations


/********* Api to calculate all the values again in neo4j**************/
app.post('/load2neo4j/calculate',async function(req, res){
  await calculate()
  .then(()=>{
    res.send("Done calculations")
  })
  .catch(e=>{
    res.send(e)
  })
})

/********* Api to export 2 level followers to neo4j**************/
app.post('/load2neo4j/all', async  function (req, res) {
  screenName = req.body.level0
  await checkExistance(screenName)
  .then(async ()=>{
    await get2LevelFollowers(screenName)
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
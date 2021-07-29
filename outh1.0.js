const OAuth = require('oauth')
const neo4j = require('neo4j-driver')
const { promisify } = require('util')
var express = require('express')
var cors = require('cors');
const { async } = require('rxjs');
const e = require('express');
const { json } = require('neo4j-driver-core');
var app = express()
app.use(cors())

var count = 0
var PTR = 5
var level1 = []
var oauth

/****************** Api  Connection ******************/
url = "https://api.twitter.com/1.1/friends/list.json?"
lookup = "https://api.twitter.com/1.1/users/lookup.json?"
TWITTER_CONSUMER_KEY = ["4a9X7yYfMBuG9HUc4DRXWdepZ","ySeQ2F2esJoYG4BfsMtuYMYF9","eGcpJRBTqzdeYDcDc9cWAc0bO", "E1ZOU8mR712aq3ecTU2nWKAZA", "sZwFeu4zaxHWI7HoKtUXVfsS8","d2ZosifWrCDm60gabT2Gk9q8g","MncJ7oEAi82h9KhHz2CPyNTGn"]
TWITTER_CONSUMER_SECRET = ["eZpTxX6aC9SWaMXz19wQ9iiInnuHh5LfjZjbkohEqx05wJMLbd","P9wtvqe15imnS0hcRueWrsZBXZsIOoRbp045reicgrInT4Hvok","NLFSBjyWlSA4Xd5pAuNFIkGOORqa48WSGtfGaBXsx9UkRjKQwr", "7JNFUeoToHTttDhLQb9HmS9iuSauTxtVaV80p7Oyb2whDPRd0M","2qlrSio6r1cj9qmK7AzV3byOpCI1xGi0XpP1RjGmnQzltQU8kl","EnompvfEWeZk2TbVPZ4r9wfY2Lkyvbo5KynD8jh9GGRqrJqIgY","pwzddqRZa0fBRrbeRAYk5EJDBUwtZDa291EcmYrplTJZAYd4l3"]
TWITTER_ACCESS_KEY = ["1131520630187208705-jEEC0cmZuzIQAq8iJVQtG1v2zBPlBt","1131520630187208705-vAM2Y0Iz0pmEkyWNbAVaSce3BgJfK4", "1131520630187208705-dIjPNsuykeRM2DqFIxiPZQ37q7j5VA","1131520630187208705-F6RRy0yMaV8LbRFEfhm3iSuQOQGRhH", "1131520630187208705-n5HgPW6wgVqFUCOvc08JOp2DGENJWM","1131520630187208705-TienDacYJG9W95K7S2N2ngNna1LuOv","1131520630187208705-iDOob0WLM4iWlbVkis2Fn8rwr859Va"]
TWITTER_ACCESS_TOKEN_SECRET = ["YuTrS6LTtflKvV4f0vugIRmvEW1d5M7wklAt4iwbzjhu4","LVDIjAu464pmuicOrWtEL2PBJMMXQontrtTITuHdE2Tjk", "PCsYCk5R17mJMiPimmP2uYxfODPhXgls87jKoQ7kJpgU1","sDiE3H3tuH0IcWyNgaW6QhOsedUyGKp0FT43YfS0ESAeQ","YeMMLNMGrKn53TlP7ZNUtDJ3TWZEkvT8hnFQ8ZMS6Vsc3","BN8x98wUXoQnQg0Yaun0fT4Yqr3YAIOxnCgHB5S0boMAR","BXI50WS630rpowIdXJutvUtWNF9NyrFHNToRZrAxN4pHx"]


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
    TWITTER_CONSUMER_KEY[PTR],
    TWITTER_CONSUMER_SECRET[PTR],
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
    if(PTR>TWITTER_CONSUMER_KEY.length){
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
      TWITTER_ACCESS_KEY[PTR],
      TWITTER_ACCESS_TOKEN_SECRET[PTR],
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
      WITH m, count(m) as AsLevel1
      MERGE (q:Date{date:date(),time:dateTime().hour})
      MERGE (m)<-[d:Data{accountAge: duration.inDays(date(m.createdAt),date()).days}]-(q)
      SET d.mutualCount=AsLevel1

      WITH q
      MATCH(m:Profile)
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
app.get('/load2neo4j/calculate',async function(req, res){
  await calculate()
  .then(()=>{
    res.send("Done calculations")
  })
  .catch(e=>{
    res.send(e)
  })
})

/********* Api to import 2 level followers to neo4j**************/
app.post('/load2neo4j/:level0', async  function (req, res) {
  screenName = req.params.level0
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




/********* Api to get All details of a specific profile**************/
app.get('/getData/:userName', async  function (req, res) {
  screenName = req.params.userName
  query = ` MATCH(n:Profile{screenName:'`+screenName+`'})<-[d:Data]-(q:Date{date:date()})
            where q.time >= dateTime().hour
            RETURN n, d
            LIMIT 1`
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw), { disableLosslessIntegers: true })
  session = driver.session()
      await session.run(query)
      .then(response=>{
        result = {
          "Profile": response.records[0]._fields[0].properties,
          "Cal": response.records[0]._fields[1].properties
        }
        res.send(result)
      })
      .catch(e=>{
        console.log(e)
        throw e;
      })
      .finally(()=>{
        session.close()
      })
})



app.get('',function(req, res){
  res.send("Welcome to the twitter apis")
})



app.listen(3000)
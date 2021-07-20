const fetch = require("node-fetch");
const neo4j = require('neo4j-driver')
var express = require('express')
var cors = require('cors');
const { response } = require("express");
const { json } = require("neo4j-driver-core");
const { async } = require("rxjs");
var app = express()
app.use(cors())


// level0 = "twitterdev" // userName leevl 0
var followers = [], followers2 = []
limit = 5 //followers.length

/****************** neo4j  Connection ******************/
// uri = "neo4j+s://c769464a.databases.neo4j.io:7687"
// user = "neo4j"
// psw = "tGHL7urcs5CYQzRGQgK1LJzlubN37-kYBdNHsijw8yw"


uri = "bolt://localhost:7687"
user = "neo4j"
psw = "123"

/****************** Api  Connection ******************/
url = "https://api.twitter.com/1.1/friends/ids.json?"
lookup = "https://api.twitter.com/1.1/users/lookup.json?"
keys = [" AAAAAAAAAAAAAAAAAAAAADikHQEAAAAAMVmCwRCbRKOeV%2BVQu4AQSOidM3g%3DXU6FR255mcDY7a7jNWV0AnmMJmFI5DhLmir7OPfQ4bjLB5ZFza"
," AAAAAAAAAAAAAAAAAAAAAIuW%2BgAAAAAA7zVY5FX%2F7vqg7hfIyVY0UbW512g%3DHBEXbPgg5Cmp9CPR1kNeWD0O8G5B2vrD69dU6c3DyPi1XYsINy"
," AAAAAAAAAAAAAAAAAAAAANxWAgEAAAAAuGb2DZiEP1q4Mq%2FOpaaw0%2BqGVko%3DoNRccf0w1kH97VGePFw1ofcSz0Am3H7LS5FythGfW9FnTOA5xG"
," AAAAAAAAAAAAAAAAAAAAAICMAwEAAAAA0QN4oTrn6sWcipRQFqtuUECXsI0%3DPpbsGFxF2qevFO5zEvvGk6mGHCASmW6fAMxEOp0w0g3Zkm1AFl"
," AAAAAAAAAAAAAAAAAAAAAIKMAwEAAAAAqUH%2Fepv7%2ByhpMQ3Bm5T199umSRI%3DVZQIqOXYcduCMcydP0lMh11TxMQ5hOCf9DPgoiuITr4jkqD2Of"
," AAAAAAAAAAAAAAAAAAAAACGkHQEAAAAAz05T1y7zyp4GiCPLeJm48LAAWEw%3DrUEWVFyom8NdvbWPmg2c7cR4ztTxZDDCQPYFSsGHQ7pjXnvKL7"]

keyPtr = 0
const method = "GET";
var options = {
  method: method,
  headers: {
    "Content-type": "application/json",
    Authorization: "Bearer"+keys[keyPtr]
  },
};

/********* Fucntion to switch keys used in the algo **************/
async function switchKey(){
  queryCounter++
  if(queryCounter>14){
    queryCounter = 0;
    console.log("switching APP AUTH")
    keyPtr++;
    if(keyPtr>=keys.length)
      keyPtr = 0
    options = {
      method: method,
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer"+keys[keyPtr]
      },
    };
  }
  
} 


/********* Fucntion that create 100 sized chunks of followers **************/
async function chunks(json,level){
  var temp = ""
  for(i =0;i<json.ids.length;i++){
    if(i%100==0){
      if(level == 1)
        followers.push(temp)
      else 
        followers2.push(temp)
      temp = ""
    }
    
    temp+=json.ids[i]
    temp+=","

  }
  
} 

/********* Fucntion that loads data to neo4j **************/
async  function load2neo4j(level0ID,json,level){
  
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
    session = driver.session()
    var query = "MATCH(n:Profile{id:"+level0ID+"})\n "
    for(i =0;i<json.length;i++){
      var createdate = new Date(json[i].created_at)
      query += "MERGE(m"+i+":Profile{id:"+json[i].id+",name:'"+json[i].name.replace(/'/g, " ")+"',screenName:'"+json[i].screen_name.replace("'", " ")+"', url:'"+json[i].url+"', listedCount:"+json[i].listed_count+", followerCount:"+json[i].followers_count+",followingCount:"+json[i].friends_count+",favouritesCount:"+json[i].favourites_count+",statusCount:"+json[i].statuses_count+"}) "
      query+= "\nset m"+i+" :Level"+level+", m"+i+".createdAt=date('"+createdate.getFullYear()+"-"+(createdate.getMonth()+1)+"-"+createdate.getDate()+"')"
      query += "\n MERGE(n)-[:Follows]->(m"+i+") \n"
    }
    query += "RETURN 1"
    session = driver.session()
    session.run(query)
    .then((ret)=>{
      console.log("level"+level+" 100 nodes loaded")
     return "level"+level+" 100 nodes loaded"
    })
    .catch(error=>{
      console.log(error)
    })
    return 1

  
}

/********* Fucntion that uses twitter api to look up the data for 100 accounts **************/
async function lookup100(level0ID,usersids,level){
  fetch(
    lookup+"user_id="+usersids,
    options
  )
  .then((response)=>response.json()) 
  .then(json => {
    /************ sending Level  to neo4j************/ 
     load2neo4j(level0ID,json,level)
    .then(response=>{
      return response
    })
    
  })
  .catch((error) => {
    console.log(error)
    return error
  });
}


/********* Api to import 2 level followers to neo4j**************/
app.get('/:level0', function (req, res) {
  // console.log("api called")
  queryCounter = 0
  level0 = req.params.level0
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
   /************ Looking up for Level 0 ************/ 
  switchKey()
  fetch(
    lookup+"screen_name="+level0,
    options
  )
  .then((response)=>response.json())
  .then(json => {
    if(json.hasOwnProperty('errors')){
      console.log(json.errors[0].message)
    }
    else if (json.hasOwnProperty('error')&& json.error == "Not authorized."){
      console.log(json)
      // res.send (level2.error)
    }
    else{
    /************ sending Level 0 to neo4j************/ 
    level0ID = json[0].id
    var createdate = new Date(json[0].created_at)
    var query = "MERGE(n:Profile{id:"+json[0].id+",name:'"+json[0].name+"',screenName:'"+json[0].screen_name+"', url:'"+json[0].url+"', listedCount:"+json[0].listed_count+", followerCount:"+json[0].followers_count+",followingCount:"+json[0].friends_count+",favouritesCount:"+json[0].favourites_count+",statusCount:"+json[0].statuses_count+"})"
    query+= "\nset n :Level0, n.createdAt=date('"+createdate.getFullYear()+"-"+(createdate.getMonth()+1)+"-"+createdate.getDate()+"')"
    session = driver.session()
    session.run(query)
    .then(r=>{
      console.log("Added level0 to neo4j")

      /************ fetching level 1 Profiles ************/ 
      switchKey()
      fetch(
        url+"screen_name="+level0,
        options
      )
        .then((response) => response.json())
        .then(level1 => {
              if(level1.hasOwnProperty('errors')){
                console.log(level1.errors[0].message)
                // res.send(level1.errors[0].message)
              }
              else if (level1.hasOwnProperty('error')&& level1.error == "Not authorized."){
                console.log(level2)
                // res.send (level2.error)
              }
                  
              else{
                  
                    // making chunks of 100 level 1 ids for twitter look up api
                    chunks(level1,1)
                    .then(t=>{
                        console.log(followers.length+" Chunks of level1 followers")
                    /************ looking up for  Level 1 ************/ 
                      for(k =1;k<=followers.length;k++){
                        switchKey()
                        lookup100(level0ID,followers[k],1)
                      }
                    
                    }) 
                    /************ fetching level 2 Profiles ************/ 
                    console.log("starting working on level 2 ")
                    for(l=0;l<level1.ids.length;l++){
                      switchKey()
                      fetch(
                        url+"screen_name="+level1[l],
                        options
                      )
                        .then((response) => response.json())
                        .then(level2 => {
                          
                          
                          if(level2.hasOwnProperty('errors')){ //Rate limit exceeded
                            console.log(level2.errors[0].message)
                            // res.send(level2.errors[0].message)
                           
                          }
                          else if (level2.hasOwnProperty('error')&& level2.error == "Not authorized."){
                            console.log(level2)
                            // res.send(level2.error)
                          }
                            
                              
                          // else{
                          //     temp = ""
                          //     res.send("starting to work on level 2")
                          //                                         // making chunks of 100 level 1 ids for twitter look up api
                          //       chunks(level2,2)
                          //       .then(t=>{
                          //           console.log(followers2.length+" Chunks of level2 followers")
                          //       /************ looking up for  Level 2 ************/ 
                          //         for(k =1;k<=followers2.length;k++){
                                        // 
                                        // switchKey()
                          //           lookup100(level1[l],followers[k],2)
                          //           .then(response =>{
                          //             
                          //           })
                                    
                          //         }
                                
                                // }) 
                            // }     
                                          
                            
                              
                        }) 
                        .catch((error) => {
                          res.send(error)
                        });
                      }// end of for loop for level 2
                              
              }
          }) 
        .catch((error) => {
          res.send(error)
        });
      
    })
    .catch((e)=>{res.send(e)
    console.log(e)})
    
    }
  })

  
})

app.listen(3000)
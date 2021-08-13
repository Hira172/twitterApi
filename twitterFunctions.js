const neo4j = require('neo4j-driver')
const { promisify } = require('util')
const fs = require('fs')
const {uri, user, psw} = require('./neo4j_config.json')
const neo4jFunctions = require('./neo4jFunctions')
twitterAuth  = require ('./twitterAuth.js')
const config = require('./config.json')



/********* Fucntion takes username and gets the followers for that user**************/
 async function getFollowers (username,level) {
    var cursor  = -1
    twitterAuth.switchKeys()
    const get = promisify(oauth.get.bind(oauth))
    while(cursor != 0){
    console.log("Api called in cursor "+username)
    await get(
        url+`screen_name=${username} &count=200 &cursor=`+cursor,
        config[global.PTR].TWITTER_ACCESS_KEY,
        config[global.PTR].TWITTER_ACCESS_TOKEN_SECRET,
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
        global.level1.push(json[i].screen_name)
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
            fs.appendFile('./log.txt',"level "+level+": "+response.users.length+" nodes loaded for user: "+username , err => {
                if (err) {
                    console.log('Error writing file: ', err)
                    res.send('Error writing file: ', err)
                }
              })
        console.log("level "+level+": "+response.users.length+" nodes loaded for user: "+username)
        })
        .catch(e=>{
            fs.appendFile('./log.txt',"\n "+ e , err => {
                if (err) {
                    console.log('Error writing file: ', err)
                    res.send('Error writing file: ', err)
                }
              })
        throw e;
        })
        .finally(()=>{
        session.close()
        })
        
    })
    .catch(e=>{
        fs.appendFile('./log.txt',"\n "+ e , err => {
            if (err) {
                console.log('Error writing file: ', err)
                res.send('Error writing file: ', err)
            }
          })
        throw e;
    })
    }

}

/********* Fucntion takes username and gets all the information for that user**************/
 async function  getInfo (username) {

    twitterAuth.switchKeys()
    const get = promisify(oauth.get.bind(oauth))
    await get(
    lookup+`screen_name=${username} `,
    config[global.PTR].TWITTER_ACCESS_KEY,
    config[global.PTR].TWITTER_ACCESS_TOKEN_SECRET,
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
            fs.appendFile('./log.txt',"\n Level 0 added to neo4j", err => {
                if (err) {
                    console.log('Error writing file: ', err)
                    res.send('Error writing file: ', err)
                }
              })
        console.log("Level 0 added to Neo4j")
        })
        .catch(e=>{
            fs.appendFile('./log.txt',"\n "+ e , err => {
                if (err) {
                    console.log('Error writing file: ', err)
                    res.send('Error writing file: ', err)
                }
              })
        throw e;
        })
        .finally(()=>{
        session.close()
        })
    
    
    })
    .catch(e=>{
        fs.appendFile('./log.txt',"\n "+ e , err => {
            if (err) {
                console.log('Error writing file: ', err)
                res.send('Error writing file: ', err)
            }
          })
    throw e;
    })
}

module.exports = {
    checkExistance : async function  (username) {
        query = `MATCH(n:Level0{screenName:'`+username+`'})
                WHERE n.createdAt > date()
                RETURN 1`
        const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
        session = driver.session()
            await session.run(query)
            .then(response=>{
                if ( response.records.length > 0)
                    throw "The data for the user have already been loaded"
                })
            .catch(e=>{
                fs.appendFile('./log.txt',"\n "+ e , err => {
                    if (err) {
                        console.log('Error writing file: ', err)
                        res.send('Error writing file: ', err)
                    }
                  })
                throw e;
            })
            .finally(()=>{
                session.close()
            })
    },
    
    
    /********* Main algorithm ***********/
    //  'muazam172'
    get2LevelFollowers: async function (username){
        await getInfo(username)
        .then(async ()=>{
            console.log("starting to work at Level 1")
            await getFollowers (username,level=1) 
            .then(async ()=>{
                fs.appendFile('./log.txt',"\n Starting level 2" , err => {
                    if (err) {
                        console.log('Error writing file: ', err)
                        res.send('Error writing file: ', err)
                    }
                  })
            console.log("done with Level1 and started working on level2")
            for(i =0;i<global.level1.length;i++){
                await getFollowers (level1[i],level=2)
                .catch(e=>{
                    fs.appendFile('./log.txt',"\n "+ e , err => {
                        if (err) {
                            console.log('Error writing file: ', err)
                            res.send('Error writing file: ', err)
                        }
                      })
                console.log(e)
                throw e;
                })
            } 
            })
            .catch(e=>{
                fs.appendFile('./log.txt',"\n "+ e , err => {
                    if (err) {
                        console.log('Error writing file: ', err)
                        res.send('Error writing file: ', err)
                    }
                  })
            console.log(e)
            throw e;
            })
        })
        .then(async ()=>{
            await neo4jFunctions.calculate()
            .catch(e=>{
                fs.appendFile('./log.txt',"\n "+ e , err => {
                    if (err) {
                        console.log('Error writing file: ', err)
                        res.send('Error writing file: ', err)
                    }
                  })
            console.log(e)
            throw e;
            })
        })
        .then(()=>{
            console.log("Done")
        })
        .catch(e=>{
            fs.appendFile('./log.txt',"\n "+ e , err => {
                if (err) {
                    console.log('Error writing file: ', err)
                    res.send('Error writing file: ', err)
                }
              })
            console.log(e)
            throw e;
        })
        
    }
}
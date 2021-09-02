const neo4j = require('neo4j-driver')
const { promisify } = require('util')
const fs = require('fs')
const {uri, user, psw} = require('./neo4j_config.json')
const neo4jFunctions = require('./neo4jFunctions.js')
twitterAuth  = require ('./twitterAuth.js')
const config = require('./config2.json')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function writeInFile( data){
    fs.appendFile('./log.txt',"\n"+data, err => {
        if (err) {
            console.log('Error writing file: ', err)
            res.send('Error writing file: ', err)
        }
    })
}


/********* Fucntion takes username and gets the followers for that user**************/
 async function getFollowers (username,level) {
    var cursor  = -1
    // twitterAuth.switchKeys()
    const get = promisify(oauth.get.bind(oauth))
    while(cursor != 0){
        diff = 0
        tempTime = new Date()
    console.log("Api called in cursor "+username + " at "+ new Date)
    await get(
        url+`screen_name=${username} &count=200 &cursor=`+cursor,
        config[global.PTR].TWITTER_ACCESS_KEY,
        config[global.PTR].TWITTER_ACCESS_TOKEN_SECRET,
    )
    .then(body=>JSON.parse(body))
    .then(async response=>{

        console.log("Got data from Api sucessfully " +" at "+ new Date)
        cursor = response.next_cursor
        count++;
        json = response.users
        
        // send data to neo4j
        const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
        session = driver.session()
        var query = "MATCH(n:Profile{screenName:'"+username+"'})\n "
        for(i =0;i<json.length;i++){
            // global.level1.push(json[i].screen_name)
            var createdate = new Date(json[i].created_at)
            query += "MERGE(m"+i+":Profile{screenName:'"+json[i].screen_name.replace("'", " ")+"'}) "
            query+= "\nON CREATE SET m"+i+".storedOn = date(),   m"+i+".createdAt=date('"+createdate.getFullYear()+"-"+(createdate.getMonth()+1)+"-"+createdate.getDate()+"')"
            query+= "\nset m"+i+" :Level"+level+", m"+i+".id="+json[i].id+", m"+i+".url='"+json[i].url+"', m"+i+".name='"+json[i].name.replace(/'/g, " ")+"', m"+i+".profile_img = '"+json[0].profile_image_url+"', m"+i+".listedCount="+json[i].listed_count+",  m"+i+".followerCount="+json[i].followers_count+", m"+i+".followingCount="+json[i].friends_count+", m"+i+".favouritesCount="+json[i].favourites_count+", m"+i+".statusCount="+json[i].statuses_count
            query += "\n MERGE(n)-[:Follows]->(m"+i+") \n"
        }
        query += "RETURN 1"
        console.log("Sending data to the db")
        session = driver.session()
        flag = 0
        while(flag == 0){
            await session.run(query)
            .then( async ()=>{
                tempTime2 = new Date()
                diff = tempTime2 - tempTime 
                writeInFile("level "+level+": "+response.users.length+" nodes loaded for user: "+username)
                console.log("level "+level+": "+response.users.length+" nodes loaded for user: "+username)
                flag = 1
                
                if (level == 1){
                    for(i =0;i<response.users.length;i++){
                        writeInFile("New call for level2")
                        await getFollowers (response.users[i].screen_name,2)
                        .catch(e=>{
                            writeInFile(JSON.stringify(e));
                            console.log(e);
                        })
                    } 
                }
            })
            .catch(e=>{
                writeInFile(JSON.stringify(e));
            })
            .finally(()=>{
            session.close()
            })
        }
        diff = 61000-diff
        if(diff>0){
            await sleep(diff)
        }
        // time3 =  new Date
        // console.log("time:", JSON.stringify(tempTime - time3), "   becuse :" ,JSON.stringify(diff))
        
    })
    .catch(e=>{
        console.log(e)
        writeInFile(JSON.stringify(e));
    })
    // console.log("before end of cursor")
    }//end of cursor loop

}

/********* Fucntion takes username and gets all the information for that user**************/
 async function  getInfo (username) {

    // twitterAuth.switchKeys()
    const get = promisify(oauth.get.bind(oauth))
    await get(
    lookup+`screen_name=${username} `,
    config[global.PTR].TWITTER_ACCESS_KEY,
    config[global.PTR].TWITTER_ACCESS_TOKEN_SECRET,
    )
    .then(body=>JSON.parse(body))
    .then(async json=>{
        count++;
        const driver = neo4j.driver(uri, neo4j.auth.basic(user, psw))
        var createdate = new Date(json[0].created_at)
        var query = "MERGE(n:Profile{screenName:'"+json[0].screen_name+"'})"
        query+= "\nON CREATE SET n.storedOn = date(),   n.createdAt=date('"+createdate.getFullYear()+"-"+(createdate.getMonth()+1)+"-"+createdate.getDate()+"')"
        query+= "\nset n :Level0, n.id="+json[0].id+",n.name='"+json[0].name+"', n.url='"+json[0].url+"', n.profile_img = '"+json[0].profile_image_url+"', n.listedCount="+json[0].listed_count+", n.followerCount="+json[0].followers_count+",n.followingCount="+json[0].friends_count+",n.favouritesCount="+json[0].favourites_count+",n.statusCount="+json[0].statuses_count
        session = driver.session()
        await session.run(query)
        .then(response=>{
            writeInFile("Level 0 added to Neo4j at "+ JSON.stringify(new Date));
            console.log("Level 0 added to Neo4j")
        })
        .catch(e=>{
            writeInFile(JSON.stringify(e));
        })
        .finally(()=>{
        session.close()
        })
    
    
    })
    .catch(e=>{
        writeInFile(JSON.stringify(e));
        console.log(e)
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
                writeInFile(JSON.stringify(e));
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
            .catch(e=>{
                writeInFile(JSON.stringify(e));
                console.log(e)
            })
        })
        .then(async ()=>{
            await neo4jFunctions.calculate()
            .catch(e=>{
                writeInFile(JSON.stringify(e));
            console.log(e)
            })
        })
        .then(()=>{
            console.log("Done")
        })
        .catch(e=>{
            writeInFile(JSON.stringify(e));
            console.log(e);
        })
        
    }
}
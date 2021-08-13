
const neo4j = require('neo4j-driver')
twitterAuth  = require ('./twitterAuth.js')
const {uri, user, psw} = require('./neo4j_config.json')

/********* Function that calculate all the requirements for process 3 **************/
module.exports = {
    calculate: async function (){
    console.log("starting calculations")
    try{
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
            SET d.reputation = d.mutualCount*m.listedCount, d.hidden = toFloat(d.reputation)/toFloat(m.followerCount), d.AA_Viral = toFloat(m.followerCount)/toFloat(d.accountAge), d.AA_Adoption = toFloat(d.mutualCount)/toFloat(d.accountAge), d.AA_Hotness = toFloat(d.reputation) / toFloat(d.accountAge), d.AA_Gem = toFloat(d.hidden) / toFloat(d.accountAge), d.DA_Gem = toFloat(d.hidden) / toFloat(d.discoveredAge),d.DA_Viral = toFloat(m.followerCount) / toFloat(d.discoveredAge), d.DA_Adoption = toFloat(d.mutualCount) / toFloat(d.discoveredAge), d.DA_Hotness = toFloat(d.reputation) / toFloat(d.discoveredAge), d.TS_Viral = d.AA_Viral + d.DA_Viral,d.TS_Adoption = d.AA_Adoption + d.DA_Adoption, d.TS_Hotness = d.AA_Hotness + d.DA_Hotness, d.TS_Gem = d.AA_Gem + d.DA_Gem, d.TS_Value = d.TS_Hotness + d.TS_Gem, d.TS_Score = d.TS_Viral + d.TS_Adoption + d.TS_Hotness + d.TS_Gem
        `
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
    catch(e){
        console.log(e)
        throw e
    }

    

    } 
}
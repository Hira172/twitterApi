const OAuth = require('oauth')
const config = require('./config.json')

/********* fucntion that is Creating the oauthenication part  **************/
module.exports = {
    getOauth : async function (PTR){
    oauth = new OAuth.OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      config[PTR].TWITTER_CONSUMER_KEY,
      config[PTR].TWITTER_CONSUMER_SECRET,
      '1.0A', null, 'HMAC-SHA1'
    )
    return oauth
  },
   /********* Fucntion to switch keys used in the authetication **************/
   switchKeys: async function (){
    if(global.count>14){
      console.log("switched "+global.count)
      global.count = 0
      PTR++
      oauth  = twitterAuth.getOauth()
      if(PTR>config.length){
        PTR = 0
      }
    }
  }
}

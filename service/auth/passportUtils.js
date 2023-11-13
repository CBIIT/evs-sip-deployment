const { createOAuthStrategy } = require('./passportStrategies.js');
const cedcd_settings = require('../../config/cedcd_settings.js');
// import { Issuer, Strategy } from "openid-client";
//const usercontroller = require('../ ../service/user/usercontroller');
const usercontroller = require('../user/usercontroller.js');

const openidClient = require('openid-client');


// function getAccountType({ preferred_username }) {
//   const loginDomain = (preferred_username || "").split("@").pop();
//   return loginDomain.endsWith("login.gov") ? "Login.gov" : "NIH";
// }

function createUserSerializer() {
  return (user, done) => done(null, user);
}

function createUserDeserializer() {
  return async(user, done) => {
    // const accountType = getAccountType({ preferred_username });
    // const user = await userManager.getUserForLogin(email, accountType);

    let userid = user.userid;
    debugger;

    let test = await usercontroller.getUserbyNciUserName(userid);
    console.log(test)

    // if(user){
    //   const expires = new Date().getTime() + cedcd_settings.maxSessionAge * 1;
    //   user.expires = expires;
    // } 
    done(null, user || {});
   
  };
}

//This is where we would retrieve user information from the database
// function createUserDeserializer() {
//   return (user, done) => done(null, user);
// }

// async function createDefaultAuthStrategy(config = config) {   
//   return await createOAuthStrategy({
//     name: "default",
//     clientId: config.oauth2_client_id,
//     clientSecret: config.oauth2_secret,
//     baseUrl: config.oauth2_base_url,
//     redirectUris: [config.oauth2_redirect_uri],
//     params: {
//       scope: "openid profile email",
//       prompt: "login",
//     },
//   });
// }

async function createOAuth2Strategy(env = process.env) {
  const { Client } = await openidClient.Issuer.discover(env.OAUTH2_BASE_URL);

  const client = new Client({
    client_id: env.OAUTH2_CLIENT_ID,
    client_secret: env.OAUTH2_CLIENT_SECRET,
    redirect_uris: [env.OAUTH2_REDIRECT_URI],
    response_types: ["code"],
  });

  const params = {
    scope: "openid profile email",
    prompt: "login",
  }

  return new openidClient.Strategy({ client, params }, async (tokenSet, done) => {
    const user = await client.userinfo(tokenSet);
    done(null, user);
  });
}


// module.exports = {
//   getAccountType,
//   createUserSerializer,
//   createUserDeserializer,
//   createDefaultAuthStrategy,
// };


module.exports = {
  createUserSerializer,
  createUserDeserializer,
  createOAuth2Strategy
};

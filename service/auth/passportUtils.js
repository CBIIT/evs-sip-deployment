const { createOAuthStrategy } = require("./passportStrategies.js");
const cedcd_settings = require("../../config/cedcd_settings.js");
// import { Issuer, Strategy } from "openid-client";
//const usercontroller = require('../ ../service/user/usercontroller');
const usercontroller = require("../user/usercontroller.js");

const openidClient = require("openid-client");

// function getAccountType({ preferred_username }) {
//   const loginDomain = (preferred_username || "").split("@").pop();
//   return loginDomain.endsWith("login.gov") ? "Login.gov" : "NIH";
// }

function createUserSerializer() {
  return (user, done) => done(null, user);
}

function createUserDeserializer() {
  return async (nciUser, done) => {
    const userData = await usercontroller.getUserbyNciUserName(nciUser.userid);

    let user = {};

    if (userData.user_total > 0) {
      const userResult = userData.results[0];
      // const expires = new Date().getTime() + cedcd_settings.maxSessionAge * 1;

      user = {
        userid: userResult.nci_username,
        firstName: userResult.first_name,
        role: userResult.role,
        project: userResult.projects,
        active: userResult.active,
        email: userResult.email
        // expires: expires,
      };
    }

    done(null, user || {});
  };
}

//This is where we would retrieve user information from the database
// function createUserDeserializer() {
//   return (user, done) => done(null, user);
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
  };

  return new openidClient.Strategy(
    { client, params },
    async (tokenSet, done) => {
      const user = await client.userinfo(tokenSet);
      done(null, user);
    }
  );
}

module.exports = {
  createUserSerializer,
  createUserDeserializer,
  createOAuth2Strategy,
};

// const express = require("express");
const Router = require('express-promise-router');
const passport = require('passport');
const nconf = require('../config');
// import cedcd_settings from "../config/cedcd_settings.js";

// nconf.get('neo4j-local')

// const router = express.Router();
const router = Router();

router.get("/login", (request, response, next) => {
    const destination = request.query.destination || "/evssip";
    passport.authenticate("default", {
      failureRedirect: "/evssip",
      state: destination,
    })(request, response, next);
  },
  async (request, response) => {
    request.session.expires = request.session.cookie.expires;
    const destination = request.query.state || "/evssip";
    response.redirect(destination);
  }
);

router.get("/logout", (request, response) => {
  request.logout(() => response.redirect("/evssip"));
});

router.get("/session", (request, response) => {
  const { session } = request;
  if (session.passport?.user) {
    response.json({
      authenticated: true,
      expires: session.expires,
      user: request.user,
    });
  } else {
    response.json({ authenticated: false });
  }
});

router.post("/session", (request, response) => {
  const { session } = request;
  if (session.passport?.user) {
    session.touch();
    session.expires = session.cookie.expires;
    response.json({
      authenticated: true,
      expires: session.expires,
      user: request.user,
    });
  } else {
    response.json({ authenticated: false });
  }
});

router.get("/user-session", (request, response) => {
  const { session } = request;

  if (session.passport?.user) {
    let user = { ...request?.user };
    if (user.expires) {
      user.expires = new Date(session.expires).getTime();
    }

    response.json({
      authenticated: true,
      expires: user.expires ? user.expires : session.expires,
      user: user || null,
    });
  } else {
    response.json(null);
  }
});

// router.get("/update-session", async (request, response) => {
//   if (request?.user == undefined || request?.user == null) {
//     console.log(" undefined user ");
//     response.json(null);
//   } else {
//     const { userManager } = request.app.locals;
//     const user = await userManager.updateUserSession(request.user);
//     if (user) {
//       user.expires =
//         new Date().getTime() + parseInt(cedcd_settings.maxSessionAge);
//     }

//     const { session } = request;
//     session.touch();
//     session.expires = user.expires;
//     request.user = { ...user };
//     response.json({
//       authenticated: true,
//       expires: session.expires,
//       user: request?.user,
//     });
//   }
// });

// export async function getDestLink(request) {
//   let destination = request.query.state || "/";

//   if (!request.user || !request.user.email) {
//     destination = "/unauthorized";
//   } else {
//     const loginDomain = (request.user.preferred_username || "")
//       .split("@")
//       .pop();
//     const accountType = loginDomain.endsWith("login.gov") ? "Login.gov" : "NIH";
//     const { userManager } = request.app.locals;
//     let userobj = await userManager.getUserForLogin(
//       request.user.email,
//       accountType
//     );
//     if (userobj && userobj.role) {
//       if (/SystemAdmin/.test(userobj.role)) {
//         destination = "/admin/managecohort";
//       } else if (/CohortAdmin/.test(userobj.role)) {
//         if (userobj.cohorts.length === 1) {
//           destination = `/cohort/questionnaire/${userobj.cohorts[0].id}`;
//         } else {
//           destination = `/cohort/questionnaire`;
//         }
//       }
//     } else {
//       destination = "/unauthorized";
//     }
//   }
//   return destination;
// }

module.exports = router;


const logger = require("../components/logger");
const usercontroller = require( '../service/user/usercontroller');

const timeoutMinutes = 150;
const maxSessionAge = timeoutMinutes * 60 * 1000; // convert minutes to ms
const logoutUrl= 'https://authdev.nih.gov/siteminderagent/smlogoutredirector.asp';

module.exports = {
    login,
    logout,
    getUserSession,
    updateSession,
}

//const baseURL = "http://localhost:3001/evssip"
async function login(request, response) {
    const { headers, session, app, params, query } = request;
  
    logger.debug(headers)
    logger.info("session")
    logger.info(session)

    let {
        //user_auth_type: userAuthType,
       // user_email: userEmail,
        sm_user: smUser,
    } = headers;
    if (smUser) {
        let match = smUser.match(/CN=([^,]+)/i);
        if (match) smUser = match[1];
    }
    
    const expires = new Date().getTime() + maxSessionAge;

    if (query.refresh && session.user) {
        session.user.refresh = query.refresh;
        return response.json(true);
    }

    try {
        let userName, userRole, userType;

        if (!smUser) {
            userName = 'admin';
            let user = await usercontroller.getUserbyNciUserName('zhangchao');
            console.log(user)
            session.user = {
                        id: 0,
                        name: 'zhangchao',
                firstName: user.first_name,
                role: user.role,
                project:user.projects,
                active: user.active,
                email: user.email,
                        expires,
                        // headers,
            };
        } else {
   
            userName = smUser;
            let user = await usercontroller.getUserbyNciUserName(smUser);
            session.user = {
                id: 1,
                name: userName,
                firstName: user.first_name,
                role: user.role,
                project:user.projects,
                active: user.active,
                email: user.email,
                expires,
                // headers,
            };
        }
        logger.info("login session:----")
        logger.debug(session.user)

      
        let redirectUrl = `/evssip/mainboard`;
        //let redirectUrl =  baseURL + '/mainboard';

        // if (!user || !session.user.active) {
        //     redirectUrl = '/unauthorized';
        // } else if (/admin/.test(session.user.role)) {
        //     redirectUrl = '/admin/managecohort';
        // } else if (/user/.test(session.user.role)) {
        //     if (session.user.project.length === 1) {
        //         redirectUrl = `/graph/${session.user.project[0].id}`;
        //     } else {
        //         redirectUrl = `/all/p`;
        //     }
        // }

        response.status(301).redirect(redirectUrl);

    } catch (e) {
        console.error('authentication error', e);
        request.session.destroy(error => {
            response.status(401).json('Unauthorized').end();
        });
    }
}

async function updateSession(request, response) {
    if (!request.session || !request.session.user) {
        response.json(null);
    }

    const { mysql } = request.app.locals;
    const user = request.session.user;
    const userId = user.id;

    const cohortAcronyms = await mysql.query(
        `SELECT DISTINCT cohort_acronym as acronym
        FROM cohort_user_mapping 
        WHERE user_id = ? AND active = 'Y'
        ORDER BY acronym ASC`,
        [userId]
    );

    let projects = [];

    for (const { acronym } of cohortAcronyms) {
        const [editableCohorts] = await mysql.query(
            `call select_editable_cohort_by_acronym(?)`,
            [acronym]
        );
        projects.push(...editableCohorts);
    }

    user.project = projects;
    user.expires = new Date().getTime() + maxSessionAge;
    request.session.user = { ...user };
    response.json(user || null);
}
// note: both federated NIH Auth use siteminder under the hood to authenticate users
// so we can use the global siteminder agent logout route to invalidate our current session
function logout(request, response) {

     request.session.destroy(error => {
         response.json(logoutUrl || '/');
     });  
}

function getUserSession(request, response) {
    logger.info("request.session")
    logger.info(request.session)
    response.json(request.session.user || null);
}

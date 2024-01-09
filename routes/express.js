import express from 'express';
import session from 'express-session';
import compression from 'compression';
import path from 'path';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import logger from '../components/logger.js';
import config from './index.js';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import passport from 'passport';

import neo4jSessionCleanup from '../middlewares/neo4jSessionCleanup.js';
// const { login, logout, getUserSession, updateSession } = require('./authentication');

import  {
  createUserSerializer,
  createUserDeserializer,
  createOAuth2Strategy,
} from '../service/auth/passportUtils.js';

import apiRoutes from './apiroutes.js';
import guiRoutes from './guiroutes.js';
import authRoutes from './authroutes.js';

// const indexRouter = require('./routes/index')
const configureRoutes = async (app) =>  {
  // if (config.env !== 'prod') { 
  //   app.use(logger('dev')) 
  // };
  if (config.env !== 'dev') {
    app.set('trust proxy', 1);
    app.use(session({
      secret: 'keyboard cat', 
      name: 'cookieName',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false, httpOnly: true, maxAge: 600000 }
    }))
  } else {
    app.use(session({
      secret: 'keyboard cat',
      cookie: {}
    }))
  };
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  // app.use(express.static(path.resolve(config.root, 'build')));
  //  app.use(require('./session'));
  app.use(compression());


var swaggerDefinition = {
  info: {
    title: "EVS-SIP Restful API",
    version: "1.0.1",
    description: "EVS-SIP Restful API",
  },
  servers: ["http://localhost:3000"],
  basePath: "/api",
  schemes: [
      'http',
      'https'
  ],
};


/**
 * @swagger
 * definition:
 *   Node:
 *     type: object
 *     properties:
 *       model:
 *         type: string
 *       node_name:
 *         type: string
 */

/**
 * @swagger
 * /api/datamodel/source/{model}:
 *   get:
 *     description: Find all nodes in requested model
 *     summary: Find all nodes in requested model
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: A list of nodes
 */



// options for the swagger docs
const options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: ["*.js"],
};

// initialize swagger-jsdoc
const swaggerSpec = swaggerJsDoc(options);

// serve swagger
// api.get("/swagger.json", function (req, res) {
//   res.setHeader("Content-Type", "application/json");
//   res.send(swaggerSpec);
// });

app.use("/api/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


  // app.use('/session-test', function (req, res, next) {
  //   const { session } = req;
  //   res.status(200).json(session);
  // });

  // app.use('/session-view', function (req, res, next) {
  //   var sess = req.session;
  //   if (sess.views) {
  //     sess.views++;
  //     res.setHeader('Content-Type', 'text/html');
  //     res.write('<p>views: ' + sess.views + '</p>');
  //     res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>');
  //     res.end();
  //   } else {
  //     sess.views = 1;
  //     res.end('welcome to the session demo. refresh!');
  //   }
  // });

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    //res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
    //res.header('Access-Control-Allow-Origin', 'https://*.nih.gov');
    //res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (next) {
      next();
    }
  });



  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  // app.use(express.static(path.resolve(config.root, 'build')));
  app.use(compression());
  app.use(neo4jSessionCleanup);


  // const connection = mysql.getConnectionPool(config.mysql);
	// const logger = createLogger("cedcd", config.log_level ? config.log_level : "debug");
	// app.locals.logger = logger;
	
	// app.locals.connection = connection;
	// app.locals.mysql = {
	// 	connection,
	// 	query: promisify(connection.query).bind(connection),
	// 	upsert: mysql.upsert,
	// }
	// const userManager = new UserManager(app.locals.mysql);

	// app.locals.userManager = userManager;

  // configure passport
	logger.debug("Configuring passport");
	passport.serializeUser(createUserSerializer());
	passport.deserializeUser(createUserDeserializer());
	passport.use("default", await createOAuth2Strategy());

	// configure session
	logger.debug("Configuring session");
	// app.use(session);
	app.use(passport.initialize());
	app.use(passport.session());


  // app.use('/session-test', function (req, res, next) {
  //   const { session } = req;
  //   res.status(200).json(session);
  // });

  // healthcheck route
  app.get('/api/ping', (req, res) => {
    res.status(200).json('true');
  });

  app.get('/', (req, res) => {
    res.status(200).json('hello');
  });

  //Routers
  //app.use('/api', indexRouter)
  app.use('/api', apiRoutes);
  app.use('/service/search', guiRoutes);
  app.use('/auth', authRoutes);
  // app.use('/dashboard/login', login);
  // app.use('/dashboard/logout', logout);
  // app.use('/service/user-session', getUserSession);
  // app.use('/service/update-session', updateSession);



  // app.get('*', (req, res) => {
  //   res.sendFile('build/index.html', { root: config.root });
  // });

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    next(createError(404));
  });

  // TODO: Add your own error handler here.
  if (config.env === 'prod') {
    // Do not send stack trace of error message when in production
    app.use((err, req, res, next) => {
      res.status(err.status || 500);
      res.send('Error occurred while handling the request.');
    });
  } else {
   // app.use(logger('dev'));
    // Log stack trace of error message while in development
    app.use((err, req, res, next) => {
      res.status(err.status || 500);
      console.log(err);
      res.send(err.message);
    });
  }
}

export default configureRoutes;
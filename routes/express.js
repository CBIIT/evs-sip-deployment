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
import createSession from '../components/session.js';

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

const configureRoutes = async (app) =>  {

  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(compression());

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

  // configure passport
	logger.debug("Configuring passport");
	passport.serializeUser(createUserSerializer());
	passport.deserializeUser(createUserDeserializer());
	passport.use("default", await createOAuth2Strategy());

	// configure session
	logger.debug("Configuring session");
  app.use(createSession());
	app.use(passport.initialize());
	app.use(passport.session());

  // healthcheck route
  app.get('/', (req, res) => {
    res.status(200).json('true');
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
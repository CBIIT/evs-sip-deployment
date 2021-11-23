// import { neo4jSessionCleanup } from '../middlewares/neo4jSessionCleanup'
const nconf = require('../config');
const neo4jSessionCleanup = require("../middlewares/neo4jSessionCleanup");
const express = require('express');
const session = require('express-session');
const compression = require('compression');
const path = require('path');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const logger = require('../components/logger');
const config = require('./index');
const { login, logout, getUserSession, updateSession } = require('./authentication');


// const indexRouter = require('./routes/index')
module.exports = function (app) {
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
  app.use(express.static(path.resolve(config.root, 'build')));
  //  app.use(require('./session'));
  app.use(compression());

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
  app.use(express.static(path.resolve(config.root, 'build')));
  app.use(compression());
  app.use(neo4jSessionCleanup);


  // app.use('/session-test', function (req, res, next) {
  //   const { session } = req;
  //   res.status(200).json(session);
  // });

  // healthcheck route
  app.get('/api/ping', (req, res) => {
    res.status(200).json('true');
  });

  //Routers
  //app.use('/api', indexRouter)
  app.use('/api', require('../service/api'));
  app.use('/service/search', require('../service/search'));
  app.use('/dashboard/login', login);
  app.use('/dashboard/logout', logout);
  app.use('/service/user-session', getUserSession);
  app.use('/service/update-session', updateSession);



  app.get('*', (req, res) => {
    res.sendFile('build/index.html', { root: config.root });
  });

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

'use strict';

require('dotenv').config();

const nconf = require('nconf');

nconf.env(['PORT', 'NODE_ENV'])
  .argv({
    'e': {
      alias: 'NODE_ENV',
      describe: 'Set production or development mode.',
      demand: false,
      default: 'development'
    },
    'p': {
      alias: 'PORT',
      describe: 'Port to run on.',
      demand: false,
      default: 3000
    },
    'n': {
      alias: "neo4j",
      describe: "Use local or remote neo4j instance",
      demand: false,
      default: "local"
    }
  })
  .defaults({
    'neo4jUSERNAME': process.env.NEO4J_DATABASE_USERNAME,
    'neo4jPASSWORD' : process.env.NEO4J_DATABASE_PASSWORD,
    'neo4j': 'local',
    'neo4j-local': process.env.NEO4J_DATABASE_URL || 'bolt://localhost:7687',
    'base_url': 'http://localhost:3000',
    'api_path': '/api/v0',

    'oauth2_client_id': process.env.OAUTH2_CLIENT_ID, 
    'oauth2_secret': process.env.OAUTH2_CLIENT_SECRET,
    'oauth2_base_url': process.env.OAUTH2_BASE_URL,
    'oauth2_redirect_uri': process.env.OAUTH2_REDIRECT_URI,
   
    'sessionTimeoutMinutes':60,
    'maxSessionAge':process.env.SESSION_MAX_AGE||360000, // convert minutes to ms
  });

  module.exports =  nconf ;

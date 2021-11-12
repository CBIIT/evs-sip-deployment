"use strict";

// neo4j cypher helper module
const nconf = require('../config');
const _ = require('lodash');
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(nconf.get('neo4j-local'), neo4j.auth.basic(nconf.get('neo4jUSERNAME'), nconf.get('neo4jPASSWORD')));

exports.getSession = function(){
  console.log(nconf.get('neo4jUSERNAME'), nconf.get('neo4jPASSWORD'))

  return driver.session();

}
exports.getneo4jSession = function (context) {
  if(context.neo4jSession) {
    return context.neo4jSession;
  }
  else {
    console.log(" create neo4j session ")
    context.neo4jSession = driver.session();
    return context.neo4jSession;
  }
};

exports.neo4jdbWhere = function (name, keys) {
  if (_.isArray(name)) {
    _.map(name, (obj) => {
      return _neo4jwhereTemplate(obj.name, obj.key, obj.paramKey);
    });
  } else if (keys && keys.length) {
    return 'WHERE ' + _.map(keys, (key) => {
        return _neo4jwhereTemplate(name, key);
      }).join(' AND ');
  }
};

function _neo4jwhereTemplate(name, key, paramKey) {
  return name + '.' + key + '={' + (paramKey || key) + '}';
}

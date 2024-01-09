// neo4j cypher helper module
import nconf from '../config.js';
import * as _ from 'lodash';
import * as neo4j from 'neo4j-driver';
const driver = neo4j.driver(nconf.get('neo4j-local'), neo4j.auth.basic(nconf.get('neo4jUSERNAME'), nconf.get('neo4jPASSWORD')));

// neo4j cypher helper module
export const getSession = () => {
  console.log(nconf.get('neo4jUSERNAME'), nconf.get('neo4jPASSWORD'))

  return driver.session();
}

export const getneo4jSession = (context) => {
  if(context.neo4jSession) {
    return context.neo4jSession;
  }
  else {
    console.log(" create neo4j session ")
    context.neo4jSession = driver.session();
    return context.neo4jSession;
  }
};

export const neo4jdbWhere = (name, keys) => {
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

const _neo4jwhereTemplate =(name, key, paramKey) => {
  return name + '.' + key + '={' + (paramKey || key) + '}';
}

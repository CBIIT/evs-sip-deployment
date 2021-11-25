const dbUtils = require('../../components/neo4jUtils');
const User = require('../../models/neo4j/user');
const { writeResponse, writeError } = require('../../components/response');
const _ = require('lodash');


const crypto = require('crypto');


const neo4jsession = dbUtils.getSession()
// expect NCI_USERNAME as parameter
const getUserbyNciUserName = function (username) {
  // console.log(typeof neo4jsession.readTransaction)
  return neo4jsession.readTransaction(txc =>
    txc.run('MATCH (user:User {nci_username: $username}) RETURN user', { username: username })
  )
    .then(results => {
      if (_.isEmpty(results.records)) {
        return { message: 'invalid NCI username', status: 400 };
      }
      return new User(results.records[0].get('user'));
    });
};

//
const getAllUser = function (keyword, fromIndex, pageSize) {
  //console.log(typeof neo4jsession.readTransaction)
  let searchword = "(?i).*" + keyword + ".*"
  return neo4jsession.readTransaction(txc => txc.run('MATCH (user:User) where (any(prop in ["fisrt_name", "last_name","nci_username","email"]'
    + ' where user[prop] =~ $searchword)) return user ORDER BY user.last_name , user.first_name '
    + ' SKIP toInteger($fromIndex) LIMIT toInteger($pageSize) ', { searchword: searchword, fromIndex: fromIndex, pageSize: pageSize })
  )
    .then(results => {
      if (_.isEmpty(results.records)) {
        return { message: 'No matched user.', status: 400 };
      }
      return results.records.map(r => new User(r.get('user')));
    });
};

const updateUserbyNciUserName = function (requester, user) {

  if (!requester && !user.nci_username) {
    return { message: 'invalid NCI username for requester', status: 400 };
  }
  let updatedUser = { last_updated_time: new Date().toISOString().slice(0, 10)};
  if (user.email && (typeof user.email) === 'string') updatedUser.email = user.email;
  if (user.last_name && (typeof user.last_name) === 'string') updatedUser.last_name = user.last_name;
  if (user.first_name && (typeof user.first_name) === 'string') updatedUser.first_name = user.first_name;
  if (user.organization && (typeof user.organization) === 'string') updatedUser.organization = user.organization;
  if (user.projects && (typeof user.projects) === 'string') updatedUser.projects = user.projects;
  if (user.active && (typeof user.active) === 'string') updatedUser.active = user.active.toLowerCase().includes('y') ? 'Y' : 'N';

  return neo4jsession.readTransaction(txc => txc.run('MATCH (user:User {nci_username: $username}) RETURN user', { username: requester }))
    .then(results => {
      if (_.isEmpty(results.records)) {
        return { message: 'requester is not valid.', status: 400 }
      }
      else {
        let requestUser = new User(results.records[0].get('user'));
        if (requestUser.role.toLowerCase().includes('admin')) {
          return neo4jsession.writeTransaction(txc => txc.run('MATCH (user:User {nci_username: $username}) SET user += $updateduser RETURN user',
            { username: user.nci_username, updateduser: updatedUser }
          )).then(results => {
            if (_.isEmpty(results.records)) {
              return { message: 'invalid NCI username', status: 400 };
            }
            return { status:200, user: new User(results.records[0].get('user'))};
          }
          )

        }else{
          return { message: 'requester is not an admin.', status: 400 };
        }
      }
    });
};


module.exports = {
  getAllUser,
  getUserbyNciUserName,
  updateUserbyNciUserName
};

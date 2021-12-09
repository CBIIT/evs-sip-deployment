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
        return { status: 400, user_total: 0, results:[], message: 'invalid NCI username' };
      }
      return { status: 200, user_total: 1, results:[new User(results.records[0].get('user'))] };
      
    }).catch(function (error) {
      console.log("error in get user: " + error);
    });
};

//
const getAllUser = function (keyword, status,fromIndex, pageSize) {
  //console.log(typeof neo4jsession.readTransaction)
  const searchword = "(?i).*" + keyword + ".*"
  const userList =[];
  return neo4jsession.readTransaction(txc => txc.run('MATCH (user:User) where user.id <> 1 and user.active = $status and (any(prop in ["fisrt_name", "last_name","nci_username","email"]'
    + ' where user[prop] =~ $searchword))  WITH collect(user) as userList, count(user) as user_cnt '
    + ' UNWIND userList as user1 return user1, user_cnt ORDER BY user1.last_name , user1.first_name '
    + ' SKIP toInteger($fromIndex) LIMIT toInteger($pageSize) ',
     { searchword: searchword, status:status, fromIndex: fromIndex, pageSize: pageSize })
  )
    .then(results => {
      if (_.isEmpty(results.records)) {
        return { message: 'No matched user.', status: 400 };
      }
       let user_cnt =+results.records[0].get('user_cnt');
        results.records.map((r) => { 
        userList.push(new User(r.get('user1')));
      })
      return {status:200, user_total: user_cnt, results: userList }
    }).catch(function (error) {
      console.log("error in get All users: " + error);
    });
};

const updateUserbyNciUserName = function (requester, user) {

  if (!requester && !user.nci_username) {
    return { message: 'invalid NCI username for requester', status: 400 };
  }
  let updatedUser = { last_updated_time: new Date().toISOString().slice(0, 10) };
  if (user.email && (typeof user.email) === 'string') updatedUser.email = user.email;
  if (user.last_name && (typeof user.last_name) === 'string') updatedUser.last_name = user.last_name;
  if (user.first_name && (typeof user.first_name) === 'string') updatedUser.first_name = user.first_name;
  if (user.role && (typeof user.role) === 'string') updatedUser.role = user.role.toLowerCase().includes('admin')? 'Admin' : 'User';
  if (user.organization && (typeof user.organization) === 'string') updatedUser.organization = user.organization;
  if (user.projects && (typeof user.projects) === 'string') updatedUser.projects = user.projects;
  if (user.active && (typeof user.active) === 'string') updatedUser.active = user.active.toLowerCase().includes('y') ? 'Y' : 'N';

  return neo4jsession.readTransaction(txc => txc.run('MATCH (user:User {nci_username: toLower($username)}) RETURN user', { username: requester.toLowerCase() }))
    .then(results => {
      if (_.isEmpty(results.records)) {
        return { message: 'requester is not valid.', status: 400 }
      }
      else {
        let requestUser = new User(results.records[0].get('user'));
        if (requestUser.role.toLowerCase().includes('admin')) {
          return neo4jsession.writeTransaction(txc => txc.run('MATCH (user:User {nci_username: toLower($username)}) SET user += $updateduser RETURN user',
            { username: user.nci_username.toLowerCase(), updateduser: updatedUser }
          )).then(results => {
            if (_.isEmpty(results.records)) {
              return { message: 'invalid NCI username', status: 400 };
            }
            return { status: 200, user: new User(results.records[0].get('user')) };
          }
          )

        } else {
          return { message: 'requester is not an admin.', status: 400 };
        }
      }
    }).catch(function (error) {
      console.log("error in update user: " + error);
    });
};

const createUserWithNciUserName = function (requester, user) {

  if (!requester && !user.nci_username) {
    return { message: 'invalid NCI username for requester', status: 400 };
  }
  let today_date = new Date().toISOString().slice(0, 10);
  let newUser = { last_updated_time: today_date, created_time: today_date, nci_username: user.nci_username.toLowerCase() };
  if (user.email && (typeof user.email) === 'string') newUser.email = user.email;
  if (user.last_name && (typeof user.last_name) === 'string') newUser.last_name = user.last_name;
  if (user.first_name && (typeof user.first_name) === 'string') newUser.first_name = user.first_name;
  if (user.role && (typeof user.role) === 'string') newUser.role = user.role.toLowerCase().include('admin')? 'Admin' : 'User';
  if (user.organization && (typeof user.organization) === 'string') newUser.organization = user.organization;
  if (user.projects && (typeof user.projects) === 'string') newUser.projects = user.projects;
  if (user.active && (typeof user.active) === 'string') newUser.active = user.active.toLowerCase().includes('y') ? 'Y' : 'N';

  return neo4jsession.readTransaction(txc => txc.run('MATCH (user:User { nci_username : toLower($username) }) RETURN user', { username: requester.toLowerCase() }))
    .then(results => {
      if (_.isEmpty(results.records)) {
        return { message: 'requester is not valid.', status: 400 }
      }
      else {
        let requestUser = new User(results.records[0].get('user'));
        if (requestUser.role.toLowerCase().includes('admin')) {
          return neo4jsession.readTransaction(txc => txc.run('MATCH (user:User {nci_username: toLower($username)}) RETURN user',
            { username: user.nci_username.toLowerCase() }
          )).then(results => {
            if (!_.isEmpty(results.records)) {
              return { message: 'existing NCI username', status: 400 };
            } else {
              return neo4jsession.writeTransaction(txc => txc.run('MERGE (user:User { nci_username: toLower($username) }) SET user = $newuser, user.id = id(user) RETURN user',
                { username: user.nci_username.toLowerCase(), newuser: newUser }
              )).then(results => {
                if (_.isEmpty(results.records)) {
                  return { message: 'failed to create user', status: 400 };
                }
                return { status: 200, user: new User(results.records[0].get('user')) };
              })
            }
          })
        } else {
          return { message: 'requester is not an admin.', status: 400 };
        }
      }
    }).catch(function (error) {
      console.log("error in create user: " + error);
    });
};

module.exports = {
  getAllUser,
  getUserbyNciUserName,
  updateUserbyNciUserName,
  createUserWithNciUserName,
};

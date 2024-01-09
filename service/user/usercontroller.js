import * as dbUtils from '../../components/neo4jUtils.js';
import User from '../../models/neo4j/user.js';
// import { writeResponse, writeError } from '../../components/response.js';

// import crypto from 'crypto';

const neo4jsession = dbUtils.getSession()
// expect NCI_USERNAME as parameter
export const getUserbyNciUserName = (username) => {
  // console.log(typeof neo4jsession.readTransaction)
  return neo4jsession.readTransaction(txc =>
    txc.run('MATCH (user:User {nci_username: $username}) RETURN user', { username: username })
  )
    .then(results => {
      if (Object.keys(results.records).length === 0) {
        return { status: 400, user_total: 0, results:[], message: 'invalid NCI username' };
      }
      return { status: 200, user_total: 1, results:[new User(results.records[0].get('user'))] };
      
    }).catch(function (error) {
      console.log("error in get user: " + error);
    });
};

//
export const getAllUser = (keyword, status,fromIndex, pageSize) => {
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
      if (Object.keys(results.records).length === 0) {
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

export const updateUserbyNciUserName = (requester, user) => {

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
      if (Object.keys(results.records).length === 0) {
        return { message: 'requester is not valid.', status: 400 }
      }
      else {
        let requestUser = new User(results.records[0].get('user'));
        if (requestUser.role.toLowerCase().includes('admin')) {
          return neo4jsession.writeTransaction(txc => txc.run('MATCH (user:User {nci_username: toLower($username)}) SET user += $updateduser RETURN user',
            { username: user.nci_username.toLowerCase(), updateduser: updatedUser }
          )).then(results => {
            if (Object.keys(results.records).length === 0) {
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

export const createUserWithNciUserName = (requester, user) => {

  if (!requester && !user.nci_username) {
    return { message: 'invalid NCI username for requester', status: 400 };
  }
  let today_date = new Date().toISOString().slice(0, 10);
  let newUser = { last_updated_time: today_date, created_time: today_date, nci_username: user.nci_username.toLowerCase() };
  if (user.email && (typeof user.email) === 'string') newUser.email = user.email;
  if (user.last_name && (typeof user.last_name) === 'string') newUser.last_name = user.last_name;
  if (user.first_name && (typeof user.first_name) === 'string') newUser.first_name = user.first_name;
  if (user.role && (typeof user.role) === 'string') newUser.role = user.role.toLowerCase().includes('admin')? 'Admin' : 'User';
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
            if (Object.keys(results.records).length !== 0) {
              return { message: 'existing NCI username', status: 400 };
            } else {
              return neo4jsession.writeTransaction(txc => txc.run('MERGE (user:User { nci_username: toLower($username) }) SET user = $newuser, user.id = id(user) RETURN user',
                { username: user.nci_username.toLowerCase(), newuser: newUser }
              )).then(results => {
                if (Object.keys(results.records).length === 0) {
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
const dbUtils  = require( '../../components/neo4jUtils');
const User  = require ( '../../models/neo4j/user');
const {writeResponse,writeError} = require( '../../components/response');
const _ = require('lodash');


const crypto = require('crypto');


const neo4jsession = dbUtils.getSession()
// expect NCI_USERNAME as parameter
const getUserbyNciUserName = function (username) {
 // console.log(typeof neo4jsession.readTransaction)
  return neo4jsession.readTransaction(txc =>  
    txc.run('MATCH (user:User {nci_username: $username}) RETURN user' , {username: username})
  )
    .then(results => {
      if (_.isEmpty(results.records)) {
        return {message: 'invalid NCI username', status: 400};
      }
      return new User(results.records[0].get('user'));
    });
};

//
const getAllUser = function (keyword, fromIndex , pageSize ) {
  //console.log(typeof neo4jsession.readTransaction)
  let searchword = "(?i).*"+keyword+".*"
  return neo4jsession.readTransaction(txc => txc.run('MATCH (user:User) where (any(prop in ["fisrt_name", "last_name","nci_username","email"]'
   + ' where user[prop] =~ $searchword)) return user ORDER BY user.last_name , user.first_name '
   + ' SKIP toInteger($fromIndex) LIMIT toInteger($pageSize) ', {searchword: searchword, fromIndex: fromIndex, pageSize: pageSize} )
 )
    .then(results => {
      if (_.isEmpty(results.records)) {
        return {message: 'No matched user.', status: 400};
      }
      return results.records.map(r=> new User(r.get('user')) );
    });
};


module.exports= {
  getAllUser,
  getUserbyNciUserName
};

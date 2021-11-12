const neo4jUtils  = require( '../../components/neo4jUtils');
const {writeResponse,writeError} = require( '../../components/response');
const usercontroller = require( './usercontroller');
const _ = require('lodash');


const crypto = require('crypto');

// expect NCI_USERNAME as parameter
const getUserProfile = async function (req, res) {
    const params = req.query;
    const userName = params.username ? params.username : "";
    if(userName) {
        const result = await usercontroller.getUserbyNciUserName(userName);
        res.json(result)
    }else{
        return writeError(res, {detail: 'no proper NCI username provided'}, 400);
    }
  
};

const getAllUser = async function (req, res) {
   //const result = await usercontroller.getAllUser(neo4jUtils.getneo4jSession(req));
    const params = req.query;
    const searchText = params.search ? params.search : "";
    const type = params.type ? params.type : "all";
    const page = parseInt(params.page ? params.page : 1);
    const pageSize = parseInt(params.pageSize ? params.pageSize : 25);
    const fromIndex = page > 1 ? (page - 1) * pageSize : 0;

    const result = await usercontroller.getAllUser(searchText, fromIndex, pageSize);
    res.json(result);

};

module.exports= {
    getUserProfile,
    getAllUser,
};

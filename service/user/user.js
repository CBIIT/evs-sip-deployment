import * as dbUtils from '../../components/neo4jUtils.js';
import { writeResponse, writeError } from '../../components/response.js';
import * as usercontroller from './usercontroller.js';

import crypto from 'crypto';

export const getAllUser = async (req, res) => {
    //const result = await usercontroller.getAllUser(neo4jUtils.getneo4jSession(req));
     const params = req.query;
     const searchText = params.search ? params.search : "";
     const status = params.status ? params.status : "Y";
     const page = parseInt(params.page ? params.page : 1);
     const pageSize = parseInt(params.pageSize ? params.pageSize : 25);
     const fromIndex = page > 1 ? (page - 1) * pageSize : 0;
 
     const result = await usercontroller.getAllUser(searchText, status, fromIndex, pageSize);
     res.json(result);
 
 };

// expect NCI_USERNAME as parameter
export const getUserProfile = async (req, res) => {
    const params = req.query;
    const userName = params.username ? params.username : "";
    if(userName) {
        const result = await usercontroller.getUserbyNciUserName(userName);
        res.json(result)
    }else{
        return writeError(res, {detail: 'no proper NCI username provided'}, 400);
    }
  
};

export const updateUser = async (req, res) => {
    let body = req.body;
    let requester = body.requester ? body.requester : "";
    let user = body.user? body.user :{};
    if(user) {
        const result = await usercontroller.updateUserbyNciUserName(requester, user);
        res.json(result)
    }else{
        res.json({detail: 'no User data provided', status: 400});
    }
  
};

export const createUser = async (req, res) => {
    let body = req.body;
    let requester = body.requester ? body.requester : "";
    let user = body.user? body.user :{};
    if(user) {
        const result = await usercontroller.createUserWithNciUserName(requester,user);
        res.json(result)
    }else{
        res.json({detail: 'no User data provided', status: 400});
    }
  
};

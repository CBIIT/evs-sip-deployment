
const {writeResponse,writeError} = require( '../../components/response');
const dataModelcontroller = require( './dataModelcontroller');
const _ = require('lodash');

// expect NCI_USERNAME as parameter
const getSearch = async function (req, res) {
   
    //return controller.searchP(req, res, formatFlag);
    const params = req.query;
    const keyword = params.keyword ? params.keyword : "";
    const model = params.model ? params.model : "ICDC";
    const type = params.type ? params.type : "";
    const page = parseInt(params.page ? params.page : 1);
    const pageSize = parseInt(params.pageSize ? params.pageSize : 25);
    const fromIndex = page > 1 ? (page - 1) * pageSize : 0;
    if(model) {
        const result = await dataModelcontroller.getSearchResults(keyword, model, type, fromIndex, pageSize );
        res.json(result)
    }else{
        return writeError(res, {detail: 'no result found' }, 400);
    }
  
};

const getSource = async function (req, res) {
   //const result = await usercontroller.getAllUser(neo4jUtils.getneo4jSession(req));
    const params = req.query;
    const searchText = params.search ? params.search : "";
    const type = params.type ? params.type : "all";
    const page = parseInt(params.page ? params.page : 1);
    const pageSize = parseInt(params.pageSize ? params.pageSize : 25);
    const fromIndex = page > 1 ? (page - 1) * pageSize : 0;

    const result = await dataModelcontroller.getSource(searchText, fromIndex, pageSize);
    res.json(result);

};

const getApiSearch = async function (req, res) {
   
    //return controller.searchP(req, res, formatFlag);
    const params = req.query;
    const keyword = params.keyword ? params.keyword : "";
    const model = params.model ? params.model : "";
    const type = params.type ? params.type : "";
    if(keyword) {
        const result = await dataModelcontroller.getApiSearchResults(keyword, model, type);
        res.json(result)
    }else{
        return writeError(res, {detail: 'no result found' }, 400);
    }
  
};

const getApiSource = async function (req, res) {
   //const result = await usercontroller.getAllUser(neo4jUtils.getneo4jSession(req));
    const params = req.query;
    const model = params.model ? params.model : "";

    const result = await dataModelcontroller.getApiSouce(model);
    res.json(result);

};

module.exports= {
    getSearch,
    getSource,
    getApiSource,
    getApiSearch,
 
};

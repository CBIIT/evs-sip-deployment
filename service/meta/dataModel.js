
const {writeResponse,writeError} = require( '../../components/response');
const dataModelcontroller = require( './dataModelcontroller');
const _ = require('lodash');
/**
 * @swagger
 * definition:
 *   Node:
 *     type: object
 *     properties:
 *       model:
 *         type: string
 *       node_name:
 *         type: string
 *       properties:
 *         type: object
 */

/**
 * @swagger
 * /api/datamodel/source/{model}:
 *   get:
 *     tags:
 *     - datamodel
 *     description: Find all nodes in requested model
 *     summary: Find all nodes in requested model
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: A list of nodes
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Node'
 */

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
    const formatFlag = req.query.format || '';
    if(keyword) {
        const result = await dataModelcontroller.getApiSearchResults(keyword, model, type);
       
        if(+result.status === 200 ){
            res.json(result);
        }else{
            //res.json( {status: 404 ,message: 'Data not found'  });
            return writeError(res, {detail: 'Data not found' }, 404);
        }
    }else{
        //res.json( {status: 400, message: 'Wrong request format' });
        return writeError(res, {message: 'Wrong request format' }, 400);
    }  
};

const getApiSource = async function (req, res) {
   //const result = await usercontroller.getAllUser(neo4jUtils.getneo4jSession(req));
    const model = req.params['model'] || 'ICDC';
    if(['icdc','ctdc','gdc','pctc'].includes(model.toLowerCase())){

    const result = await dataModelcontroller.getApiDataSource(model);
    if(+result.status === 200){
        res.json(result);
    }else{
        //res.json( {status: 404 ,message: 'Data not found in :'+model  });
        return writeError(res, {message: 'no result found' }, 404);
    }
    
    }else{
        //res.json( {status: 400 ,message: 'Not valid data model :'+model  });
        return writeError(res, {message: 'Not valid data model' }, 400);
    }

};

module.exports= {
    getSearch,
    getSource,
    getApiSource,
    getApiSearch,
 
};

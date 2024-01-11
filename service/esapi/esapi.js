import * as esapicontroller from './esapicontroller.js';
import * as shared from '../search/shared.js';
import * as xmlBuilder from '../tools/xmlBuilder.js';
import { writeResponse, writeError } from '../../components/response.js';

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

export const apiEsSearch = async (req, res) => {
  let formatFlag = req.query.format;
  return await esapicontroller.searchP(req, res, formatFlag);
};

export const getEsModelData = async function (req, res) {
  //const result = await usercontroller.getAllUser(neo4jUtils.getneo4jSession(req));
  const model = req.params['model'] || 'ICDC';
  const node = req.params['node'] || '';
  const prop = req.params['prop'] || '';
  console.log(' node name ', node);

  let result = {};
  if (['icdc', 'ctdc', 'gdc', 'pcdc'].includes(model.toLowerCase())) {
    switch (model.toLowerCase()) {
      case 'gdc':
        result = await getGraphicalGDCDictionary(node, prop);
        break;
      case 'ctdc':
        result = await getGraphicalCTDCDictionary(node, prop);
        break;
      case 'icdc':
        result = await getGraphicalICDCDictionary(node, prop);
        break;
      case 'pcdc':
        let project = (req.query.project || '') === '' ? 'AML' : req.query.project;
        result = await getGraphicalPCDCDictionary(project, node, prop);
        break;
      default:
        break;
    }
    if (+result.status === 200) {
      res.json(result);
    } else {
      //res.json( {status: 404 ,message: 'Data not found'  });
      return writeError(res, { detail: 'Data not found' }, 404);
    }
  } else {
    //res.json( {status: 400 ,message: 'Not valid data model :'+model  });
    return writeError(res, { message: 'Not valid data model' }, 400);
  }
};

const getGraphicalGDCDictionary = async (node, prop) => {
  return await esapicontroller.getGraphicalGDCDictionary(node, prop);
  // let jsonData = await shared.getGraphicalGDCDictionary();
  // //res.json(jsonData);
  // let formatFlag = req.query.format || '';
  // if (formatFlag === 'xml') {
  //     res.setHeader('Content-Type', 'application/xml');
  //     // xmlBuilder.buildResponse(formatFlag, res, 200, JSON.parse(JSON.stringify(jsonData)), 'data');
  //     xmlBuilder.buildResponse(formatFlag, res, 200, { message: "Invalid data for xml format, Please select json format. " });
  // } else {
  //     res.json(jsonData);
  // }
};

const getGraphicalICDCDictionary = async (node, prop) => {
  return await esapicontroller.getGraphicalICDCDictionary(node, prop);
};

const getGraphicalCTDCDictionary = async (node, prop) => {
  return await esapicontroller.getGraphicalCTDCDictionary(node, prop);
};

const getGraphicalPCDCDictionary = async (project, node, prop) => {
  return await esapicontroller.getGraphicalPCDCDictionary(project, node, prop);
  // let project = (req.query.project || '') === "" ? "AML" : req.query.project;
  // let jsonData = shared.getGraphicalPCDCDictionary(project);
  // let formatFlag = req.query.format || '';
  // if (formatFlag === 'xml') {
  //     res.setHeader('Content-Type', 'application/xml');
  //     // xmlBuilder.buildResponse(formatFlag, res, 200, JSON.parse(JSON.stringify(jsonData)), 'data');
  //     xmlBuilder.buildResponse(formatFlag, res, 200, { message: "Invalid data for xml format, Please select json format. " });
  // } else {
  //     res.json(jsonData);
  // }
};

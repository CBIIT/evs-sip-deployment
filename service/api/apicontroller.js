const controller = require("../search/controller");
const shared = require("../search/shared");
const xmlBuilder = require("../xmlBuilder");


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



const apiSearch = (req, res) => {
    let formatFlag = req.query.format;
    return controller.searchP(req, res, formatFlag);
};

const getGraphicalGDCDictionary = async function (req, res) {
    let jsonData = await shared.getGraphicalGDCDictionary();
    //res.json(jsonData);
    let formatFlag = req.query.format || '';
    if (formatFlag === 'xml') {
       res.setHeader('Content-Type', 'application/xml');
       // xmlBuilder.buildResponse(formatFlag, res, 200, JSON.parse(JSON.stringify(jsonData)), 'data');
       xmlBuilder.buildResponse(formatFlag, res, 200, {message: "Invalid data for xml format, Please select json format. " });
    } else {
        res.json(jsonData);
    }
};

const getGraphicalICDCDictionary = async (req, res) => {
    let jsonData = await shared.getGraphicalICDCDictionary();
   // res.json(jsonData);
    let formatFlag = req.query.format || '';
    if (formatFlag === 'xml') {
       res.setHeader('Content-Type', 'application/xml');
       // xmlBuilder.buildResponse(formatFlag, res, 200, JSON.parse(JSON.stringify(jsonData)), 'data');
       xmlBuilder.buildResponse(formatFlag, res, 200, {message: "Invalid data for xml format, Please select json format. " });
    } else {
        res.json(jsonData);
    }
};

const getGraphicalCTDCDictionary = async function (req, res) {
    let jsonData = await shared.getGraphicalCTDCDictionary();
    let formatFlag = req.query.format || '';
    if (formatFlag === 'xml') {
       res.setHeader('Content-Type', 'application/xml');
       // xmlBuilder.buildResponse(formatFlag, res, 200, JSON.parse(JSON.stringify(jsonData)), 'data');
       xmlBuilder.buildResponse(formatFlag, res, 200, {message: "Invalid data for xml format, Please select json format. " });
    } else {
        res.json(jsonData);
    }
};

const getGraphicalPCDCDictionary = async (req, res) => {
    let project = (req.query.project || '') === "" ? "AML" : req.query.project;
    let jsonData = shared.getGraphicalPCDCDictionary(project);
    let formatFlag = req.query.format || '';
    if (formatFlag === 'xml') {
       res.setHeader('Content-Type', 'application/xml');
       // xmlBuilder.buildResponse(formatFlag, res, 200, JSON.parse(JSON.stringify(jsonData)), 'data');
       xmlBuilder.buildResponse(formatFlag, res, 200, {message: "Invalid data for xml format, Please select json format. " });
    } else {
        res.json(jsonData);
    }
};


module.exports = {
    apiSearch,
    getGraphicalGDCDictionary,
    getGraphicalICDCDictionary,
    getGraphicalCTDCDictionary,
    getGraphicalPCDCDictionary,

}

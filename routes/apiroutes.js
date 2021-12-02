const express = require("express");
const esapi = require("../service/esapi/esapi");
const metauser = require("../service/user/user");
const metamodel = require("../service/datamodel/dataModel");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');

const router = express.Router();

router.get('/', function (req, res) {
    res.json({
        'version': '1.0.0',
        'title': 'EVS-SIP Restful API',
        'documentation': 'https://' + req.headers.host+ [':300',':80'].some((e) => req.headers.host.includes(e))?'/api/docs/':'/evssip/api/docs/'
    });
});

router.use('/docs',
    swaggerUi.serve,
    function (req, res) {
        const protocol = 'http';
        const host = req.get('host');
        const baseUrl = [':300',':80'].some((e) => host.includes(e))?'/api':'/evssip/api';
        swaggerUi.setup(swaggerDocument(protocol, host, baseUrl))(req, res);
    }
);
  
// property based api
router.get("/es/search", esapi.apiEsSearch);

//source view from elasticSearch
router.get("/es/source/:model", esapi.getEsModelData);
router.get("/es/source/:model/:node", esapi.getEsModelData);


// neo4j user
router.get("/user/userprofile", metauser.getUserProfile);
router.get("/user/allusers", metauser.getAllUser);
// user admin disabled for API 
//router.get("/admin/updateuser", metauser.updateUser);
//router.get("/admin/createuser", metauser.createUser);

// neo4j datamodel
router.get("/datamodel/search", metamodel.getApiSearch);
router.get("/datamodel/source/:model", metamodel.getApiSource);
router.get("/datamodel/source/:model/:node", metamodel.getApiSource);

module.exports = router;

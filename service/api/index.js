const express = require("express");
const controller = require("../search/controller");
const apicontroller = require("./apicontroller");
const metauser = require("../meta/user");
const metamodel = require("../meta/dataModel");
const report = require("../search/report");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../routes/swagger');

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
router.get("/search", apicontroller.apiSearch);

//graphical view
router.get("/source/gdc", apicontroller.getGraphicalGDCDictionary);
router.get("/source/icdc", apicontroller.getGraphicalICDCDictionary);
router.get("/source/ctdc", apicontroller.getGraphicalCTDCDictionary);
router.get("/source/pcdc", apicontroller.getGraphicalPCDCDictionary);
router.get("/graph/p/vs", controller.getValuesForGraphicalView);
router.get("/p/local/vs", controller.getGDCData);

// neo4j data
router.get("/user/userprofile", metauser.getUserProfile);
router.get("/user/allusers", metauser.getAllUser);
//router.get("/admin/updateuser", metauser.updateUser);
//router.get("/admin/createuser", metauser.createUser);

router.get("/datamodel/search", metamodel.getApiSearch);
router.get("/datamodel/source", metamodel.getApiSource);



//get report Diff from mysql table
router.get('/reportDiff', report.getReportDiff);

module.exports = router;

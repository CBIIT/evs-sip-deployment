const express = require("express");
const controller = require("./controller");
const report = require("./report");

const router = express.Router();

router.get("/buildIndex", controller.indexing);
router.get("/suggest", controller.suggestion);


// property based api
router.get("/all/p", controller.searchP);

//graphical view
router.get("/graph/gdc", controller.getGraphicalGDCDictionary);
router.get("/graph/icdc", controller.getGraphicalICDCDictionary);
router.get("/graph/ctdc", controller.getGraphicalCTDCDictionary);
router.get("/graph/pcdc", controller.getGraphicalPCDCDictionary);
router.get("/graph/p/vs", controller.getValuesForGraphicalView);
router.get("/p/local/vs", controller.getGDCData);

//for data preprocessing only
//router.get("/preloadNCItSynonyms_old", controller.preloadNCItSynonyms_old);
//router.get("/preloadNCItSynonyms", controller.preloadNCItSynonyms);
//router.get('/preloadGDCDataMappings', controller.preloadGDCDataMappings);
//router.get('/compareWithGDCDictionary', controller.compareWithGDCDictionary);
router.get('/compareAllWithGDCDictionary', controller.compareAllWithGDCDictionary);
router.get('/exportCompareResult', controller.exportCompareResult);
router.get('/exportAllCompareResult', controller.exportAllCompareResult);
//router.get('/generateProperties', controller.generateProperties);
//router.get('/updateGDCPropertyMappings', controller.updateGDCPropertyMappings);
//router.get("/updateGDCDataMappings", controller.updateGDCDataMappings);
//router.get("/preloadPCDCDataMappings", controller.preloadPCDCDataMappings);

//get report Diff from mysql table
router.get('/report/reportDiff', report.getReportDiff);

module.exports = router;

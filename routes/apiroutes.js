import express from "express";
import * as esapi from "../service/esapi/esapi.js";
import * as metauser from "../service/user/user.js";
// import metamodel from '../service/datamodel/dataModel.js';
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    version: "1.0.0",
    title: "EVS-SIP Restful API",
    documentation:
      "https://" +
      req.headers.host +
      [":300", ":80"].some((e) => req.headers.host.includes(e))
        ? "/api/docs/"
        : "/evssip/api/docs/",
  });
});

router.use("/docs", swaggerUi.serve, (req, res) => {
  const protocol = "https";
  const host = req.get("host");
  const baseUrl = [":300", ":80"].some((e) => host.includes(e))
    ? "/api"
    : "/evssip/api";
  swaggerUi.setup(swaggerDocument(protocol, host, baseUrl))(req, res);
});

router.use("/swagger", (req, res) => {
  const protocol = req.get("host").includes("gov") ? "https" : "http";
  const host = req.get("host");
  const baseUrl = [":300", ":80"].some((e) => host.includes(e))
    ? "/api"
    : "/evssip/api";
  const swaggerdoc = swaggerDocument(protocol, host, baseUrl);
  res.json(swaggerdoc);
});

// api search from elasticSearch
router.get("/search", esapi.apiEsSearch);

//source view from dict files
router.get("/data_dictionary/source/:model", esapi.getEsModelData);
router.get("/data_dictionary/source/:model/:node", esapi.getEsModelData);
router.get("/data_dictionary/source/:model/:node/:prop", esapi.getEsModelData);

// neo4j user
router.get("/user/userprofile", metauser.getUserProfile);
router.get("/user/allusers", metauser.getAllUser);
// user admin disabled for API
//router.get("/admin/updateuser", metauser.updateUser);
//router.get("/admin/createuser", metauser.createUser);

// neo4j datamodel
/*
router.get("/datamodel/search", metamodel.getApiSearch);
router.get("/datamodel/source/:model", metamodel.getApiSource);
router.get("/datamodel/source/:model/:node", metamodel.getApiSource);
router.get("/datamodel/source/:model/:node/:prop", metamodel.getApiSource);
*/

export default router;

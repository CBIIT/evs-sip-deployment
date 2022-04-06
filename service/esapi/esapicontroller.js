const elastic = require("../../components/elasticsearch");
const handleError = require("../../components/handleError");
const logger = require("../../components/logger");
const cache = require("../../components/cache");
const config = require("../../routes");
const https = require("https");
const fs = require("fs");
const path = require("path");
const shared = require("../search/shared");
const xmlBuilder = require("../tools/xmlBuilder");
const yaml = require("yamljs");
const $RefParser = require("@apidevtools/json-schema-ref-parser");
const folderPath = path.join(
  __dirname,
  "..",
  "..",
  "data_files",
  "GDC",
  "model"
);
const dataFilesPath = path.join(__dirname, "..", "..", "data_files");

const searchP = (req, res, formatFlag) => {
  //let keyword = req.query.keyword.trim().replace(/\+/g, "\\+").replace(/-/g, "\\-").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  if (req.query.keyword) {
    let keyword = req.query.keyword.trim();
    let sources = req.query.sources ? req.query.sources.replace(/\ /g, "").replace(/\"/g, "").replace(/\'/g, "").trim().split(',') : [];

    let option = {};
    if (req.query.options) {
      option.match = req.query.options.indexOf("exact") !== -1 ? "exact" : "partial";
      option.syn = req.query.options.indexOf('syn') !== -1 ? true : false;
      option.n_syn = req.query.options.indexOf('n_syn') !== -1 ? true : false;
      option.p_syn = req.query.options.indexOf('p_syn') !== -1 ? true : false;
      option.desc = req.query.options.indexOf('desc') !== -1 ? true : false;
      option.sources = sources;
    }
    else {
      option = {
        match: "partial",
        syn: false,
        n_syn: false,
        p_syn: false,
        desc: false
      };
      option.sources = sources;
    }
    if (keyword && keyword.trim() !== "") {
      let query = shared.generateQuery(keyword, option);
      logger.debug("keyword: " + keyword)
      logger.debug("------ query ------  %o ", query)
      let highlight = shared.generateHighlight();
      elastic.query(config.index_p, query, "enum", highlight,(result) => {
        if (result.hits === undefined) {
          res.json({ total: 0, returnList: [], timedOut: true });
          //return writeError.error(res, result);
        } else {
          let total = result.hits.total.value;
          let data = result.hits.hits;
          data.forEach((entry) => {
            delete entry.sort;
            delete entry._index;
            delete entry._score;
            delete entry._type;
            delete entry._id;
          });
          const pcdc_project_fullName = shared.getPCDCProjectsFullName();
          if (formatFlag === 'xml') {
            res.header('Content-Type', 'text/xml').send(xmlBuilder.xmlBuilder.buildObject(({
              total: total,
              returnList: data,
              timedOut: false,
              info: pcdc_project_fullName,
            })));
          } else {
            res.json({
              total: total,
              returnList: data,
              timedOut: false,
              info: pcdc_project_fullName,
            });
          }
        }
      });
    }
  } else {
    if (formatFlag === 'xml') {
      res.header('Content-Type', 'text/xml').status(200).send(xmlBuilder.buildObject({
        Message: 'Empty keyword'
      }));
    } else {
      res.json([]);
    }
  }
};

const getGraphicalGDCDictionary = async function (node, prop) {

  let result = cache.getValue("gdc_dict_api");
  if (result == undefined || node !== '') {
    console.log(
      "Start to generate GDC Dictionary Data and load to local cache."
    );
    let jsonData = {};
    var termsJson = yaml.load(folderPath + "/_terms.yaml");
    jsonData["_terms.yaml"] = termsJson;
    var defJson = yaml.load(folderPath + "/_definitions.yaml");
    jsonData["_definitions.yaml"] = defJson;
    var termsEnumJson = yaml.load(folderPath + "/_terms_enum.yaml");
    jsonData["_terms_enum.yaml"] = termsEnumJson;
    // let bulkBody = [];
   
    fs.readdirSync(folderPath).forEach((file) => {
      if(!node || node ==='' || file.toLowerCase().includes(node.toLowerCase())){
      let fileJson = yaml.load(folderPath + "/" + file);
      // Do not include annotation.yaml, metaschema.yaml
      // Only include node in the gdc_searchable_nodes
      // Do not include node in category "TBD" and "data"
      /*
            if (file.indexOf('_') !== 0 && file !== 'annotation.yaml' && file !== 'metaschema.yaml'  
              && gdc_searchable_nodes.indexOf(fileJson.id) !== -1 && fileJson.category !== 'TBD' && fileJson.category !== 'data') {
              jsonData[file] = fileJson;
            }
            */
      if (
        file.indexOf("_") !== 0 &&
        file !== "annotation.yaml" &&
        file !== "metaschema.yaml" &&
        fileJson.category !== "TBD" &&
        fileJson.category !== "data"
      ) {
        jsonData[file] = fileJson;
      }
    }
    });
    result = await generateGDCData(jsonData);
    console.log("Cached:");
    console.log(Object.keys(result).length);
    if(node === '') cache.setValue("gdc_dict_api", result, config.item_ttl);
  }
  delete result._terms;
  delete result._terms_enum;
  delete result._definitions;
  result = processGDCResult(result, node, prop)
  if (result.length ===0 ) {
    return { status: 400, message: " No data found. " };
  }
  return { status: 200, results: result };
};

const generateGDCData = async function (schema) {
  console.log("Start...");
  let dict = {};
  for (let [key, value] of Object.entries(schema)) {
    delete value["$schema"];
    delete value["namespace"];
    delete value["project"];
    delete value["program"];
    delete value["submittable"];
    delete value["downloadable"];
    delete value["previous_version_downloadable"];
    delete value["validators"];
    delete value["uniqueKeys"];
    if (value["properties"]) {
      delete value["properties"]["$ref"];
    }

    dict[key.slice(0, -5)] = value;
  }

  //console.log(dict);

  // Recursivly fix references
  dict = findObjectWithRef(dict, (refObj, rootKey) => {
    // This halts for sub objects./...

    let tmp = "";

    if (Array.isArray(refObj)) {
      tmp = refObj[0];
    } else {
      tmp = refObj;
    }

    if (tmp.includes(".yaml")) {
      // ABS_FIX
      // "$ref": "_definitions.yaml#/ubiquitous_properties",
      // ->
      // "$ref": "#/_definitions/ubiquitous_properties",

      tmp = "#/" + tmp.replace(".yaml#", "");
      // console.log("ABS FIX -- " + rootKey + ": " + refObj);
    } else {
      // REL FIX
      // "$ref": "#/state"
      // ->
      // "$ref": "#/{_definitions aka root key}/state"

      tmp = "#/" + rootKey + "/" + tmp.replace("#/", "");
      //console.log("REL FIX -- " + rootKey + ": " + refObj);
    }

    return tmp;
  });

  dict["_terms"]["file_format"] = { description: "wut" };
  //dict["case"].category = "case";

  console.log("End...");

  let newDict = await $RefParser.dereference(dict, {
    continueOnError: false, // Don't throw on the first error
    dereference: {
      circular: true, // Don't allow circular $refs
    },
  });

  console.log("End of Dereference...");

  const result = Object.keys(newDict).reduce(function (filtered, key) {
    let obj = newDict[key];
    let deprecated_properties = obj.deprecated ? obj.deprecated : [];
    let deprecated_enum = [];

    if (obj.properties) {
      deprecated_properties.forEach((d_p) => {
        delete obj.properties[d_p];
      });
      delete obj["deprecated"];
      for (let p in obj.properties) {
        if (obj.properties[p].anyOf) {
          //remove any reference properties
          delete obj.properties[p];
        }
        /*
        else{
          if (obj.properties[p].deprecated_enum) {
            obj.properties[p].enum = _.differenceWith(obj.properties[p].enum, obj.properties[p].deprecated_enum, _.isEqual);
            console.log(obj.properties[p].enum);
          }
          delete obj.properties[p].deprecated_enum;
        }
        */
      }
      obj.properties = excludeSystemProperties(obj);
    }

    delete obj.systemProperties;



    if( !['_terms','_terms_enum','_definitions'].includes(key))filtered.push(newDict[key]);
    return filtered;
  }, []);


  return result;
};

const findObjectWithRef = (obj, updateFn, root_key = "", level = 0) => {
  // iterate over the properties
  for (var propertyName in obj) {
    if (level === 0) root_key = propertyName;

    if (propertyName === "$ref") {
      obj["$ref"] = updateFn(obj["$ref"], root_key);
    }

    // any object that is not a simple value
    if (obj[propertyName] !== null && typeof obj[propertyName] === "object") {
      // recurse into the object and write back the result to the object graph
      obj[propertyName] = findObjectWithRef(
        obj[propertyName],
        updateFn,
        root_key,
        level + 1
      );
    }
  }

  return obj;
};

const excludeSystemProperties = function (node) {
  const properties =
    node.properties &&
    Object.keys(node.properties)
      .filter((key) =>
        node.systemProperties ? !node.systemProperties.includes(key) : true
      )
      .reduce((acc, key) => {
        acc[key] = node.properties[key];
        return acc;
      }, {});
  return properties;
};

const getGraphicalICDCDictionary = function (node, prop ) {

  let result = cache.getValue("icdc_dict_api");
  if (result == undefined || node !== '') {
    let jsonData = {};
    var mpJson = yaml.load(dataFilesPath + "/ICDC/icdc-model-props.yml");
    jsonData.mpData = mpJson;
    var mJson = yaml.load(dataFilesPath + "/ICDC/icdc-model.yml");
    jsonData.mData = mJson;
    result = generateICDCorCTDCData(jsonData, 'ICDC', node, prop);
    if (node === '') cache.setValue("icdc_dict_api", result, config.item_ttl);
  }
  if (result.length === 0) {
    return { status: 400, message: " No data found. " };
  }
  return { status: 200, results: result };
};

const getGraphicalCTDCDictionary = function (node, prop )  {
  let result = cache.getValue("ctdc_dict_api");
  if (result == undefined || node !== '') {
    let jsonData = {};
    var mpJson = yaml.load(
      dataFilesPath + "/CTDC/ctdc_model_properties_file.yaml"
    );
    jsonData.mpData = mpJson;
    var mJson = yaml.load(dataFilesPath + "/CTDC/ctdc_model_file.yaml");
    jsonData.mData = mJson;
    result = generateICDCorCTDCData(jsonData, 'CTDC', node, prop);
    /*
        for(let node in result){
          result[node].category = "clinical";
        }
        */
    if (node === '') cache.setValue("ctdc_dict_api", result, config.item_ttl);
  }
  if (result.length === 0) {
    return { status: 400, message: " No data found. " };
  }
  return { status: 200, results: result };
}

const processGDCDictionaryEnumData = (prop) => {
  const enums = prop.enum;
  const enumsDef = prop.enumDef;
  let result = enums ? enums.map((value) => {
    let tmp = {};
    tmp.n = value.replace(/(?:\r\n|\r|\n)/g, ' ');
    if (enumsDef && enumsDef[tmp.n] && enumsDef[tmp.n].termDef) {
      let term = enumsDef[tmp.n].termDef;
      if (term.source == "NCIt" && term.term_id && term.term_id !== "") {
        tmp.gdc_ncit = term.term_id;
      }
      else {
        tmp.gdc_ncit = "";
      }
    }
    else {
      tmp.gdc_ncit = "";
    }
    tmp.n = tmp.n.replace(/\s+/g, ' ');
    return tmp;
  }) : [];
  return result;
};

const getGraphicalPCDCDictionary = (project, node, prop) => {
  let project_result = cache.getValue("pcdc_dict_" + project);
  if (project_result == undefined) {
    let result = cache.getValue("pcdc_dict");
    if (result == undefined) {
      let jsonData = shared.readPCDCMapping();
      result = generatePCDCData(jsonData, {});
      //result = generatePCDCData(jsonData, {Relationships: {}});
      cache.setValue("pcdc_dict", result, config.item_ttl);
    }

    project_result = result[project];
    let nodes = Object.keys(project_result);
    //create fake relationship for graphical display purpose

    nodes.forEach((n, i) => {
      if (i - 4 >= 0) {
        let linkItem = {};
        linkItem["name"] = nodes[i - 4];
        linkItem["backref"] = n;
        linkItem["label"] = "of_pcdc";
        linkItem["target_type"] = nodes[i - 4];
        linkItem["required"] = false;

        project_result[n].links.push(linkItem);
      }
    });
    cache.setValue("pcdc_dict_" + project, project_result, config.item_ttl);
  }

  project_result.status = 200;
  return project_result;
};

const generateICDCorCTDCData = (dc, model, node, prop) => {
  const dcMData = dc.mData;
  const dcMPData = dc.mpData;

  const dataList = [];

  for (let [key, value] of Object.entries(dcMData.Nodes)) {
    if (prop && prop !== '' && node && node !== '' && key.toLowerCase() === (node.toLowerCase())) {
      
      if (dcMData.Nodes[key].Props != null) {
        //if(dcMData.Nodes[key].Props.some(item => item.toLowerCase() === prop.toLowerCase())){
        // console.log ("find match prop ", prop );
        // }
        for (var i = 0; i < dcMData.Nodes[key].Props.length; i++) {
          const nodeP = dcMData.Nodes[key].Props[i];
          if (nodeP.toLowerCase() === prop.toLowerCase()) {
            const propertiesItem = {};
            for (var propertyName in dcMPData.PropDefinitions) {
              if (propertyName === nodeP) {
                propertiesItem["model"] = model;
                if ("Category" in value) {
                  propertiesItem["category"] = value.Category;
                } else {
                  propertiesItem["category"] = "Undefined";
                }
                propertiesItem["node_name"] = key;
                propertiesItem["property_name"] = nodeP;

                propertiesItem["description"] = dcMPData.PropDefinitions[propertyName].Desc;

                propertiesItem["value_type"] = (!!dcMPData.PropDefinitions[propertyName].Type && dcMPData.PropDefinitions[propertyName].Type.constructor === Array) ?
                  dcMPData.PropDefinitions[propertyName].Type.sort() : dcMPData.PropDefinitions[propertyName].Type;
                propertiesItem["src"] = dcMPData.PropDefinitions[propertyName].Src;

            dataList.push(propertiesItem)

              }
            }
          }
        }
      }
      return dataList;
    
    } else if (!node || node === '' || key.toLowerCase() === (node.toLowerCase())) {
    
      const item = {};

      item["model"] = model;
      if ("Category" in value) {
        item["category"] = value.Category;
      } else {
        item["category"] = "Undefined";
      }
      item["node_name"] = key;

      const link = [];
      const properties = []; // convert to [] from {}
      const pRequired = [];

      if (dcMData.Nodes[key].Props != null) {
        for (var i = 0; i < dcMData.Nodes[key].Props.length; i++) {
          //console.log(icdcMData.Nodes[key].Props[i]);
          const nodeP = dcMData.Nodes[key].Props[i];
          const propertiesItem = {};
          for (var propertyName in dcMPData.PropDefinitions) {
            if (propertyName === nodeP) {
              propertiesItem["description"] =
                dcMPData.PropDefinitions[propertyName].Desc;

              propertiesItem["value_type"] = (!!dcMPData.PropDefinitions[propertyName].Type && dcMPData.PropDefinitions[propertyName].Type.constructor === Array) ?
                dcMPData.PropDefinitions[propertyName].Type.sort() : dcMPData.PropDefinitions[propertyName].Type;
              propertiesItem["src"] = dcMPData.PropDefinitions[propertyName].Src;

              if (dcMPData.PropDefinitions[propertyName].Req == true) {
                pRequired.push(nodeP);
              }
            }
          }
          //properties[nodeP] = propertiesItem;
          properties.push({ property_name: nodeP, ...propertiesItem });
        }

        item["properties"] = properties;
        item["required"] = pRequired.sort();
      } else {
        item["properties"] = [];
      }

      for (let propertyName in dcMData.Relationships) {
        const linkItem = {};

        const label = propertyName;
        const multiplicity = dcMData.Relationships[propertyName].Mul;
        linkItem["relationship_type"] = label;
        linkItem["multiplicity"] = multiplicity;
        //const required = false;
        let nodeList = [];
        for (
          let i = 0;
          i < dcMData.Relationships[propertyName].Ends.length;
          i++) {
          if (dcMData.Relationships[propertyName].Ends[i].Src == key) {
            const backref = dcMData.Relationships[propertyName].Ends[i].Src;
            const name = dcMData.Relationships[propertyName].Ends[i].Dst;
            const target = dcMData.Relationships[propertyName].Ends[i].Dst;

            nodeList.push({ source: backref, destination: name })

          }
        }
        linkItem["relationship_entity"] = nodeList;
        if (nodeList.length > 0) link.push(linkItem);
      }

      //console.log(link);
      item["relationship"] = link.sort();

      dataList.push(item);
    }
  }

  return dataList;
};

const generatePCDCData = (pcdc_data, filter) => {
  let dataList = {};

  for (let project in pcdc_data) {
    dataList[project] = {};
    let dc = pcdc_data[project];
    for (let [key, value] of Object.entries(dc)) {
      //console.log(key);
      //console.log(value.Category);
      const item = {};
      item["$schema"] = "http://json-schema.org/draft-06/schema#";
      item["id"] = key;
      item["title"] = shared.convert2Title(key);
      if ("Category" in value) {
        item["category"] = project;
      } else {
        item["category"] = project;
      }

      item["program"] = "*";
      item["project"] = "*";
      item["additionalProperties"] = false;
      item["submittable"] = true;
      item["constraints"] = null;
      //item["links"]=[];

      item["type"] = "object";
      const link = [];
      const properties = {};
      const pRequired = [];

      if (value.properties.length > 0) {
        for (var i = 0; i < value.properties.length; i++) {
          //console.log(icdcMData.Nodes[key].Props[i]);
          const nodeP = value.properties[i];
          const propertiesItem = {};
          propertiesItem["description"] = nodeP.p_desc;
          propertiesItem["type"] = nodeP.p_type;
          propertiesItem["src"] = value.n_PT;

          properties[nodeP.p_name] = propertiesItem;
        }

        item["properties"] = properties;
        item["required"] = pRequired;
      } else {
        item["properties"] = {};
      }

      item["links"] = link;

      dataList[project][key] = item;
    }
  }

  return dataList;
};

const processGDCResult = function (result, node, prop ) {
  const dataList = [];
  if(result.length > 0){
    result.map((r) =>{
      if(!node ||  r.id.toLowerCase() === node.toLowerCase()){
        let item = {};
        item["model"] = "GDC";
        item["category"] = r.category;
        item["node_name"] = r.id;
        item["node_description"] = r.description;
        if(prop && prop !== ''){
          if(r.properties){
            for (let propertyName in r.properties) {
              //console.log(propertyName)
             // console.log(r.properties[propertyName]);
              if (propertyName.toLowerCase() === prop.toLowerCase()) {
                //console.log("GDC prop found")
                item["property_name"] = propertyName;
                item["property_description"] = r.properties[propertyName].description;
                item["values"] = r.properties[propertyName].enum;
                item["term_def"] = r.properties[propertyName].termDef;
                dataList.push(item);
              }
            }

          }

        }else{
          let propList =[];
          if(r.properties){
            for (let propertyName in r.properties) {
              let p ={};
                p["property_name"] = propertyName;
                p["property_description"] = r.properties[propertyName].description;
                p["values"] = r.properties[propertyName].enum;
                p["term_def"] = r.properties[propertyName].termDef;
                propList.push(p);             
            }

          }
          item["properties"] = propList;
          item["required"] = r.required;     
          item["relationship"] = r.links;

          dataList.push(item);
        }
      }

    });
  }

  return dataList

};

module.exports = {
  searchP,
  getGraphicalICDCDictionary,
  getGraphicalCTDCDictionary,
  getGraphicalPCDCDictionary,
  getGraphicalGDCDictionary
};

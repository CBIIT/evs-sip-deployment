const cache = require('../../components/cache');
const config = require('../../config');
const fs = require('fs');
const path = require('path');
const yaml = require('yamljs');
const $RefParser = require("@apidevtools/json-schema-ref-parser");

const folderPath = path.join(__dirname, '..', '..', 'data');
const dataFilesPath = path.join(__dirname, '..', '..', 'data_files');
const dataFilesDir = path.join(__dirname, '..', '..', 'data_files');

const generateHighlightInnerHits = () => {
  let highlight = {
    "pre_tags": ["<b>"],
    "post_tags": ["</b>"],
    "fields": {
      "enum.n.have": {"number_of_fragments": 0},
      "enum.n": {"number_of_fragments": 0},
      "enum.n_syn.n_c.have": {"number_of_fragments": 0},
      "enum.n_syn.n_c": {"number_of_fragments": 0},
      "enum.n_syn.s.termName.have": {"number_of_fragments": 0},
      "enum.n_syn.s.termName": {"number_of_fragments": 0},
      "enum.i_c.have": {"number_of_fragments": 0},
      "enum.i_c.c": {"number_of_fragments": 0}
    }
  };
  return highlight;
}

const generateHighlight = () => {
  let highlight = {
    "pre_tags": ["<b>"],
    "post_tags": ["</b>"],
    "fields": {
      "property.have": {"number_of_fragments": 0},
      "property": {"number_of_fragments": 0},
      "property_desc": {"number_of_fragments": 0},
      "cde.id": {"number_of_fragments": 0},
      "id": {"number_of_fragments": 0}
    }
  };
  return highlight;
}

const generateQuery = (keyword, option, isBoolean) => {
  let query = {};
  if(option.match === "exact"){ // Perform exact search
    if (/[^\w\d\s]/g.test(keyword) === true && isBoolean === false) keyword = keyword.replace(/[^\w\d\s]/g, '\\$&') // Escape special characters
    query.bool = {};
    query.bool.should = [];
    let m = {};
    m.query_string = {};
    m.query_string.query = keyword;
    m.query_string.fields = [];
    m.query_string.fields.push("cde.id");
    m.query_string.fields.push("property");
    if (option.desc) {
      m.query_string.fields.push("property_desc");
    }
    query.bool.should.push(m);

    m = {};
    m.nested = {};
    m.nested.path = "enum"
    m.nested.query = {};
    m.nested.query.query_string = {};
    m.nested.query.query_string.fields = [];
    
    if (option.syn) {
      m.nested.query.query_string.fields.push("enum.n_syn.s.termName");
    }
    m.nested.query.query_string.fields.push("enum.n_syn.n_c");
    m.nested.query.query_string.fields.push("enum.n");
    m.nested.query.query_string.fields.push("enum.i_c.c");
    m.nested.query.query_string.query = keyword;
    
    m.nested.inner_hits = {};
    m.nested.inner_hits.from = 0;
    m.nested.inner_hits.size = 1000000;
    m.nested.inner_hits.highlight = generateHighlightInnerHits();
    query.bool.should.push(m);
  }
  else if(option.match !== "exact" && isBoolean === true){ // Perform boolean search
    if (keyword.indexOf("/") !== -1) keyword = keyword.replace(/\//g, "\\/");
    query.bool = {};
    query.bool.should = [];
    let m = {};
    m.query_string = {};
    m.query_string.default_operator = "AND";
    m.query_string.query = keyword;
    m.query_string.fields = [];
    m.query_string.fields.push("cde.id");
    m.query_string.fields.push("property.have");
    if (option.desc) {
      m.query_string.fields.push("property_desc");
    }
    query.bool.should.push(m);

    m = {};
    m.nested = {};
    m.nested.path = "enum"
    m.nested.query = {};
    m.nested.query.query_string = {};
    m.nested.query.query_string.fields = [];
    m.nested.query.query_string.default_operator = "AND";

    if (option.syn) {
      m.nested.query.query_string.fields.push("enum.n_syn.s.termName.have");
    }
    m.nested.query.query_string.fields.push("enum.n_syn.n_c.have");
    m.nested.query.query_string.fields.push("enum.n.have");
    m.nested.query.query_string.fields.push("enum.i_c.have");
    m.nested.query.query_string.query = keyword;

    m.nested.inner_hits = {};
    m.nested.inner_hits.from = 0;
    m.nested.inner_hits.size = 10000000;
    m.nested.inner_hits.highlight = generateHighlightInnerHits();
    query.bool.should.push(m);
  }
  else{ // If it's partial and not a boolean search
  if (keyword.indexOf("/") !== -1) keyword = keyword.replace(/\//g, "\\/");
    query.bool = {};
    query.bool.should = [];

    let m = {};
    m.match_phrase_prefix = {};
    m.match_phrase_prefix["property.have"] = keyword;
    query.bool.should.push(m);

    m = {};
    m.match_phrase_prefix = {};
    m.match_phrase_prefix["cde.id"] = keyword;
    query.bool.should.push(m);

    if (option.desc) {
      m = {};
      m.match_phrase_prefix = {};
      m.match_phrase_prefix["property_desc"] = keyword;
      query.bool.should.push(m);
    }

    m = {};
    m.nested = {};
    m.nested.path = "enum"
    m.nested.query = {};
    m.nested.query.bool = {};
    m.nested.query.bool.should = [];

    let n = {};
    if (option.syn) {
      n = {};
      n.match_phrase_prefix = {};
      n.match_phrase_prefix["enum.n_syn.s.termName.have"] = keyword;
      m.nested.query.bool.should.push(n);
    }
    n = {};
    n.match_phrase_prefix = {};
    n.match_phrase_prefix["enum.n_syn.n_c.have"] = keyword;
    m.nested.query.bool.should.push(n);
    
    n = {};
    n.match_phrase_prefix = {};
    n.match_phrase_prefix["enum.n.have"] = keyword;
    m.nested.query.bool.should.push(n);

    n = {};
    n.match_phrase_prefix = {};
    n.match_phrase_prefix["enum.i_c.have"] = {};
    n.match_phrase_prefix["enum.i_c.have"].query = keyword;
    n.match_phrase_prefix["enum.i_c.have"].analyzer = "my_standard";
    m.nested.query.bool.should.push(n);

    m.nested.inner_hits = {};
    m.nested.inner_hits.from = 0;
    m.nested.inner_hits.size = 1000000;
    m.nested.inner_hits.highlight = generateHighlightInnerHits();
    query.bool.should.push(m);
  }
  return query;
}

const preProcess = (searchable_nodes, data) => {

  // Remove deprecated properties and nodes
  for (let key in data) {
    if (searchable_nodes.indexOf(key) === -1) {
      delete data[key];
    } else if (searchable_nodes.indexOf(key) !== -1 && data[key].deprecated) {
      let deprecated_p = data[key].deprecated;
      deprecated_p.forEach(function (d_p) {
        delete data[key].properties[d_p];
      });
    }
  }
  // get data from $ref: "analyte.yaml#/properties/analyte_type"
  for (let key1 in data) {
    if (data[key1].properties) {
      let p = data[key1].properties;
      for (let key in p) {
        if (key !== '$ref') {
          let ref = Array.isArray(p[key].$ref) ? p[key].$ref[0] : p[key].$ref;
          if (ref && ref.indexOf("_terms.yaml") === -1 && ref.indexOf("_definitions.yaml") === -1) {
            let node = ref.split('#/')[0].replace('.yaml', '');
            let remaining = ref.split('#/')[1];
            let type = remaining.split('/')[0];
            let prop = remaining.split('/')[1];
            if (data[node] && data[node][type] && data[node][type][prop]) {
              p[key] = data[node][type][prop];
            }
          }
        }
      }
    }
  }

  // remove deprecated_enum from enums
  for (let key1 in data) {
    if (data[key1].properties) {
      let p = data[key1].properties;
      for (let key in p) {
        if (p[key].deprecated_enum && p[key].enum) {
          p[key].new_enum = _.differenceWith(p[key].enum, p[key].deprecated_enum, _.isEqual);
        }
      }
    }
  }

  // get all terms definition 
  let term_definition = yaml.load(folderPath + '/_terms.yaml');

  // get $ref for Property
  for (let key1 in data) {
    if (data[key1].properties) {
      let p = data[key1].properties;
      for (let key in p) {
        let property_data = p[key];
        if (property_data.$ref) {
          let ref = Array.isArray(property_data.$ref) ? property_data.$ref[0] : property_data.$ref;
          if (ref.indexOf('_terms.yaml') !== -1) {
            if (ref.indexOf('#/') !== -1) {
              // let file_name = ref.split('#/')[0];
              let ref_property = ref.split('#/')[1];
              let prop = ref_property.split('/')[0];
              // let term_definition = yaml.load(folderPath + '/' + file_name);
              if (term_definition[prop]) {
                property_data.relation = term_definition[prop].common !== undefined ? term_definition[prop].common : term_definition[prop];
              }
            }
          }
        }
      }
    }
  }
  return data;
}

const readNCItDetails = () => {
    let content = fs.readFileSync(dataFilesDir + "/ncit_details.js").toString();
	content = content.replace(/}{/g, ",");
	return JSON.parse(content);
}

const readGDCValues = () => {
    let content = fs.readFileSync(dataFilesDir + "/gdc_values.js").toString();
	return JSON.parse(content);
}

const readConceptCode = () => {
    let content = fs.readFileSync(dataFilesDir + "/conceptCode.js").toString();
	return JSON.parse(content);
}

const readCDEData = () => {
    let content = fs.readFileSync(dataFilesDir + "/cdeData.js").toString();
	content = content.replace(/}{/g, ",");
	return JSON.parse(content);
}

const findObjectWithRef = (obj, updateFn, root_key = '', level = 0) => {
  // iterate over the properties
  for (var propertyName in obj) {

    if ( level === 0 ) root_key = propertyName;

    if ( propertyName === '$ref' ) {
      obj['$ref'] = updateFn(obj['$ref'], root_key);
    }

    // any object that is not a simple value
    if (obj[propertyName] !== null && typeof obj[propertyName] === 'object') {
      // recurse into the object and write back the result to the object graph
      obj[propertyName] = findObjectWithRef(obj[propertyName], updateFn, root_key, (level + 1));
    }
  }
  
  return obj;
};

const generateGDCData = async function(schema) {
  let dict = {};  
  for (let [key, value] of Object.entries(schema)) {
    dict[key.slice(0, -5)] = value;
    
  }
  
  // Recursivly fix references
  dict = findObjectWithRef(dict, (refObj, rootKey)=> { // This halts for sub objects./...

    let tmp = "";

    if ( Array.isArray(refObj)){
        tmp = refObj[0];
    }
    else{
        tmp = refObj;
    }

    if (tmp.includes('.yaml') ) {

      // ABS_FIX
      // "$ref": "_definitions.yaml#/ubiquitous_properties",
      // ->
      // "$ref": "#/_definitions/ubiquitous_properties",

      tmp = "#/" + tmp.replace('.yaml#', '');
     // console.log("ABS FIX -- " + rootKey + ": " + refObj);

    } else {

      // REL FIX
      // "$ref": "#/state"
      // ->
      // "$ref": "#/{_definitions aka root key}/state"
      
      tmp = '#/' + rootKey + '/' + tmp.replace('#/', '');
      //console.log("REL FIX -- " + rootKey + ": " + refObj);
    }


    return tmp;
  });

  // Append metaschema TODO?? Doesn't seem to matter anymore

  // This is a HACK FIX ME!!@!!!
  
  dict['_terms']['file_format'] = {description: 'wut'};


  let newDict = await $RefParser.dereference(dict, {
    continueOnError: false,            // Don't throw on the first error
    dereference: {
      circular: true                 // Don't allow circular $refs
    }
  });

  const result = Object.keys(newDict).reduce(function(filtered, key){
    
    console.log(newDict[key].id);
    console.log(newDict[key].category);
    let tmp = newDict[key].category;

    if(tmp != undefined){
      tmp = tmp.toLowerCase();
    }
    
    if(tmp == undefined || (tmp !== 'tbd' && tmp !== 'data') ){
      filtered[key] = newDict[key];
    }
    return filtered;
  }, {});

  return result;
}

const generateICDCorCTDCData = (dc) => {
  const dcMData = dc.mData;
  const dcMPData = dc.mpData;

  const dataList={};
 
  for (let [key, value] of Object.entries(dcMData.Nodes)) {
    //console.log(key);
    //console.log(value.Category);
    const item = {}
    item["$schema"] = "http://json-schema.org/draft-06/schema#";
    item["id"] = key;
    item["title"]=key;
    if("Category" in value){
      item["category"]=value.Category;
    }
    else{
      item["category"]="Undefined";
    }
    
    item["program"]="*";
    item["project"]="*";
    item["additionalProperties"]=false;
    item["submittable"]=true;
    item["constraints"]=null;
    //item["links"]=[];
    
    item["type"]="object";
    const link=[];
    const properties={};
    const pRequired=[];
    
    if (dcMData.Nodes[key].Props != null ) {
     
      for(var i=0;i<dcMData.Nodes[key].Props.length;i++){
        //console.log(icdcMData.Nodes[key].Props[i]);
        const nodeP=dcMData.Nodes[key].Props[i];
        const propertiesItem={};
        for(var propertyName in dcMPData.PropDefinitions){
          
          if(propertyName==nodeP){
            
            propertiesItem["description"]=dcMPData.PropDefinitions[propertyName].Desc;
            propertiesItem["type"]=dcMPData.PropDefinitions[propertyName].Type;
            propertiesItem["src"]=dcMPData.PropDefinitions[propertyName].Src;
            
            if(dcMPData.PropDefinitions[propertyName].Req==true){
              pRequired.push(nodeP);
            }


          }
        }
        properties[nodeP]=propertiesItem;

      }

      item["properties"]=properties;
      item["required"]=pRequired;

    }else{
      item["properties"]={};
    }
    
    
    for (var propertyName in dcMData.Relationships) {
      const linkItem={};
      //console.log(propertyName);
      //console.log(icdcMData.Relationships[propertyName]);
      //console.log(icdcMData.Relationships[propertyName].Ends);
      const label=propertyName;
      const multiplicity=dcMData.Relationships[propertyName].Mul;
      const required=false;
      for(var i=0;i<dcMData.Relationships[propertyName].Ends.length;i++){
        
        if(dcMData.Relationships[propertyName].Ends[i].Src==key){
          const backref=dcMData.Relationships[propertyName].Ends[i].Src;
          const name=dcMData.Relationships[propertyName].Ends[i].Dst;
          const target=dcMData.Relationships[propertyName].Ends[i].Dst;

          linkItem["name"]=name;
          linkItem["backref"]=backref;
          linkItem["label"]=label;
          linkItem["target_type"]=target;
          linkItem["required"]=required;
          
          link.push(linkItem);
        }
      }
      
    }

    //console.log(link);
    item["links"]=link;

    dataList[key]=item;
  }
 
  return dataList;
}

const getGraphicalGDCDictionary = async function() {
    let result = cache.getValue("gdc_dict");
    if(result == undefined){
        let jsonData = {};
        var termsJson = yaml.load(folderPath + '/_terms.yaml');
        jsonData["_terms.yaml"] = termsJson;
        var defJson = yaml.load(folderPath + '/_definitions.yaml');
        jsonData["_definitions.yaml"] = defJson;
        // let bulkBody = [];
        fs.readdirSync(folderPath).forEach(file => {
            if (file.indexOf('_') !== 0 && file !== 'annotation.yaml' && file !== 'metaschema.yaml') {
              let fileJson = yaml.load(folderPath + '/' + file);
              jsonData[file] = fileJson;
            }
        });
        result = await generateGDCData(jsonData);
        cache.setValue("gdc_dict", result, config.item_ttl);
    }

    return result;
}

const getGraphicalICDCDictionary = () => {

    let result = cache.getValue("icdc_dict");
    if(result == undefined){
        let jsonData = {};
        var mpJson = yaml.load(dataFilesPath + '/ICDC/icdc-model-props.yml');
        jsonData.mpData = mpJson;
        var mJson = yaml.load(dataFilesPath + '/ICDC/icdc-model.yml');
        jsonData.mData = mJson;
        result = generateICDCorCTDCData(jsonData);
        cache.setValue("icdc_dict", result, config.item_ttl);
    }
    return result;
}

const getGraphicalCTDCDictionary = () => {
    
    let result = cache.getValue("ctdc_dict");
    if(result == undefined){
        let jsonData = {};
        var mpJson = yaml.load(dataFilesPath + '/CTDC/ctdc_model_properties_file.yaml');
        jsonData.mpData = mpJson;
        var mJson = yaml.load(dataFilesPath + '/CTDC/ctdc_model_file.yaml');
        jsonData.mData = mJson;
        result = generateICDCorCTDCData(jsonData);
        cache.setValue("ctdc_dict", result, config.item_ttl);
    }
    return result;
}

module.exports = {
    generateHighlight,
    generateQuery,
    readNCItDetails,
    preProcess,
    readGDCValues,
    readConceptCode,
    readCDEData,
    getGraphicalGDCDictionary,
    getGraphicalICDCDictionary,
    getGraphicalCTDCDictionary
};

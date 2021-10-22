/**
 * Client for elasticsearch
 */
const fs = require('fs');
const path = require('path');
const elasticsearch = require('elasticsearch');
const yaml = require('yamljs');
const config = require('../config');
const config_dev = require('../routes/dev');
const logger = require('./logger');
const cache = require('./cache');
const extend = require('util')._extend;
const _ = require('lodash');
const shared = require('../service/search/shared');
const folderPath = path.join(__dirname, '..', 'data_files', 'GDC', 'model');
var allTerm = {};
var icdo_mapping = shared.getICDOMapping();
var icdo2Exclude = shared.getParentICDO();
var gdc_values = {};
var gdc_props = {};
var gdc_nodes = {};
var allProperties = [];
var unloaded_ncits = [];

var esClient = new elasticsearch.Client({
  host: config_dev.elasticsearch.host,
  log: config_dev.elasticsearch.log,
  requestTimeout: config_dev.elasticsearch.requestTimeout
});

const helper_gdc = (fileJson, syns) => {
  let properties = fileJson.properties;

  let n_ncit = [];
  if (gdc_nodes[fileJson.id]) {
    let n_tmp = {};
    n_tmp.c = gdc_nodes[fileJson.id].toUpperCase();
    n_tmp.l = (n_tmp.c !== '' && syns[n_tmp.c] ? syns[n_tmp.c].label : "");
    let synonyms = (n_tmp.c !== '' && syns[n_tmp.c] ? syns[n_tmp.c].synonyms : []);
    if (syns[n_tmp.c] == undefined) {
      console.log("Don't have the ncit data for:" + n_tmp.c);
      if (unloaded_ncits.indexOf(n_tmp.c) == -1) {
        unloaded_ncits.push(n_tmp.c);
      }
    }
    if (synonyms.length > 0) {
      n_tmp.s = [];
      synonyms.forEach(s => {
        n_tmp.s.push({
          n: s.termName,
          t: s.termGroup,
          src: s.termSource
        });
      });
    }
    n_ncit.push(n_tmp);
  }


  for (var prop in properties) {
    let entry = {};
    let p = {};
    let entryRaw = properties[prop];

    p.source = "gdc";
    p.category = fileJson.category;
    p.node = {};
    p.node.n = fileJson.id;
    p.node.d = fileJson.description;
    if (n_ncit.length > 0) {
      p.node.ncit = n_ncit;
    }
    p.prop = {};
    p.prop.n = prop;
    p.prop.d = entryRaw.description;
    p.id = p.prop.n + "/" + p.node.n + "/" + p.category;

    let p_id = p.category + "." + p.node.n + "." + p.prop.n;
    if (p_id in gdc_props) {
      p.prop.ncit = [];
      let tmp = {};
      tmp.c = gdc_props[p_id].toUpperCase();
      tmp.l = (tmp.c !== '' && syns[tmp.c] ? syns[tmp.c].label : "");
      let synonyms = (tmp.c !== '' && syns[tmp.c] ? syns[tmp.c].synonyms : []);
      if (syns[tmp.c] == undefined) {
        console.log("Don't have the ncit data for:" + tmp.c);
        if (unloaded_ncits.indexOf(tmp.c) == -1) {
          unloaded_ncits.push(tmp.c);
        }
      }
      if (synonyms.length > 0) {
        tmp.s = [];
        synonyms.forEach(s => {
          tmp.s.push({
            n: s.termName,
            t: s.termGroup,
            src: s.termSource
          });
        });
      }
      p.prop.ncit.push(tmp);
    }

    p.type = entryRaw.type;

    entry.enum = extend([], entryRaw.enum || (entryRaw.items && entryRaw.items.enum ? entryRaw.items.enum : []));
    entry.enumDef = entryRaw.enumDef ? entryRaw.enumDef : [];
    entry.termDef = extend({}, entryRaw.termDef);
    entry.deprecated_enum = extend([], entryRaw.deprecated_enum);

    if (entry.termDef !== undefined && entry.termDef.cde_id !== undefined && entry.termDef.cde_id !== null) {
      entry.termDef.cde_id = '' + entry.termDef.cde_id;
      if (entry.termDef.source === 'caDSR') {
        p.prop.cde = {};
        p.prop.cde.c = entry.termDef.cde_id;
        p.prop.cde.url = entry.termDef.term_url;
        p.prop.cde.src = 'CDE';
      }
    }

    //generate p.enum, need to consolidate values in entry.enum, conceptCode and gdc_values
    //p.enum should have the following format:
    //enum:[
    //  {
    //    n: "Abdomen, NOS",
    //    icdo: {
    //        c: "C76.2", 
    //        have: ["C76", "C76.2"],
    //        s: [
    //          {n: "Abdomen, NOS", t: "PT"},
    //          {n: "Abdominal wall, NOS", t: "RT"},
    //          ...
    //        ]
    //      },
    //    ncit: [
    //      {
    //        c: "C12664", 
    //        s: [
    //          {n: "ABDOMINAL CAVITY", t: "PT", src: "CDISC"},
    //          ...
    //        ]
    //      },
    //      ...
    //    ]
    //  },
    //  ...
    //]
    let values = [];
    let values_ncit_mapping = {};
    let values_icdo_mapping = {};
    // 1. work on entry.enum and entry.enumDef
    entry.enum.forEach(v => {
      values.push(v);
      values_ncit_mapping[v.toLowerCase()] = [];
    });

    /*
    for(let key in entry.enumDef){
      let obj = entry.enumDef[key];
      let v = key.toLowerCase();
      if(v in values_ncit_mapping){
        if(obj && obj.termDef && obj.termDef.term_id && values_ncit_mapping[v].indexOf(obj.termDef.term_id.trim()) == -1){
          values_ncit_mapping[v].push(obj.termDef.term_id.trim());
        }
      }
    }
    */

    // 2. work on conceptCode to further combind the ncit code
    // depracted as data mappings in conceptCode.js file have already been included in gdc_values.js file

    let prop_full_name = p.category + '.' + p.node.n + '.' + p.prop.n;

    // 3. work on gdc_values to pull out icd-o-3 code and ncit code for all the values saved in the previous 3 steps
    if (prop_full_name in gdc_values) {
      let enums = [];
      let obj = gdc_values[prop_full_name];
      obj.forEach(v => {
        if (!(v.term_type && v.term_type == "HT")) {
          //only pick data at child level instead of parent level
          if (icdo2Exclude.indexOf(v.nm) > -1) {
            return;
          }
          let pv = v.nm.toLowerCase();
          let icdo = v.i_c;
          let ncits = v.n_c;
          if (pv in values_ncit_mapping) {
            //save values to ncit mapping
            if (Array.isArray(ncits)) {
              ncits.forEach(code => {
                if (values_ncit_mapping[pv].indexOf(code.trim()) == -1) {
                  values_ncit_mapping[pv].push(code.trim());
                }
              });
            }
            else {
              if (ncits != "" && values_ncit_mapping[pv].indexOf(ncits.trim()) == -1) {
                values_ncit_mapping[pv].push(ncits.trim());
              }
            }

            //save values to icdo mapping
            if (!(pv in values_icdo_mapping)) {
              values_icdo_mapping[pv] = icdo;
            }
          }
        }

      });
    }

    if (entry.deprecated_enum) {
      values = _.differenceWith(values, entry.deprecated_enum, _.isEqual);
    }

    //generate p.enum
    if (values.length > 0) {
      p.enum = [];
      values.forEach(function (v) {
        let tmp = {};
        tmp.n = v;
        let v_lowcase = v.toLowerCase();
        if (v_lowcase in values_icdo_mapping) {

          if (values_icdo_mapping[v_lowcase] != "") {
            tmp.icdo = {};
            tmp.icdo.c = values_icdo_mapping[v_lowcase];
            tmp.icdo.have = shared.generateICDOHaveWords(tmp.icdo.c),
              tmp.icdo.s = [];
            for (let key in icdo_mapping[tmp.icdo.c].syn) {
              let entry = { n: key, t: icdo_mapping[tmp.icdo.c].syn[key] };
              tmp.icdo.s.push(entry);
            }
          }

        }
        if (v_lowcase in values_ncit_mapping) {
          tmp.ncit = [];
          let ncits = values_ncit_mapping[v_lowcase];
          ncits.forEach(n => {
            if (n == undefined || n == '') return;
            let dict = {};
            dict.c = n.toUpperCase();
            dict.l = (n !== '' && syns[dict.c] ? syns[dict.c].label : "");
            let synonyms = (n !== '' && syns[dict.c] ? syns[dict.c].synonyms : []);
            if (syns[dict.c] == undefined) {
              console.log("Don't have the ncit data for:" + dict.c);
              if (unloaded_ncits.indexOf(dict.c) == -1) {
                unloaded_ncits.push(dict.c);
              }
            }
            if (synonyms.length > 0) {
              dict.s = [];
              synonyms.forEach(s => {
                dict.s.push({
                  n: s.termName,
                  t: s.termGroup,
                  src: s.termSource
                });
              });
            }
            tmp.ncit.push(dict);
          });
        }
        p.enum.push(tmp);
      });
    }

    //building typeahead index, need to collect from properties, CDE ID, values, ICDO3 codes and NCIt codes
    //collect properties
    if (p.prop.n in allTerm) {
      // if exist, then check if have the same type
      let t = allTerm[p.prop.n];
      if (t.indexOf('property') === -1) {
        t.push('property');
      }
    } else {
      let t = [];
      t.push('property');
      allTerm[p.prop.n] = t;
    }

    // collect CDE ID
    if (p.prop.cde) {
      let em = p.prop.cde.c.toString().trim().toLowerCase();
      if (em in allTerm) {
        // if exist, then check if have the same type
        let t = allTerm[em];
        if (t.indexOf('cde id') === -1) {
          t.push('cde id');
        }
      } else {
        let t = [];
        t.push('cde id');
        allTerm[em] = t;
      }
    }

    //collect values
    if (values.length > 0) {
      values.forEach(function (v) {
        let em = v.toString().trim().toLowerCase();
        if (em in allTerm) {
          // if exist, then check if have the same type
          let t = allTerm[em];
          if (t.indexOf("value") == -1) {
            t.push("value");
          }
        } else {
          let t = [];
          t.push("value");
          allTerm[em] = t;
        }
      });
    }

    //collect ICDO3 codes
    if (Object.keys(values_icdo_mapping).length > 0) {
      for (let key in values_icdo_mapping) {
        let em = values_icdo_mapping[key].toString().trim().toLowerCase();
        if (em in allTerm) {
          // if exist, then check if have the same type
          let t = allTerm[em];
          if (t.indexOf("icdo3 code") == -1) {
            t.push("icdo3 code");
          }
        } else {
          let t = [];
          t.push("icdo3 code");
          allTerm[em] = t;
        }
      }
    }

    //collect node and properties' NCIt codes
    if (p.node.ncit) {
      let ncits = p.node.ncit;
      ncits.forEach(n => {
        let em = n.c.trim().toLowerCase();
        if (em in allTerm) {
          //if exist, then check if have the same type
          let t = allTerm[em];
          if (t.indexOf("ncit code") == -1) {
            t.push("ncit code");
          }
        } else {
          let t = [];
          t.push("ncit code");
          allTerm[em] = t;
        }
      });
    }
    if (p.prop.ncit) {
      let ncits = p.prop.ncit;
      ncits.forEach(n => {
        let em = n.c.trim().toLowerCase();
        if (em in allTerm) {
          //if exist, then check if have the same type
          let t = allTerm[em];
          if (t.indexOf("ncit code") == -1) {
            t.push("ncit code");
          }
        } else {
          let t = [];
          t.push("ncit code");
          allTerm[em] = t;
        }
      });
    }


    //collect values' NCIt codes
    if (Object.keys(values_ncit_mapping).length > 0) {
      for (let key in values_ncit_mapping) {
        let ncits = values_ncit_mapping[key];
        ncits.forEach(n => {
          if (n == undefined || n == '') return;
          let em = n.toString().trim().toLowerCase();
          if (em in allTerm) {
            //if exist, then check if have the same type
            let t = allTerm[em];
            if (t.indexOf("ncit code") == -1) {
              t.push("ncit code");
            }
          } else {
            let t = [];
            t.push("ncit code");
            allTerm[em] = t;
          }
        });
      }
    }



    // property type
    if (p.enum !== undefined && p.enum.length > 0) {
      p.type = 'enum';
    }
    allProperties.push(p);
  }

}

const helper_icdc = (dict, icdc_mapping, syns) => {
  for (let node_name in dict) {
    let properties = dict[node_name].properties;

    let mapping_dict = {};
    if (icdc_mapping[node_name] && icdc_mapping[node_name].properties) {
      icdc_mapping[node_name].properties.forEach(prop => {
        mapping_dict[prop.p_name] = prop;
      });
    }


    for (var prop in properties) {
      let entry = {};
      let p = {};
      let values = [];
      let ncits = [];
      let entryRaw = properties[prop];
      let mappingEntryRaw = mapping_dict[prop];

      p.source = "icdc";
      p.category = dict[node_name].category;
      p.node = {};
      p.node.n = dict[node_name].id;
      p.node.d = dict[node_name].description || "";
      p.prop = {};
      p.prop.n = prop;
      p.prop.d = entryRaw.description;
      p.id = p.prop.n + "/" + p.node.n + "/" + p.category;

      if (["string", "number", "integer", "boolean", "TBD", "datetime"].indexOf(entryRaw.type) > -1) {
        p.type = entryRaw.type;
      }
      else if (Array.isArray(entryRaw.type)) {
        let arr = entryRaw.type;
        if (arr.length == 1 && arr[0].indexOf('http') == 0) {
          //this is a reference to other http resource
          p.type = arr[0];
        }
        else {
          //p.enum should have the following format:
          //enum:[
          //  {
          //    n: "Abdomen, NOS",
          //    icdo: {
          //        c: "C76.2", 
          //        have: ["C76", "C76.2"],
          //        s: [
          //          {n: "Abdomen, NOS", t: "PT"},
          //          {n: "Abdominal wall, NOS", t: "RT"},
          //          ...
          //        ]
          //      },
          //    ncit: [
          //      {
          //        c: "C12664", 
          //        s: [
          //          {n: "ABDOMINAL CAVITY", t: "PT", src: "CDISC"},
          //          ...
          //        ]
          //      },
          //      ...
          //    ]
          //  },
          //  ...
          //]
          p.type = "enum";
          //add values and ncit codes
          p.enum = [];
          let values_dict = {};
          if (mappingEntryRaw && mappingEntryRaw.values) {
            mappingEntryRaw.values.forEach(entry => {
              values_dict[entry.v_name.toLowerCase()] = entry;
            });
          }

          entryRaw.type.forEach(v => {
            let tmp = {};
            tmp.n = v;
            let v_lowcase = v.toLowerCase();
            tmp.ncit = [];
            if (values_dict[v_lowcase] && values_dict[v_lowcase].v_n_code && values_dict[v_lowcase].v_n_code.trim() != "") {
              let dict = {};
              dict.c = values_dict[v_lowcase].v_n_code.trim();
              dict.l = (syns[values_dict[v_lowcase].v_n_code] ? syns[values_dict[v_lowcase].v_n_code].label : "");
              let synonyms = (syns[values_dict[v_lowcase].v_n_code] ? syns[values_dict[v_lowcase].v_n_code].synonyms : []);
              if (syns[values_dict[v_lowcase].v_n_code] == undefined) {
                console.log("Don't have the ncit data for:" + dict.c);
                if (unloaded_ncits.indexOf(dict.c) == -1) {
                  unloaded_ncits.push(dict.c);
                }
              }
              if (synonyms.length > 0) {
                dict.s = [];
                synonyms.forEach(s => {
                  dict.s.push({
                    n: s.termName,
                    t: s.termGroup,
                    src: s.termSource
                  });
                });
              }
              tmp.ncit.push(dict);
              ncits.push(dict.c.toLowerCase());
            }
            p.enum.push(tmp);
            values.push(v_lowcase);
          });
          values = _.uniq(values.concat(Object.keys(values_dict)));
          ncits = _.uniq(ncits);
        }
      }
      else {
        if (entryRaw.type && entryRaw.type.value_type) {
          //this is a reference to other http resource
          p.type = entryRaw.type.value_type + " units " + entryRaw.type.units.join('/');
        } else {
          p.type = "object";
        }

      }

      if (mappingEntryRaw && mappingEntryRaw.p_n_code) {
        /*
        p.cde = {};
        p.cde.id = mappingEntryRaw.p_n_code;
        //p.cde.v = entry.termDef.cde_version;
        p.cde.url = "https://ncit.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_Thesaurus&ns=ncit&code=" + p.cde.id;
        p.cde.src = 'NCIt';
        */
        p.prop.ncit = [];
        let tmp = {};
        tmp.c = mappingEntryRaw.p_n_code.toUpperCase();
        tmp.l = (tmp.c !== '' && syns[tmp.c] ? syns[tmp.c].label : "");
        let synonyms = (tmp.c !== '' && syns[tmp.c] ? syns[tmp.c].synonyms : []);
        if (syns[tmp.c] == undefined) {
          console.log("Don't have the ncit data for:" + tmp.c);
          if (unloaded_ncits.indexOf(tmp.c) == -1) {
            unloaded_ncits.push(tmp.c);
          }
        }
        if (synonyms.length > 0) {
          tmp.s = [];
          synonyms.forEach(s => {
            tmp.s.push({
              n: s.termName,
              t: s.termGroup,
              src: s.termSource
            });
          });
        }
        p.prop.ncit.push(tmp);
      }

      //building typeahead index, need to collect from properties, CDE ID, values, NCIt codes
      //collect properties
      if (p.prop.n in allTerm) {
        // if exist, then check if have the same type
        let t = allTerm[p.prop.n];
        if (t.indexOf('property') === -1) {
          t.push('property');
        }
      } else {
        let t = [];
        t.push('property');
        allTerm[p.prop.n] = t;
      }

      //collect values
      if (values.length > 0) {
        values.forEach(function (em) {
          if (em in allTerm) {
            // if exist, then check if have the same type
            let t = allTerm[em];
            if (t.indexOf("value") == -1) {
              t.push("value");
            }
          } else {
            let t = [];
            t.push("value");
            allTerm[em] = t;
          }
        });
      }

      //collect properties' NCIt codes
      if (p.prop.ncit) {
        let ncits = p.prop.ncit;
        ncits.forEach(n => {
          let em = n.c.trim().toLowerCase();
          if (em in allTerm) {
            //if exist, then check if have the same type
            let t = allTerm[em];
            if (t.indexOf("ncit code") == -1) {
              t.push("ncit code");
            }
          } else {
            let t = [];
            t.push("ncit code");
            allTerm[em] = t;
          }
        });
      }

      //collect values' NCIt codes
      if (ncits.length > 0) {
        ncits.forEach(em => {
          if (em == undefined || em == '') return;
          if (em in allTerm) {
            //if exist, then check if have the same type
            let t = allTerm[em];
            if (t.indexOf("ncit code") == -1) {
              t.push("ncit code");
            }
          } else {
            let t = [];
            t.push("ncit code");
            allTerm[em] = t;
          }
        });
      }

      allProperties.push(p);
    }
  }
}

const helper_ctdc = (dict, ctdc_mapping, syns) => {
  for (let node_name in dict) {
    let properties = dict[node_name].properties;

    let mapping_dict = {};
    if (ctdc_mapping[node_name] && ctdc_mapping[node_name].properties) {
      ctdc_mapping[node_name].properties.forEach(prop => {
        mapping_dict[prop.p_name] = prop;
      });
    }

    let n_ncit = [];
    if (ctdc_mapping[node_name] && ctdc_mapping[node_name].n_n_code) {
      let n_tmp = {};
      n_tmp.c = ctdc_mapping[node_name].n_n_code.toUpperCase();
      n_tmp.l = (n_tmp.c !== '' && syns[n_tmp.c] ? syns[n_tmp.c].label : "");
      let synonyms = (n_tmp.c !== '' && syns[n_tmp.c] ? syns[n_tmp.c].synonyms : []);
      if (syns[n_tmp.c] == undefined) {
        console.log("Don't have the ncit data for:" + n_tmp.c);
        if (unloaded_ncits.indexOf(n_tmp.c) == -1) {
          unloaded_ncits.push(n_tmp.c);
        }
      }
      if (synonyms.length > 0) {
        n_tmp.s = [];
        synonyms.forEach(s => {
          n_tmp.s.push({
            n: s.termName,
            t: s.termGroup,
            src: s.termSource
          });
        });
      }
      n_ncit.push(n_tmp);
    }


    for (var prop in properties) {
      let entry = {};
      let p = {};
      let values = [];
      let ncits = [];
      let entryRaw = properties[prop];
      let mappingEntryRaw = mapping_dict[prop];

      p.source = "ctdc";
      p.category = dict[node_name].category;
      p.node = {};
      p.node.n = dict[node_name].id;
      p.node.d = dict[node_name].description || "";
      if (n_ncit.length > 0) {
        p.node.ncit = n_ncit;
      }
      p.prop = {};
      p.prop.n = prop;
      p.prop.d = entryRaw.description;
      p.id = p.prop.n + "/" + p.node.n + "/" + p.category;

      if (["string", "number", "integer", "boolean", "TBD", "datetime"].indexOf(entryRaw.type) > -1) {
        p.type = entryRaw.type;
      }
      else if (Array.isArray(entryRaw.type)) {
        let arr = entryRaw.type;
        if (arr.length == 1 && arr[0].indexOf('http') == 0) {
          //this is a reference to other http resource
          p.type = arr[0];
        }
        else {
          //p.enum should have the following format:
          //enum:[
          //  {
          //    n: "Abdomen, NOS",
          //    icdo: {
          //        c: "C76.2", 
          //        have: ["C76", "C76.2"],
          //        s: [
          //          {n: "Abdomen, NOS", t: "PT"},
          //          {n: "Abdominal wall, NOS", t: "RT"},
          //          ...
          //        ]
          //      },
          //    ncit: [
          //      {
          //        c: "C12664", 
          //        s: [
          //          {n: "ABDOMINAL CAVITY", t: "PT", src: "CDISC"},
          //          ...
          //        ]
          //      },
          //      ...
          //    ]
          //  },
          //  ...
          //]
          p.type = "enum";
          //add values and ncit codes
          p.enum = [];
          let values_dict = {};
          if (mappingEntryRaw && mappingEntryRaw.values) {
            mappingEntryRaw.values.forEach(entry => {
              values_dict[entry.v_name.toLowerCase()] = entry;
            });
          }

          entryRaw.type.forEach(v => {
            let tmp = {};
            tmp.n = v;
            let v_lowcase = v.toLowerCase();
            tmp.ncit = [];
            if (values_dict[v_lowcase] && values_dict[v_lowcase].v_n_code && values_dict[v_lowcase].v_n_code.trim() != "") {
              let dict = {};
              dict.c = values_dict[v_lowcase].v_n_code.trim();
              dict.l = (syns[values_dict[v_lowcase].v_n_code] ? syns[values_dict[v_lowcase].v_n_code].label : "");
              let synonyms = (syns[values_dict[v_lowcase].v_n_code] ? syns[values_dict[v_lowcase].v_n_code].synonyms : []);
              if (syns[values_dict[v_lowcase].v_n_code] == undefined) {
                console.log("Don't have the ncit data for:" + dict.c);
                if (unloaded_ncits.indexOf(dict.c) == -1) {
                  unloaded_ncits.push(dict.c);
                }
              }
              if (synonyms.length > 0) {
                dict.s = [];
                synonyms.forEach(s => {
                  dict.s.push({
                    n: s.termName,
                    t: s.termGroup,
                    src: s.termSource
                  });
                });
              }
              tmp.ncit.push(dict);
              ncits.push(dict.c.toLowerCase());
            }
            p.enum.push(tmp);
            values.push(v_lowcase);
          });
          values = _.uniq(values.concat(Object.keys(values_dict)));
          ncits = _.uniq(ncits);
        }
      }
      else {
        p.type = "object";
      }

      if (mappingEntryRaw && mappingEntryRaw.p_n_code) {
        /*
        p.cde = {};
        p.cde.id = mappingEntryRaw.p_n_code;
        //p.cde.v = entry.termDef.cde_version;
        p.cde.url = "https://ncit.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_Thesaurus&ns=ncit&code=" + p.cde.id;
        p.cde.src = 'NCIt';
        */
        p.prop.ncit = [];
        let tmp = {};
        tmp.c = mappingEntryRaw.p_n_code.toUpperCase();
        tmp.l = (tmp.c !== '' && syns[tmp.c] ? syns[tmp.c].label : "");
        let synonyms = (tmp.c !== '' && syns[tmp.c] ? syns[tmp.c].synonyms : []);
        if (syns[tmp.c] == undefined) {
          console.log("Don't have the ncit data for:" + tmp.c);
          if (unloaded_ncits.indexOf(tmp.c) == -1) {
            unloaded_ncits.push(tmp.c);
          }
        }
        if (synonyms.length > 0) {
          tmp.s = [];
          synonyms.forEach(s => {
            tmp.s.push({
              n: s.termName,
              t: s.termGroup,
              src: s.termSource
            });
          });
        }
        p.prop.ncit.push(tmp);
      }

      //building typeahead index, need to collect from properties, CDE ID, values, NCIt codes
      //collect properties
      if (p.prop.n in allTerm) {
        // if exist, then check if have the same type
        let t = allTerm[p.prop.n];
        if (t.indexOf('property') === -1) {
          t.push('property');
        }
      } else {
        let t = [];
        t.push('property');
        allTerm[p.prop.n] = t;
      }

      //collect values
      if (values.length > 0) {
        values.forEach(function (em) {
          if (em in allTerm) {
            // if exist, then check if have the same type
            let t = allTerm[em];
            if (t.indexOf("value") == -1) {
              t.push("value");
            }
          } else {
            let t = [];
            t.push("value");
            allTerm[em] = t;
          }
        });
      }

      //collect node and properties' NCIt codes
      if (p.node.ncit) {
        let ncits = p.node.ncit;
        ncits.forEach(n => {
          let em = n.c.trim().toLowerCase();
          if (em in allTerm) {
            //if exist, then check if have the same type
            let t = allTerm[em];
            if (t.indexOf("ncit code") == -1) {
              t.push("ncit code");
            }
          } else {
            let t = [];
            t.push("ncit code");
            allTerm[em] = t;
          }
        });
      }
      if (p.prop.ncit) {
        let ncits = p.prop.ncit;
        ncits.forEach(n => {
          let em = n.c.trim().toLowerCase();
          if (em in allTerm) {
            //if exist, then check if have the same type
            let t = allTerm[em];
            if (t.indexOf("ncit code") == -1) {
              t.push("ncit code");
            }
          } else {
            let t = [];
            t.push("ncit code");
            allTerm[em] = t;
          }
        });
      }

      //collect values' NCIt codes
      if (ncits.length > 0) {
        ncits.forEach(em => {
          if (em == undefined || em == '') return;
          if (em in allTerm) {
            //if exist, then check if have the same type
            let t = allTerm[em];
            if (t.indexOf("ncit code") == -1) {
              t.push("ncit code");
            }
          } else {
            let t = [];
            t.push("ncit code");
            allTerm[em] = t;
          }
        });
      }

      allProperties.push(p);
    }
  }
}

const helper_pcdc = (pcdc_data, syns) => {
  for (let project in pcdc_data) {
    let pcdc_mapping = pcdc_data[project];
    for (let node_name in pcdc_mapping) {
      let properties = pcdc_mapping[node_name].properties;
      let n_n_code = pcdc_mapping[node_name].n_n_code;

      properties.map((prop) => {
        let p = {};
        let ncits = [];
        let values = [];

        p.source = "pcdc";
        p.category = project;
        p.node = {};
        p.node.n = node_name;
        if (n_n_code.trim() != "") {
          p.node.ncit = [];
          let dict = {};
          dict.c = n_n_code.trim();
          dict.l = syns[dict.c] ? syns[dict.c].label : "";
          let synonyms = syns[dict.c] ? syns[dict.c].synonyms : [];
          if (syns[dict.c] == undefined) {
            console.log("Don't have the ncit data for:" + dict.c);
            if (unloaded_ncits.indexOf(dict.c) == -1) {
              unloaded_ncits.push(dict.c);
            }
          }
          dict.s = [];
          if (synonyms.length > 0) {
            synonyms.forEach((s) => {
              dict.s.push({
                n: s.termName,
                t: s.termGroup,
                src: s.termSource,
              });
            });
          }
          p.node.ncit.push(dict);
        }

        p.prop = {};
        p.prop.n = prop.p_name;
        p.prop.d = prop.p_desc;
        if (prop.p_n_code.trim() != "") {
          p.prop.ncit = [];
          let dict = {};
          dict.c = prop.p_n_code.trim();
          dict.l = syns[dict.c] ? syns[dict.c].label : "";
          let synonyms = syns[dict.c] ? syns[dict.c].synonyms : [];
          if (syns[dict.c] == undefined) {
            console.log("Don't have the ncit data for:" + dict.c);
            if (unloaded_ncits.indexOf(dict.c) == -1) {
              unloaded_ncits.push(dict.c);
            }
          }
          dict.s = [];
          if (synonyms.length > 0) {
            synonyms.forEach((s) => {
              dict.s.push({
                n: s.termName,
                t: s.termGroup,
                src: s.termSource,
              });
            });
          }
          p.prop.ncit.push(dict);
        }
        p.id = p.prop.n + "/" + p.node.n + "/" + p.category;

        p.type = prop.p_type;

        p.enum = [];

        prop.values.map((v) => {
          let tmp = {};
          tmp.n = v.v_name;
          tmp.ncit = [];
          if (v.v_n_code.trim() != "") {
            let dict = {};
            dict.c = v.v_n_code.trim();
            dict.l = syns[dict.c] ? syns[dict.c].label : "";
            let synonyms = syns[dict.c] ? syns[dict.c].synonyms : [];
            if (syns[dict.c] == undefined) {
              console.log("Don't have the ncit data for:" + dict.c);
              if (unloaded_ncits.indexOf(dict.c) == -1) {
                unloaded_ncits.push(dict.c);
              }
            }
            dict.s = [];
            if (synonyms.length > 0) {
              synonyms.forEach((s) => {
                dict.s.push({
                  n: s.termName,
                  t: s.termGroup,
                  src: s.termSource,
                });
              });
            }
            tmp.ncit.push(dict);
            ncits.push(dict.c.toLowerCase());
          }
          p.enum.push(tmp);
          values.push(tmp.n.toLowerCase());
        });

        ncits = _.uniq(ncits);

        //building typeahead index, need to collect from properties, CDE ID, values, NCIt codes
        //collect properties
        if (p.prop in allTerm) {
          // if exist, then check if have the same type
          let t = allTerm[p.prop];
          if (t.indexOf("property") === -1) {
            t.push("property");
          }
        } else {
          let t = [];
          t.push("property");
          allTerm[p.prop] = t;
        }

        //collect values
        if (values.length > 0) {
          values.forEach(function (em) {
            if (em in allTerm) {
              // if exist, then check if have the same type
              let t = allTerm[em];
              if (t.indexOf("value") == -1) {
                t.push("value");
              }
            } else {
              let t = [];
              t.push("value");
              allTerm[em] = t;
            }
          });
        }

        //collect NCIt codes
        if (ncits.length > 0) {
          ncits.forEach((em) => {
            if (em == undefined || em == "") return;
            if (em in allTerm) {
              //if exist, then check if have the same type
              let t = allTerm[em];
              if (t.indexOf("ncit code") == -1) {
                t.push("ncit code");
              }
            } else {
              let t = [];
              t.push("ncit code");
              allTerm[em] = t;
            }
          });
        }

        allProperties.push(p);
      });
    }
  }
};

const bulkIndex = async function (next) {

  gdc_values = shared.readGDCValues();
  gdc_props = shared.readGDCProps();
  gdc_nodes = shared.readGDCNodes();
  let syns = shared.readNCItDetails();


  //collect gdc data
  let jsonData = await shared.getGraphicalGDCDictionary();

  for (let node in jsonData) {
    if (node !== '_terms' || node !== '_definitions') {
      helper_gdc(jsonData[node], syns);
    }
  }

  //collect ICDC data

  let icdcData = shared.getGraphicalICDCDictionary();
  let icdc_mapping = shared.readICDCMapping();
  helper_icdc(icdcData, icdc_mapping, syns);

  //collect CTDC data

  let ctdcData = shared.getGraphicalCTDCDictionary();
  let ctdc_mapping = shared.readCTDCMapping();
  helper_ctdc(ctdcData, ctdc_mapping, syns);

  let pcdc_mapping = shared.readPCDCMapping();
  helper_pcdc(pcdc_mapping, syns);

  cache.setValue("unloaded_ncits", unloaded_ncits, config.item_ttl);

  // build suggestion index
  let suggestionBody = [];

  for (var term in allTerm) {
    let doc = {};
    doc.id = term.toString();
    if (doc.id != '') {
      doc.type = allTerm[term];
      suggestionBody.push({
        index: {
          _index: config.suggestionName,
          _type: '_doc',
          _id: doc.id
        }
      });
      suggestionBody.push(doc);
    }
  }

  //build property index
  let propertyBody = [];

  allProperties.forEach(ap => {
    if (ap.prop.cde && ap.prop.d) { // ADD CDE ID to all property description.
      ap.prop.d = ap.prop.d + " (" + ap.prop.cde.src + " - " + ap.prop.cde.c + ")"
    }
    let doc = extend(ap, {});
    doc.id = ap.prop.n + "/" + ap.node.n + "/" + ap.category + "/" + ap.source;
    propertyBody.push({
      index: {
        _index: config.index_p,
        _type: '_doc',
        _id: doc.id
      }
    });
    propertyBody.push(doc);
  });

  esClient.bulk({ body: propertyBody }, (err_p, data_p) => {
    if (err_p) {
      return next(err_p);
    }
    let errorCount_p = 0;
    data_p.items.forEach(item => {
      if (item.index && item.index.error) {
        logger.error(++errorCount_p, item.index.error);
      }
    });
    esClient.bulk({ body: suggestionBody }, (err_s, data_s) => {
      if (err_s) {
        return next(err_s);
      }
      let errorCount_s = 0;
      data_s.items.forEach(itm => {
        if (itm.index && itm.index.error) {
          logger.error(++errorCount_s, itm.index.error);
        }
      });
      next({
        property_indexed: (propertyBody.length - errorCount_p),
        property_total: propertyBody.length,
        suggestion_indexed: (suggestionBody.length - errorCount_s),
        suggestion_total: suggestionBody.length
      });
    });
  });
}
exports.bulkIndex = bulkIndex;

const query = (index, dsl, source_excludes, highlight, next) => {
  var body = {
    size: config.search_result_limit,
    from: 0
  };
  body.query = dsl;

  if (highlight) {
    body.highlight = highlight;
  }
  /*
  body.sort = [{
    "category": "asc"
  }, {
    "node": "asc"
  }];
  */
  //console.log(JSON.stringify(body, null, 4))
  if (source_excludes == "") {
    esClient.search({ index: index, body: body }, (err, data) => {
      if (err) {
        logger.error(err);
        next(err);
      } else {
        next(data);
      }
    });
  }
  else {
    esClient.search({ index: index, "_source_excludes": source_excludes, body: body }, (err, data) => {
      if (err) {
        logger.error(err);
        next(err);
      } else {
        next(data);
      }
    });
  }

}

exports.query = query;

const query_all = async function (index, dsl, source_excludes, highlight) {
  var body = {
    size: 10000,
    from: 0
  };
  body.query = dsl;
  if (highlight) {
    body.highlight = highlight;
  }
  /*
  body.sort = [{
    "category": "asc"
  }, {
    "node": "asc"
  }];
  */

  // console.log(JSON.stringify(body, null, 4))

  if (source_excludes == "") {
    /*
    esClient.search({index: index, body: body}, (err, data) => {
      if (err) {
        logger.error(err);
        next(err);
      } else {
        next(data);
      }
    });
    */
    const result = await esClient.search({ index: index, body: body });
    return result;
  }
  else {
    /*
    esClient.search({index: index, "_source_excludes": source_excludes, body: body}, (err, data) => {
      if (err) {
        logger.error(err);
        next(err);
      } else {
        next(data);
      }
    });
    */
    const result = await esClient.search({ index: index, "_source_excludes": source_excludes, body: body });
    return result;
  }
}

exports.query_all = query_all;

const suggest = (index, suggest, next) => {
  let body = {};
  body.suggest = suggest;

  //console.log(JSON.stringify(body));
  //console.log(JSON.stringify(body, null, 4))

  esClient.search({ index: index, "_source": true, body: body }, (err, data) => {
    if (err) {
      logger.error(err);
      next(err);
    } else {
      next(data);
    }
  });
}

exports.suggest = suggest;

const createIndexes = (params, next) => {
  esClient.indices.create(params[0], (err_2, result_2) => {
    if (err_2) {
      logger.error(err_2);
      next(err_2);
    } else {
      esClient.indices.create(params[1], (err_3, result_3) => {
        if (err_3) {
          logger.error(err_3);
          next(err_3);
        } else {
          logger.debug("have built property and suggestion indexes.");
          next(result_3);
        }
      });
    }
  });
}

exports.createIndexes = createIndexes;

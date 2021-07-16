const dataUtils = require('./dataprocess/dataUtils');
const ICDCdata = require('./dataprocess/ICDCdata');
const fs = require("fs");
const path = require("path");
const yaml = require("yamljs");
const _ = require('lodash');

var allTerm = {};

var allProperties = [];
var unloaded_ncits = [];

const dataFilesDir = path.join(__dirname, "server", "data_files", "GDC");
const dataFilesPath = path.join(__dirname, "server", "data_files");


const readNCItDetails = () => {
    let content = fs.readFileSync(dataFilesDir + "/ncit_details.js").toString();
    content = content.replace(/}{/g, ",");
    return JSON.parse(content);
};



const helper_icdc = (dict, icdc_mapping, syns) => {
    for (let node_name in dict) {
        console.log(node_name)
        let properties = dict[node_name].properties;

        console.dir(dict[node_name])

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




let icdcData = ICDCdata.getGraphicalICDCDictionary();
let icdc_mapping = ICDCdata.readICDCMapping();
let syns = readNCItDetails();

console.dir(icdc_mapping)
//helper_icdc(icdcData, icdc_mapping, syns);

// console.log(syns)
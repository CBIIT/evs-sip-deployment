const dbUtils = require('../../components/neo4jUtils');
const User = require('../../models/neo4j/user');
const _ = require('lodash');
const { session } = require('neo4j-driver');

//const neo4jsession = dbUtils.getSession()

const getApiSearchResults = async function (keyword, model, type) {
  let nodeinfo = [];
  let resultAll = [];
  let typeList = [];
  if (type.toLowerCase().includes('prop')) typeList.push('property');
  if (type.toLowerCase().includes('node')) typeList.push('node');
  if (type.toLowerCase().includes('value')) typeList.push('term');
  if (model && model.length > 1) {
    nodeinfo = await getNodebykeywordAndModel(keyword, model)
  } else if (keyword) {
    nodeinfo = await getNodebykeyword(keyword)
  }

  if ('string' != (typeof nodeinfo)) {
    let promises = nodeinfo.map(async r => {
      let nodetype = r.type[0];
      if (typeList.length === 0 || typeList.includes(nodetype)) {
        if (r.model && ['icdc', 'ctdc'].includes(r.model.toLowerCase())) {
          switch (nodetype) {
            case 'node':

              return await getNodeDetailsByName(r.model, r.name);
              break;
            case 'property':

              return await getPropWithValuesByName(r.model, r.name);
              break;
            case 'term':

              return await getValuesByName(r.model, r.name);
              break;
            default:

              return null;
              break;
          };
        } else if (nodetype === 'term') {
          // return await getValuesByName(r.model, r.name);

          return null;
        } else {
          return null;
        }
      }
    })

    for await (let val of promises) {
      if (val) resultAll.push(val);
    }
    
  } else {
    //resultAll = nodeinfo;
  }
  if (resultAll.length ===0 ) {
    return { status: 400, message: " No data found. " };
  }
  return { status: 200, results: resultAll };
}

//
const getApiDataSource = function (model) {
  //console.log(typeof neo4jsession.readTransaction)
  const neo4jsession = dbUtils.getSession()
  if (!model) model = "ICDC";
  return neo4jsession.readTransaction(txc => txc.run('MATCH (n1:node) WHERE n1._to IS NULL and toLower(n1.model) = toLower($model) '
    + ' OPTIONAL MATCH (n1) -[:has_property]- (p1:property) WHERE NOT (p1._to IS NOT NULL)'
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' WITH DISTINCT  n1.handle as node_name, p1.value_domain as value_type,collect(t.value) as value,p1.handle as handle, '
    + ' n1.model as model ORDER BY model, node_name, handle '
    + ' RETURN model, node_name, collect({property_name:handle, value_domain:value_type,value: value }) as properties '
    + ' ORDER BY model, node_name  ',
    { model: model })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data.', status: 400 };
      }
      let props = [];
      results.records.map(r => {
        let prop = r.get('properties');
        let data = {};
        data.Modlel = r.get('model');
        data.Node_Name = r.get('node_name');
        if (prop.length > 0) {
          let plist = [];
          prop.map(p => {
            if (p.value && p.value.length > 0) {
              plist.push({
                property_name: p.property_name,
                value_type: p.value_domain,
                values: p.value
              })

            } else {
              plist.push({
                property_name: p.property_name,
                value_type: p.value_domain
              })
            }
          });
          data.properties = plist;
        }
        props.push(data)
      })

      if (props.length ===0 ) {
        return({ status: 400, message: " No data found. " });
      }else {
        return { status: 200, results: props };
      }
    }).catch(function (error) {
      console.log("error in getBy Resource: " + error);
    });
};

const getPropWithValuesByName = function (model, keyword) {
  //console.log(typeof neo4jsession.readTransaction)
  //let searchword = "(?i).*" + keyword + ".*"
  const neo4jsession = dbUtils.getSession()
  let searchword = keyword;

  return neo4jsession.readTransaction(txc => txc.run('MATCH (n1:node) WHERE n1._to IS NULL and toLower(n1.model) = toLower($model) '
    + ' MATCH (n1) -[:has_property]- (p1:property) WHERE p1._to IS  NULL and toLower(p1.model) = toLower($model) AND p1.handle in $searchword '
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' RETURN DISTINCT '
    + ' n1.handle as node_name,'
    + ' p1.value_domain as value_type,'
    + ' collect(t.value) as value,'
    + ' p1.handle as handle,'
    + ' p1.model as model,'
    + ' p1.nanoid as pid'
    + ' ORDER BY model, handle, value ',
    { model: model, searchword: searchword })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data in properties.', status: 400 };
      }
      let props = [];
      results.records.map(r => {
        if (r.get('value') && r.get('value').length > 0) {
          props.push({
            model: r.get('model'),
            category: 'category',
            node_name: r.get('node_name'),
            property_name: r.get('handle'),
            value_type: r.get('value_type'),
            values: r.get('value'),
          })
        } else {
          props.push({
            model: r.get('model'),
            category: 'category',
            node_name: r.get('node_name'),
            property_mame: r.get('handle'),
            value_type: r.get('value_type')
          })
        }
      })

      return { type: 'props', result: props };
    }).catch(function (error) {
      console.log("error in getProp : " + error);
    });
};

const getValuesByName = function (model, keyword) {
  //console.log(typeof neo4jsession.readTransaction)
  const neo4jsession = dbUtils.getSession()
  let searchword = keyword;
  if (!model) model = 'ICDC';
  return neo4jsession.readTransaction(txc => txc.run('MATCH (n) -[:has_property]- (p)-[:has_value_set]->(vs) MATCH (vs)-[:has_term]->(t:term)'
    + ' WHERE n._to IS NULL and p._to IS NULL and vs._to IS NULL and t._to IS NULL and toLower(p.model) = toLower($model) AND t.value) in $searchword'
    + ' WITH DISTINCT  n.handle as node_name,p.value_domain as value_type, collect(t.value) as value, p.handle as handle, p.model as model,'
    + ' p.nanoid as pid ORDER BY model, handle '
    + ' RETURN DISTINCT model, node_name, collect({property_name:handle, value_domain:value_type,value: value }) as properties ',
    { model: model, searchword: searchword })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data.', status: 400 };
      }
      let props = [];
      results.records.map(r =>
        props.push({
          model: r.get('model'),
          category: 'category',
          node_name: r.get('node_name'),
          property_name: r.get('handle'),
          value_type: r.get('value_type'),
          values: r.get('value'),
        }))

      return { type: 'values', result: props };
    }).catch(function (error) {
      console.log("error in getValue: " + error);
    });
};


const getNodeDetailsByName = function (model, keyword) {
  //console.log(typeof neo4jsession.readTransaction)
  const neo4jsession = dbUtils.getSession()
  let searchword = keyword;
  return neo4jsession.readTransaction(txc => txc.run('MATCH (n1:node) WHERE n1._to IS NULL and toLower(n1.model)= toLower($model) AND n1.handle in $searchword '
    + ' OPTIONAL MATCH (n1) -[:has_property]- (p1:property) WHERE NOT (p1._to IS NOT NULL)'
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' WITH DISTINCT  n1.handle as node_name, p1.value_domain as value_type,collect(t.value) as value,p1.handle as handle, '
    + ' n1.model as model ORDER BY model, node_name, handle '
    + ' RETURN DISTINCT model, node_name, collect({property_name:handle, value_domain:value_type,value: value }) as properties '
    + ' ORDER BY model, node_name  ',
    { model: model, searchword: searchword })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data.', status: 400 };
      }
      let props = [];
      results.records.map(r => {
        let prop = r.get('properties');
        let data = {};
        data.modlel = r.get('model');
        data.node_name = r.get('node_name');
        data.category = 'category';
        if (prop.length > 0) {
          let plist = [];
          prop.map(p => {
            if (p.value && p.value.length > 0) {
              plist.push({
                property_name: p.property_name,
                value_type: p.value_domain,
                values: p.value
              })

            } else {
              plist.push({
                property_name: p.property_name,
                value_type: p.value_domain
              })
            }
          });
          data.properties = plist;
        }
        props.push(data)
      })

      return { type: 'node', result: props };
    }).catch(function (error) {
      console.log(" error in nodebyname: " + error);
    });
};


const getNodebykeyword = function (keyword) {
  //console.log(typeof neo4jsession.readTransaction)
  const neo4jsession = dbUtils.getSession()
  let searchword = "(?i).*" + keyword + ".*"
  // return neo4jsession.readTransaction(txc => txc.run('MATCH (n) WHERE n._to IS NULL AND ((toLower(n.handle) =~ toLower($searchword) AND n.model  in $model ) OR toLower(n.value) =~ toLower($searchword))'
  return neo4jsession.readTransaction(txc => txc.run('MATCH (n) WHERE n._to IS NULL AND (toLower(n.handle) =~ toLower($searchword) AND n.model in $model )'
    + '  RETURN distinct collect(n.handle) AS name,n.model AS model, labels(n) AS type; ',
    { searchword: searchword, model: ['ICDC', 'CTDC'] })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return 'Not Found with keyword ' + keyword;
      }
      return results.records.map(r => { return { name: r.get('name'), model: r.get('model'), type: r.get('type') } });
    }).catch(function (error) {
      console.log("error in getNodeByKeyword: " + error);
    });
};

const getNodebykeywordAndModel = function (keyword, model) {
  //console.log(typeof neo4jsession.readTransaction)
  let searchword = "(?i).*" + keyword + ".*"
  const neo4jsession = dbUtils.getSession()

  return neo4jsession.readTransaction(txc => txc.run('MATCH (n) WHERE n._to IS NULL AND toLower(n.handle) =~ toLower($searchword) AND toLower(n.model) = toLower($model)'
    + ' RETURN collect(n.handle) AS name,n.model AS model, labels(n) AS type; ',
    { searchword: searchword, model: model })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return 'Not Found with keyword: ' + keyword + ' in data model :' + model;
      }
      return results.records.map(r => { return { name: r.get('name'), model: r.get('model'), type: r.get('type') } });
    }).catch(function (error) {
      console.log("error in getNodeByKeyword and model: " + error);
    });
};
const getSearchResults = async function (keyword, model, type, fromIndex, pageSize) {
  // this support GUI, assume model is NOT NULL and single
  // keyword could be null
  let resultAll = [];

  if (!model) model = 'ICDC';
  if (type.toLowerCase().includes('prop')) type = 'prop';
  if (type.toLowerCase().includes('node')) type = 'node';
  if (type.toLowerCase().includes('value')) type = 'value';
  if (type) {
    let result = [];
    switch (type) {
      case 'node':
        result = await getNodeListWithPaging(model, keyword, fromIndex, pageSize);
        break;
      case 'prop':
        result = await getPropListWithPaging(model, keyword, fromIndex, pageSize);
        break;
      case 'value':
        result = await getValueListWithPaging(model, keyword, fromIndex, pageSize);
        break;
      default:
        result = { type: type, message: 'No matched data.' }
        break;
    }
    if (result) resultAll.push(result);

  } else {
    let nresult = await getNodeListWithPaging(model, keyword, fromIndex, pageSize);
    let presult = await getPropListWithPaging(model, keyword, fromIndex, pageSize);
    let vresult = await getValueListWithPaging(model, keyword, fromIndex, pageSize);
    if (nresult) resultAll.push(nresult);
    if (presult) resultAll.push(presult);
    if (vresult) resultAll.push(vresult);

  }
  return resultAll;
}

const getDataSource = function (model, keyword, fromIndex, pageSize) {
  //console.log(typeof neo4jsession.readTransaction)
  const neo4jsession = dbUtils.getSession()
  if (!model) model = "ICDC";
  return neo4jsession.readTransaction(txc => txc.run('MATCH (n1:node) WHERE n1._to IS NULL and toLower(n1.model) = toLower($model) '
    + ' OPTIONAL MATCH (n1) -[:has_property]- (p1:property) WHERE NOT (p1._to IS NOT NULL)'
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' WITH DISTINCT  n1.handle as node_name, p1.value_domain as value_type,collect(t.value) as value,p1.handle as handle, '
    + ' n1.model as model ORDER BY model, node_name, handle '
    + ' RETURN model, node_name, collect({property_name:handle, value_domain:value_type,value: value }) as properties '
    + ' ORDER BY model, node_name  ',
    { model: model })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data.', status: 400 };
      }
      let props = [];
      results.records.map(r => {
        let prop = r.get('properties');
        let data = {};
        data.Modlel = r.get('model');
        data.Category = 'category';
        data.Node_Name = r.get('node_name');
        if (prop.length > 0) {
          let plist = [];
          prop.map(p => {
            if (p.value && p.value.length > 0) {
              plist.push({
                property_name: p.property_name,
                value_type: p.value_domain,
                values: p.value
              })

            } else {
              plist.push({
                property_name: p.property_name,
                value_type: p.value_domain
              })
            }
          });
          data.properties = plist;
        }
        props.push(data)
      })

      return { type: 'node', result: props };
    }).catch(function (error) {
      console.log("error in getBy Resource: " + error);
    });
};

const getNodeListWithPaging = function (model, keyword, fromIndex, pageSize) {
  //console.log(typeof neo4jsession.readTransaction)
  let searchword = "(?i).*" + keyword + ".*"
  const neo4jsession = dbUtils.getSession()

  return neo4jsession.readTransaction(txc => txc.run('MATCH (n:node) WHERE n._to IS NULL and toLower(n.model) = toLower($model) AND toLower(n.handle) =~ toLower($searchword) '
    + ' WITH collect(n) as allnodes, count(distinct n.handle) as total_nodes UNWIND allnodes as n1'
    + ' WITH n1, total_nodes ORDER BY n1.handle SKIP toInteger($fromIndex) LIMIT toInteger($pageSize)'
    + ' OPTIONAL MATCH (n1) -[:has_property]- (p1:property) WHERE NOT (p1._to IS NOT NULL)'
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' WITH DISTINCT  n1.nanoid as id, n1.handle as node_name, p1.value_domain as value_type,collect(t.value) as value,p1.handle as handle, '
    + ' n1.model as model, total_nodes ORDER BY model, node_name, handle '
    + ' RETURN model, node_name, id, total_nodes, collect({property_name:handle, value_domain:value_type,value: value }) as properties '
    + ' ORDER BY model, node_name  ',
    { model: model, searchword: searchword, fromIndex: fromIndex, pageSize: pageSize })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { type: 'node', message: 'No matched data in nodes.' };
      }
      let props = [];
      let total = 0;
      results.records.map(r => {
        if (total < 1 && r.get('total_nodes').toNumber() > 0) total = r.get('total_nodes').toNumber();
        let prop = r.get('properties');
        let data = {};
        data.Modlel = r.get('model');
        data.Category = 'category';
        data.Node_Name = r.get('node_name');
        data.Nanoid = r.get("id");
        //data.total_nodes = r.get('total_nodes').toNumber();
        if (prop.length > 0) {
          let plist = [];
          prop.map(p => {
            if (p.value && p.value.length > 0) {
              plist.push({
                property_name: p.property_name,
                value_type: p.value_domain,
                values: p.value
              })

            } else {
              plist.push({
                property_name: p.property_name,
                value_type: p.value_domain
              })
            }
          });
          data.properties = plist;
        }
        props.push(data)
      })

      return { type: 'node', total_nodes: total, result: props };

    }).catch(function (error) {
      console.log("error in getNodeList : " + error);
    });
};

const getPropListWithPaging = function (model, keyword, fromIndex, pageSize) {
  //console.log(typeof neo4jsession.readTransaction)
  let searchword = "(?i).*" + keyword + ".*"
  const neo4jsession = dbUtils.getSession()

  return neo4jsession.readTransaction(txc => txc.run('MATCH (p:property) WHERE p._to IS NULL and toLower(p.model)= toLower($model) AND toLower(p.handle) =~ toLower($searchword) '
    + ' WITH collect(p) as allprops, count(p.handle) as total_props UNWIND allprops as p1'
    + ' WITH p1, total_props '
    + ' MATCH (n1:node) -[:has_property]- (p1) WHERE n1._to IS  NULL and toLower(n1.model) = toLower($model) '
    + ' WITH n1, p1 , total_props ORDER BY p1.handle SKIP toInteger($fromIndex) LIMIT toInteger($pageSize)'
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' RETURN DISTINCT '
    + ' n1.handle as node_name,'
    + ' p1.value_domain as value_type,'
    + ' collect(t.value) as value,'
    + ' p1.handle as handle,'
    + ' p1.model as model,'
    + ' p1.nanoid as pid,'
    + ' total_props as total_props '
    + ' ORDER BY model, handle, value ',
    { model: model, searchword: searchword, fromIndex: fromIndex, pageSize: pageSize })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { type: 'props', message: 'No matched data in properties.' };
      }
      let props = [];
      let totals = 0;
      results.records.map(r => {
        if (totals < 1 && r.get('total_props').toNumber() > 0) totals = r.get('total_props').toNumber();
        if (r.get('value') && r.get('value').length > 0) {
          props.push({
            Model: r.get('model'),
            Category: 'category',
            Node_Name: r.get('node_name'),
            Property_Name: r.get('handle'),
            Nanoid: r.get('pid'),
            // Total_Prop: r.get('total_props').toNumber(),
            Value_Type: r.get('value_type'),
            Value: r.get('value'),
          })
        } else {
          props.push({
            Model: r.get('model'),
            Category: 'category',
            Node_Name: r.get('node_name'),
            Property_Name: r.get('handle'),
            Nanoid: r.get('pid'),
            // Total_Prop: r.get('total_props').toNumber(),
            Value_Type: r.get('value_type')
          })
        }
      })

      return { type: 'props', total_props: totals, result: props };
    }).catch(function (error) {
      console.log("error in getPropList : " + error);
    });
};

const getValueListWithPaging = function (model, keyword, fromIndex, pageSize) {
  //console.log(typeof neo4jsession.readTransaction)
  let searchword = "(?i).*" + keyword + ".*"
  const neo4jsession = dbUtils.getSession()

  return neo4jsession.readTransaction(txc => txc.run(
     ' MATCH (n) -[:has_property]- (p)-[:has_value_set]->(vs) MATCH (vs)-[:has_term]->(t:term)'
    + ' WHERE n._to IS NULL and p._to IS NULL and vs._to IS NULL and t._to IS NULL and toLower(p.model) = toLower($model) AND toLower(t.value) =~ toLower($searchword)'
    + ' WITH collect(t) as allvalues, count(distinct t.value) as total_values UNWIND allvalues as t1'
    + ' WITH t1, total_values '
    + ' MATCH (n1) -[:has_property]- (p1)-[:has_value_set]->(vs1) MATCH (vs1)-[:has_term]->(t1)'
    + ' WHERE n1._to IS NULL and p1._to IS NULL and vs1._to IS NULL and t1._to IS NULL and toLower(p1.model) = toLower($model) AND toLower(t1.value) =~ toLower($searchword)'
    + ' RETURN DISTINCT  n1.handle as node_name,p1.value_domain as value_type, t1.value as value, p1.handle as handle, p1.model as model,'
    + ' t1.nanoid as tid, total_values as total_values '
    + ' ORDER BY t1.value SKIP toInteger($fromIndex) LIMIT toInteger($pageSize) ',
    { model: model, searchword: searchword, fromIndex: fromIndex, pageSize: pageSize })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { type: 'values', message: 'No matched data in values' };
      }
      let props = [];
      let totals = 0;
      results.records.map(r => {
        if (totals < 1 && r.get('total_values').toNumber() > 0) totals = r.get('total_values').toNumber();
        props.push({
          Model: r.get('model'),
          Category: 'category',
          Node_Name: r.get('node_name'),
          Property_Name: r.get('handle'),
          Value_Type: r.get('value_type'),
          Nanoid: r.get('tid'),
          Value: r.get('value'),
        })
      })

      return { type: 'values',total_values:totals, result: props };

    }).catch(function (error) {
      console.log("error in getValuesList : " + error);
    });
};

module.exports = {
  getApiDataSource,
  getApiSearchResults,
  getDataSource,
  getSearchResults,
};

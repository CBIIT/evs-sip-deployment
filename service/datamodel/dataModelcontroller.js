const dbUtils = require('../../components/neo4jUtils');
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
  if (resultAll.length === 0) {
    return { status: 400, message: " No data found. " };
  }
  return { status: 200, results: resultAll };
}

const getApiDataSource = async function (model, node, prop) {
  if (model && node && prop) {
    return await getApiDataSourcebyModelNodeProp(model, node, prop);
  } else if (model && node) {
    return await getApiDataSourcebyModelNode(model, node);
  } else if (model) {
    return await getApiDataSourcebyModel(model);
  } else {
    return ({ status: 404, message: " Wrong request format. " });
  }
}

//
const getApiDataSourcebyModel = function (model) {
  //console.log(typeof neo4jsession.readTransaction)
  const neo4jsession = dbUtils.getSession()
  if (!model) model = "ICDC";
  return neo4jsession.readTransaction(txc => txc.run('MATCH (n1:node) WHERE n1._to IS NULL and toLower(n1.model) = toLower($model) '
    + ' OPTIONAL MATCH (n1) -[:has_ncitcode]- (cn:ncitcode {type:"node"})  '
    + ' OPTIONAL MATCH (n1) -[:has_property]- (p1:property) WHERE NOT (p1._to IS NOT NULL)'
    + ' OPTIONAL MATCH (p1) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' OPTIONAL MATCH (p1) -[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs) -[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' OPTIONAL MATCH (t) -[:has_ncitcode]- (cv:ncitcode {type :"term"}) '
    + ' WITH DISTINCT  n1, p1.value_domain as value_domain,t, t.value as value,p1.handle as handle, '
    + ' cn.ncit_code as n_ncitcode, cp.ncit_code as p_ncitcode, cv.ncit_code as v_ncitcode ,cv.name_pt as v_name_pt ORDER BY p1.handle, t.value '
    + ' WITH DISTINCT  n1, value_domain as value_type,collect({term:value, ncit_code: v_ncitcode, termPT: v_name_pt}) as value, handle, n_ncitcode , p_ncitcode ORDER BY handle '
    + ' WITH n1,n_ncitcode, collect({property_name:handle, ncit_code: p_ncitcode, value_domain:value_type,value: value }) as properties '
    + ' OPTIONAL MATCH (n1)<-[:has_src]-(r12:relationship)-[:has_dst]->(n2:node) '
    + ' WHERE NOT (n2._to is NOT NULL) and NOT (r12._to IS NOT NULL) '
    + ' OPTIONAL MATCH (n3)<-[:has_src]-(r31:relationship)-[:has_dst]->(n1:node) '
    + ' WHERE NOT (n3._to is NOT NULL) and NOT (r31._to IS NOT NULL) '
    + ' WITH DISTINCT n1,n_ncitcode, properties,n3, r31, collect({end_node:n2.handle,rel_name:r12.handle, rel_type:r12.multiplicity}) as endnodes '
    + ' WITH DISTINCT n1,n_ncitcode, properties,endnodes, collect({start_node:n3.handle,rel_name:r31.handle, rel_type:r31.multiplicity}) as startnodes '
    + ' RETURN n1.handle as node_name, n1.model as model,n_ncitcode, properties, startnodes, endnodes '
    + ' ORDER BY n1.model, n1.handle ',
    { model: model })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data.', status: 400 };
      }
      const props = processNodePropResult(results);
      if (props && props.length === 0) {
        return ({ status: 400, message: " No data found. " });
      } else {
        return { status: 200, results: props };
      }
    }).catch(function (error) {
      console.log("error in getBy Resource: " + error);
    });
};
const getApiDataSourcebyModelNode = function (model, node) {
  //console.log(typeof neo4jsession.readTransaction)
  const neo4jsession = dbUtils.getSession()
  if (!model) model = "ICDC";
  return neo4jsession.readTransaction(txc => txc.run('MATCH (n1:node) WHERE n1._to IS NULL and toLower(n1.model) = toLower($model) and  toLower(n1.handle) = toLower($node)'
    + ' OPTIONAL MATCH (n1) -[:has_ncitcode]- (cn:ncitcode {type:"node"})  '
    + ' OPTIONAL MATCH (n1) -[:has_property]- (p1:property) WHERE NOT (p1._to IS NOT NULL)'
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (p1) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' OPTIONAL MATCH (t) -[:has_ncitcode]- (cv:ncitcode {type :"term"}) '
    + ' WITH DISTINCT  n1, p1.value_domain as value_domain,t, t.value as value,p1.handle as handle, '
    + ' cn.ncit_code as n_ncitcode, cp.ncit_code as p_ncitcode, cv.ncit_code as v_ncitcode ,cv.name_pt as v_name_pt ORDER BY p1.handle, t.value '
    + ' WITH DISTINCT  n1, value_domain as value_type,collect({term:value, ncit_code: v_ncitcode, termPT: v_name_pt}) as value, handle, n_ncitcode , p_ncitcode ORDER BY handle '
    + ' WITH DISTINCT n1,n_ncitcode, collect({property_name:handle, ncit_code: p_ncitcode, value_domain:value_type,value: value }) as properties '
    + ' OPTIONAL MATCH (n1)<-[:has_src]-(r12:relationship)-[:has_dst]->(n2:node) '
    + ' WHERE NOT (n2._to is NOT NULL) and NOT (r12._to IS NOT NULL) '
    + ' OPTIONAL MATCH (n3)<-[:has_src]-(r31:relationship)-[:has_dst]->(n1:node) '
    + ' WHERE NOT (n3._to is NOT NULL) and NOT (r31._to IS NOT NULL) '
    + ' WITH DISTINCT n1,n_ncitcode, properties,n3, r31, collect({end_node:n2.handle,rel_name:r12.handle, rel_type:r12.multiplicity}) as endnodes '
    + ' WITH DISTINCT n1,n_ncitcode, properties,endnodes, collect({start_node:n3.handle,rel_name:r31.handle, rel_type:r31.multiplicity}) as startnodes '
    + ' RETURN n1.handle as node_name, n1.model as model,n_ncitcode, properties, startnodes, endnodes '
    + ' ORDER BY n1.model, n1.handle ',
    { model: model, node: node })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data.', status: 400 };
      }
      const props = processNodePropResult(results);
      if (props && props.length === 0) {
        return ({ status: 400, message: " No data found. " });
      } else {
        return { status: 200, results: props };
      }
    }).catch(function (error) {
      console.log("error in getBy Resource by node: " + error);
    });
};

const getApiDataSourcebyModelNodeProp = function (model, node, prop) {
  //console.log(typeof neo4jsession.readTransaction)
  const neo4jsession = dbUtils.getSession()
  if (!model) model = "ICDC";
  return neo4jsession.readTransaction(txc => txc.run(
    'MATCH (n1:node) WHERE n1._to IS NULL and toLower(n1.model) = toLower($model) and toLower(n1.handle) = toLower($node)'
    + ' OPTIONAL MATCH (n1) -[:has_ncitcode]- (cn:ncitcode {type:"node"}) '
    + ' OPTIONAL MATCH (n1) -[:has_property]- (p1:property) WHERE NOT (p1._to IS NOT NULL) and toLower(p1.handle) = toLower($prop) '
    + ' OPTIONAL MATCH (p1) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' OPTIONAL MATCH (t) -[:has_ncitcode]- (cv:ncitcode {type :"term"}) '
    + ' WITH DISTINCT  n1, p1.value_domain as value_domain,t.value as value,p1.handle as handle, ' 
    + ' cn.ncit_code as n_ncitcode, cp.ncit_code as p_ncitcode, cv.ncit_code as v_ncitcode ,cv.name_pt as v_name_pt ORDER BY p1.handle, t.value  '
    + ' WITH DISTINCT  n1.model as model, n1.handle as node_name, value_domain as value_type,n_ncitcode , p_ncitcode, ' 
    + ' collect({term:value, ncit_code: v_ncitcode, termPT: v_name_pt}) as value, handle as prop_name '
    + ' RETURN DISTINCT  model , node_name,  value_type, value,  prop_name , n_ncitcode , p_ncitcode '
    + ' ORDER BY model, node_name, prop_name ',
    { model: model, node: node, prop: prop })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data.', status: 400 };
      }

      let props = [];
      results.records.map(r => {
        let value = r.get('value');
        let data = {};
        data.model = r.get('model');
        data.category = 'category';
        data.node_name = r.get('node_name');
        data.node_ncitcode = r.get('n_ncitcode')||'';
        data.property_name = r.get('prop_name');
        data.property_ncitcode = r.get('p_ncitcode')||'';
        data.value_type = r.get('value_type');

        if (value && value.length > 0 && r.get('value_type') === 'value_set') {
        
          let vlist = [];
          if (value[0] && !!value[0].term && value[0].term !== null) {
            for (let v of value) {
              if (v.term) {
                vlist.push({ term: v.term, ncit_code: v.ncit_code||'', term_PT: v.termPT || '' });
              }
            }
          }
          data.values = vlist;
        }

        props.push(data);
      });

      if (props.length === 0) {
        return ({ status: 400, message: " No data found. " });
      } else {
        return { status: 200, results: props };
      }
    }).catch(function (error) {
      console.log("error in getBy Resource node and prop: " + error);
    });
};

const getPropWithValuesByName = function (model, keyword) {
  //console.log(typeof neo4jsession.readTransaction)
  //let searchword = "(?i).*" + keyword + ".*"
  const neo4jsession = dbUtils.getSession()
  let searchword = keyword;

  return neo4jsession.readTransaction(txc => txc.run(
    'MATCH (n1:node) WHERE n1._to IS NULL and toLower(n1.model) = toLower($model) '
    + ' OPTIONAL MATCH (n1) -[:has_ncitcode]- (cn:ncitcode {type:"node"}) '
    + ' MATCH (n1) -[:has_property]- (p1:property) WHERE p1._to IS  NULL and toLower(p1.model) = toLower($model) AND p1.handle in $searchword '
    + ' OPTIONAL MATCH (p1) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' OPTIONAL MATCH (t) -[:has_ncitcode]- (cv:ncitcode {type :"term"}) '
    + ' WITH DISTINCT  n1, p1.value_domain as value_domain,t.value as value,p1.handle as handle , p1.nanoid as pid, ' 
    + ' cn.ncit_code as n_ncitcode, cp.ncit_code as p_ncitcode, cv.ncit_code as v_ncitcode ,cv.name_pt as v_name_pt ORDER BY p1.handle, t.value  '
    + ' RETURN DISTINCT  n1.model as model, n1.handle as node_name,n_ncitcode, p_ncitcode, value_domain as value_type, ' 
    + ' collect({term:value, ncit_code: v_ncitcode, termPT: v_name_pt}) as value, handle as prop_name, pid '
    + ' ORDER BY model,node_name, handle, value ',
    { model: model, searchword: searchword })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data in properties.', status: 400 };
      }
      let props = [];
      results.records.map(r => {
        let value = r.get('value');
        let data = {};
        data.model = r.get('model');
        data.category = 'category';
        data.node_name = r.get('node_name');
        data.node_ncitcode = r.get('n_ncitcode')||'';
        data.property_name = r.get('prop_name');
        data.property_ncitcode = r.get('p_ncitcode')||'';
        data.value_type = r.get('value_type');

        if (value && value.length > 0 && r.get('value_type') === 'value_set') {
        
          let vlist = [];
          if (value[0] && !!value[0].term && value[0].term !== null) {
            for (let v of value) {
              if (v.term) {
                vlist.push({ term: v.term, ncit_code: v.ncit_code||'', term_PT: v.termPT || '' });
              }
            }
          }
          data.values = vlist;
        }
        props.push(data);
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
  return neo4jsession.readTransaction(txc => txc.run(
    ' MATCH (n) -[:has_property]- (p)-[:has_value_set]->(vs) MATCH (vs)-[:has_term]->(t:term) '
    + ' WHERE n._to IS NULL and p._to IS NULL and vs._to IS NULL and t._to IS NULL and toLower(p.model) = toLower($model) AND t.value) in $searchword '
    + ' OPTIONAL MATCH (t) -[:has_ncitcode]- (cv:ncitcode {type :"term"}) '
    + ' OPTIONAL MATCH (p) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' OPTIONAL MATCH (n) -[:has_ncitcode]- (cn:ncitcode {type:"node"}) '
    + ' WITH DISTINCT n, p, t, cn.ncit_code as n_ncitcode, cp.ncit_code as p_ncitcode, cv.ncit_code as v_ncitcode,cv.name_pt as v_name_pt ORDER BY n.handle, p.handle, t.value '
    + ' WITH DISTINCT  n.handle as node_name,p.value_domain as value_type, p.handle as handle, p.model as model,n_ncitcode,  p_ncitcode,'
    + ' collect({term:value, ncit_code: v_ncitcode, termPT: v_name_pt}) as value, p.nanoid as pid ORDER BY model, handle '
    + ' RETURN DISTINCT model, node_name,n_ncitcode, collect({property_name:handle,ncit_code: p_ncitcode, value_domain:value_type,value: value }) as properties ',
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
    + ' OPTIONAL MATCH (t) -[:has_ncitcode]- (cv:ncitcode {type :"term"}) '
    + ' OPTIONAL MATCH (p1) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' OPTIONAL MATCH (n1) -[:has_ncitcode]- (cn:ncitcode {type:"node"}) '
    + ' WITH DISTINCT  n1, p1, t.value as value, cn.ncit_code as n_ncitcode, cp.ncit_code as p_ncitcode, cv.ncit_code as v_ncitcode,cv.name_pt as v_name_pt ORDER BY n1.handle, p1.handle, t.value '
    + ' WITH DISTINCT  n1, p1.value_domain as value_type,n_ncitcode, p_ncitcode, ' 
    + ' collect({term:value, ncit_code: v_ncitcode, termPT: v_name_pt}) as value,p1.handle as handle ORDER BY n1, p1.handle '
    + ' WITH n1,n_ncitcode, collect({property_name:handle, ncit_code: p_ncitcode, value_domain:value_type,value: value }) as properties '
    + ' OPTIONAL MATCH (n1)<-[:has_src]-(r12:relationship)-[:has_dst]->(n2:node) '
    + ' WHERE NOT (n2._to is NOT NULL) and NOT (r12._to IS NOT NULL) '
    + ' OPTIONAL MATCH (n3)<-[:has_src]-(r31:relationship)-[:has_dst]->(n1:node) '
    + ' WHERE NOT (n3._to is NOT NULL) and NOT (r31._to IS NOT NULL) '
    + ' WITH DISTINCT n1, n_ncitcode, properties,n3, r31, collect({end_node:n2.handle,rel_name:r12.handle, rel_type:r12.multiplicity}) as endnodes '
    + ' WITH DISTINCT n1,n_ncitcode,  properties,endnodes, collect({start_node:n3.handle,rel_name:r31.handle, rel_type:r31.multiplicity}) as startnodes '
    + ' RETURN n1.handle as node_name, n1.model as model, n_ncitcode, properties, startnodes, endnodes '
    + ' ORDER BY n1.model, n1.handle ',
    { model: model, searchword: searchword })
  )
    .then(results => {
      neo4jsession.close();
      if (_.isEmpty(results.records)) {
        return { message: 'No matched data.', status: 400 };
      }
      let props = processNodePropResult(results);
     
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
    + ' OPTIONAL MATCH (t) -[:has_ncitcode]- (cv:ncitcode {type :"term"}) '
    + ' OPTIONAL MATCH (p1) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' OPTIONAL MATCH (n1) -[:has_ncitcode]- (cn:ncitcode {type:"node"}) '
    + ' WITH DISTINCT  n1, p1.value_domain as value_domain,t, t.value as value,p1.handle as handle, '
    + ' cn.ncit_code as n_ncitcode, cp.ncit_code as p_ncitcode, cv.ncit_code as v_ncitcode ,cv.name_pt as v_name_pt ORDER BY n1.handle,p1.handle, t.value '
    + ' WITH DISTINCT  n1, value_domain as value_type,collect({term:value, ncit_code: v_ncitcode, termPT: v_name_pt}) as value, handle, n_ncitcode , p_ncitcode ORDER BY handle '
    + ' WITH n1,n_ncitcode, collect({property_name:handle, ncit_code: p_ncitcode, value_domain:value_type,value: value }) as properties '
    + ' RETURN n1.mdoel as model, n1.handle as node_name, n_ncitcode, properties '
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
        data.Model = r.get('model');
        data.Category = 'category';
        data.Node_Name = r.get('node_name');
        data.Node_Ncitcode = r.get('n_ncitcode')||'';
        if (prop.length > 0) {
          let plist = [];
          prop.map(p => {
            if (p.value && p.value.length > 0 && p.value_domain && p.value_domain === 'value_set') {
              let vlist = [];
              if (p.value[0] && !!p.value[0].term && p.value[0].term !== null) {
                for (let v of p.value) {
                  if (v.term) {
                    vlist.push({ term: v.term, ncit_code: v.ncit_code||'', term_PT: v.termPT || '' });
                  }
                }
              }
    
              plist.push({
                property_name: p.property_name,
                ncit_code: p.ncit_code || '',
                value_type: p.value_domain,
                values: vlist
              })
    
            } else {
              plist.push({
                property_name: p.property_name,
                ncit_code: p.ncit_code ||'',
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
    + ' OPTIONAL MATCH (t) -[:has_ncitcode]- (cv:ncitcode {type :"term"}) '
    + ' OPTIONAL MATCH (p1) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' OPTIONAL MATCH (n1) -[:has_ncitcode]- (cn:ncitcode {type:"node"}) '
    + ' WITH DISTINCT  n1, p1.value_domain as value_domain,t, t.value as value,p1.handle as handle,total_nodes, '
    + ' cn.ncit_code as n_ncitcode, cp.ncit_code as p_ncitcode, cv.ncit_code as v_ncitcode ,cv.name_pt as v_name_pt ORDER BY n1.handle,p1.handle, t.value '
    + ' WITH DISTINCT  n1, total_nodes, value_domain as value_type,collect({term:value, ncit_code: v_ncitcode, termPT: v_name_pt}) as value, handle, n_ncitcode , p_ncitcode ORDER BY handle '
    + ' WITH n1,n_ncitcode,total_nodes, collect({property_name:handle, ncit_code: p_ncitcode, value_domain:value_type,value: value }) as properties '
    + ' RETURN n1.nanoid as id, n1.handle as node_name,n1.model as model,n_ncitcode, total_nodes, properties '
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
        data.Model = r.get('model');
        data.Category = 'category';
        data.Node_Name = r.get('node_name');
        data.Node_Ncitcode = r.get('n_ncitcode')||'';
        data.Nanoid = r.get("id");
      /*
        if (prop.length > 0) {
          let plist = [];
          prop.map(p => {
            if (p.value && p.value.length > 0 && p.value_domain && p.value_domain === 'value_set') {
              let vlist = [];
              if (p.value[0] && !!p.value[0].term && p.value[0].term !== null) {
                for (let v of p.value) {
                  if (v.term) {
                    vlist.push({ term: v.term, ncit_code: v.ncit_code||'', term_PT: v.termPT || '' });
                  }
                }
              }
    
              plist.push({
                property_name: p.property_name,
                ncit_code: p.ncit_code || '',
                value_type: p.value_domain,
                values: vlist
              })
    
            } else {
              plist.push({
                property_name: p.property_name,
                ncit_code: p.ncit_code ||'',
                value_type: p.value_domain
              })
            }
          });
          data.properties = plist;
        }
        */
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
    + ' WITH n1, p1 , total_props ORDER BY n1.handle, p1.handle SKIP toInteger($fromIndex) LIMIT toInteger($pageSize)'
    + ' OPTIONAL MATCH (p1)-[:has_value_set]->(vs) WHERE NOT (vs._to IS NOT NULL) '
    + ' OPTIONAL MATCH (vs)-[:has_term]->(t:term) WHERE NOT (t._to IS NOT NULL) '
    + ' OPTIONAL MATCH (p1) -[:has_ncitcode]- (cp:ncitcode {type :"prop"}) '
    + ' RETURN DISTINCT '
    + ' n1.handle as node_name,'
    + ' p1.value_domain as value_type,'
    + ' collect(t.value) as value,'
    + ' cp.ncitcode as p_ncitcode,'
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
            Property_Ncitcode: r.get('p_ncitcode')||'',
            Nanoid: r.get('pid'),
            // Total_Prop: r.get('total_props').toNumber(),
          //  Value_Type: r.get('value_type'),
            Value: r.get('value'),
          })
        } else {
          props.push({
            Model: r.get('model'),
            Category: 'category',
            Node_Name: r.get('node_name'),
            Property_Name: r.get('handle'),
            Property_Ncitcode: r.get('p_ncitcode')||'',
            Nanoid: r.get('pid'),
            // Total_Prop: r.get('total_props').toNumber(),
           // Value_Type: r.get('value_type')
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
    + ' MATCH (n1) -[:has_property]- (p1)-[:has_value_set]->(vs1) ' 
    + ' MATCH (vs1)-[:has_term]->(t1) '
    + ' WHERE n1._to IS NULL and p1._to IS NULL and vs1._to IS NULL and t1._to IS NULL and toLower(p1.model) = toLower($model) AND toLower(t1.value) =~ toLower($searchword)'
    + ' OPTIONAL MATCH (t1) -[:has_ncitcode]- (cv:ncitcode {type :"term"})'
    + ' RETURN DISTINCT  n1.handle as node_name,p1.value_domain as value_type, t1.value as value, p1.handle as handle, p1.model as model,'
    + ' t1.nanoid as tid, cv.ncit_code as v_ncitcode ,cv.name_pt as v_name_pt , total_values as total_values '
    + ' ORDER BY n1.handle, p1.handle, t1.value SKIP toInteger($fromIndex) LIMIT toInteger($pageSize) ',
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
          Term_Ncitcode: r.get('v_ncitcode')||'',
          Term_PT: r.get('v_name_pt')||'',
        })
      })

      return { type: 'values', total_values: totals, result: props };

    }).catch(function (error) {
      console.log("error in getValuesList : " + error);
    });
};

const processNodePropResult = function (results) {
  const props = [];
  results.records.map(r => {
    let prop = r.get('properties');
    let rel_start = r.get('startnodes');
    let rel_end = r.get('endnodes');
    let data = {};
    data.model = r.get('model');
    data.category = 'category';
    data.node_name = r.get('node_name');
    data.ncit_code = r.get('n_ncitcode')||'';
    if (prop.length > 0) {
      let plist = [];
      prop.map(p => {
        if (p.value && p.value.length > 0 && p.value_domain && p.value_domain === 'value_set') {
          let vlist = [];
          if (p.value[0] && !!p.value[0].term && p.value[0].term !== null) {
            for (let v of p.value) {
              if (v.term) {
                vlist.push({ term: v.term, ncit_code: v.ncit_code||'', term_PT: v.termPT || '' });
              }
            }
          }

          plist.push({
            property_name: p.property_name,
            ncit_code: p.ncit_code || '',
            value_type: p.value_domain,
            values: vlist
          })

        } else {
          plist.push({
            property_name: p.property_name,
            ncit_code: p.ncit_code ||'',
            value_type: p.value_domain
          })
        }
      });
      data.properties = plist;
    }
    if (rel_start && rel_start.length > 0) {
      let rel =
        rel_start.reduce((acc, p) => {

          if (p.rel_name) {
            (acc[p.rel_name] = acc[p.rel_name] || []).push(
              { source: p.start_node, destination: r.get('node_name'), type: p.rel_type }
            );
          }
          return acc;
        }, {});

      if (rel && Object.keys(rel).length > 0) {
        // rel_list.push({Incoming : rel});
        data.relationship = {};
        let dlist = [];
        for (let property in rel) {
          let rel_mul = rel[property][0].type;
          let nodesList = rel[property].map(({ type, ...keepAttrs }) => keepAttrs)
          dlist.push({ relationship_type: property, multiplicity: rel_mul, relationship_entity: nodesList });

        }
        data.relationship.incoming = dlist;
      }
    }
    if (rel_end && rel_end.length > 0) {
      let rel =
        rel_end.reduce((acc, p) => {

          if (p.rel_name) {
            (acc[p.rel_name] = acc[p.rel_name] || []).push(
              { source: r.get('node_name'), destination: p.end_node, type: p.rel_type }
            );
          }
          return acc;
        }, {});

      if (rel && Object.keys(rel).length > 0) {
        // rel_list.push({Outing: rel});
        if (!data.relationship) {
          data.relationship = {};
        }
        let dlist = [];
        for (let property in rel) {
          let rel_mul = rel[property][0].type;
          let nodesList = rel[property].map(({ type, ...keepAttrs }) => keepAttrs)
          dlist.push({ relationship_type: property, multiplicity: rel_mul, relationship_entity: nodesList });
        }
        data.relationship.outgoing = dlist;

      }
    }
    props.push(data)
  })

 return props;

}

module.exports = {
  getApiDataSource,
  getApiSearchResults,
  getDataSource,
  getSearchResults,
};

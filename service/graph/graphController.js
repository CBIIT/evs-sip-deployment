import * as cache from '../../components/cache.js';
import * as dbUtils from '../../components/neo4jUtils.js';
import config from '../../routes/index.js';
import { convert2Title } from '../search/shared.js';

/**
 *
 * @param string model
 * @returns
 */
export const getGraphicalDictionary = async (model, project) => {
  const keyCatch = `new_${model}_dict`;
  let result = cache.getValue(keyCatch);

  if (result == undefined) {
    let jsonData = await getDataSourcebyModel(model);
    result = generateDictionaryGraphData(jsonData);

    cache.setValue(keyCatch, result, config.item_ttl);
  }
  return result;
};

/**
 *
 * @param string model
 * @returns
 */
export const getPCDCGraphicalDictionary = async (project) => {
  const keyCatch = `new_pcdc_dict_${project}`;
  let result = cache.getValue(keyCatch);

  if (result == undefined) {
    let jsonData = await getPCDCDataSourcebyProject(project);

    result = generatePCDCDictionaryGraphData(jsonData);

    cache.setValue(keyCatch, result, config.item_ttl);
  }
  return result;
};

/**
 *  Generate dictionary data from neo4j data
 *  @param string model
 *
 */
const getDataSourcebyModel = (model) => {
  const neo4jsession = dbUtils.getSession();
  if (!model) model = 'icdc';
  return neo4jsession
    .readTransaction((txc) =>
      txc.run(
        // 'MATCH (n:node) WHERE n.model = $model ' +
        //   'OPTIONAL MATCH (n) <-[:of_node]- (p:property) ' +
        //   'OPTIONAL MATCH (p) <-[:of_property]- (vs:value_set) <-[:of_value_set]- (t:term) ' +
        //   'OPTIONAL MATCH (n) -[:has_src]-> (r:relationship) -[:has_dst]-> (n1: node) ' +
        //   'WITH n, p, r, n1, collect(DISTINCT t.handle) AS terms ' +
        //   'WITH n, collect( DISTINCT CASE WHEN p IS NOT NULL THEN { prop_type: p.data_type, prop_id: p.property_id, prop_name: p.handle, prop_desc: p.description, prop_units: p.units, prop_req: p.required, prop_terms: [term IN terms WHERE term IS NOT NULL] } END ) AS props, ' +
        //   'collect( DISTINCT CASE WHEN r IS NOT NULL THEN { rel_id: r.nanoid, rel_name: r.handle, rel_multiplicity: r.multiplicity, rel_req: r.required, rel_dst: n1.handle } END ) AS rels ' +
        //   'RETURN ({ model: n.model, node_id: n.node_id, category: n.category, node_name: n.handle, node_desc: n.description, properties: [prop IN props WHERE prop IS NOT NULL], relationships: [rel IN rels WHERE rel IS NOT NULL] }) AS result ',
        'MATCH (n:node) ' +
        'WHERE n.model = $model ' +
        'OPTIONAL MATCH (n) <-[:of_node]- (p:property) ' +
        'OPTIONAL MATCH (p) <-[:of_property]- (vs:value_set) <-[:of_value_set]- (t:term) ' +
        'OPTIONAL MATCH (n) -[:has_src]-> (r:relationship) -[:has_dst]-> (n1:node) ' +
        'WITH n, p, r, n1, collect(DISTINCT t.handle) AS terms ' +
        'WITH n, ' +
        'collect(DISTINCT CASE WHEN p IS NOT NULL THEN { ' +
        '    prop_type: p.data_type, ' +
        '    prop_id: p.property_id, ' +
        '    prop_name: p.handle, ' +
        '    prop_desc: p.description, ' +
        '    prop_units: p.units, ' +
        '    prop_req: p.required, ' +
        '    prop_terms: [term IN terms WHERE term IS NOT NULL] ' +
        '} END) AS props, ' +
        'collect(DISTINCT CASE WHEN r IS NOT NULL THEN { ' +
        '    rel_id: r.nanoid, ' +
        '    rel_name: r.handle, ' +
        '    rel_multiplicity: r.multiplicity, ' +
        '    rel_req: r.required, ' +
        '    rel_dst: n1.handle ' +
        '} END) AS rels ' +
        'RETURN { ' +
        '    model: n.model, ' +
        '    node_id: n.node_id, ' +
        '    category: n.category, ' +
        '    node_name: n.handle, ' +
        '    node_desc: n.description, ' +
        '    properties: [prop IN props WHERE prop IS NOT NULL], ' +
        '    relationships: [rel IN rels WHERE rel IS NOT NULL] ' +
        '} AS result',
        { model: model }
      )
    )
    .then((results) => {
      neo4jsession.close();
      if (Object.keys(results.records).length === 0) {
        return { message: 'No matched data.', status: 400 };
      }

      const nodes = processNodeResult(results);
      if (nodes && nodes.length === 0) {
        return { status: 400, message: ' No data found. ' };
      } else {
        return { status: 200, results: nodes };
      }
    })
    .catch(function (error) {
      console.log('error in getBy Resource: ' + error);
    });
};

/**
 *  Generate dictionary data from neo4j data
 *  @param string model
 *
 */
const getPCDCDataSourcebyProject = (project) => {
  const neo4jsession = dbUtils.getSession();

  return neo4jsession
    .readTransaction((txc) =>
      txc.run(
        'MATCH (n:node) ' +
          'WHERE n.model = "pcdc" AND n.category = $project ' +
          'OPTIONAL MATCH (n) <-[:of_node]- (p:property) ' +
          'OPTIONAL MATCH (p) <-[:of_property]- (vs:value_set) <-[:of_value_set]- (t:term) ' +
          'OPTIONAL MATCH (n) -[:has_src]-> (r:relationship) -[:has_dst]-> (n1:node) ' +
          'WITH n, p, r, n1, collect(DISTINCT t.handle) AS terms ' +
          'WITH n, ' +
          'collect(DISTINCT CASE WHEN p IS NOT NULL THEN { ' +
          '    prop_type: p.data_type, ' +
          '    prop_id: p.property_id, ' +
          '    prop_name: p.handle, ' +
          '    prop_desc: p.description, ' +
          '    prop_units: p.units, ' +
          '    prop_req: p.required, ' +
          '    prop_terms: [term IN terms WHERE term IS NOT NULL] ' +
          '} END) AS props, ' +
          'collect(DISTINCT CASE WHEN r IS NOT NULL THEN { ' +
          '    rel_id: r.nanoid, ' +
          '    rel_name: r.handle, ' +
          '    rel_multiplicity: r.multiplicity, ' +
          '    rel_req: r.required, ' +
          '    rel_dst: n1.handle ' +
          '} END) AS rels ' +
          'RETURN { ' +
          '    model: n.model, ' +
          '    node_id: n.node_id, ' +
          '    category: n.category, ' +
          '    node_name: n.handle, ' +
          '    node_desc: n.description, ' +
          '    properties: [prop IN props WHERE prop IS NOT NULL], ' +
          '    relationships: [rel IN rels WHERE rel IS NOT NULL] ' +
          '} AS result',
        { project: project }
      )
    )
    .then((results) => {
      neo4jsession.close();
      if (Object.keys(results.records).length === 0) {
        return { message: 'No matched data.', status: 400 };
      }

      const nodes = processNodeResult(results);
      if (nodes && nodes.length === 0) {
        return { status: 400, message: ' No data found. ' };
      } else {
        return { status: 200, results: nodes };
      }
    })
    .catch(function (error) {
      console.log('error in getBy Resource: ' + error);
    });
};

const processNodeResult = (results) => {
  let result = [];
  results.records.map((record) => {
    let node = record.get('result');
    result.push(node);
  });
  return result;
};

const generateDictionaryGraphData = (data) => {
  const dataDictionary = data.results;

  const dataList = {};

  for (const data of dataDictionary) {

    const item = {};
    item['$schema'] = 'http://json-schema.org/draft-06/schema#';
    item['id'] = data.node_name;
    item['category'] = data.category;
    item['title'] = convert2Title(data.node_name);
    item['program'] = '*';
    item['project'] = '*';
    item['additionalProperties'] = false;
    item['submittable'] = true;
    item['constraints'] = null;

    item['type'] = 'object';
    const link = [];
    const properties = {};
    const required = [];

    if (data.properties !== undefined || data.properties.length !== 0) {
      for (const prop of data.properties) {
        const propertiesItem = {};
        propertiesItem['description'] = prop.prop_desc;
        propertiesItem['type'] = prop.prop_type;
        if (prop.prop_terms.length !== 0) {
          propertiesItem['enum'] = prop.prop_terms;
        }
        // propertiesItem['src'] = '';
        if (prop.prop_req == 'Yes') {
          required.push(prop.prop_name);
        }
        properties[prop.prop_name] = propertiesItem;
      }
      item['properties'] = properties;
      item['required'] = required;
    } else {
      item['properties'] = {};
    }

    for (const relationship of data.relationships) {
      const linkItem = {};
      linkItem['name'] = relationship.rel_dst;
      linkItem['backref'] = data.node_name;
      linkItem['label'] = relationship.rel_name;
      linkItem['target_type'] = relationship.rel_dst;
      linkItem['required'] = relationship.rel_req === 'Yes';

      link.push(linkItem);
    }

    item['links'] = link;

    dataList[data.node_name] = item;
  }

  return dataList;
};

const generatePCDCDictionaryGraphData = (data) => {
  const dataDictionary = data.results;

  const dataList = {};

  for (const [index, data] of dataDictionary.entries()) {

    // const nodeName = removeFirstWordAndDot(data.node_name);

    const item = {};
    item['$schema'] = 'http://json-schema.org/draft-06/schema#';
    item['id'] = data.node_name;
    item['category'] = data.category;
    item['title'] = convert2Title(data.node_name);
    item['program'] = '*';
    item['project'] = '*';
    item['additionalProperties'] = false;
    item['submittable'] = true;
    item['constraints'] = null;

    item['type'] = 'object';
    const link = [];
    const properties = {};
    const required = [];

    if (data.properties !== undefined || data.properties.length !== 0) {
      for (const prop of data.properties) {
        const propertiesItem = {};
        propertiesItem['description'] = prop.prop_desc;
        propertiesItem['type'] = prop.prop_type;
        if (prop.prop_terms.length !== 0) {
          propertiesItem['enum'] = prop.prop_terms;
        }
        // propertiesItem['src'] = '';
        if (prop.prop_req == 'Yes') {
          required.push(prop.prop_name);
        }
        properties[prop.prop_name] = propertiesItem;
      }
      item['properties'] = properties;
      item['required'] = required;
    } else {
      item['properties'] = {};
    }

    // create links for pcdc
    if (index - 4 >= 0) {
      const linkItem = {};
      const nodeNameTarget = dataDictionary[index - 4].node_name;
      linkItem['name'] = nodeNameTarget;
      linkItem['backref'] = data.node_name;
      linkItem['label'] = 'of_pcdc';
      linkItem['target_type'] = nodeNameTarget;
      linkItem['required'] = false;

      link.push(linkItem);
    }

    item['links'] = link;

    dataList[data.node_name] = item;
  }

  return dataList;
};

const removeFirstWordAndDot = (str) => {
  // Split the string into words using the dot as the delimiter
  const words = str.split('.');
  // Remove the first word and join the rest back into a string
  return words.slice(1).join('.');
}

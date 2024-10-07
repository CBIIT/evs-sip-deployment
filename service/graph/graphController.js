import * as cache from '../../components/cache.js';
import * as dbUtils from '../../components/neo4jUtils.js';
import config from '../../routes/index.js';

/**
 *
 * @param string model
 * @returns
 */
export const getGraphicalDictionary = async (model) => {
  
  let result = cache.getValue(`new_${model}_dict`);

  if (result == undefined) {
    result = await getDataSourcebyModel(model);

    // const newResult = generateDictionaryData(jsonData);

    cache.setValue('new_icdc_dict', result, config.item_ttl);
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
        'MATCH (n:node) WHERE n.model = $model ' +
          'OPTIONAL MATCH (n) <-[:of_node]- (p:property) ' +
          'OPTIONAL MATCH (n) -[:has_src]-> (r:relationship) -[:has_dst]-> (n1: node) ' +
          'WITH n, collect( DISTINCT CASE WHEN p IS NOT NULL THEN { prop_type: p.data_type, prop_id: p.property_id, prop_name: p.handle, prop_desc: p.description, prop_units: p.units, prop_req: p.required } END ) AS props, ' +
          'collect( DISTINCT CASE WHEN r IS NOT NULL THEN { rel_id: r.nanoid, rel_name: r.handle, rel_multiplicity: r.multiplicity, rel_req: r.required, rel_dst: n1.handle } END ) AS rels ' +
          'RETURN ({ model: n.model, node_id: n.node_id, category: n.category, node_name: n.handle, node_desc: n.description, properties: [prop IN props WHERE prop IS NOT NULL], relationships: [rel IN rels WHERE rel IS NOT NULL] }) AS result ',
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

const processNodeResult = (results) => {
  let result = [];
  results.records.map((record) => {
    let node = record.get('result');
    result.push(node);
  });
  return result;
};

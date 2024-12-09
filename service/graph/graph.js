import { writeResponse, writeError } from '../../components/response.js';
import * as graphController from './graphController.js';

export const getGraphicalDictionary = async (req, res) => {
  const model = req.params['model'].toLowerCase();
  // // const project = (typeof req.query.project === 'undefined' || req.query.project === "") ? "AML" : req.query.project;
  // const project = req.query.project;

  if (['icdc', 'ctdc', 'gdc'].includes(model)) {
    const jsonData = await graphController.getGraphicalDictionary(model);
    res.json(jsonData);
  } else if ((model === 'pcdc')) {
    const project = typeof req.query.project === 'undefined' || req.query.project === '' ? 'AML' : req.query.project;
    const jsonData = await graphController.getPCDCGraphicalDictionary(project);
    res.json(jsonData);
  } else {
    return writeError(res, { message: 'Not valid data model' }, 400);
  }
};

import { writeResponse, writeError } from '../../components/response.js';
import * as graphController from './graphController.js';

export const getGraphicalDictionary = async (req, res) => {
    const model = req.params['model'].toLowerCase();
  
    if (['icdc', 'ctdc', 'gdc', 'pcdc'].includes(model)) {
  
      const jsonData = await graphController.getGraphicalDictionary(model);
      res.json(jsonData);
  
    } else {
        //res.json( {status: 400 ,message: 'Not valid data model :'+model  });
        return writeError(res, { message: 'Not valid data model' }, 400);
    }
}
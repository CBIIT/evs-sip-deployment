// var sw = require("swagger-node-express");
import * as _ from 'lodash';

export const writeResponse = (res, response, status) => {
  // sw.setHeaders(res);
  res.status(status || 200).send(JSON.stringify(response));
};

export const writeError = (res, error, status) => {
  // sw.setHeaders(res);
  res
    .status(error.status || status || 400)
    .send(JSON.stringify(_.omit(error, ["status"])));
};
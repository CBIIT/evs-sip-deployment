import { writeError} from '../components/response';
import * as dbUtils  from '../neo4jUtils';
import { Users } from '../models/users';


export default function setAuthUser(req, res, next) {
  var authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.user = {id: null};
    next();
  }
  else {
    var match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      return writeError(res, {detail: 'invalid authorization format. Follow `Token <token>`'}, 401);
    }
    var token = match[1];

    Users.me(dbUtils.getneo4jSession(req), token)
      .then(user => {
        req.user = user;
        next();
      })
      .catch(next);
  }
};

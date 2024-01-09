/**
 * local cache
 */

import NodeCache from "node-cache";
const myCache = new NodeCache();

export const getValue = function (sid) {
  let value = myCache.get(sid);
  return value;
};

export const setValue = function (key, value, ttl, next) {
  myCache.set(key, value, ttl);
  if (next) {
    next();
  }
};

export const del = function (key, next) {
  myCache.del(key);
  if (next) {
    next();
  }
};

/**
 * qa environment
 */

const elasticsearchConfig = {
  host: "127.0.0.1:9200",
  log: "error",
  requestTimeout: 30000,
};

export default {
  elasticsearch: elasticsearchConfig,
};

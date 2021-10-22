const express = require('express');
const routes = require('./routes');

// Setup server
const app = express();
app.set('trust proxy', 1);
// var server = require('http').createServer(app);
require('./routes/express')(app);
// require('./routes')(app);
//require('./components/exchange');

// Start server
app.listen(routes.port, routes.ip, function () {
  console.log('Server listening on %d, in %s mode', routes.port, routes.env);
});

// Expose app
exports = module.exports = app;
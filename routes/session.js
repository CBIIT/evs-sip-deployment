
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const timeoutMinutes = 150;
const maxSessionAge = timeoutMinutes * 60 * 1000; // convert minutes to ms
const isProd = process.env.NODE_ENV !== 'development'&& process.env.NODE_ENV !== 'dev' ;

module.exports = session({
    cookie: { 
      maxAge: maxSessionAge,
      secure: isProd,
    },
    store: new MemoryStore({
      checkPeriod: maxSessionAge / 10
    }),
    resave: false,
    rolling: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || 'default session store secret'
});

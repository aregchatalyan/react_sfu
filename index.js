const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');

let protocol;
let httpServer;

const app = express();

const socket = require('./socket');
const config = require('./config');

if (process.env.NODE_ENV === 'production') {
  protocol = 'http';
  httpServer = http.createServer(app);
} else {
  protocol = 'https';
  httpServer = https.createServer({
    key: config.sslKey,
    cert: config.sslCrt
  }, app);
}

app.use(express.static(path.join(__dirname, 'client')));

httpServer.listen(config.listenPort, () => {
  console.log(`Open ${protocol}://${config.listenIp}:${config.listenPort}`);
});

socket(new Server(httpServer));

process.on('uncaughtException', err => {
  console.error(`Caught exception: ${err}`);
});
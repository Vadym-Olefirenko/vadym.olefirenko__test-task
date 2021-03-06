'use strict';

////
// CONFIGURATION SETTINGS
////
var FETCH_INTERVAL = 5000;
var PRETTY_PRINT_JSON = true;

////
// START
////
var express = require('express');
var http = require('http');
var io = require('socket.io');
var cors = require('cors');
var bodyParser = require('body-parser');
var moment = require('moment');

function getRandomValBetween(min, max, precision) {
  min = min === undefined ? 0 : min;
  max = max === undefined ? 9007199254740992 : max;
  precision = precision === undefined ? 0 : precision;

  var random = Math.random() * (max - min) + min;

  return random.toFixed(precision);
}

function getUTCDate() {
  return moment().format("MMMM Do YYYY, h:mm:ss a");
}

function getQuote(socket, ticker) {
  var dataObj;

  var quote = {};
  quote.ticker = ticker;
  quote.exchange = 'NASDAQ';
  quote.price = getRandomValBetween(100, 300, 2);
  quote.change = getRandomValBetween(-5, 5, 2);
  quote.change_percent = getRandomValBetween(0, 1, 2);
  quote.last_trade_time = getUTCDate();
  quote.dividend = getRandomValBetween(0, 1, 2);
  quote.yield = getRandomValBetween(0, 2, 2);

  socket.emit(ticker, PRETTY_PRINT_JSON ? JSON.stringify(quote, null, 4) : JSON.stringify(quote));
}

function trackTicker(socket, ticker) {
  var timer;
  console.log('track Ticker');
  console.log('socket1', socket);

  // run the first time immediately
  getQuote(socket, ticker);

  var setOwnInterval = function() {
    getQuote(socket, ticker);
    timer = setTimeout(setOwnInterval, FETCH_INTERVAL);
  };

  timer = setTimeout(setOwnInterval, FETCH_INTERVAL);

  socket.on('disconnect', function() {
    clearTimeout(timer);
  });
}

var app = express();
app.use(cors());
var server = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

var io = io.listen(server);
io.set('origins', '*:*');

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.post('/', function(request, response){
    FETCH_INTERVAL = request.body.interval;
    var interval = FETCH_INTERVAL.toString();
    response.send(interval);
});


io.sockets.on('connection', function(socket) {
  socket.on('ticker', function(ticker) {
    trackTicker(socket, ticker);
  });
});

server.listen(process.env.PORT || 4000);

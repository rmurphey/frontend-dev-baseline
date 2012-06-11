var express   = require('express');
var fs        = require('fs');
var io        = require('socket.io');
var _         = require('underscore');

var app       = express.createServer();
var staticDir = express.static;

io            = io.listen(app);

var clients   = [];

// i owe a great debt to this article by @tbranyen:
// http://weblog.bocoup.com/synchronizing-html5-slides-with-node-js/

module.exports = function(opts) {
  var currentState;

  opts = _.extend({
    port :      1947,
    baseDir :   './'
  }, opts || {});

  io.sockets.on('connection', function(socket) {
    socket.on('ping', function() {
      if (currentState) {
        socket.emit('slidedata', currentState);
      }
    });

    socket.on('slidechanged', function(slideData) {
      currentState = slideData;
      socket.broadcast.emit('slidedata', currentState);
    });

    socket.on('navigation', function(dir) {
      socket.broadcast.emit('navigate', { direction : dir });
    });
  });

  app.configure(function() {
    [ 'css', 'img', 'js', 'lib' ].forEach(function(dir) {
      app.use('/' + dir, staticDir(opts.baseDir + 'www/' + dir));
    });
  });

  app.get("/", function(req, res) {
    fs.createReadStream(opts.baseDir + 'www/index.html').pipe(res);
  });

  app.get("/_notes", function(req, res) {
    fs.createReadStream(opts.baseDir + 'server/notes.html').pipe(res);
  });

  // Actually listen
  app.listen(opts.port || null);
  console.log("Serving at http://localhost:" + (opts.port || ''));
};

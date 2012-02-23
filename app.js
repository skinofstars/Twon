var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app);

app.configure(function(){
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// start the controller
require('./public/controller.js').start(io);


app.listen(3000);
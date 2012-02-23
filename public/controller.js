// # The game controller
// This gets a bit trippy because it can be used both by
// the browser or server

var controller = function(io){
  
  // utils
  var each = function(arr, fn){
    for (var i=0; i < arr.length; i++) {
      fn.call(arr[i]);
    };
  };
  var rest = function(arr){
    return Array.prototype.slice.call(arr,1);
  };
  
  
  var ArenaCounter = 0;
  var PlayerCounter = 0;
  
  // a list of players and arenas
  var arenas = [];
  var players = [];
  
  
  /* 
    Arena & Controller logic
  */
  
  // the controller represention of an arena
  var Arena = function(sock){
    this.id = ArenaCounter++;
    
    // add to the list of arenas
    arenas.push(this);
  };
  
  // the controller representation of a player
  var Player = function(sock){
    var id = this.id = PlayerCounter++;
    
    // listen for commands from the player
    sock.on('left', function(){
      console.log("<<<Player"+id+" should go LEFT<<<");
    });
    
    sock.on('right', function(){
      console.log(">>>Player"+id+" should go RIGHT>>>");
    });
    
    
    // add to the list of players
    players.push(this);
  };
  
  
  
  
  
  // Handle connections other windows
  io.sockets.on('connection', function(socket){
    /*
      socket is a local variable, so if they identify themselves
      as a player or an arena - then we can set up handlers for
      to send them the correct information
    */
    var identifed = false;
    
    console.log("New Socket connection to server!");
    
    socket.on('arena', function(){
      if (identifed) {return} identifed = true;
      
      // this socket comes from an arena
      console.log("This socket comes from AN ARENA!!!");
      
      var arena = new Arena(socket);
      
      socket.emit('hello', "Hi there Arena " + arena.id);
      
    });
    
    socket.on('player', function(){
      if (identifed) {return} identifed = true;
      
      // this socket comes from a player
      console.log("This socket comes from a PLAYER!!!");
      
      var player = new Player(socket);
      
      socket.emit('hello', "Hi there player " + player.id);
      
    });
    
  });
  
};


// expose for node
if(typeof exports != 'undefined'){
  exports.start = controller;
} else {
  window.controller = controller;
}


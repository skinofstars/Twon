// # The game controller
// This gets a bit trippy because it can be used both by
// the browser or server

var controller = function(io){
  
  // utils
  var each = function(arr, fn){
    for (var i=0; i < arr.length; i++) {
      fn.call(arr[i], arr[i]);
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
  
  var Game = function(){
    this.players = [];
    this.arenas = [];
    
    this.start();
    
    // start the game loop
    var g = this;
    (function l(){
      g.loop();
      setTimeout(l,500);
    })()
  };
  
  // Add entities to the game
  Game.prototype.addPlayer = function(player){
    this.players.push(player);
  };
  Game.prototype.addArena = function(arena){
    this.arenas.push(arena);
  };
  
  /* start the game, position the players, etc */
  Game.prototype.start = function(){
    var y = 0;
    each(this.players, function(player){
      y += 10;
      player.posArray = [[0,y]];
      player.nextDirection = 'right';
    });
  }
  
  /* The actual game loop*/
  Game.prototype.loop = function(){
    // console.log("game loop")
    
    var arenas = this.arenas;
    
    each(this.players, function(player){
      player.advance();
      //update the arena with the new player position
      if(arenas[0]){
        arenas[0].draw(player);
      }
    });
    
  };
  
  
  
  
  // the controller represention of an arena
  var Arena = function(transport){
    this.id = ArenaCounter++;
    this.transport = transport;
  };
  
  Arena.prototype.color = function(color){
    this.emit('backgroundtop',color);
  }
  
  // update the view of the arena
  Arena.prototype.draw = function(player){
    // console.log(player.id, player.x, player.y);
    this.emit('updatePlayer', player.id, player.x, player.y)
  }
  
  
  
  
  // the controller representation of a player
  var Player = function(transport){
    var id = this.id = PlayerCounter++;
    this.transport = transport;
    
    this.on('left', function(){
      console.log("<<<Player"+this.id+" should go LEFT<<<");
      // increment the direction
      this.nextDirection = {
        'right':'up',
        'up':'left',
        'left':'down',
        'down':'right'
      }[this.nextDirection];
    });
    
    this.on('right', function(){
      console.log(">>>Player"+id+" should go RIGHT>>>");
      // increment the direction
      this.nextDirection = {
        'right':'down',
        'down':'left',
        'left':'up',
        'up':'right'
      }[this.nextDirection];
    });
    
  };
  
  Player.prototype.advance = function(){
    var nextPosition = this.posArray[0].slice(); 
    
    direction = this.nextDirection;
    switch (direction) {
    case 'left':
      nextPosition[0] -= 1;
      break;
    case 'up':
      nextPosition[1] -= 1;
      break;
    case 'right':
      nextPosition[0] += 1;
      break;
    case 'down':
      nextPosition[1] += 1;
      break;
    default:
      throw('Invalid direction');
    }
    
    this.x = nextPosition[0];
    this.y = nextPosition[1];

    previousPosArray = this.posArray.slice();

    //add the new position to the beginning of the array
    this.posArray.unshift(nextPosition);
    // console.log(this.posArray);
  }
  
  
  
  
  /* 
   Link up the models to the transport

   This means that the models don't have to have
   transport code in them,  calling this.on(…) will
   defer to the transport.  Also - the functions 
   will be called in the context of the object
   which is handy.
 */
  var transportPrototypes = function(){
    this.prototype.on = function(event,fn){
      var _this = this;
      this.transport.on(event, function(){
        fn.apply(_this,arguments);
      });
    };
    this.prototype.emit = function(){
      this.transport.emit.apply(this.transport,arguments);
    };
  }
  transportPrototypes.call(Player);
  transportPrototypes.call(Arena);
  
  
  var game = new Game();
  
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
      
      game.addArena(arena);
      
    });
    
    socket.on('player', function(){
      if (identifed) {return} identifed = true;
      
      // this socket comes from a player
      console.log("This socket comes from a PLAYER!!!");
      
      var player = new Player(socket);
      
      socket.emit('hello', "Hi there player " + player.id);
      
      game.addPlayer(player);
      
      // restart the game
      game.start();
      
    });
    
  });
  
};


// expose for node
if(typeof exports != 'undefined'){
  exports.start = controller;
} else {
  window.controller = controller;
}


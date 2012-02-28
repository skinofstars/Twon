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
  var equalCoordinates = function (coord1, coord2) {
    return coord1[0] === coord2[0] && coord1[1] === coord2[1];
  };
  var checkCoordinateInArray = function (coord, arr) {
    var isInArray = false;
    each(arr, function (item) {
      if (equalCoordinates(coord, item)) {
        isInArray = true;
      }
    });
    return isInArray;
  };
  
  var ArenaCounter = 0;
  var PlayerCounter = 0;
  
  // a list of players and arenas
  var arenas = [];
  var players = [];
  
  var gameover = function(){
    
  }
  
  /* 
    Arena & Controller logic
  */
  
  var Game = function(){
    this.players = [];
    this.arenas = [];
    
    this.transports = [];
    
    this.start();
    
    // start the game loop
    var g = this;
    (function l(){
      g.loop();
      setTimeout(l,50);
    })()
  };
  
  // Add entities to the game
  Game.prototype.addPlayer = function(player){
    this.players.push(player);
    this.start();
    this.report();
  };
  Game.prototype.addArena = function(arena){
    this.arenas.push(arena);
    this.start();
    this.report();
  };
  
  //Hack because games get socks added later and multiple transports
  Game.prototype.addTransport = function(trans){
    this.transports.push(trans);
    
    var game = this;
    // All ON stuff should be added here, and the context won't be `game`
    // trans.on('button')…
    trans.on('restart', function(){
      game.start();
    })
    
    this.report();
  };
  
  Game.prototype.emit = function(){
    var _this = this;
    var args = arguments;
    for(var t in this.transports){
      var trans = this.transports[t];
            console.log(t,this.transports)
      trans.emit.apply(trans,args);
    }
  };
  
  // report the current game state 
  Game.prototype.report = function(){
    this.emit('update:player_count',this.players.length);
    this.emit('update:arena_count',this.arenas.length);
  }
  
  
  /* start the game, position the players, etc */
  Game.prototype.start = function(){
    if(this.arenas.length == 0){
      console.log("Couldn't start game,  no arenas."); return;
    }
    
    // clear the arenas
    each(this.arenas, function(){
      this.usedpoints = [];
      this.emit('clear');
    })
    
    var startArena = this.arenas[0];
    
    //(player.id % 4) == 0;//0,height/2     d:right
    //(player.id % 4) == 1;//width,height/2 d:left
    //(player.id % 4) == 2;//width/2,0      d:down
    //(player.id % 4) == 3;//width/2,height d:up
    
    var y = 0;
    var i = 0;
    
    var firstarena = this.arenas[0];
    
    each(this.players, function(player){
      player.dead = false;
      
      switch(i % 4)
      {
        case 0:
          player.x = 0;
          player.y = firstarena.height/2;
          player.nextDirection = 'right';
          break;
        case 1:
          player.x = firstarena.width;
          player.y = firstarena.height/2;
          player.nextDirection = 'left';        
          break;
        case 2:
          player.x = firstarena.width/2;
          player.y = 0;
          player.nextDirection = 'down';         
          break;
        case 3:
          player.x = firstarena.width/2;
          player.y = firstarena.height;
          player.nextDirection = 'up';         
          break;
      }
      
      if(i>3){
      switch(i % 4)
      {
        case 0:
          player.y += 10;
          break;
        case 1:
          player.y += 10;     
          break;
        case 2:
          player.x += 10;       
          break;
        case 3:
          player.x += 10;       
          break;
      }
        

      }
      
      i++;
      
      player.arena = startArena;// XXX temporary
      player.emit('removerestart');
    });
  }
  
  /* The actual game loop*/
  Game.prototype.loop = function(){
    // console.log("game loop")
    
    var arenas = this.arenas;
    
    each(this.players, function(player){
      if(player.dead != true)
      {
        player.advance();
        //update the arena with the new player position
        if(player.arena){
          player.arena.draw(player);
        }
      }
    });
    
  };
  
  Game.prototype.restart = function(){
    
    var playersleft = 0;
    
    each(this.players, function(player){
      if(player.dead === false)
      {
        playersleft++;
      }
    });
    
    if(playersleft < 2)
    {
      console.log('game restart')
      
      each(this.arenas, function(arena){
        arena.emit('notice', 'restarting');
      });

      var g=this;
      setTimeout(function(){
        g.start()
      }, 1500);
    }
    
  }
  
  
  
  
  
  // When a link between arenas is requested - we set this variable
  var linkArena;
  var linkEdge;
  
  // the controller represention of an arena
  var Arena = function(transport,width,height){
    this.id = ArenaCounter++;
    this.transport = transport;
    
    this.width = width;
    this.height = height;
    
    this.links = {};
    
    
    this.on('requestLink', function(edge){
      console.log("requested link with", edge);
      
      if(!linkArena){
        linkArena = this;
        linkEdge = edge;
      } else {
        linkArena.links[linkEdge] = this;
        this.links[edge] = linkArena;
        
        linkArena.emit('linked', linkEdge);
        this.emit('linked', edge);
        
        // ready for another link
        linkArena = false;
      }
      
    });

    this.usedpoints = [];
  };
  
  // this checks to see if a player is still on this
  // arena and moves them to another one (or null)
  // as appropriate
  Arena.prototype.updatePlayer = function(player){    
    if(player.x < 0){
      // left
      if(player.arena = this.links.left)
        player.arena.entry(this, player, player.y/this.height);
      
    } else if(player.x > this.width){
      // right
      if(player.arena = this.links.right)
        player.arena.entry(this, player, player.y/this.height);
      
    } else if(player.y < 0){
      //top
      if(player.arena = this.links.top)
        player.arena.entry(this, player, player.x/this.width);
    } else if(player.y > this.height){
      //bottom
      if(player.arena = this.links.bottom)
        player.arena.entry(this, player,  player.x/this.width);
    }
  };
  
  // this repositions the player as they have entered from another
  // arena
  Arena.prototype.entry = function(fromarena, player, position){
    for(link in this.links){
      if(this.links[link] === fromarena){
        // update the direction and position
        if(link == 'left'){
          player.x = 0;
          player.y = position * this.height;
          player.nextDirection = 'right';
        };
        if(link == 'right'){
          player.x = this.width;
          player.y = position * this.height;
          player.nextDirection = 'left';
        };
        if(link == 'top'){
          player.x = position * this.width;
          player.y = 0;
          player.nextDirection = 'down';
        };
        if(link == 'bottom'){
          player.x = position * this.width;
          player.y = this.height;
          player.nextDirection = 'up';
        };
        
        console.log("Switched player" + player.id + ' from arena' + fromarena.id + ' --> arena' + this.id);
      }
    }
  }
  
  // update the view of the arena
  Arena.prototype.draw = function(player){
    this.emit('updatePlayer', player.id, player.x, player.y)
  }
  
  Arena.prototype.addUsedPoint = function(points){
    // [x,y,playerid]
    // console.log(points)
    
    this.usedpoints.push(points);
  }

  Arena.prototype.checkCollision = function(head){
    // console.log('head:' + head)
    // console.log('used: '+ this.usedpoints);
    // [[x,y,playerid],[x,y,playerid]]
    playerCollision = checkCoordinateInArray(head, this.usedpoints);
    if(playerCollision){
      return true;
    }
  }
  
  
  // the controller representation of a player
  var Player = function(transport){
    var id = this.id = PlayerCounter++;
    
    var dead = this.dead = false;
    
    this.transport = transport;
    
    this.on('left', function(){
      console.log("<<<Player"+this.id+" LEFT");
      // increment the direction
      this.nextDirection = {
        'right':'up',
        'up':'left',
        'left':'down',
        'down':'right'
      }[this.nextDirection];
    });
    
    this.on('right', function(){
      console.log(">>>Player"+id+" RIGHT");
      // increment the direction
      this.nextDirection = {
        'right':'down',
        'down':'left',
        'left':'up',
        'up':'right'
      }[this.nextDirection];
    });
    
    this.on('restart', function(){
      console.log('>.< Player '+this.id+' says RESTART!!');
      
      game.restart(); // best way?
    });
    
  };

  Player.prototype.advance = function(){
    
    // increment x y appropriately
    this.x += {left:-1, right:1}[this.nextDirection] || 0;
    this.y += {down:1,  up:-1   }[this.nextDirection] || 0;
    
    // update/transistion the arena based on the position
    if(this.arena){
      this.arena.updatePlayer(this);
      
      if(!this.arena){
        // we arent on an arena anymore
        console.log("KABOOM player "+this.id);
        this.dead = true;
        this.restart();
      } else {
        this.checkCollision();
        // store the point for collisions
        var nextPosition = [this.x,this.y,this.id];
        this.arena.addUsedPoint(nextPosition);
      }
      
    }
    
  }

  Player.prototype.restart = function(){
    //console.log("KABOOM");
    this.emit('gameover', true);
  }
  
  Player.prototype.checkCollision = function(){
    
    // actually, we just ask the arena for now
    if(this.arena.checkCollision([this.x,this.y,this.id]) === true)
    {
      console.log('BOOM!');
      this.dead = true;
      this.restart();
    }
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
    
    socket.on('arena', function(width,height,oldid){
      if (identifed) {return} identifed = true;
      
      // this socket comes from an arena
      console.log("This socket comes from AN ARENA!!!");
      var arena;
      if(oldid){
        each(game.arenas, function(a){
          if(a.id == oldid){
            arena = a;
          }
        })
      }
      arena = arena || new Arena(socket,width,height);
      
      socket.emit('hello', "Hi there Arena " + arena.id);
      
      socket.emit('id', arena.id);
      
      game.addArena(arena);
      
      
      socket.on('disconnect', function () {
        console.log("Disconnected arena");
        for (var i = game.arenas.length - 1; i >= 0; i--){
          if(game.arenas[i] == arena){
            console.log("found arena to remove", i)
            game.arenas.splice(i,1); 
          }
        };
      });
      
    });
    
    socket.on('player', function(){
      if (identifed) {return} identifed = true;
      
      // this socket comes from a player
      console.log("This socket comes from a PLAYER!!!");
      
      var player = new Player(socket);
      
      player.emit('id', player.id);
      socket.emit('hello', "Hi there player " + player.id);
      
      game.addPlayer(player);
      
      
      // restart the game
      game.start();
      
    });
    
    
    
    socket.on('game', function(){
      if (identifed) {return} identifed = true;
      
      // this socket comes from a game
      console.log("This socket comes from a GAME!!!");
      
      game.addTransport(socket);
      
    });
    
    
    
  });
  
};


// expose for node
if(typeof exports != 'undefined'){
  exports.start = controller;
} else {
  window.controller = controller;
}


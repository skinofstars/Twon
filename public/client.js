(function(window, document, io){
  
  // utils
  var each = function(arr, fn){
    for (var i=0; i < arr.length; i++) {
      fn.call(arr[i], arr[i], i);
    };
  };
  
  
  // if io has been defined in the top window (for dev reasons)
  var io = window.top.io || io;
  // var socket = io.connect(document.location.origin);
  
  // get a socket - and listen for logging
  var getSocket = function(){
    var socket = io.connect(document.location.origin)
    socket.on('hello', function(message){
      console.log("Server said:" + message);
    });
    return socket;
  }
  
  
  var ArenaView = function(elements){
    this.els = elements;
    this.transport = getSocket();
    this.emit('arena', this.els.canvas.width, this.els.canvas.height);
    
    this.on('backgroundtop', function(color){
      elements.top.style.backgroundColor = color
    });
    
    
    var ctx = elements.canvas.getContext('2d');
    ctx.fillStyle="red"
    this.on('updatePlayer', function(id,x,y){
      // *5 for debug
      ctx.fillRect(x,y,1,1);
    });
    
    // set up the click handlers for the elements
    var arenaView = this;
    each(['top', 'bottom', 'left', 'right'], function(key){
      var el = arenaView.els[key];
      el.addEventListener('click', function(){
        this.style.backgroundColor = 'blue';
        arenaView.emit('requestLink', key);
      })
    });
    
    // when an edge has been linked
    this.on('linked', function(edge){
      this.els[edge].style.backgroundColor = 'green';
    })
    
  };
  
  
  var PlayerView = function(elements){
    this.els = elements;
    this.transport = getSocket();
    
    this.emit('player');
    
    var player = this;
    // link up the ui
    this.els.left.addEventListener('click', function(){
      player.emit('left');
    })
    this.els.right.addEventListener('click', function(){
      player.emit('right');
    })
  };
  
  
  
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
  transportPrototypes.call(PlayerView);
  transportPrototypes.call(ArenaView);
  
  
  window.ArenaView = ArenaView;
  window.PlayerView = PlayerView;
  
  window.el = function(id){
    return document.getElementById(id);
  }
  
})(window, document, io);
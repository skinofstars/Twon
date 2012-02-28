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
  
  var fills = ['#f09','#fc0','#08f','#0f4'];
  
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
    
    this.on('updatePlayer', function(id,x,y){
      ctx.fillStyle=fills[id%fills.length]
      ctx.fillRect(x,y,1,1);
    });
    this.on('clear', function(id,x,y){
      ctx.clearRect(0,0,this.els.canvas.width, this.els.canvas.height);
    });
    this.on('notice', function(notice){
      console.log(notice)

      var x = 10;
      var y = 10;
 
      ctx.font = "10px Courier";
      ctx.fillStyle = "#333";
      ctx.fillText(notice, x, y);
    
    });
    
    // set up the click handlers for the elements
    var arenaView = this;
    each(['top', 'bottom', 'left', 'right'], function(key){
      var el = arenaView.els[key];
      el.addEventListener('click', function(){
        if(this.style.backgroundColor == 'blue'){
          return;
        }
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
    
    var player = this;
    // link up the ui
    this.els.left.addEventListener('click', function(){
      player.emit('left');
    })
    this.els.right.addEventListener('click', function(){
      player.emit('right');
    })

    this.els.restart.addEventListener('click', function(){
      player.emit('restart');
    })
    
    // player is assigned an id
    this.on('id', function(id){
      //color the buttons
      // console.log('-----')
      this.els.left.style.color = fills[id%fills.length]
      this.els.right.style.color = fills[id%fills.length]
      
    });
    
    this.on('gameover', function(){
      // show restart button
      this.els.restart.style.display = 'block';
    });
    
    this.on('removerestart', function(){
      // restart pressed, remove button
      this.els.restart.style.display = 'none';
    });    
    
    this.emit('player');
    
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

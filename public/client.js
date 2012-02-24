(function(window, document, io){
  
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
		
		// start socket and sign up as an arena
		this.socket = getSocket();
    this.socket.emit('arena');
    
    this.socket.on('backgroundtop', function(color){
      elements.top.style.backgroundColor = color
    });
    
    
    var ctx = elements.canvas.getContext('2d');
    ctx.fillStyle="red"
    this.socket.on('updatePlayer', function(id,x,y){
      // *5 for debug
      ctx.fillRect(x*5,y*5,2,2);
    })
	};
	
	
	var PlayerView = function(elements){
		this.els = elements;
		
		// start socket and sign up as a player
    this.socket = getSocket();
		this.socket.emit('player');
		
		var socket = this.socket;
		// link up the ui
		this.els.left.addEventListener('click', function(){
		  socket.emit('left');
		})
		this.els.right.addEventListener('click', function(){
		  socket.emit('right');
		})
	};
	
	
	
	
	window.ArenaView = ArenaView;
	window.PlayerView = PlayerView;
	
	window.el = function(id){
    return document.getElementById(id);
  }
	
})(window, document, io);
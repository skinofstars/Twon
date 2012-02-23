(function(){
  
  // utils
  var each = function(arr, fn){
    for (var i=0; i < arr.length; i++) {
      fn.call(arr[i]);
    };
  };
  var rest = function(arr){
    return Array.prototype.slice.call(arr,1);
  };
  
  // build a mock socket io for browser dev
  var Socket = function(){this.listeners = {};}
  Socket.prototype.emit = function(k){
    if(this.listeners[k]){
      // notify the listeners
      var args = rest(arguments);
      each(this.listeners[k], function(){
        this.apply(this, args);
      });
    }
  };
  
  Socket.prototype.on = function(k, fn){
    this.listeners[k] || (this.listeners[k] = []);
    this.listeners[k].push(fn);
    return this;
  };

  window.io = {
  
    // the socket that gets notified of new
    // connected sockets
    sockets:new Socket(),
  
    connect:function(host){
      var s = new Socket();
      this.sockets.emit('connection', s);
      return s;
    } 
  };
})();
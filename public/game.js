var Twon = {}

players = [];



Twon.game = (function(){
  var canvas, ctx;
  var frameLength = 50;
  var timeout;
  Twon.height = 300;
  Twon.width = 500;
  Twon.blockSize = 2;
  Twon.backgroundColor = '#333';
  
  function init(){
    $('#game-canvas').append('<canvas id="arena">');
    var $canvas = $('#arena');
    $canvas.attr('width', Twon.width);
    $canvas.attr('height', Twon.height);
    var canvas = $canvas[0];
    ctx = canvas.getContext('2d'); // the one and only context
    
    // need to pass x, y, direction, colour, speed?
    players[0] = Twon.player({'xStart':8, 'yStart':23, 'dirStart':'right', 'colour':'#33a'}); 
    players[1] = Twon.player({'xStart':102, 'yStart':56, 'dirStart':'left', 'colour':'#a33'}); 
    
    bindEvents();
    gameLoop();
    
  }
  
  function gameLoop(){
    ctx.fillStyle = Twon.backgroundColor;
    ctx.fillRect(0, 0, Twon.width, Twon.height);

    drawBorder();
    
    var playersAlive = 0; 
    var lastplayer = 0;//meh
    
    $.each(players, function(i, player){
      //console.log(player);
      if (player.checkCollision() === true) {
        player.dying(); // some final death throws
      }
      
      if (player.isAlive()) {
        playersAlive++;
        lastplayer = i;
        
        player.advance();
        player.draw(ctx);
      }
      
    });
    //console.log(playersAlive);
    // there can be only one
    if (playersAlive === 1){
      gameOver({'winner':lastplayer});
    }
    else {
      timeout = setTimeout(gameLoop, frameLength);
    }
    
  }
  
  
  function gameOver(args) {
    var winner = args.winner;
    
    // print the winner?
    // check for new players?
    
    ctx.save();
    ctx.restore();
  }

  
  function drawBorder() {
    ctx.save();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.lineCap = 'square';
    var offset = 4;
    var corners = [
      [offset, offset],
      [Twon.width - offset, offset],
      [Twon.width - offset, Twon.height - offset],
      [offset, Twon.height - offset]
    ];
    ctx.beginPath();
    ctx.moveTo(corners[3][0], corners[3][1]);
    $.each(corners, function (index, corner) {
      ctx.lineTo(corner[0], corner[1]);
    });
    ctx.stroke();
    ctx.restore();
  }
  
  function bindEvents() {
    var keysToDirections = {
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down'
    };

    $(document).keydown(function (event) {
      var key = event.which;
      var direction = keysToDirections[key];

      if (direction) {
        players[0].setDirection(direction);
        event.preventDefault();
      }
    });
  }
  
  return {
    init: init
  };
  
})();

Twon.player = function(args){
  
  var posArray = [];
  posArray.push([args.xStart, args.yStart]);
  
  var direction = args.dirStart;
  var nextDirection = direction;
  
  var alive = true;
  
  function isAlive() {
    return alive;
  }
  
  function setDirection(newDirection) {
    var allowedDirections;

    //If player is going left or right, only valid new directions
    //are up and down. Vice versa for up or down.
    switch (direction) {
    case 'left':
    case 'right':
      allowedDirections = ['up', 'down'];
      break;
    case 'up':
    case 'down':
      allowedDirections = ['left', 'right'];
      break;
    default:
      throw('Invalid direction');
    }
    if (allowedDirections.indexOf(newDirection) > -1) {
      nextDirection = newDirection;
    }
  }
  
  function drawSection(ctx, position) {
    var x = Twon.blockSize * position[0];
    var y = Twon.blockSize * position[1];
    ctx.fillRect(x, y, Twon.blockSize, Twon.blockSize);
  }

  function draw(ctx) {
    ctx.save();
    ctx.fillStyle = args.colour;
    for(var i = 0; i < posArray.length; i++) {
      drawSection(ctx, posArray[i]);
    }
    ctx.restore();
  }

  function checkCollision() {
    var wallCollision = false;
    var playerSelfCollision = false;
    var playerOtherCollision = false; // who'd ya hit?!
    var head = posArray[0]; //just the head
    var rest = posArray.slice(1); //the player tail
    var playerX = head[0];
    var playerY = head[1];
    var minX = 1;
    var minY = 1;
    var maxX = Twon.widthInBlocks - 1;
    var maxY = Twon.heightInBlocks - 1;
    var outsideHorizontalBounds = playerX < minX || playerX >= maxX;
    var outsideVerticalBounds = playerY < minY || playerY >= maxY;

    if (outsideHorizontalBounds || outsideVerticalBounds) {
      wallCollision = true;
    }
    
    //check if the player head coords overlap the rest of the tail
    playerCollision = Twon.checkCoordinateInArray(head, rest);
    return wallCollision || playerCollision;
  }

  function advance() {
    var nextPosition = posArray[0].slice(); 
    
    direction = nextDirection;
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
    //nextPosition[0] += 1; //add 1 to the x position

    previousPosArray = posArray.slice();

    //add the new position to the beginning of the array
    posArray.unshift(nextPosition);

  }

  function dying() {
    posArray = previousPosArray;
    alive = false;
    // would be nice to do some indication
  }

  return {
    draw: draw,
    advance: advance,
    setDirection: setDirection,
    checkCollision: checkCollision,
    dying: dying,
    isAlive: isAlive
  };  
}

Twon.equalCoordinates = function (coord1, coord2) {
  return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

Twon.checkCoordinateInArray = function (coord, arr) {
  var isInArray = false;
  $.each(arr, function (index, item) {
    if (Twon.equalCoordinates(coord, item)) {
      isInArray = true;
    }
  });
  return isInArray;
};

$(document).ready(function(){
  Twon.game.init();
});

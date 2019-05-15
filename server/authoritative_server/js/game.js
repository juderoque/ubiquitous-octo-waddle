var totalRed=0;
var totalBlue=0;
const players = {};
var timestamp = Date.now();
var config ={
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  autoFocus: false
};

function preload() {
  this.load.image('red-zone','assets/red-zone.jpg');
  this.load.image('blue-zone','assets/blue-zone.jpg');
  this.load.image('water', 'assets/plain-blue-background.jpg');
  this.load.spritesheet('octo1','assets/octo1.png',{frameWidth: 98,frameHeight: 109});
  this.load.spritesheet('octo2','assets/octo2.png',{frameWidth: 98,frameHeight: 109});
  this.load.spritesheet('octoflag1','assets/octoflag1.png',{frameWidth: 98,frameHeight: 109});
  this.load.spritesheet('octoflag2','assets/octoflag2.png',{frameWidth: 98,frameHeight: 109});
  this.load.image('flag','assets/flag.png');
}

function create() {


  this.add.image(400, 300, 'water');
  const self = this;
  this.players = this.physics.add.group();

  this.scores = {
    blue: 0,
    red: 0
  };

  //this.star = this.physics.add.image(415, 315, 'star');
  this.flag = this.physics.add.image(400,300,'flag');

  this.red_zone=this.physics.add.image(100,300,'red-zone');
  this.blue_zone=this.physics.add.image(700,300,'blue-zone');
  // this.physics.add.collider(this.players);





  // this.physics.add.overlap(this.players, this.star, function (star, player) {
  //   if (players[player.playerId].team === 'red') {
  //     self.scores.red += 10;
  //   } else {
  //     self.scores.blue += 10;
  //   }
  //   self.star.setPosition(randomPosition(700), randomPosition(500));
  //   io.emit('updateScore', self.scores);
  //   io.emit('starLocation', { x: self.star.x, y: self.star.y });
  // });
  this.physics.add.overlap(this.players, this.players, function (otherPlayer, player) {
    var newTime = Date.now();
    if(players[player.playerId].team!=players[otherPlayer.playerId].team){
    if(newTime-timestamp>1000){
        if(players[player.playerId].hasFlag){
          players[player.playerId].hasFlag=false;
          players[otherPlayer.playerId].hasFlag=true;
          timestamp = Date.now();
        }
        else if(players[otherPlayer.playerId].hasFlag){
          players[player.playerId].hasFlag=true;
          players[otherPlayer.playerId].hasFlag=false;
          timestamp = Date.now();
        }
      }
    }
    io.emit('playerUpdates', players);
  });


  this.physics.add.overlap(this.players, this.flag, function (flag, player) {
    players[player.playerId].hasFlag = true;
    self.flag.setPosition(1000, 1000);
    io.emit('updateScore', self.scores);
    io.emit('flagLocation', { x: self.flag.x, y: self.flag.y });
  });

  this.physics.add.overlap(this.players, this.red_zone, function (red_zone, player) {
    if(players[player.playerId].hasFlag&&players[player.playerId].team==='red'){
      self.flag.setPosition(400, 300);
      self.scores.red+=1;
      players[player.playerId].hasFlag=false;
    }
    io.emit('updateScore', self.scores);
    io.emit('flagLocation', { x: self.flag.x, y: self.flag.y });
  });
  this.physics.add.overlap(this.players, this.blue_zone, function (blue_zone, player) {
    if(players[player.playerId].hasFlag&&players[player.playerId].team==='blue'){
      self.flag.setPosition(400, 300);
      self.scores.blue+=1;
      players[player.playerId].hasFlag=false;
    }
    io.emit('updateScore', self.scores);
    io.emit('flagLocation', { x: self.flag.x, y: self.flag.y });
  });




  io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
      rotation: 0,
      x: (totalBlue>totalRed) ? 100:700,
      // x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: (totalBlue>totalRed) ? 'red':'blue',
      input: {
        left: false,
        right: false,
        up: false
      },
      hasFlag: false
    };
    if(players[socket.id].team=='red'){
      totalRed++;
    }
    else{
      totalBlue++;
    }
    console.log(totalRed);
    console.log(totalBlue);
    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);
    // send the star object to the new player
    //socket.emit('starLocation', { x: self.star.x, y: self.star.y });
    socket.emit('flagLocation',{x:self.flag.x,y:self.flag.y});
    // send the current scores
    socket.emit('updateScore', self.scores);

    socket.on('disconnect', function () {
      console.log('user disconnected');

      if(players[socket.id].hasFlag){
        self.flag.setPosition(400, 300);
        io.emit('flagLocation', { x: self.flag.x, y: self.flag.y });
      }

      if(players[socket.id].team=='red'){
        totalRed--;
      }
      else{
        totalBlue--;
      }
      console.log(totalRed);
      console.log(totalBlue);
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerInput', function (inputData) {
      handlePlayerInput(self, socket.id, inputData);
    });
  });
}

function update() {
  this.players.getChildren().forEach((player) => {

    const input = players[player.playerId].input;

    if (input.left) {
      player.setAngularVelocity(-300);
    } else if (input.right) {
      player.setAngularVelocity(300);
    } else {
      player.setAngularVelocity(0);
    }

    if (input.up) {
      this.physics.velocityFromRotation((player.rotation + 1.5), -200, player.body.acceleration);
    } else {
      player.setAcceleration(0);
    }

    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
    players[player.playerId].rotation = player.rotation;
  });


  this.physics.world.wrap(this.players, 5);
  io.emit('playerUpdates', players);
}

function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}

function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].input = input;
    }
  });
}

function addPlayer(self, playerInfo) {
  const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'octo1').setOrigin(0.5, 0.5).setDisplaySize(24, 27);
  player.setDamping(true);
  player.setDrag(.75,.75);
  player.setAngularDrag(100);
  player.setMaxVelocity(200);
  player.playerId = playerInfo.playerId;
  self.players.add(player);

}

function removePlayer(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      player.destroy();
    }
  });
}

const game = new Phaser.Game(config);
window.gameLoaded();

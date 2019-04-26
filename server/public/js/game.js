var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

function preload() {
  this.load.image('red-zone','assets/red-zone.jpg');
  this.load.image('blue-zone','assets/blue-zone.jpg');
  this.load.image('water', 'assets/plain-blue-background.jpg');
  //this.load.image('star', 'assets/star_gold.png');
  this.load.spritesheet('octoflag1','assets/octoflag1.png',{frameWidth: 98,frameHeight: 109});
  this.load.spritesheet('octoflag2','assets/octoflag2.png',{frameWidth: 98,frameHeight: 109});
  this.load.image('flag', 'assets/flag.png');
  this.load.spritesheet('octo1','assets/octo1.png',{frameWidth: 98,frameHeight: 109});
  this.load.spritesheet('octo2','assets/octo2.png',{frameWidth: 98,frameHeight: 109});
  this.load.spritesheet('ship', 'assets/octopus-purple.png', {
        frameWidth: 128,
        frameHeight: 128
  });

}

function create() {
  this.add.image(400, 300, 'water');
  this.add.image(100,300,'red-zone');
  this.add.image(700,300,'blue-zone');
  var self = this;
  this.socket = io();
  this.players = this.add.group();

  this.anims.create({
        key: 'forward',
        frames: [{key:'octo1'},{key:'octo2'}],
        frameRate: 5,
        repeat: -1
  });
  this.anims.create({
        key: 'still',
        frames: [{key: 'octo1'}],
        frameRate: 20
  });
  this.anims.create({
        key: 'flagforward',
        frames: [{key:'octoflag1'},{key:'octoflag2'}],
        frameRate: 5,
        repeat: -1
  });
  this.anims.create({
        key: 'flagstill',
        frames: [{key: 'octoflag1'}],
        frameRate: 20
  });




  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        displayPlayers(self, players[id], 'octo1');
      } else {
        displayPlayers(self, players[id], 'octo1');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'octo1');
  });

  this.socket.on('disconnect', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });

  this.socket.on('playerUpdates', function (players) {
    Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);

          if(players[id].hasFlag){
            if(players[id].input.up) player.anims.play('flagforward',true);
            else player.anims.play('flagstill',true);

          }
          else{
            if(players[id].input.up) player.anims.play('forward',true);
            else player.anims.play('still',true);
          }




        }
      });
    });
  });

  this.socket.on('updateScore', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  // this.socket.on('starLocation', function (starLocation) {
  //   if (!self.star) {
  //     self.star = self.add.image(starLocation.x, starLocation.y, 'star');
  //   } else {
  //     self.star.setPosition(starLocation.x, starLocation.y);
  //   }
  // });

  this.socket.on('flagLocation', function (flagLocation) {
    if (!self.flag) {
      self.flag = self.add.image(flagLocation.x, flagLocation.y, 'flag');
    } else {
      self.flag.setPosition(flagLocation.x, flagLocation.y);
    }
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
}

function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;

  if (this.cursors.left.isDown) {
    this.leftKeyPressed = true;
  } else if (this.cursors.right.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }

  if (this.cursors.up.isDown) {
    this.upKeyPressed = true;
  } else {
    this.upKeyPressed = false;
  }

  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(24, 27);
  if (playerInfo.team === 'blue') player.setTintFill(0x0000FF);
  else player.setTintFill(0xFF0000);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

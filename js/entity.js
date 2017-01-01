var HEIGHT=500;
var WIDTH=500;
var timeWhenGameStarted = Date.now();
var frameCount = 0;
var score = 0;
var player;

var enemyList = {};
var upgradeList = {};
var bulletList = {};
var player;

Entity = function(type,x,spdX,y,spdY,name,id,width,height,color){
  var self = {
    type:type,
    x:x,
    spdX:spdX,
    y:y,
    spdY:spdY,
    name:name,
    id:id,
    width : width,
    height:height,
    color:color
  };
  self.update = function () {
    self.updatePosition();
    self.draw();
  };
  self.updatePosition = function(){
    self.x+=self.spdX;
    self.y+=self.spdY;


    if(self.x>WIDTH || self.x<0){
      self.spdX=-self.spdX;
    }
    if(self.y>HEIGHT || self.y<0){
      self.spdY=-self.spdY;
    }
  };
  self.draw = function(){
      ctx.save();
      var x = self.x-self.width/2;
      var y = self.y-self.height/2;
      ctx.fillStyle = self.color;
      ctx.fillRect(x,y,self.width,self.height);
      ctx.restore();
  };
  self.getDistance = function (entity2){
    var vx = self.x - entity2.x;
    var vy = self.y - entity2.y;
    return Math.sqrt(vx*vx+vy*vy);
  };

  self.testCollision = function (entity2){
    var rect1 = {
      x:self.x-self.width/2,
      y:self.y-self.height/2,
      width:self.width,
      height:self.height
    };
    var rect2 = {
      x:entity2.x-entity2.width/2,
      y:entity2.y-entity2.height/2,
      width:entity2.width,
      height:entity2.height
    };
    return testCollisionRectRect(rect1,rect2);
  };


  return self;
};

Actor = function(entity_name,x,spdX,y,spdY,name,id,width,height,color,hp,aimAngle){
  var self = Entity(entity_name,x,spdX,y,spdY,name,id,width,height,color);

  self.hp=hp;
  self.aimAngle=aimAngle;
  self.atkSpd=1;
  self.atkCounter=0;

  var super_update = self.update;// preventing overwrite
  self.update = function(){
    super_update();
    self.atkCounter += self.atkSpd;
  };

  self.performAttack= function() {
    if(self.atkCounter > 25){
      randomlyGenerateBullet(self);
      self.atkCounter=0;
    }
  };
  self.performSpecialAttack = function() {
    if(self.atkCounter > 50){
      for(var i=0;i<360;i++){
        randomlyGenerateBullet(self,i);
      };
      self.atkCounter=0;
    }
  };

  return self;
}

enemy = function (id,x,y,spdX,spdY,name,width,height) { // attributes as passed during creation
  var self = Actor('enemy',x,spdX,y,spdY,name,id,width,height,'red',10,0);

  var super_update =self.update;
  self.update = function() {
    super_update();
    self.performAttack();

    var isColliding = player.testCollision(self);
    if(isColliding){
      player.hp-=1;
    }
  };

  enemyList[id]=self;
};

Upgrade = function (id,x,y,spdX,spdY,name,width,height,category,color) {
  var self = Entity('upgrade',x,spdX,y,spdY,name,id,width,height,color);
  self.category=category;
  var super_update = self.update;
  self.update = function() {
    super_update();
    var isColliding = player.testCollision(self);
    if(isColliding){
      if(self.category === 'score'){
        score+=1000;
      }
      if(self.category === 'atkSpd'){
        player.atkSpd+=3;
      }
      delete upgradeList[self.id];
    }
  };
  upgradeList[id]=self;
};

Bullet = function (id,x,y,spdX,spdY,name,width,height) {
  var self = Entity('bullet',x,spdX,y,spdY,name,id,width,height,'black');
  self.timer=0;

  var super_update = self.update;
  self.update = function() {
    super_update();
    var toRemove = false;
    self.timer++;
    if(self.timer > 100){
      toRemove=true;
    }


    for(var key2 in enemyList){
      // var isColliding = self.testCollision(enemyList[key2]);
      // if(isColliding){
      //   toRemove = true;
      //   delete enemyList[key2];
      //   break;
      // }
    }
    if(toRemove){
      delete bulletList[self.id];
    }
  };

  bulletList[id]=self;
};

Player = function() {
  var self = Actor('player',50,30,40,5,'P',undefined,20,20,'green',10,1);

  self.updatePosition = function() {
    if(self.pressingRight)
      self.x+=10;
    if(self.pressingLeft)
      self.x-=10;
    if(self.pressingDown)
      self.y+=10;
    if(self.pressingUp)
      self.y-=10;

      if(self.x<self.width/2)
        self.x=self.width/2;
      if(self.x>WIDTH-self.width/2)
        self.x=WIDTH-self.width/2;
      if(self.y<self.height/2)
        self.y=self.height/2;
      if(self.y>HEIGHT-self.height/2)
        self.y=HEIGHT-self.height/2;
  };
  var super_update = self.update;
  self.update= function() {
    super_update();
    if(self.hp <= 0){
      var timeSurvived = Date.now() - timeWhenGameStarted;
      console.log('You lost, you survived for ' + timeSurvived + ' ms');
      startNewGame();
    }
  };

  self.pressingDown = false;
  self.pressingUp=false;
  self.pressingLeft=false;
  self.pressingRight =false;
  return self;
};


update = function (){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  frameCount++;
  score++;

  if(frameCount % 100 === 0){
    randomlyGenerateEnemy();
  }

  if(frameCount % 75 === 0){
    randomlyGenerateUpgrade();
  }

  player.atkCounter+=player.atkSpd;

  for (var key in bulletList){
    bulletList[key].update();
  };

  for (var key in upgradeList){
    upgradeList[key].update();
  };

  for ( var key in enemyList) {
    enemyList[key].update();
  };

  player.update();

  ctx.fillText(player.hp + " Hp",0,20);
  ctx.fillText(score + " Score",200,20);
};

startNewGame = function() {
  player.hp = 10;
  score=0;
  timeWhenGameStarted = Date.now();
  frameCount=0;
  selfList = {};
  upgradeList = {};
  bulletList= {};
  randomlyGenerateEnemy();
  randomlyGenerateEnemy();
  randomlyGenerateEnemy();
}

randomlyGenerateEnemy = function() {
  var x = Math.random()*WIDTH;
  var y = Math.random()*HEIGHT;
  var height = 10 + Math.random()*30;
  var width = 10 + Math.random()*30;
  var id = Math.random();
  var spdX = 5 + Math.random()*5;
  var spdY= 5 + Math.random()*5;
  enemy(id,x,y,spdX,spdY,'E',width,height);
};

randomlyGenerateBullet = function(actor,overWriteAngle) {
  var x = actor.x;
  var y = actor.y;
  var height = 10 ;
  var width = 10 ;
  var id = Math.random();

  var angle = actor.aimAngle;
  if(overWriteAngle !== undefined){
    angle = overWriteAngle;
  }
  var spdX = Math.cos(angle/180 * Math.PI)*5;
  var spdY= Math.sin(angle/180 * Math.PI)*5;
  Bullet(id,x,y,spdX,spdY,'E',width,height);
};

randomlyGenerateUpgrade = function() {
  var x = Math.random()*WIDTH;
  var y = Math.random()*HEIGHT;
  var height = 10 ;
  var width = 10 ;
  var id = Math.random();
  var spdX = 0;
  var spdY= 0;

  if(Math.random() < 0.5){
    var category = 'score';
    var color= 'blue';
  } else {
    category = 'atkSpd';
    var color = 'yellow';
  }

  Upgrade(id,x,y,spdX,spdY,'U',width,height,category,color);
};

document.onclick = function(mouse) {
  player.performAttack();
};

document.oncontextmenu = function(mouse) {
  player.performSpecialAttack();
  mouse.preventDefault();
};

document.onmousemove = function(mouse){
  var mouseX = mouse.clientX - document.getElementById('ctx').getBoundingClientRect().left;
  var mouseY = mouse.clientY - document.getElementById('ctx').getBoundingClientRect().top;
  mouseX-=player.x;
  mouseY-=player.y;

  player.aimAngle = ( Math.atan2(mouseY,mouseX) / Math.PI) * 180;
};

document.onkeydown = function(event){
  if(event.keyCode === 68){ //d
    player.pressingRight = true;
  }else if(event.keyCode === 83){//s
    player.pressingDown = true;
  }else if(event.keyCode === 65){//a
    player.pressingLeft = true;
  }else if(event.keyCode === 87){//w
    player.pressingUp = true;
  }
};

document.onkeyup = function(event){
  if(event.keyCode === 68){ //d
    player.pressingRight = false;
  }else if(event.keyCode === 83){//s
    player.pressingDown = false;
  }else if(event.keyCode === 65){//a
    player.pressingLeft = false;
  }else if(event.keyCode === 87){//w
    player.pressingUp = false;
  }
};

testCollisionRectRect = function (rect1,rect2){
  return rect1.x <= rect2.x+rect2.width
      && rect2.x <= rect1.x+rect1.width
      && rect1.y <= rect2.y+rect2.height
      && rect2.y <= rect1.y+rect1.height;
}


var player = Player();
startNewGame();

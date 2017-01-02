var Img = {};
Img.player = new Image();
Img.player.src="img/player.png";
Img.enemy = new Image();
Img.enemy.src="img/enemy.png";
Img.bullet = new Image();
Img.bullet.src="img/bullet.png";
Img.upgrade1 = new Image();
Img.upgrade1.src="img/upgrade1.png";
Img.upgrade2 = new Image();
Img.upgrade2.src="img/upgrade2.png";

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

Entity = function(type,x,y,name,id,width,height,img){
  var self = {
    type:type,
    x:x,
    y:y,
    name:name,
    id:id,
    width : width,
    height:height,
    img:img
  };
  self.update = function () {
    self.draw();
  };
  self.draw = function(){
      ctx.save();
      var x = self.x - player.x;
      var y = self.y - player.y;

      x += WIDTH/2;
      y += HEIGHT/2;

      x -= self.width/2;
      y -= self.height/2;

      ctx.drawImage(self.img,0,0,self.img.width,self.img.height,x,y,self.width,self.height);

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

enemy = function (id,x,y,name,width,height) { // attributes as passed during creation

  var self = Actor('enemy',x,y,name,id,width,height,Img.enemy,10,0);

  self.updateAimAngle = function() {
    var difX = -self.x + player.x;
    var difY = -self.y + player.y;
    self.aimAngle = ( Math.atan2(difY,difX) / Math.PI) * 180;
  }

  self.updatePosition = function(){
    if(self.x > player.x)
      self.x-=3;
    else
      self.x+=3;
    if(self.y > player.y)
      self.y-=3;
    else
      self.y+=3;
  }
  var super_update =self.update;
  self.update = function() {
    self.updateAimAngle();
    self.updatePosition();
    super_update();
    self.performAttack();

    var isColliding = player.testCollision(self);
    if(isColliding){
      player.hp-=1;
    }
  };

  enemyList[id]=self;
};

Actor = function(entity_name,x,y,name,id,width,height,img,hp,aimAngle){
  var self = Entity(entity_name,x,y,name,id,width,height,img);

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


Upgrade = function (id,x,y,name,width,height,category,img) {
  var self = Entity('upgrade',x,y,name,id,width,height,img);
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

Bullet = function (id,x,y,spdX,spdY,name,width,height,combatType) {
  var self = Entity('bullet',x,y,name,id,width,height,Img.bullet);
  self.timer=0;
  self.spdX = spdX;
  self.spdY = spdY;
  self.combatType = combatType;
  self.updatePosition = function(){
    self.x+=self.spdX;
    self.y+=self.spdY;


    if(self.x>currentMap.width || self.x<0){
      self.spdX=-self.spdX;
    }
    if(self.y>currentMap.height || self.y<0){
      self.spdY=-self.spdY;
    }
  };
  var super_update = self.update;

  self.update = function() {
    self.updatePosition();
    super_update();
    var toRemove = false;
    self.timer++;
    if(self.timer > 100){
      toRemove=true;
    }// bullets removed since their time of existence ended

    if(self.combatType === 'player'){
      for(var key2 in enemyList){
        var isColliding = self.testCollision(enemyList[key2]);
        if(isColliding){
          toRemove = true;
          delete enemyList[key2];
          break;
        }
      }
      } else if(self.combatType === 'enemy'){
      var isColliding = self.testCollision(player);
      if(isColliding){
        toRemove=true;
        player.hp-=1;
      }
    }
    if(toRemove){
      delete bulletList[self.id];
    }
  };

  bulletList[id]=self;
};

update = function (){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  currentMap.draw();
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

Player = function() {
  var self = Actor('player',50,40,'P',undefined,50,70,Img.player,10,1);

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
      if(self.x>currentMap.width-self.width/2)
        self.x=currentMap.width-self.width/2;
      if(self.y<self.height/2)
        self.y=self.height/2;
      if(self.y>currentMap.height-self.height/2)
        self.y=currentMap.height-self.height/2;
  };
  var super_update = self.update;
  self.update= function() {
    self.updatePosition();
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


startNewGame = function() {
  player.hp = 1000;
  score=0;
  timeWhenGameStarted = Date.now();
  frameCount=0;
  enemyList = {};
  upgradeList = {};
  bulletList= {};
  randomlyGenerateEnemy();
  randomlyGenerateEnemy();
  randomlyGenerateEnemy();
}

randomlyGenerateEnemy = function() {
  var x = Math.random()*currentMap.width;
  var y = Math.random()*currentMap.height;
  var height = 64;
  var width = 64;
  var id = Math.random();
  enemy(id,x,y,'E',width,height);
};

randomlyGenerateBullet = function(actor,overWriteAngle) {
  var x = actor.x;
  var y = actor.y;
  var height = 32 ;
  var width = 32 ;
  var id = Math.random();
  var angle = actor.aimAngle;
  if(overWriteAngle !== undefined){
    angle = overWriteAngle;
  }
  var spdX = Math.cos(angle/180 * Math.PI)*5;
  var spdY= Math.sin(angle/180 * Math.PI)*5;
  Bullet(id,x,y,spdX,spdY,'E',width,height,actor.type);
};

randomlyGenerateUpgrade = function() {
  var x = Math.random()*currentMap.width;
  var y = Math.random()*currentMap.height;
  var height = 32 ;
  var width = 32 ;
  var id = Math.random();

  if(Math.random() < 0.5){
    var category = 'score';
    var img= Img.upgrade1;
  } else {
    category = 'atkSpd';
    var img = Img.upgrade2;
  }

  Upgrade(id,x,y,'U',width,height,category,img);
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
  mouseX-=WIDTH/2;
  mouseY-=HEIGHT/2;

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

Maps = function(id,imgSrc,width,height){
  var self = {
    id:id,
    image:new Image(),
    width:width,
    height:height
  };
  self.image.src = imgSrc;
  self.draw = function() {
    var x = (WIDTH/2 - player.x);
    var y = (HEIGHT/2 - player.y);
    ctx.drawImage(self.image,0,0,self.image.width,self.image.height,x,y,self.image.width*2,self.image.height*2);
  };
  return self;
}

currentMap = Maps('field','img/map.png',1280,960);

var player = Player();
startNewGame();

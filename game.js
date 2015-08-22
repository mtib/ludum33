var width = 800;
var height = 450;
var rendererStyle = {antialiasing: false, transparent: false, resolution: 1};
var renderer = PIXI.autoDetectRenderer(width, height, rendererStyle);
var stage = new PIXI.Container();
var defaultTextStyle = {font: "16px 'Bree Serif'", fill: "#FFFFFF", align: "center"};
var version = "v_ld: 001_33";
var versionText = new PIXI.Text(version, defaultTextStyle);
var debugText = new PIXI.Text("", {font:"16px 'Bree Serif'", fill:"#3F3F3F"});
debugText.anchor.y=1.0;
debugText.position.set(10,height-10);
var fullScreenText = new PIXI.Text("", {font:"60px 'Bree Serif'", fill:"#FFFFFF",align:"center"});
fullScreenText.anchor.x =0.5;
fullScreenText.anchor.y =1;
fullScreenText.position.set(width/2,height/2);
var hitescp = new PIXI.Text("", {font:"20px 'Bree Serif'", fill:"#FFFFFF",align:"center"})
hitescp.anchor.x =0.5;
hitescp.anchor.y =-.5;
hitescp.position.set(width/2,height/2);
stage.addChild(fullScreenText);
stage.addChild(hitescp);
stage.addChild(debugText);
versionText.position.set(10,10);
stage.addChild(versionText);
renderer.backgroundColor = 0x959595;
document.getElementById("game").appendChild(renderer.view);

var menuC = new PIXI.Container();
var playC = new PIXI.Container();
var storyC = new PIXI.Container();

var monsterBoost = 1.1; // Multiplies every Monster Speed

var escapeKey = keyboard(27);
var pointCheat = keyboard(80);
pointCheat.press=function(){ health -= 10 };

menuC.visible=false;
playC.visible=false;
storyC.visible=false;

var hardness = 0; // 0=easy, 1=normal, 2=hard, 3=endless;
var goals = [20,100,500,-1];
var soundmult = 1; // 1.0 to 0.0
var musicmult = 1; // 1.0 to 0.0

var score = 0;
var health = 100.0;

stage.addChild(menuC);
stage.addChild(playC);
stage.addChild(storyC);

var state;

var enemyLogic;

PIXI.loader
    .add("Images/buttons/story.png")
    .add("Images/buttons/easy.png")
    .add("Images/buttons/normal.png")
    .add("Images/buttons/hard.png")
    .add("Images/buttons/endless.png")
    .add("Images/buttons/sound.png") // Does nothing
    .add("Images/buttons/music.png")
    .add("Images/creatures/monster1.png")
    .add("Images/creatures/grand1.png")
    .add("Images/creatures/love1.png")
    .add("Images/creatures/police1.png")
    .load(setup);

var monster1;

var menuSprites = [];
var soundToggle;
var musicToggle;

var menuSoundVolume = 0.02;
var menuSound = new Howl({
    urls: ["Music/menu.mp3"],
    loop: true,
    volume: menuSoundVolume
});
var playSoundVolume = 0.1;
var playSound = new Howl({
    urls: ["Music/ingame.mp3"],
    loop: true,
    volume: playSoundVolume
});
var storySoundVolume = 0.1;
var storySound = new Howl({
    urls: ["Music/story.mp3"],
    loop: true,
    volume: storySoundVolume
});
var eatSound = new Howl({
    urls: ["Sounds/eat.wav"],
    loop: false,
    volume: 0.4
});
var selectSound = new Howl({
    urls: ["Sounds/select.wav"],
    loop: false,
    volume: 0.3
});
var endSound = new Howl({
    urls: ["Sounds/end.wav"],
    loop: false,
    volume: 0.2
});
var shootSound = new Howl({
    urls: ["Sounds/shoot.wav"],
    loop: false,
    volume: 0.1
});
var hitSound = new Howl({
    urls: ["Sounds/hit.wav"],
    loop: false,
    volume: 0.2
});

function setup(){
    monster1 = new PIXI.Sprite.fromImage("Images/creatures/monster1.png");
    monster1.pivot.x = 0.5;
    monster1.pivot.y = 0.5;
    playC.addChild(monster1);

    escapeKey.press = function(){ changeState(menu) };

    var menuButtons = [
        [new PIXI.Sprite.fromImage("Images/buttons/story.png"), function(data){ changeState(story) }],
        [new PIXI.Sprite.fromImage("Images/buttons/easy.png"), function(data){ hardness=0; changeState(play); }],
        [new PIXI.Sprite.fromImage("Images/buttons/normal.png"), function(data){ hardness=1; changeState(play) }],
        [new PIXI.Sprite.fromImage("Images/buttons/hard.png"), function(data){ hardness=2; changeState(play) }],
        [new PIXI.Sprite.fromImage("Images/buttons/endless.png"), function(data){ hardness=3; changeState(play) }],
    ]
    for (var i = menuButtons.length - 1; i >= 0; i--) {
        menuSprites[i] = menuButtons[i][0];
        menuSprites[i].interactive = true;
        menuSprites[i].click=menuButtons[i][1];
        menuSprites[i].anchor.x = 0.5;
        menuSprites[i].anchor.y = 0.5;
        menuSprites[i].position.set(renderer.width/2, 64 + i/menuButtons.length*400);
        menuC.addChild(menuSprites[i]);
    };
    soundToggle = new PIXI.Sprite.fromImage("Images/buttons/sound.png");
    soundToggle.interactive=true;
    soundToggle.click=function(data){ soundmult = abs(soundmult-1); refreshSounds() };
    soundToggle.position.set(10,36);
    musicToggle = new PIXI.Sprite.fromImage("Images/buttons/music.png");
    musicToggle.interactive=true;
    musicToggle.click=function(data){ musicmult = abs(musicmult-1); refreshMusic() };
    musicToggle.position.set(10,36+74);
    menuC.addChild(soundToggle);
    menuC.addChild(musicToggle);


    // Done loading, now switching to MENU
    changeState(menu);
    gameloop();
}

var mousePos;
function gameloop(){
    requestAnimationFrame(gameloop);
    mousePos = renderer.plugins.interaction.mouse.global
    state();
    renderer.render(stage);
}

function menu(){

}

function end(){

}

function play(){
    var mouseAngle = -Math.atan((monster1.x-mousePos.x)/(monster1.y-mousePos.y))
    var dist = vecDist(mousePos, monster1);
    var dt = "";
    if(dist>5){
        if(dist>225)
            dist = 225.0;
        var relDist = Math.sqrt(dist/225.0);
        var norm = normalize(diff(mousePos, monster1));
        if(hardness == 3){
            monster1.position.set(monster1.x+relDist*norm.x*(monsterBoost+score/100),monster1.y+relDist*norm.y*(monsterBoost+score/100));
        }else{
            monster1.position.set(monster1.x+relDist*norm.x*(monsterBoost+score/goals[hardness]),monster1.y+relDist*norm.y*(monsterBoost+score/goals[hardness]));
        }
    }
    if(monster1.x<0){
        monster1.x=0;
    }else if(monster1.x>width){
        monster1.x=width;
    }
    if(monster1.y<0){
        monster1.y=0;
    } else if(monster1.y>height){
        monster1.y=height;
    }
    dt += "\nScore: "+score;
    dt += "\nHealth: "+health;
    dt += "\nGoal: "+goals[hardness];
    monster1.rotation = mouseAngle;
    if(mousePos.y>monster1.y){
        monster1.rotation=mouseAngle+3.1415;
    }
    debug(dt);
    if(score>=goals[hardness] && goals[hardness]>0){
        win();
    }
    if(health<=0){
        lose();
    }
}

function win(){
    fullScreenText.text = "You win.\nYou found love!";
    hitescp.text = "Hit [ESCAPE] to return to the menu";
        for (var i = policeArray.length - 1; i >= 0; i--) {
            policeArray[i].die();
        };
}

function lose(){
    playC.visible=false;
    fullScreenText.text = "You lose.\nYou were shot down!";
    hitescp.text = "Hit [ESCAPE] to return to the menu";
        for (var i = policeArray.length - 1; i >= 0; i--) {
            policeArray[i].die();
        };
}

function story(){

}

// easy, normal, hard, endless
var numCasult = [8,10,8,6];
var casultArray = [];
var numPolice = [1,5,10,6];
var policeArray = [];
var safeframecount = 0;
function enemyBehaviour(){
    if(state!=play){
        for (var i = casultArray.length - 1; i >= 0; i--) {
            playC.removeChild(casultArray[i].currSprite);
        };
    }
    for (var i = casultArray.length - 1; i >= 0; i--) {
        var n = casultArray[i].update();
        if(n != undefined){
            casultArray[i]=n;
        }
    };
    for (var i = policeArray.length - 1; i >= 0; i--) {
        var n = policeArray[i].update();
        if(n != undefined){
            policeArray[i]=n; // this seems to be empty
        }
    };
}

function Shot(x,y,vx,vy, travel){
    if(travel === undefined){
        travel = 0;
    }
    this.damage = 10;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    var shot = this;
    this.line = new PIXI.Graphics();
    this.move = function (){
        this.line.lineStyle (5, 0xD9600B, 1);
        this.line.moveTo(this.x,this.y);
        this.x += this.vx;
        this.y += this.vy;
        this.line.lineTo(this.x, this.y);
        playC.addChild(this.line);
        if(vecDist(this,monster1)<30){
            health -= this.damage;
            hitSound.play();
            if(health<=0){
                endSound.play();
            }
        }else if(travel<300){
            window.setTimeout(function(){ new Shot(shot.x,shot.y,shot.vx,shot.vy, travel+Math.sqrt(shot.vx*shot.vx+shot.vy*shot.vy)); }, 30);
        }
        window.setTimeout(function(){ playC.removeChild(shot.line) }, 200);
    };
    // this.remove = function(){
    //     playC.removeChild(line);
    // };
    this.move();
}

function Police(){
    var police = this;
    this.update=function(){
        playC.removeChild(this.sprites.shoot);
        playC.removeChild(this.sprites.walk);
        if(this.shooting){
            playC.addChild(this.sprites.shoot);
            this.sprites.shoot.position.set(this.x, this.y);
            this.lookAtMonster(this.sprites.shoot);
        }else{
            //playC.addChild(this.sprites.walk);
        }
    }
    this.setShoot = function (bool){ if( bool == this.shooting ){return undefined}; this.shooting = bool; this.shoot(); };
    this.shoot = function(){
        if(police.shooting){

            if(safeframecount>0){
                safeframecount -= 1;
            }else {
                var relMon = normalize(diff(monster1, police));
                shootSound.play();
                new Shot(police.x+Math.sin(police.sprites.shoot.rotation-.25*3.1415)*14.284, police.y+Math.cos(police.sprites.shoot.rotation-.25*3.1415)*14.284,relMon.x*police.shotTravelSpeed, relMon.y*police.shotTravelSpeed);

            }
            window.setTimeout(function(){police.shoot()}, 3000 + rint(10,1000));
        }
    };
    this.lookAtMonster=function(sprite){
        var vector = normalize(diff(monster1,sprite));
        var lookangle = -Math.atan((vector.x)/(vector.y));
        if(sprite.y<monster1.y){
            lookangle+=3.1415;
        }
        sprite.rotation=lookangle;
    }
    this.die=function(){
        this.setShoot(false);
        playC.removeChild(this.sprites.shoot);
        playC.removeChild(this.sprites.walk);
    }
    this.init=function(){
        this.shotTravelSpeed =5;
        this.x=rint(0, width);
        this.y=rint(0, height);
        this.shooting = false;
        this.setShoot(true); // start shooting;
        // if(Math.random()>.5)
        //     this.y=-this.y;
        this.sprites={
            shoot:new PIXI.Sprite.fromImage("Images/creatures/police1.png"),
            walk: new PIXI.Sprite.fromImage("Images/creatures/police1.png")
        };
        this.sprites.shoot.pivot = {x:0.5, y:0.5};
        this.sprites.shoot.anchor = {x:0.5, y:0.5};
        this.sprites.shoot.scale = {x:0.5, y:0.5};
        this.sprites.walk.pivot = {x:0.5, y:0.5};
        this.sprites.walk.amchor = {x:0.5, y:0.5};
        this.sprites.walk.scale = {x:0.5, y:0.5};

    }
    this.init();
}

function Woman(x,y){
    score +=1;
    health = 100;
    this.sprite = new PIXI.Sprite.fromImage("Images/creatures/love1.png");
    this.sprite.x=x;
    this.sprite.y=y;
    this.sprite.anchor = {x:0.5,y:0.5};
    this.sprite.pivot = {x:0.5,y:0.5};
    endSound.play(); // Woman Spawns. Game won
    this.lookAtMonster = function(){
        var vector = normalize(diff(monster1,this.sprite));
        var lookangle = -Math.atan((vector.x)/(vector.y));
        if(this.sprite.y<monster1.y){
            lookangle+=3.1415;
        }
        this.sprite.rotation=lookangle+3.1415;
    };
    this.update = function(){
        this.lookAtMonster();
        if(vecDist(this.sprite, monster1)>70){
            var vec = normalize(diff(this.sprite, monster1));
            this.sprite.x -= vec.x*3;
            this.sprite.y -= vec.y*3;
        }
    };
    playC.addChild(this.sprite);
}

function Casult(){
    this.newVelo=function(){
        this.vx = rint(-this.speed, this.speed);
        this.vy = rint(-this.speed, this.speed);
    };
    this.x = rint(-32, -8);
    this.y = rint(-32, height+32);
    if(Math.random()>0.5){
        this.x = rint(width+8, width+32);
    }
    this.speed = 1.5;
    this.newVelo();
    this.sprites = [new PIXI.Sprite.fromImage("Images/creatures/grand1.png")];
    this.animframe = 0;
    this.currSprite;
    this.update = function(){
        try{playC.removeChild(currSprite);}catch(e){};
        this.animframe = (this.animframe+1)%this.sprites.length;
        this.currSprite = this.sprites[this.animframe];
        playC.addChild(this.currSprite);
        this.lookangle = -Math.atan((this.vx)/(this.vy));
        if(this.vy>0){
            this.lookangle+=3.1415;
        }
        this.currSprite.rotation=this.lookangle;
        this.x += this.vx;
        this.y += this.vy;
        this.currSprite.position.set(this.x,this.y);
        var mondist = vecDist(this, monster1);
        if(this.x<-32 || this.x>width+32 || this.y<-32 || this.y>height+32){
            playC.removeChild(this.currSprite);
            return new Casult();
        } else if(mondist<30){
            playC.removeChild(this.currSprite);
            if(score == goals[hardness]-1){
                // Sound is played in Woman(...)
                return new Woman(this.x, this.y);
            }else {
                eatSound.play();
            }
            score += 1;
            return new Casult();
        } else if(mondist<100){
            var newVect = normalize(diff(monster1, this));
            this.vx = newVect.x*rint(-this.speed/3, -this.speed);
            this.vy = newVect.y*rint(-this.speed/3, -this.speed);
        }
        //this.currSprite.rotation=this.currSprite.rotation+0.1;

    };
    for (var i = this.sprites.length - 1; i >= 0; i--) {
        this.sprites[i].scale={x:0.5,y:0.5};
        this.sprites[i].anchor={x:0.5,y:0.5};
        this.sprites[i].pivot={x:0.5,y:0.5};
    };
    return this.update(); // this is very important
}

function changeState(newstate){
    if(state==newstate){
        return;
    }

    if(newstate == menu){
        menuSound.play();
        debug("");
        menuC.visible = true;
    }
    if(newstate == story){
        storySound.stop();
        storySound.play();
        storyC.visible = true;
    }
    if(newstate == play){
        safeframecount = 20;
        playSound.stop();
        enemyBehaviour();
        score = 0;
        health= 100;
        // spawn Monster
        monster1.anchor.x = 0.5;
        monster1.anchor.y = 0.5;
        monster1.position.set(renderer.width/2, renderer.height/2);
        playSound.play();
        playC.visible =true;
        enemyLogic = window.setInterval(function(){enemyBehaviour()},50);

        for(i=0;i<numPolice[hardness];i++){
            policeArray[i] = new Police();
        }
        for(i=0;i<numCasult[hardness];i++){
            if(casultArray[i] != undefined){
                playC.removeChild(casultArray[i].currSprite);
            }
            casultArray[i] = new Casult();
        }

    }

    //state = oldstate
    if(state == menu){
        selectSound.play();
        menuSound.fadeOut(1000);
        menuC.visible =false;
    }
    if(state == story){
        storySound.fadeOut(1000);
        storyC.visible =false;
    }
    if(state == play){
        playSound.fadeOut(1000);
        playC.visible =false;
        fullScreenText.text="";
        hitescp.text="";
        for (var i = policeArray.length - 1; i >= 0; i--) {
            policeArray[i].die();
        };
    }
    refreshMusic();
    state = newstate;
}

function debug(text){
    debugText.text = text;
}

function diff(a,b){
    return {x:a.x-b.x,y:a.y-b.y};
}

function normalize(vec){
    var l = Math.sqrt(vec.x*vec.x+vec.y*vec.y);
    return {x:vec.x/l,y:vec.y/l};
}

// c^2=a^2+b^2
function vecDist(a,b){
    var dx = a.x-b.x;
    var dy = a.y-b.y;
    return Math.sqrt(dx*dx+dy*dy);
}

function refreshSounds(){
    if(soundmult == 0){
        soundToggle.rotation = .2; // 1 rad
    } else {
        soundToggle.rotation = 0;
    }
}
function refreshMusic(){
    menuSound.volume(menuSoundVolume * musicmult);
    playSound.volume(playSoundVolume * musicmult);
    storySound.volume(storySoundVolume * musicmult);
    if(musicmult == 0){
        musicToggle.rotation = .2; // 1 rad
    } else {
        musicToggle.rotation = 0;
    }
}
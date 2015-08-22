var width = 800;
var height = 450;
var rendererStyle = {antialiasing: false, transparent: false, resolution: 1};
var renderer = PIXI.autoDetectRenderer(width, height, rendererStyle);
var stage = new PIXI.Container();
var defaultTextStyle = {font: "16px 'Bree Serif'", fill: "#FFFFFF", align: "center"};
var version = "v_ld: 000_33";
var versionText = new PIXI.Text(version, defaultTextStyle);
versionText.position.set(10,10);
stage.addChild(versionText);
renderer.backgroundColor = 0x959595;
document.getElementById("game").appendChild(renderer.view);

var state;

PIXI.loader
    .add("Images/buttonbg.png")
    .load(setup);

var menuSound = new Howl({
    urls: ["Music/menu.mp3"],
    loop: true,
    volume: 0.02
});
var playSound = new Howl({
    urls: ["Music/ingame.mp3"],
    loop: true,
    volume: 0.5
});
var storySound = new Howl({
    urls: ["Music/story.mp3"],
    loop: true,
    volume: 0.5
});

function setup(){
    changeState(menu);
    gameloop();
}

function gameloop(){
    requestAnimationFrame(gameloop);
    state();
    renderer.render(stage);
}

function menu(){

}

function end(){

}

function play(){

}

function story(){

}

function changeState(newstate){
    if(newstate == menu){
        menuSound.play();
        console.log("Now Playing MenuSound!");
    }

    if(state == menu){
        menuSound.fadeOut();
    }
    state = newstate;
}
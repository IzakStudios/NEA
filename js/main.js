function getMousePos(ctx, mouseEvent) {
    var rect = ctx.getBoundingClientRect();

    return {
        x: (ctx.clientX - rect.left) * scale,
        y: (ctx.clientY - rect.top) * scale,
    };
}

class Camera {
    constructor(){
        this._position = [0, 0];
    }

    update(){ this._position[0] = this._position[0] + 1 };

    setPosition(position){ this._position = position};
    getPosition(){ return this._position };
}

const gameCamera = new Camera();

function drawCircle(obj) {
    const cameraPosition = gameCamera.getPosition();

    obj.x = obj.x - cameraPosition[0]
    obj.y = obj.y + cameraPosition[1]

    obj.ctx.beginPath();
    obj.ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI, false);
    
    if (obj.fill) {
        obj.ctx.fillStyle = obj.fill;

        obj.ctx.fill();
    }

    if (obj.stroke) {
        obj.ctx.lineWidth = obj.strokeWidth;
        obj.ctx.strokeStyle = obj.stroke;

        obj.ctx.stroke();
    }
}

class Object {
    constructor(position){
        this.isRemoved = false;

        this._position = position;
        this._color = "#FF0000";
        this._radius = 15;
    }

    update(){
        const cameraPosition = gameCamera.getPosition();
        if (this._position[0] < cameraPosition[0] - gameCanvas.width / 2 - this._radius){
            this.remove()
        };
    };
    draw(canvasContext){
        drawCircle({
            ctx: canvasContext,
            x: gameCanvas.width / 2 + this._position[0],
            y: gameCanvas.height / 2 - this._position[1],
            radius: this._radius,
            fill: "#FF00FF",
        })
    }
    remove(){ this.isRemoved = true };
}

class Player {
    constructor(){
        this._position = [0, 0];
        this._gravity = 1;
        this._mode = 1;
        this._isJumping = false;
        this.speed = 9;
    }

    setJumping(state){ this._isJumping = state };

    setPosition(position){ this._position = position};
    getPosition(){ return this._position };

    async update(){
        let x = 1;
        let y = -1;

        if (this._isJumping){ y = 1; };

        this._position[0] += x * this.speed;
        this._position[1] += y * this.speed;
    };

    async draw(canvasContext){
        drawCircle({
            ctx: canvasContext,
            x: gameCanvas.width / 2 + this._position[0],
            y: gameCanvas.height / 2 - this._position[1],
            radius: 20,
            fill: "#00FFFF",
        })
    };
}

const lerp = (a, b, t) => {
    return a + (b - a) * t;
}

var heldKeys = {};
var gamePlayer = new Player();
var objects = [];

async function renderGame(){
    const canvasContext = gameCanvas.getContext("2d");
    canvasContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    gamePlayer.setJumping(heldKeys["ArrowUp"] || heldKeys["Space"]);
    gamePlayer.update();
    gamePlayer.draw(canvasContext);

    let playerPosition = gamePlayer.getPosition();
    let cameraPosition = gameCamera.getPosition();

    gameCamera.setPosition([
        lerp(cameraPosition[0], playerPosition[0], 0.1),
        lerp(cameraPosition[1], playerPosition[1], 0.02),
    ]);

    if (Math.floor(Math.random() * Math.floor(30 - gamePlayer.speed)) == 1){
        objects.push(new Object([
            playerPosition[0] + gameCanvas.width / 1.75,
            playerPosition[1] + (Math.floor(Math.random() * gameCanvas.height) - gameCanvas.height / 2)
        ]))
    };

    objects.forEach((object, index) => {
        object.update();
        object.draw(canvasContext);

        if (object.isRemoved){ objects.splice(index, 1) };
    })

    requestAnimationFrame(renderGame);
};

window.addEventListener("keydown", (event) => { heldKeys[event.code] = true; });
window.addEventListener("keyup", (event) => { heldKeys[event.code] = false; });

window.addEventListener("load", async () => {
    gameCanvas.width = 1024;
    gameCanvas.height = 1024;

    requestAnimationFrame(renderGame)
})
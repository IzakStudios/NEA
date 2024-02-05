function drawCircle(obj) {
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

function getMousePos(ctx, mouseEvent) {
    var rect = ctx.getBoundingClientRect();

    return {
        x: (ctx.clientX - rect.left) * scale,
        y: (ctx.clientY - rect.top) * scale,
    };
}

var pressedKeys = {};
var playerLocation = [-200, 0];

var playerJumping = false;
var playerSpeed = 2;
var playerGravity = 1;
var playerColor = "rgb(0,255,255)";
var playerVelocityIncrease = 2;
var previousLocations = [];

var lastTick = Date.now() / 1000;

function updatePhysics(){
    let playerVelocity = playerJumping && 1 || -1;

    if (previousLocations.length >= 350){
        previousLocations = previousLocations.slice(1, previousLocations.length)
    };

    switch (playerGravity){
        case -1:
            playerColor = "rgb(255,255,0)";
            playerVelocityIncrease = 1;
            break
        case 1:
            playerColor = "rgb(0,255,255)";
            playerVelocityIncrease = 2;
            break
    };

    previousLocations.push([playerLocation[1], playerColor]);

    let nextLocation = playerLocation[1] + playerVelocity * playerSpeed * playerGravity * playerVelocityIncrease;
    if (Math.abs(nextLocation) >= gameCanvas.height / 2){
        playerGravity *= -1;
        nextLocation = playerLocation[1] + playerVelocity * playerSpeed * playerGravity * playerVelocityIncrease;
    }

    playerLocation[1] = Math.max(
        -gameCanvas.height / 2,
        Math.min(
            gameCanvas.height / 2,
            nextLocation
        )
    );
}

function renderGame(){
    var currentTick = Date.now() / 1000;
    var deltaTime = currentTick - lastTick;

    lastTick = Date.now() / 1000;

    updatePhysics();

    var ctx = gameCanvas.getContext("2d");
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    var centerX = gameCanvas.width / 2;
    var centerY = gameCanvas.height / 2;

    previousLocations.forEach((locationData, index) => {
        drawCircle({
            ctx: ctx,
            x: centerX + playerLocation[0] - (previousLocations.length - index) * playerSpeed,
            y: centerY - locationData[0],
            radius: 15,
            fill: locationData[1],
        })
    });

    drawCircle({
        ctx: ctx,
        x: centerX + playerLocation[0],
        y: centerY - playerLocation[1],
        radius: 20,
        fill: playerColor,
    });
};

window.addEventListener("keydown", (event) => {
    if (pressedKeys[event.code]) return;
    pressedKeys[event.code] = true;

    let keyCode = event.key;
    switch (keyCode){
        case "ArrowUp":
            playerJumping = true;
            break;
    };
});
window.addEventListener("keyup", (event) => {
    pressedKeys[event.code] = false;

    let keyCode = event.key;
    switch (keyCode){
        case "ArrowUp":
            playerJumping = false;
            break;
    }
});

window.addEventListener("load", async () => {
    gameCanvas.width = 1024;
    gameCanvas.height = 1024;

    while (true) {
        requestAnimationFrame(renderGame)
        await new Promise(r => setTimeout(r, 1 / 30));
    };
})
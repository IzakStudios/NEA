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

function moveToCenter(obj){
    newObj = JSON.parse(JSON.stringify(obj));

    newObj.y *= -1;

    newObj.x += gameCanvas.width / 2;
    newObj.y += gameCanvas.height / 2;

    return newObj
}

function drawLine(canvasContext, obj) {
    const cameraPosition = gameCamera.getPosition();
    
    obj.p1 = moveToCenter(obj.p1);
    obj.p2 = moveToCenter(obj.p2);

    obj.p1.x -= cameraPosition[0]
    obj.p1.y += cameraPosition[1]

    obj.p2.x -= cameraPosition[0]
    obj.p2.y += cameraPosition[1]

    canvasContext.lineWidth = obj.radius;
    canvasContext.lineCap = "round";
    
    canvasContext.beginPath();

    canvasContext.moveTo(obj.p1.x, obj.p1.y);
    canvasContext.lineTo(obj.p2.x, obj.p2.y);

    canvasContext.stroke();
}

function drawCircle(canvasContext, obj) {
    const cameraPosition = gameCamera.getPosition();

    obj = moveToCenter(obj);

    obj.x -= cameraPosition[0]
    obj.y += cameraPosition[1]

    canvasContext.lineWidth = 4;

    canvasContext.beginPath();
    canvasContext.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI, false);
    
    if (obj.fill) {
        canvasContext.fillStyle = obj.fill;

        canvasContext.fill();
    };

    canvasContext.stroke();
}

function drawBlock(canvasContext, obj) {
    const cameraPosition = gameCamera.getPosition();

    obj = moveToCenter(obj);

    obj.x -= cameraPosition[0];
    obj.y += cameraPosition[1];

    canvasContext.lineWidth = 3;

    canvasContext.beginPath();
    canvasContext.rect(obj.x, obj.y, obj.radius, obj.radius);
    if (obj.fill) {
        canvasContext.fillStyle = obj.fill;

        canvasContext.fill();
    };
    canvasContext.stroke();
}

class Object {
    constructor(position){
        this.isRemoved = false;

        this._position = position;
        this._color = "#FF0000";

        this.radius = 50;
    }

    update(){
        const cameraPosition = gameCamera.getPosition();
        if (this._position[0] < cameraPosition[0] - gameCanvas.width / 2 - this._radius){
            this.remove()
        };
    };
    
    draw(canvasContext){
        drawCircle(canvasContext, {
            x: this._position[0],
            y: this._position[1],
            radius: this.radius,
            fill: "#FF00FF",
        })
    }
    remove(){ this.isRemoved = true };
}

const checkCollision = (a, b) => {
    const aP = a._position;
    const bP = b._position;

    if (b._isBlock){
        let touchingLeft = aP[0] >= (bP[0] - a.radius / 2);
        let touchingRight = aP[0] <= (bP[0] + b.radius + a.radius / 2);

        let touchingTop = aP[1] <= (bP[1] + a.radius / 2);
        let touchingBottom = aP[1] >= (bP[1] - b.radius - a.radius / 2);

        return touchingLeft && touchingRight && touchingTop && touchingBottom
    } else {
        let distance = Math.sqrt(
            Math.pow(aP[0] - bP[0], 2) +
            Math.pow(aP[1] - bP[1], 2)
        )

        let isTouching = distance <= Math.max(a.radius, b.radius) + Math.min(a.radius, b.radius);
        if (isTouching){
            return aP[1] >= bP[1] && 1 || -1
        }
        return false;
    }
};

class Player {
    constructor(){
        this.speed = 2;
        this.radius = 12;

        this._position = Array(2, 0);
        this._gravity = 1;
        this._mode = 1;

        this._isJumping = false;
        this._isGrounded = false;

        this.pastLocations = [];
    }

    setJumping(state){
        if (this._isJumping == state){ return };

        this._isJumping = state

        if (this._isGrounded){ 
            this._isGrounded = false;
            this.pastLocations.push([
                this._position[0],
                this._position[1],
            ]);
            
            this.setPosition([
                this.getPosition()[0],
                this.getPosition()[1] + (this.getNextLocation()[1] - this.getPosition()[1]) / 2,
            ])

            return
        }

        this.pastLocations.push([
            this._position[0],
            this._position[1],
        ]);
    };

    setGravity(gravity){ this._gravity = gravity };
    setGrounded(state){
        if (this._isGrounded == state){ return };

        this._isGrounded = state

        this.pastLocations.push([
            this._position[0],
            this._position[1],
        ]);
    };

    setPosition(position){ this._position = position };
    getPosition(){ return this._position };

    getNextLocation(){
        let x = 1;
        let y = -1;

        if (this._isJumping){ y = 1; };
        if (this._isGrounded){ y = 0; };

        return [
            this._position[0] + x * this.speed,
            this._position[1] + y * this.speed
        ]
    }

    async reset(){
        this.setPosition([0, 0]);
        let cameraPosition = gameCamera.getPosition();

        gameCamera.setPosition([
            lerp(cameraPosition[0], this._position[0], 0.4),
            cameraPosition[1]//lerp(cameraPosition[1], this._position[1], 0.2),
        ]);
    };

    async update(){
        const currentLocation = [
            this._position[0],
            this._position[1],
        ]

        const nextLocation = this.getNextLocation();

        this._position[0] = nextLocation[0];

        if (Math.abs(nextLocation[1]) <= gameCanvas.height / 2){
            this._position[1] = nextLocation[1];
            this._touchingBorder = false;
        } else {
            if (!this._touchingBorder){
                this._touchingBorder = true;
                this.pastLocations.push([
                    currentLocation[0],
                    currentLocation[1],
                ]);
            }
        }
    };

    async draw(canvasContext){
        drawCircle(canvasContext, {
            x: this._position[0],
            y: this._position[1],
            radius: this.radius,
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

    gamePlayer.update();
    gamePlayer.setGrounded(false);

    let hasMoved = false;

    objects.forEach(object => {
        const collisionMade = checkCollision(gamePlayer, object);
        if (collisionMade){
            if (!hasMoved){
                let direction = (hasMoved == 1 && 1 || - 1)

                hasMoved = true;
                
                let nextLocation = gamePlayer.getNextLocation();
                let verticalDistance = Math.abs(nextLocation[1] - gamePlayer._position[1]);
                
                let attemptNumber = 0

                while (true){
                    attemptNumber++;

                    let virtualPlayer = {
                        radius: gamePlayer.radius,
                        _position: [
                            gamePlayer._position[0],
                            gamePlayer._position[1] - (verticalDistance * direction) * attemptNumber
                        ],
                    }

                    let isColliding = checkCollision(virtualPlayer, object);
                    if (!isColliding){
                        gamePlayer.setPosition([
                            gamePlayer._position[0],
                            gamePlayer._position[1] - (verticalDistance * direction) * (attemptNumber - 2)
                        ])

                        break
                    }
                }
            };

            gamePlayer.setGrounded(true);
        }
    })

    gamePlayer.pastLocations.forEach((location, index) => {
        let nextLocation = gamePlayer.getPosition();

        if (index < gamePlayer.pastLocations.length - 1){
            nextLocation = gamePlayer.pastLocations[index + 1]
        }

        drawLine(canvasContext, {
            p1: {
                x: location[0],
                y: location[1],
            },
            p2: {
                x: nextLocation[0],
                y: nextLocation[1],
            },

            radius: gamePlayer.radius,
            fill: "#00FFFF",
        })
    });
    
    if (gamePlayer._isJumping != (heldKeys["Mouse"] || heldKeys["ArrowUp"] || heldKeys["Space"] || heldKeys)){
        gamePlayer.setJumping(heldKeys["Mouse"] || heldKeys["ArrowUp"] || heldKeys["Space"]);
    }

    objects.forEach((object, index) => {
        object.update();
        object.draw(canvasContext);

        if (object.isRemoved){ objects.splice(index, 1); return };

        checkCollision(gamePlayer, object);
    })

    let playerPosition = gamePlayer.getPosition();
    let cameraPosition = gameCamera.getPosition();

    gameCamera.setPosition([
        lerp(cameraPosition[0], playerPosition[0], 1.5),
        cameraPosition[1]//lerp(cameraPosition[1], playerPosition[1], 0.1),
    ]);

    if (Math.floor(Math.random() * Math.floor(100 - gamePlayer.speed)) == 1){
        objects.push(new Object([
            playerPosition[0] + gameCanvas.width / 1.75,
            playerPosition[1] + (Math.floor(Math.random() * gameCanvas.height) - gameCanvas.height / 2) * 2
        ]))
    };

    gamePlayer.draw(canvasContext);

    requestAnimationFrame(renderGame);
};

window.addEventListener("keydown", (event) => { heldKeys[event.code] = true; });
window.addEventListener("keyup", (event) => { heldKeys[event.code] = false; });

window.addEventListener("mousedown", (event) => { heldKeys["Mouse"] = true; });
window.addEventListener("mouseup", (event) => { heldKeys["Mouse"] = false; });

window.addEventListener("load", async () => {
    aspectRatio = 9/16;

    gameCanvas.width = 1024;
    gameCanvas.height = 1024 * aspectRatio;

    objects.push(new Object([
        480,
        -500
    ]))

    objects.push(new Object([
        700,
        -100
    ]))

    requestAnimationFrame(renderGame);
})
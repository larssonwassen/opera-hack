var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };
var canvas = document.createElement("canvas");
var width = 400;
var height = 600;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
var player = new Player();
var computer = new Computer();
var ball = new Ball(200, 300);

var keysDown = {};

var render = function () {
    context.fillStyle = "#FFA500";
    context.fillRect(0, 0, width, height);
    player.render();
    computer.render();
    ball.render();
};

var update = function () {
    player.update();
    computer.update(ball);
    ball.update(player.paddle, computer.paddle);
};

var step = function () {
    update();
    render();
    animate(step);
};

function Paddle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.x_speed = 0;
    this.y_speed = 0;
}

Paddle.prototype.render = function () {
    context.fillStyle = "#FF0000";
    context.fillRect(this.x, this.y, this.width, this.height);
};

Paddle.prototype.move = function (x, y) {
    this.x += x;
    this.y += y;
    this.x_speed = x;
    this.y_speed = y;
    if (this.x < 0) {
        this.x = 0;
        this.x_speed = 0;
    } else if (this.x + this.width > 400) {
        this.x = 400 - this.width;
        this.x_speed = 0;
    }
};

function Computer() {
    this.paddle = new Paddle(175, 10, 50, 10);
}

Computer.prototype.render = function () {
    this.paddle.render();
};

Computer.prototype.update = function (ball) {
    var x_pos = ball.x;
    var diff = -((this.paddle.x + (this.paddle.width / 2)) - x_pos);
    if (diff < 0 && diff < -4) {
        diff = -5;
    } else if (diff > 0 && diff > 4) {
        diff = 5;
    }
    this.paddle.move(diff, 0);
    if (this.paddle.x < 0) {
        this.paddle.x = 0;
    } else if (this.paddle.x + this.paddle.width > 400) {
        this.paddle.x = 400 - this.paddle.width;
    }
};

function Player() {
    this.paddle = new Paddle(175, 580, 50, 10);
}

Player.prototype.render = function () {
    this.paddle.render();
};

Player.prototype.update = function () {
    for (var key in keysDown) {
        var value = Number(key);
        if (value == 37) {
            this.paddle.move(-4, 0);
        } else if (value == 39) {
            this.paddle.move(4, 0);
        } else {
            this.paddle.move(0, 0);
        }
    }
};

function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.x_speed = 0;
    this.y_speed = 3;
}

Ball.prototype.render = function () {
    context.beginPath();
    context.arc(this.x, this.y, 5, 2 * Math.PI, false);
    context.fillStyle = "#000000";
    context.fill();
};

Ball.prototype.update = function (paddle1, paddle2) {
    this.x += this.x_speed;
    this.y += this.y_speed;
    var top_x = this.x - 5;
    var top_y = this.y - 5;
    var bottom_x = this.x + 5;
    var bottom_y = this.y + 5;

    if (this.x - 5 < 0) {
        this.x = 5;
        this.x_speed = -this.x_speed;
    } else if (this.x + 5 > 400) {
        this.x = 395;
        this.x_speed = -this.x_speed;
    }

    if (this.y < 0 || this.y > 600) {
        this.x_speed = 0;
        this.y_speed = 3;
        this.x = 200;
        this.y = 300;
    }

    if (top_y > 300) {
        if (top_y < (paddle1.y + paddle1.height) && bottom_y > paddle1.y && top_x < (paddle1.x + paddle1.width) && bottom_x > paddle1.x) {
            this.y_speed = -3;
            this.x_speed += (paddle1.x_speed / 2);
            this.y += this.y_speed;
        }
    } else {
        if (top_y < (paddle2.y + paddle2.height) && bottom_y > paddle2.y && top_x < (paddle2.x + paddle2.width) && bottom_x > paddle2.x) {
            this.y_speed = 3;
            this.x_speed += (paddle2.x_speed / 2);
            this.y += this.y_speed;
        }
    }
};

document.body.appendChild(canvas);
animate(step);

window.addEventListener("keydown", function (event) {
    keysDown[event.keyCode] = true;
});

window.addEventListener("keyup", function (event) {
    delete keysDown[event.keyCode];
});

//controlercode from box2d

var TILT_LIMIT = 30;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var halfScreenWidth = screenWidth / 2;
var halfScreenHeight = screenHeight / 2;

//var cubeWidth;

//if (screenWidth < screenHeight) {
//    cubeWidth = screenWidth / 4;
// } else {
//     cubeWidth = screenHeight / 4;
// }

// var halfCubeWidth = cubeWidth / 2;

// var box = document.querySelector('#floatingBox');

// box.style.width = cubeWidth + 'px';
// box.style.height = cubeWidth + 'px';

// box.minBoundX = box.parentNode.offsetLeft;
// box.minBoundY = box.parentNode.offsetTop;

// box.maxBoundX = box.minBoundX + box.parentNode.offsetWidth - box.offsetWidth;
// box.maxBoundY = box.minBoundY + box.parentNode.offsetHeight - box.offsetHeight;

var initialBeta;

var controlTypes = ['FULLTILT DeviceOrientation', 'Raw DeviceOrientation'];
var currentControlType = 0;

// Allow switching between 'FULLTILT' and 'Raw DeviceOrientation' data sources
//var controllerSelectorEl = document.querySelector('#controllertype');

// controllerSelectorEl.addEventListener('click', function() {

//     event.preventDefault();

//     if (++currentControlType === 2) currentControlType = 0;

//     controllerSelectorEl.textContent = controlTypes[currentControlType];

//     // Clear default beta offset from zero

//     initialBeta = null;

// }, false);

var transformCSSPropName = getCSSPropertyName('transform');

window.addEventListener('load', function() {

    var promise = FULLTILT.getDeviceOrientation({'type': 'game'});

    promise.then(function(orientationControl) {

        orientationControl.listen(function() {

            var euler;

            switch( currentControlType ) {
                case 1: // Use raw DeviceOrientation event values
                    euler = orientationControl.getLastRawEventData();
                    break;
                default: // Use Full Tilt values
                    euler = orientationControl.getScreenAdjustedEuler();
                    break;
            }

            // Don't update CSS position if we are close to encountering gimbal lock
            if (euler.beta > 85 && euler.beta < 95) {
                return;
            }

            var tiltX = euler.gamma;

            if (tiltX > 0) {
                tiltX = Math.min(tiltX, TILT_LIMIT);
            } else {
                tiltX = Math.max(tiltX, TILT_LIMIT * -1);
            }

            var pxOffsetX = (tiltX * halfScreenWidth) / TILT_LIMIT;

            if ( !initialBeta ) {
                initialBeta = euler.beta;
            }

            //var tiltY = euler.beta - initialBeta;

            //if (tiltY > 0) {
            //    tiltY = Math.min(tiltY, TILT_LIMIT);
            //} else {
            //    tiltY = Math.max(tiltY, TILT_LIMIT * -1);
            //}

            //var pxOffsetY = (tiltY * halfScreenHeight) / TILT_LIMIT;

//            var pxToMoveX = Math.max(box.minBoundX, Math.min(pxOffsetX + halfScreenWidth - halfCubeWidth, box.maxBoundX));
        //    var pxToMoveY = Math.max(box.minBoundY, Math.min(pxOffsetY + halfScreenHeight - halfCubeWidth, box.maxBoundY));

          //  box.style[transformCSSPropName] = 'translate3d(' + pxToMoveX + 'px, ' + pxToMoveY + 'px, 0)';

        });

    });

}, false);

// window.addEventListener('resize', function() {

    // Recalculate screen dimensions

//    screenWidth = window.innerWidth;
//    screenHeight = window.innerHeight;

//    halfScreenWidth = screenWidth / 2;
//    halfScreenHeight = screenHeight / 2;

    // Recalculate min/max X/Y bounds

//    box.minBoundX = box.parentNode.offsetLeft;
  //box.minBoundY = box.parentNode.offsetTop;

//    box.maxBoundX = box.minBoundX + box.parentNode.offsetWidth - box.offsetWidth;
    //box.maxBoundY = box.minBoundY + box.parentNode.offsetHeight - box.offsetHeight;

    // Clear default beta offset from zero

//    initialBeta = null;

//}, false);
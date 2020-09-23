/* CONTENEUR D'IMGS */
const imageFiles = [
    'ship1'
];

/* CONTROLES ET POSITION DE DEPART */
const gameSettings = {
    keyPress : {
        left : 37,
        right : 39,
        up : 38,
        down : 40,
        space : 32
    },
    targetFPS: 1000 / 60,

    bulletSpeed : 700 / 1000,
    bulletLife : 4000,
    bulletFireRate : 2000,

    playareaWidth: 720,
    playareaHeight: 720,
    playareaDiv: '#playarea',

    playerDivName : 'playersprite',
    playerStart : {
        x :360,
        y :440,
    },

    playerstartLives : 3,
    playerState: {
        ok: 0,
        dead: 1,
        hitFlashing: 2
    },
    playerMoveStep : 8

};


let gameManager = {
    assets:{},
    player: undefined,
    bullets: undefined,
    lastUpdated: Date.now(),
    elapsedTime: 0,
    fps: 0,
}

/***  CLASSES SIZE POINT & SPRITE ***/

    /* SIZE */
    class Size {
        constructor(w, h) {
            this.width = w;
            this.height = h;
        }
    }

    /* POINT */
    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        update(x, y) {
            this.x = x;
            this.y = y;
        }

        increment(ix, iy) {
            this.x += ix;
            this.y += iy;
        }
    }

    /* SPRITE */
    class Sprite {
        constructor(divName, position, imgName, sizePx) {
            this.position = position;
            this.divName = divName;
            this.imgName = imgName;
            this.size = sizePx;
            this.anchorShift = new Point(-this.size.width / 2 , -this.size.height / 2);
        }

        addToBoard(shift) {
            var div = document.createElement("div");
            div.classList.add("sprite");
            div.id = this.divName;
            div.style.backgroundImage = "url('" + this.imgName + "')";
            div.style.width = this.size.width + 'px';
            div.style.height = this.size.height + 'px';
            $(gameSettings.playareaDiv).append(div);

            this.setPosition(this.position.x, this.position.y, shift);
        }

        removeFromBoard() {
            $('#' + this.divName).remove();
        }

        draw() {
            $('#' + this.divName).css({
                "left": this.position.x,
                "top": this.position.y
            });
        }

        setPosition(x, y, shift) {
            this.position.update(x,y);
            if (shift == true) {
                this.incrementPosition(this.anchorShift.x, this.anchorShift.y);
            }
            this.draw();
        }

        updatePosition(x, y) {
            this.position.update(x,y);
            this.draw();
        }

        incrementPosition(ix, iy) {
            this.position.increment(ix,iy);
            this.draw();
        }

    }


    class Rect {
        constructor(x, y, width, height) {
            this.origin = new Point(x,y);
            this.size = new Size (width, height);
            this.max = new Point(this.origin.x + this.size.width, this.origin.y + this.size.height);
        }

        update(x,y) {
            this.origin.x = x;
            this.origin.y = y;
            this.max.x = this.origin.x + this.size.width;
            this.max.y = this.origin.y + this.size.height;
        }

        shift(x, y) {
            this.update(this.origin.x + x, this.origin.y + y);
        }

        outsideHorizontal(x) {
            if(x < this.origin.x || x > this.max.x) {
                return true;
            } else {
                return false;
            }
        }

        outsideVertical(y) {
            if(y < this.origin.y || y > this.max.y) {
                return true;
            } else {
                return false;
            }
        }
    }

    /* EXTENSIONS DE CLASSE */

    class Player extends Sprite {
        constructor(divName, position, assetDesc, boundaryRect) {
            super(divName, position, assetDesc.fileName,
                new Size(assetDesc.width, assetDesc.height));
                this.lives = gameSettings.playerstartLives;
                this.score = 0;
                this.highScore = 0;
                this.state = gameSettings.playerState.ok;
                this.boundaryRect = boundaryRect;
                this.boundaryRect.shift(this.anchorShift.x, this.anchorShift.y);
        }

        reset() {
            this.state = gameSettings.playerState.ok;
            this.score = 0;
            this.lives = gameSettings.playerstartLives;
            this.setLives();
            this.setScore();
            this.setHighScore();
            this.setPosition(gameSettings.playerStart.x, gameSettings.playerStart.y, true);
        }

        move(x, y) {
            let xStep = gameSettings.playerMoveStep * x;
            let yStep = gameSettings.playerMoveStep * y;

            if(this.boundaryRect.outsideHorizontal(xStep + this.position.x) == true) {
                xStep = 0;
            }

            if(this.boundaryRect.outsideHorizontal(yStep + this.position.y) == true) {
                yStep = 0;
            }

            this.incrementPosition(xStep, yStep);
        }

        incrementScore(amount) {
            this.score += amount;
            this.setScore();
            this.setHighScore();
        }

        setLives() {
            $('#lives').text('x ' + this.lives);
        }

        setScore() {
            $('#score').text(this.score);
        }

        setHighScore() {
            if(this.score > this.highScore) {
                this.highScore = this.score;
            }
            $('#highScore').text(this.highScore);
        }

    }


/* FONCTIONS */
function tick() {
    let now = Date.now();
    let dt = now - gameManager.lastUpdated;
    gameManager.lastUpdated = now;
    gameManager.fps = parseInt(1000 / dt);

    $('#divFPS').text('FPS: ' + gameManager.fps);

    setTimeout(tick, gameSettings.targetFPS);
    console.log(gameSettings)
}

function resetPlayer() {
    if(gameManager.player == undefined) {
        let asset = gameManager.assets['ship1'];
        
        gameManager.player = new Player(gameSettings.playerDivName,
        new Point(gameSettings.playerStart.x, gameSettings.playerStart.y),
        asset,
        new Rect(40,40, gameSettings.playareaWidth - 80, gameSettings.playareaHeight - 80)
        );
        gameManager.player.addToBoard(true);
    }
    console.log('resetPlayer() gameManager.player:', gameManager.player);
    gameManager.player.reset()
}

function init() {
    console.log('Main Game init()');
    resetPlayer();
    setTimeout(tick, gameSettings.targetFPS);
}

function processAsset(indexNum) {
    var img = new Image();
    var fileName = 'assets/' + imageFiles[indexNum] + '.png';
    img.src = fileName;
    img.onload = function() {
        gameManager.assets[imageFiles[indexNum]] = {
            width: this.width,
            height: this.height,
            fileName: fileName
        };
        indexNum++;
        if(indexNum < imageFiles.length) {
            processAsset(indexNum);
        } else {
            console.log('Assets Done:', gameManager.assets);
            init();
        }
    }
}

/* DETECTION DES TOUCHES */
$(function(){
    processAsset(0);
    $(document).keydown(

        function(e){

            switch(e.which) {
                case gameSettings.keyPress.up :
                    gameManager.player.move(0, -1);
                    break
                case gameSettings.keyPress.down :
                    gameManager.player.move(0, 1);
                    break
                case gameSettings.keyPress.left :
                    gameManager.player.move(-1, 0);;
                    break
                case gameSettings.keyPress.right :
                    gameManager.player.move(1, 0);
                    break
                case gameSettings.keyPress.space :
                    break
            }

        }

    );

});
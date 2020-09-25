/* CONTENEUR D'IMGS */
const imageFiles = [
    'ship1',
    'beam',
    'alienship'
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
        hitFlashing: 3
    },
    playerMoveStep : 8,
    enemyState: {
        ready: 1,
        dead: 0,
        movingToWaypoint: 2
    },
    pressSpaceDelay: 3000,
    gamePhase: {
        readyToPlay: 1,
        countdownToStart: 2,
        playing: 3,
        gameOver: 4
    },
    countdownGap: 700,
    countdownValues: ['2', '1', 'GO!']
    
};

const wayPoints = {
    leftToRightShallow : [
        {
        rotation : 0,
        x : 60,
        y : -90,
        dir_x : 0,
        dir_y : 0
        },
        {
        rotation : 0,
        x : 60,
        y : 128,
        dir_x : 0,
        dir_y : 1
        },
        {
        rotation : 0,
        x : 810,
        y : 128,
        dir_x : 1,
        dir_y : 0
        }
],
    streamFrom180 : [
        {
        rotation : 0,
        x : 180,
        y : 700,
        dir_x : 0,
        dir_y : 0
        },
        {
        rotation : 0,
        x : 180,
        y : -90,
        dir_x : 0,
        dir_y : -1
        }
]
};

let enemySequences = [];

let gameManager = {
    assets:{},
    player: undefined,
    bullets: undefined,
    phase: gameSettings.gamePhase.gameOver,
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

        equalToPoint(x, y) {
            if(this.x == x && this.y == y) {
                return true;
            } 
            return false;
        }
    }

    

    /* SPRITE */
    class EnemyCollection {
        constructor(player) {
            this.listEnemies = [];
            this.lastAdded = 0;
            this.gameOver = false;
            this.sequenceIndex = 0;
            this.sequencesDone = false;
            this.count = 0;
            this.player = player;
        }

        killAll() {
            for(let i = 0; i < this.listEnemies.length; i++) {
                this.listEnemies[i].killMe();
            }
        }

        update(dt) {
            this.lastAdded += dt;
            if (this.sequencesDone == false &&
                enemySequences[this.sequenceIndex].delayBefore < this.lastAdded) {
                    this.addEnemy();
                }

            for (let i = this.listEnemies.length - 1; i >= 0; --i) {
                if(this.listEnemies[i].state == gameSettings.enemyState.dead) {
                    this.listEnemies.splice(i, 1);
                } else {
                    this.listEnemies[i].update(dt);
                }
            }

                this.checkGameOver();

        }

        checkGameOver() {
            if(this.listEnemies.length == 0 && this.sequencesDone == true) {
                this.gameOver = true;
                console.log('GAME OVER')
            }
        }

        addEnemy() {
            let seq = enemySequences[this.sequenceIndex];
            let en_new = new Enemy('en_' + this.count, gameManager.assets[seq.image],
            this.player, seq);
            this.listEnemies.push(en_new);
            en_new.setMoving();
            this.count++;
            this.sequenceIndex++;
            this.lastAdded = 0;
            if (this.sequenceIndex == enemySequences.length) {
                this.sequencesDone = true;
                console.log('sequences done');
            }
        }

    }
    
    
    class WayPoint {
        constructor(x,y,dir_x,dir_y) {
            this.point = new Point(x,y);
            this.dir_x = dir_x;
            this.dir_y = dir_y;
        }
    }
    
    
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

    class BulletCollection {
        constructor(player) {
            this.listBullets = [];
            this.lastAdded = 0;
            this.player = player;
            this.total_bullets = 0;
        }

        reset() {
            for(let i = 0; i < this.listBullets.length; ++i) {
                this.listBullets[i].removeFromBoard();
            }
            this.listBullets = [];
            this.lastAdded = 0;
            this.total_bullets = 0;
        }

        update(dt) {
            for(let i = this.listBullets.length - 1; i >=0 ; --i) {
                if(this.listBullets[i].dead == true ) {
                    this.listBullets.splice(i, 1);
                } else {
                    this.listBullets[i].update(dt);
                }
            }
            this.lastAdded += dt;

            if(this.lastAdded > gameSettings.bulletFireRate &&
                this.player.state != gameSettings.playerState.hitFlashing) {
                    this.lastAdded = 0;
                    this.listBullets.push(
                        new Bullet(
                            'bullet_' + this.total_bullets,
                            gameManager.assets['beam'],
                            new Point(this.player.position.x +(this.player.size.width / 2),
                            this.player.position.y)
                        )
                    );
                    this.total_bullets++;
                }
        }

    }

    /* EXTENSIONS DE CLASSE */
    class Enemy extends Sprite {
        constructor(divName, assetDesc, player, sequence) {
            super(divName, new Point(0,0), assetDesc.fileName, new Size(assetDesc.width, assetDesc.height));
            this.state = gameSettings.enemyState.ready;
            this.waypointList = [];
            this.targetWayPointNumber = 0;
            this.targetWayPoint = new WayPoint(0,0,0,0);
            this.lastWayPointIndex = 0;
            this.player = player;
            this.score = sequence.score;
            this.lives = sequence.lives;
            this.speed = sequence.speed;
            this.readInWayPoints(sequence.wayPoints);
        }

        readInWayPoints(wpList) {
            this.waypointList = [];
            for(let i = 0; i < wpList.length; i++) {
                let t_wp = wpList[i];
                let n_wp = new WayPoint(
                    t_wp.x + this.anchorShift.x,
                    t_wp.y + this.anchorShift.y,
                    t_wp.dir_x,
                    t_wp.dir_y
                );
                this.waypointList.push(n_wp);
            }
        }

        update(dt) {
            switch(this.state) {
                case gameSettings.enemyState.movingToWayPoint:
                    this.moveTowardPoint(dt);
                    break;
            }
        }

        moveTowardPoint(dt) {
            let inc = dt * this.speed;
            this.incrementPosition(inc * this.targetWayPoint.dir_x, inc * this.targetWayPoint.dir_y);

            if(Math.abs(this.position.x - this.targetWayPoint.point.x) < Math.abs(inc) &&
            Math.abs(this.position.y - this.targetWayPoint.point.y) < Math.abs(inc)) {
                this.updatePosition(this.targetWayPoint.point.x, this.targetWayPoint.point.y);
            }

            if(this.position.equalToPoint(this.targetWayPoint.point.x, this.targetWayPoint.point.y) == true) {
                if (this.targetWayPointNumber == this.lastWayPointIndex) {
                    this.killMe();
                    console.log('reached end');
                } else {
                    this.setNextWayPoint();
                }
            }
        }

        setNextWayPoint() {
            this.targetWayPointNumber++;
            this.targetWayPoint = this.waypointList[this.targetWayPointNumber];
        }

        killMe() {
            this.state = gameSettings.enemyState.dead;
            this.removeFromBoard();
        }

        setMoving() {
            this.targetWayPointNumber = 0;
            this.targetWayPoint = this.waypointList[this.targetWayPointNumber];
            this.lastWayPointIndex = this.waypointList.length -1;
            this.setPosition(this.targetWayPoint.point.x, this.targetWayPoint.point.y, false);
            this.addToBoard(false);
            this.targetWayPointNumber = 1;
            this.targetWayPoint = this.waypointList[this.targetWayPointNumber];
            this.state = gameSettings.enemyState.movingToWayPoint;
        }

    }


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
                /* console.log(assetDesc) */
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

    class Bullet extends Sprite {

       constructor(divName, assetDesc, position) {
        super(divName, position, assetDesc.fileName, new Size(assetDesc.width, assetDesc.height));
        this.life = gameSettings.bulletLife;
        this.dead = false;
        this.addToBoard(true);
    }

        update(dt) {
            let inc = dt * gameSettings.bulletSpeed;
            this.incrementPosition(0, -inc);
            this.life -= dt;
            if (this.life < 0) {
                this.killMe();
            }
        }

        killMe() {
            this.dead = true;
            this.removeFromBoard();
        }

    }

/* FONCTIONS */
function addEnemySequence(delayBefore, image, score, lives, speed, number, delayBetween, wayPoints) {

    for(let i = 0; i < number; i++) {
        let delay = delayBetween;
        if(i == 0) {
            delay = delayBefore;
        }

        enemySequences.push({
            delayBefore : delay,
            image : image,
            wayPoints : wayPoints,
            score : score,
            lives :lives,
            speed : speed
        });
    }

}

function setUpSequences() {
    addEnemySequence(2000, 'alienship', 100, 1, 200 / 1000,
    2, 800, wayPoints['leftToRightShallow']);
    addEnemySequence(4000, 'alienship', 100, 1, 400 / 1000,
    6, 400, wayPoints['streamFrom180']);
}

function tick() {
    let now = Date.now();
    let dt = now - gameManager.lastUpdated;
    gameManager.lastUpdated = now;
    gameManager.fps = parseInt(1000 / dt);

    $('#divFPS').text('FPS: ' + gameManager.fps);

    gameManager.bullets.update(dt);
    gameManager.enemies.update(dt);

    if(gameManager.enemies.gameOver == true) {
        console.log('Game Over');
        showGameOver();
    } else {
        setTimeout(tick, gameSettings.targetFPS);
    }

}

function showGameOver() {
    gameManager.phase = gameSettings.gameOver;
    writeMessage('Game Over');
    setTimeout(function() {appendMessage('Press space to reset'); }, 
                gameSettings.pressSpaceDelay);
}

function endCountdown() {
    clearMessages();
    gameManager.phase = gameSettings.gamePhase.playing;
    gameManager.lastUpdated = Date.now();
    setTimeout(tick, gameSettings.targetFPS);
}

function runCountdown() {
    gameManager.phase = gameSettings.gamePhase.countdownToStart;
    writeMessage(3);
    for (let i = 0; i < gameSettings.countdownValues.length; i++) {
        setTimeout(writeMessage, gameSettings.countdownGap * (i + 1),
        gameSettings.countdownValues[i])
    }
    setTimeout(endCountdown, 
        (gameSettings.countdownValues.length + 1) * gameSettings.countdownGap);
}

function writeMessage(text) {
    clearMessages();
    appendMessage(text);
}

function appendMessage(text) {
    $('#messageContainer').append('<div class="message">' + text + '</div>')
}

function clearMessages() {
    $('#messageContainer').empty();
}

function resetBullets() {
    if(gameManager.bullets != undefined) {
        gameManager.bullets.reset();
    } else {
        gameManager.bullets = new BulletCollection(gameManager.player);
    }
}

function resetEnemies() {
    gameManager.enemies = new EnemyCollection(gameManager.player);
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

function resetGame() {
    console.log('Main Game init()');
    resetPlayer();
    resetBullets();
    resetEnemies();
    runCountdown();
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
            resetGame();
        }
    }
}

/* DETECTION DES TOUCHES */
$(function(){
    setUpSequences();
    $(document).keydown(function(e){
            if(gameManager.phase == gameSettings.gamePhase.readyToPlay) {
                if(e.which == gameSettings.keyPress.space) {
                    runCountdown();
                }
            } else if (gameManager.phase == gameSettings.gamePhase.playing) {
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
            } else if (gameManager.phase == gameSettings.gameOver) {
                if(e.which == gameSettings.keyPress.space) {
                    resetGame();
                } 
            }
        }
    );
    processAsset(0);
});
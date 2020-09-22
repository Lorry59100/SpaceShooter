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
    playareaWidth: 1000,
    playareaHeight: 800,
    playareaDiv: '#playarea',

    playerDivName : 'playersprite',
    playerStart : {
        x :880,
        y :700,
    },

    playerstartLives : 3,
    playerState: {
        ok: 0,
        dead: 1,
        hitFlashing: 2
    }

};


let gameManager = {
    assets:{},
    player: undefined
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
            this.anchorShift = new Point(-this.size.width * 4.5, -this.size.height / 2);
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

    /* EXTENSIONS DE CLASSE */

    class Player extends Sprite {
        constructor(divName, position, assetDesc) {
            super(divName, position, assetDesc.fileName,
                new Size(assetDesc.width, assetDesc.height));
                this.lives = gameSettings.playerstartLives;
                this.score = 0;
                this.highScore = 0;
                this.state = gameSettings.playerState.ok;
        }

        reset() {
            this.state = gameSettings.playerState.ok;
            this.score = 0;
            this.lives = gameSettings.playerstartLives;
            this.setLives();
            this.setScore();
            this.setHighScore();
            this.setPosition(gameManager.playerStart.x, gameManager.playerStart.y, true);
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
            $('#highscore').text(this.highscore);
        }

    }


/* FONCTIONS */
function resetPlayer() {
    if(gameManager.player == undefined) {
        let asset = gameManager.assets['ship1'];
        
        gameManager.player = new Player(gameSettings.playerDivName,
        new Point(gameSettings.playerStart.x, gameSettings.playerStart.y),
        asset.fileName,
        new Size(asset.width, asset.height)
        );
        gameManager.player.addToBoard(true);
    }
    console.log('resetPlayer() gameManager.player:', gameManager.player);
}

function init() {
    console.log('Main Game init()');
    resetPlayer();
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
                    console.log('up');
                    break
                case gameSettings.keyPress.down :
                    console.log('down');
                    break
                case gameSettings.keyPress.left :
                    console.log('left');
                    break
                case gameSettings.keyPress.right :
                    console.log('right');
                    break
                case gameSettings.keyPress.space :
                    console.log('space');
                    break
            }

        }

    );

});
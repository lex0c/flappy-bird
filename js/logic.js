// Debug mode of the game
var debugMode = false;

// Immutable objects
var states = Object.freeze({
    splashScreen: 0,
    duringGame: 1,
    gameEnd: 2
});

// Physics of the game
var currentState;
var gravity = 0.25;
var velocity = 0;
var position = 180;
var rotation = 0;
var jump = -4.6;

// Pre-defined measures for pipes
var obstacle = new Array();
var obstacleWidth = 52;
var obstacleHeight = 90;

// Current score and best
var score = 0;
var bestScore = 0;

// Loops of iteration
var gameLoop;
var obstacleLoop;

// Reload game
var restart = false;

// Definition of sounds
var soundJump = new buzz.sound("assets/sounds/wing.ogg");
var soundScore = new buzz.sound("assets/sounds/point.ogg");
var soundHit = new buzz.sound("assets/sounds/hit.ogg");
var soundDie = new buzz.sound("assets/sounds/die.ogg");
var soundSwoosh = new buzz.sound("assets/sounds/swooshing.ogg");
buzz.all().setVolume(30);
/// End of variables declaration ///

/* 
    /// BUILDER ///
*/
$(document).ready(function()
{
    // Init debug mode
    if(window.location.search == "?debug"){
		debugMode = true;
	}else if(window.location.search == "?easy"){
		obstacleHeight = 200;
	}

	// Get best score by cookie
	var savedScore = getCookie("bestScore");
	if(savedScore != ""){
		bestScore = parseInt(savedScore);
	}

	showSplashScreen();

});

$(document).keydown(function(e)
{    
    if(e.keyCode == 32){
        // Begins with the spacebar
        if(currentState == states.gameEnd){
            $("#restart").click();
        }else{
            stateGame();
        }
    }
});

// Begins with the touch or mouse
if("ontouchstart" in window){
    $(document).on("touchstart", stateGame);
}else{
    $("#modal").on("mousedown", stateGame);
}

// Initializes the game based on the current state
function stateGame()
{
    if(currentState == states.duringGame){ 
        playerJump();
    }else if(currentState == states.splashScreen){ 
        startGame(); 
    }
}

/*
  /// INITIALIZES THE GAME ///
*/
function startGame()
{
    currentState = states.duringGame;

    // Hide of splash screen
    $("#splash-screen").stop();
    $("#splash-screen").transition({ opacity: 0 }, 500, 'ease');

    // Update current score during game
    setScoreInGame();

    // Check border
    if(debugMode){ 
        $(".boundingbox").show(); 
    }

    // Loop interval
    gameLoop = setInterval(inLoop, (900.0 / 60.0)); // 60fps
    obstacleLoop = setInterval(addObstacle, 1400); // Sets the distance between obstacles

    // Start
    playerJump();
}

function inLoop()
{
    // Upadate rate
    velocity += gravity;
    position += velocity;
    // apply new rate
    updatePlayer($("#player"));

    // Creates the hack bounding box, for the personage
    var box = document.getElementById('player').getBoundingClientRect();
    // Initial values
    var initWidth = 34.0;
    var initHeight = 24.0;

    // Crazy calculations for the physics of the game
    var boxWidth = initWidth - (Math.sin(Math.abs(rotation) / 90) * 8);
    var boxHeight = (initHeight + box.height) / 2;
    var boxTop = ((box.height - boxHeight) / 2) + box.top;
    var boxLeft = ((box.width - boxWidth) / 2) + box.left;
    var boxRight = boxLeft + boxWidth;
    var boxBottom = boxTop + boxHeight;

    // Checks if the player collided with the ground
    if(box.bottom >= $("#land").offset().top){
        playerDead();
        return;
    }
    // Checks if the player collided with the ceiling
    else if(boxTop <= ($("#ceiling").offset().top + $("#ceiling").height())){ 
        position = 0;
    }
    // Checks if there is no obstacle in game
    else if(obstacle[0] == null){ 
        return; 
    }

    // Determines the area for the next obstacles
    var nextObstacle = obstacle[0];
    var nextObstacleUpper = nextObstacle.children(".obstacle_upper");   
    // More crazy calculations for the physics of the game
    var obstacleTop = nextObstacleUpper.offset().top + nextObstacleUpper.height();

    // For some reason it starts in the displacement of inner tubes, not the outer tubes
    var obstacleLeft = nextObstacleUpper.offset().left -2;

    var obstacleRight = obstacleLeft + obstacleWidth;
    var obstacleBottom = obstacleTop + obstacleHeight;

    if(boxRight > obstacleLeft){
        if((boxTop > obstacleTop) && (boxBottom < obstacleBottom)){

            // Optional code...

        }else{
            playerDead();
            return;
        }
    }
    // Verifies that the player has passed over the obstacle
    if(boxLeft > obstacleRight){
        // Next obstacle
        obstacle.splice(0, 1);
        updateScore();
    }

}

// Relates the sound with the leap
function playerJump()
{
   velocity = -4.5;
   soundJump.stop();
   soundJump.play();
}

function playerDead()
{
    // Pause animations
    $(".animated").css('-webkit-animation-play-state', 'paused');
    $(".animated").css('-moz-animation-play-state', 'paused');
    $(".animated").css('-o-animation-play-state', 'paused');
    $(".animated").css('animation-play-state', 'paused');

    // Drop the personage the floor
    var playerBottom = $("#player").position().top + $("#player").width();
    var floor = $("#flight-area").height();
    var movey = Math.max(0, floor - playerBottom);   
    $("#player").transition({ y: movey + 'px', rotate: 90}, 1000, 'easeInOutCubic');

    currentState = states.gameEnd;

    // Destroy loops
    clearInterval(gameLoop);
    clearInterval(obstacleLoop);
    gameLoop = null;
    obstacleLoop = null;

    // Mobile browsers that do not support the buzz bindOnce event
    if(isIncompatible.any()){ 
        showScore(); 
    }else{
        soundHit.play().bindOnce("ended", function(){
            soundDie.play().bindOnce("ended", function(){
                showScore();
            });
        });
    }

}

function showScore()
{
    $("#scoreboard").css("display", "block");

    // Hide scoreInGame
    setScoreInGame(true);

    if(score > bestScore){
        bestScore = score;
        setCookie("bestScore", bestScore, 999);
    }

    setCurrentScore();
    setBestScore();

    // Restarts the sound
    soundSwoosh.stop();
    soundSwoosh.play();

    // Transitions
    $("#scoreboard").css({ y: '40px', opacity: 0 });
    $("#restart").css({ y: '40px', opacity: 0 });
    $("#scoreboard").transition({ y: '0px', opacity: 1}, 500, 'ease', function(){
      
        soundSwoosh.stop();
        soundSwoosh.play();
         
        $("#restart").transition({ y: '0px', opacity: 1}, 500, 'ease');
         
        if(setMedal()){
            $("#medal").css({ scale: 2, opacity: 0 });
            $("#medal").transition({ opacity: 1, scale: 1 }, 1200, 'ease');
        }
    });

    restart = true;
}

// Activated click for button restart
$("#restart").click(function() 
{
    if(!restart){
        return;
    }else{
        restart = false;
        soundSwoosh.stop();
        soundSwoosh.play();
    }

    $("#scoreboard").transition({ y: '-40px', opacity: 0}, 1000, 'ease', function(){
        $("#scoreboard").css("display", "none");
        showSplashScreen();
    });

});

/*
    /// SPLASH SCREEN ///
*/
function showSplashScreen()
{
    currentState = states.splashScreen;
      
    // Initial values
    velocity = 0;
    position = 180;
    rotation = 0;
    score = 0;

    // Reset the position of player
    updatePlayer($("#player").css({ y: 0, x: 0 }));

    // Sound of actions
    soundSwoosh.stop();
    soundSwoosh.play();
  
    // Clear the obstacles of screen
    $(".obstacle").remove();
    obstacle = new Array();

    // Reload animation of sprites
    $(".animated").css('-webkit-animation-play-state', 'running');
    $(".animated").css('-moz-animation-play-state', 'running');
    $(".animated").css('-o-animation-play-state', 'running');
    $(".animated").css('animation-play-state', 'running');

    // Show 
    $("#splash-screen").transition({ opacity: 1 }, 2000, 'ease');

}

function updatePlayer(player)
{
    rotation = Math.min((velocity / 10) * 90, 90);   
    $(player).css({ rotate: rotation, top: position });
}

function updateScore()
{
    score += 1;
    soundScore.stop();
    soundScore.play();
    setScoreInGame();
}

function addObstacle()
{
    $(".obstacle").filter(function(){ 
        return $(this).position().left <= -100; 
    }).remove();

    var padding = 80;
    var constt = 420 - obstacleHeight - (padding * 2);
    var topHeight = Math.floor((Math.random() * constt) + padding);
    var bottomHeight = (420 - obstacleHeight) - topHeight;
    var newObstacle = $('<div class="obstacle animated"><div class="obstacle_upper" style="height: ' + topHeight + 'px;"></div><div class="obstacle_lower" style="height: ' + bottomHeight + 'px;"></div></div>');
    $("#flight-area").append(newObstacle);
    obstacle.push(newObstacle);

}

// Updates the score of the player during the game
function setScoreInGame(erase)
{
    var elementScore = $("#score");
    elementScore.empty();
      
    if(erase){ 
        return; 
    }

    var num = score.toString().split('');
    for(var i = 0; i < num.length; i++){
        elementScore.append("<img src='assets/fonts/big_" + num[i] + ".png' alt='" + num[i] + "'>");
    }

}

// Displays the current score on the scoreboard
function setCurrentScore()
{
    var elementScore = $("#current-score");
    elementScore.empty();

    var num = score.toString().split('');
    for(var i = 0; i < num.length; i++){
        elementScore.append("<img src='assets/fonts/small_" + num[i] + ".png' alt='" + num[i] + "'>");
    }

}

// Displays the best score on the scoreboard
function setBestScore()
{
    var elementScore = $("#best-score");
    elementScore.empty();

    var num = bestScore.toString().split('');
    for(var i = 0; i < num.length; i++){
        elementScore.append("<img src='assets/fonts/small_" + num[i] + ".png' alt='" + num[i] + "'>");
    }

}

// Displays the medal on the scoreboard
function setMedal()
{
    var elementMedal = $("#medal");
    elementMedal.empty();
      
    if(score < 10){ return false; }

    if(score >= 10){ var medal = "bronze"; }
    if(score >= 20){ var medal = "silver"; }
    if(score >= 30){ var medal = "gold"; }
    if(score >= 40){ var medal = "platinum"; }
      
    elementMedal.append('<img src="assets/scenery/medal_' + medal +'.png" alt="' + medal +'">');  
    return true;
}

/*
    /// STORES THE PLAYER'S SCORE ///
*/
function getCookie(scoreType)
{
    var name = scoreType + "=";
    var cookieSplit = document.cookie.split(';');
    for(var i = 0; i < cookieSplit.length; i++){
        var cookie = cookieSplit[i].trim();
        if(cookie.indexOf(name) == 0){
            return cookie.substring(name.length,cookie.length);
        }
    }
    return "";
}

function setCookie(name, value, exdays)
{
    var d = new Date();
    d.setTime(d.getTime()+(exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = name + "=" + value + "; " + expires;
}

var isIncompatible = {
    Android: function() 
    { 
        return navigator.userAgent.match(/Android/i); 
    },
    BlackBerry: function() 
    { 
    	return navigator.userAgent.match(/BlackBerry/i); 
    },
    iOS: function() 
    { 
    	return navigator.userAgent.match(/iPhone|iPad|iPod/i); 
    },
    Opera: function() 
    { 
    	return navigator.userAgent.match(/Opera Mini/i); 
    },
    Safari: function() 
    { 
    	return (navigator.userAgent.match(/OS X.*Safari/) 
            && !navigator.userAgent.match(/Chrome/)); 
    },
    Windows: function() 
    { 
    	return navigator.userAgent.match(/IEMobile/i); 
    },
    any: function() 
    {
        return (isIncompatible.Android() 
        	|| isIncompatible.BlackBerry() 
            || isIncompatible.iOS() 
            || isIncompatible.Opera() 
            || isIncompatible.Safari() 
            || isIncompatible.Windows()); 
    }

};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const gameOverScreen = document.getElementById('game-over');
const startScreen = document.getElementById('start-screen');
const restartButton = document.getElementById('restart-button');
const startButton = document.getElementById('start-button');

const gridSize = 20; // Size of each grid cell
const canvasSize = canvas.width; // Assuming square canvas
const tileCount = canvasSize / gridSize; // Number of tiles in each row/column

let snake = [
    { x: 10, y: 10 } // Initial snake position (in grid units)
];
let dx = 0; // Horizontal velocity
let dy = 0; // Vertical velocity
let food = { x: 15, y: 15 }; // Initial food position
let score = 0;
let changingDirection = false;
let gameRunning = false;
let gameLoopTimeout;

// --- Game Logic Functions ---

function main() {
    if (!gameRunning) return;

    gameLoopTimeout = setTimeout(() => {
        changingDirection = false;
        clearCanvas();
        moveSnake();
        drawFood();
        drawSnake();
        main(); // Recursive call for game loop
    }, 100); // Game speed (lower is faster)
}

function startGame() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    resetGame(); // Reset game state first
    gameRunning = true; // Set gameRunning to true *after* reset
    dx = 1; // Move right initially
    dy = 0;
    changingDirection = false;
    main(); // Start the loop
}

function resetGame() {
    clearTimeout(gameLoopTimeout); // Clear any existing loop
    snake = [{ x: 10, y: 10 }];
    dx = 0; // Reset direction here
    dy = 0; // Reset direction here
    score = 0;
    scoreDisplay.textContent = score;
    placeFood();
}

function clearCanvas() {
    ctx.fillStyle = '#f9f9f9'; // Background color
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.strokeStyle = '#eee'; // Grid lines (optional)
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvasSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvasSize, i * gridSize);
        ctx.stroke();
    }
}

function drawSnakePart(snakePart) {
    ctx.fillStyle = '#4CAF50'; // Snake color
    ctx.strokeStyle = '#388E3C'; // Snake border
    ctx.fillRect(snakePart.x * gridSize, snakePart.y * gridSize, gridSize, gridSize);
    ctx.strokeRect(snakePart.x * gridSize, snakePart.y * gridSize, gridSize, gridSize);
}

function drawSnake() {
    snake.forEach(drawSnakePart);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); // Add new head

    // Check for collision with food
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = score;
        placeFood(); // Place new food
    } else {
        snake.pop(); // Remove tail if no food eaten
    }

    // Check for game over conditions
    if (hasGameEnded()) {
        endGame();
    }
}

function changeDirection(event) {
    // Start the game on first key press if not running yet
    // (Optional: could keep the start button requirement)
    // if (!gameRunning) {
    //     startGame();
    // }

    if (changingDirection || !gameRunning) return; // Prevent rapid changes or changes when not running
    changingDirection = true;

    const keyPressed = event.key;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingLeft = dx === -1;
    const goingRight = dx === 1;

    // Use Arrow keys or WASD
    if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && !goingRight) {
        dx = -1;
        dy = 0;
    } else if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && !goingDown) {
        dx = 0;
        dy = -1;
    } else if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && !goingLeft) {
        dx = 1;
        dy = 0;
    } else if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && !goingUp) {
        dx = 0;
        dy = 1;
    } else {
         // If invalid key or opposite direction, don't change direction
         changingDirection = false;
    }
}

function randomPosition() {
    return Math.floor(Math.random() * tileCount);
}

function placeFood() {
    food.x = randomPosition();
    food.y = randomPosition();
    // Ensure food doesn't spawn on the snake
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) {
            placeFood(); // Recursively try again
        }
    });
}

function drawFood() {
    ctx.fillStyle = '#FF4500'; // Food color
    ctx.strokeStyle = '#cc3700'; // Food border
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function hasGameEnded() {
    // Check wall collision
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= tileCount;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= tileCount;

    if (hitLeftWall || hitRightWall || hitTopWall || hitBottomWall) {
        return true;
    }

    // Check self collision
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }

    return false;
}

function endGame() {
    gameRunning = false; // endGame is the correct place to set gameRunning to false
    clearTimeout(gameLoopTimeout);
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex';
}

// --- Event Listeners ---
document.addEventListener('keydown', changeDirection);
restartButton.addEventListener('click', () => {
    resetGame(); // Reset first
    startGame(); // Then start
});
startButton.addEventListener('click', startGame);

// --- Initial Setup ---
resetGame(); // Prepare the game board initially
clearCanvas(); // Draw initial empty canvas with grid
drawFood();    // Draw initial food
drawSnake();   // Draw initial snake
// Show start screen by default (handled in HTML/CSS)

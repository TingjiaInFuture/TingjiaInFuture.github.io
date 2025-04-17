const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timer');
const player1HealthBar = document.getElementById('player1-health');
const player2HealthBar = document.getElementById('player2-health');
const messageOverlay = document.getElementById('message-overlay');
const messageContent = document.getElementById('message-content');
const gameOverOverlay = document.getElementById('game-over-overlay');
const winnerMessage = document.getElementById('winner-message');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// --- Canvas Setup ---
canvas.width = 1024;
canvas.height = 576;

ctx.fillRect(0, 0, canvas.width, canvas.height);

// --- Game Constants ---
const gravity = 0.7;
const groundLevel = canvas.height - 96; // Adjust based on background/floor
const moveSpeed = 5;
const jumpPower = -20;
const attackDamage = 10;
const gameTime = 60;

// --- Player Class ---
class Sprite {
    constructor({ position, color = 'red', velocity = { x: 0, y: 0 }, offset = { x: 0, y: 0 } }) {
        this.position = position;
        this.width = 50;
        this.height = 150;
        this.velocity = velocity;
        this.color = color;
        this.health = 100;
        this.lastKeyPressed = '';
        this.attackBox = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            offset, // Use the provided offset
            width: 100,
            height: 50
        };
        this.isAttacking = false;
        this.attackCooldown = 500; // milliseconds
        this.lastAttackTime = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw attack box only when attacking (for debugging)
        // if (this.isAttacking) {
        //     ctx.fillStyle = 'rgba(0, 255, 0, 0.5)'; // Green transparent
        //     ctx.fillRect(
        //         this.attackBox.position.x,
        //         this.attackBox.position.y,
        //         this.attackBox.width,
        //         this.attackBox.height
        //     );
        // }
    }

    update() {
        this.draw();

        // Update attack box position based on player position and offset
        this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

        // Apply horizontal movement
        this.position.x += this.velocity.x;

        // Apply gravity and vertical movement
        this.position.y += this.velocity.y;

        // Ground collision
        if (this.position.y + this.height + this.velocity.y >= groundLevel) {
            this.velocity.y = 0;
            this.position.y = groundLevel - this.height; // Snap to ground
        } else {
            this.velocity.y += gravity;
        }

        // Screen boundary collision (horizontal)
        if (this.position.x < 0) {
            this.position.x = 0;
        }
        if (this.position.x + this.width > canvas.width) {
            this.position.x = canvas.width - this.width;
        }
    }

    attack() {
        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackCooldown) {
            this.isAttacking = true;
            this.lastAttackTime = now;
            // Reset attack state after a short duration
            setTimeout(() => {
                this.isAttacking = false;
            }, 100); // Attack duration
        }
    }

    takeHit(damage) {
        this.health -= damage;
        if (this.health < 0) {
            this.health = 0;
        }
        // Update health bar visually (will be done in the main loop)
    }
}

// --- Game State Variables ---
let player1;
let player2;
let timer = gameTime;
let timerId;
let gameOver = false;

// --- Key State ---
const keys = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false }, // Player 1 Jump
    Space: { pressed: false }, // Player 1 Attack
    ArrowLeft: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowUp: { pressed: false }, // Player 2 Jump
    Enter: { pressed: false } // Player 2 Attack
};

// --- Helper Functions ---
function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x < rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.x + rectangle1.attackBox.width > rectangle2.position.x &&
        rectangle1.attackBox.position.y < rectangle2.position.y + rectangle2.height &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height > rectangle2.position.y
    );
}

function determineWinner({ player1, player2, timerId }) {
    clearTimeout(timerId);
    gameOver = true;
    gameOverOverlay.style.display = 'flex';
    if (player1.health === player2.health) {
        winnerMessage.textContent = '平局!';
    } else if (player1.health > player2.health) {
        winnerMessage.textContent = '玩家 1 获胜!';
    } else {
        winnerMessage.textContent = '玩家 2 获胜!';
    }
}

function decreaseTimer() {
    if (timer > 0) {
        timerId = setTimeout(decreaseTimer, 1000);
        timer--;
        timerDisplay.textContent = timer;
    } else {
        determineWinner({ player1, player2, timerId });
    }
}

function resetGame() {
    clearTimeout(timerId);
    gameOver = false;
    timer = gameTime;
    timerDisplay.textContent = timer;
    messageOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';

    player1 = new Sprite({
        position: { x: 100, y: 0 },
        color: 'blue',
        offset: { x: 0, y: 50 } // Attack box offset for player 1
    });

    player2 = new Sprite({
        position: { x: canvas.width - 150, y: 100 },
        color: 'green',
        offset: { x: -50, y: 50 } // Attack box offset for player 2 (facing left)
    });

    // Reset health bars
    player1HealthBar.style.width = '100%';
    player2HealthBar.style.width = '100%';

    decreaseTimer();
    animate(); // Start the animation loop
}

// --- Animation Loop ---
function animate() {
    if (gameOver) return;

    const animationFrameId = window.requestAnimationFrame(animate);

    // Clear canvas with a background color
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update players
    player1.update();
    player2.update();

    // Reset velocities
    player1.velocity.x = 0;
    player2.velocity.x = 0;

    // Player 1 Movement
    if (keys.a.pressed && player1.lastKeyPressed === 'a') {
        player1.velocity.x = -moveSpeed;
    } else if (keys.d.pressed && player1.lastKeyPressed === 'd') {
        player1.velocity.x = moveSpeed;
    }

    // Player 2 Movement
    if (keys.ArrowLeft.pressed && player2.lastKeyPressed === 'ArrowLeft') {
        player2.velocity.x = -moveSpeed;
    } else if (keys.ArrowRight.pressed && player2.lastKeyPressed === 'ArrowRight') {
        player2.velocity.x = moveSpeed;
    }

    // Collision Detection (Attack Hits)
    // Player 1 attacks Player 2
    if (
        rectangularCollision({ rectangle1: player1, rectangle2: player2 }) &&
        player1.isAttacking
    ) {
        player1.isAttacking = false; // Prevent multiple hits per attack
        player2.takeHit(attackDamage);
        player2HealthBar.style.width = player2.health + '%';
        console.log('Player 1 hit Player 2. P2 Health:', player2.health);
    }

    // Player 2 attacks Player 1
    if (
        rectangularCollision({ rectangle1: player2, rectangle2: player1 }) &&
        player2.isAttacking
    ) {
        player2.isAttacking = false; // Prevent multiple hits per attack
        player1.takeHit(attackDamage);
        player1HealthBar.style.width = player1.health + '%';
        console.log('Player 2 hit Player 1. P1 Health:', player1.health);
    }

    // Check for game over by health
    if (player1.health <= 0 || player2.health <= 0) {
        determineWinner({ player1, player2, timerId });
        window.cancelAnimationFrame(animationFrameId); // Stop the loop
    }
}

// --- Event Listeners ---
window.addEventListener('keydown', (event) => {
    if (gameOver) return;

    switch (event.key) {
        // Player 1
        case 'd':
            keys.d.pressed = true;
            player1.lastKeyPressed = 'd';
            break;
        case 'a':
            keys.a.pressed = true;
            player1.lastKeyPressed = 'a';
            break;
        case 'w':
            // Only jump if on the ground (or close to it)
            if (player1.position.y + player1.height >= groundLevel - 1) {
                 player1.velocity.y = jumpPower;
            }
            break;
        case ' ':
            keys.Space.pressed = true;
            player1.attack();
            break;

        // Player 2
        case 'ArrowRight':
            keys.ArrowRight.pressed = true;
            player2.lastKeyPressed = 'ArrowRight';
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true;
            player2.lastKeyPressed = 'ArrowLeft';
            break;
        case 'ArrowUp':
             // Only jump if on the ground (or close to it)
            if (player2.position.y + player2.height >= groundLevel - 1) {
                player2.velocity.y = jumpPower;
            }
            break;
        case 'Enter':
            keys.Enter.pressed = true;
            player2.attack();
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        // Player 1
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
         case ' ':
            keys.Space.pressed = false;
            break;

        // Player 2
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
        case 'Enter':
            keys.Enter.pressed = false;
            break;
    }
});

// Start/Restart Button Listeners
startButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);

// Initial message display (no game running yet)
// resetGame() will be called when the start button is clicked.

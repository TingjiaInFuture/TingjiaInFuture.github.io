// 获取Canvas和相关元素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.querySelector('.score');
const scoreEndDisplay = document.querySelector('.score-display');
const startScreen = document.querySelector('.start-screen');
const gameOverScreen = document.querySelector('.game-over-screen');
const restartButton = document.querySelector('.restart-button');

// 新增音效和最高分读取
const soundJump = new Audio('jump.wav');
const soundScore = new Audio('score.wav');
const soundHit = new Audio('hit.wav');
let highScore = localStorage.getItem('flappyHighScore') ? parseInt(localStorage.getItem('flappyHighScore')) : 0;

// 确保音效文件已加载或报告错误
[soundJump, soundScore, soundHit].forEach(sound => {
    sound.addEventListener('canplaythrough', () => console.log(sound.src + ' 加载成功'));
    sound.addEventListener('error', () => console.error(sound.src + ' 加载失败，请检查文件是否存在于 flappybird 目录')); 
});

// 静音状态读取
let isMuted = localStorage.getItem('flappyMuted') === 'true';

// 背景音乐
const backgroundMusic = new Audio('bg.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
backgroundMusic.muted = isMuted;
backgroundMusic.addEventListener('canplaythrough', () => console.log('背景音乐加载成功'));
backgroundMusic.addEventListener('error', () => console.error('背景音乐加载失败，请检查 bg.mp3 文件'));

// 设置Canvas尺寸
canvas.width = 320;
canvas.height = 480;

// 获取最高分元素并初始化显示
const highScoreDisplay = document.querySelector('.high-score-display');
highScoreDisplay.textContent = highScore;

// 游戏变量
let game = {
    isRunning: false,
    speed: 2, // Default speed
    gravity: 0.5,
    score: 0,
    frames: 0,
    isPaused: false
};
let animationId;

// 静音状态读取
[soundJump, soundScore, soundHit].forEach(s => s.muted = isMuted);

// 鸟对象
const bird = {
    x: 50,
    y: canvas.height / 3, // <-- Changed initial height
    width: 34,
    height: 24,
    velocity: 0,
    jumpStrength: -8,
    
    // 鸟的颜色
    color: '#FFD700',
    
    // 绘制鸟
    draw: function() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 画眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 画嘴巴
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y);
        ctx.lineTo(this.x + 22, this.y);
        ctx.lineTo(this.x + 12, this.y + 4);
        ctx.fill();
        
        // 画翅膀
        ctx.fillStyle = '#FF9900';
        ctx.beginPath();
        ctx.ellipse(this.x - 5, this.y + 5, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // 更新鸟的位置
    update: function() {
        this.velocity += game.gravity;
        this.y += this.velocity;
        
        // 防止小鸟飞出屏幕上方
        if (this.y < 0 + this.height / 2) {
            this.y = 0 + this.height / 2;
            this.velocity = 0;
        }
        
        // 检测是否碰到地面
        if (this.y > canvas.height - 80) {
            gameOver();
        }
    },
    
    // 跳跃
    jump: function() {
        soundJump.play();
        this.velocity = this.jumpStrength;
    },
    
    // 重置鸟
    reset: function() {
        this.y = canvas.height / 3; // <-- Changed reset height
        this.velocity = 0;
    }
};

// 管道对象数组
let pipes = [];

// 管道构造函数
class Pipe {
    constructor() {
        this.top = Math.random() * (canvas.height - 250) + 50;
        this.bottom = this.top + 150; // 上下管道之间的间隙
        this.x = canvas.width;
        this.width = 50;
        this.scored = false;
        this.color = '#3CB371';
    }
    
    // 绘制管道
    draw() {
        // 绘制上方管道
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, 0, this.width, this.top);
        
        // 绘制下方管道
        ctx.fillRect(this.x, this.bottom, this.width, canvas.height - this.bottom);
        
        // 绘制管道顶部边缘
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(this.x - 3, this.top - 10, this.width + 6, 10);
        ctx.fillRect(this.x - 3, this.bottom, this.width + 6, 10);
    }
    
    // 更新管道位置
    update() {
        this.x -= game.speed;
        
        // 检测碰撞
        if (
            bird.x + 15 > this.x && 
            bird.x - 15 < this.x + this.width && 
            (bird.y - 15 < this.top || bird.y + 15 > this.bottom)
        ) {
            gameOver();
        }
        
        // 计分
        if (!this.scored && this.x + this.width < bird.x) {
            game.score++;
            soundScore.play();
            scoreDisplay.textContent = game.score;
            this.scored = true;
        }
    }
}

// 背景元素
const background = {
    // 绘制天空和地面
    draw: function() {
        // 天空和地面
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 动态云朵
        const cloudSpeed = 0.2;
        const offset = (game.frames * cloudSpeed) % (canvas.width + 150);
        ctx.save();
        ctx.translate(-offset, 0);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(50, 70, 25, 0, Math.PI * 2);
        ctx.arc(80, 60, 30, 0, Math.PI * 2);
        ctx.arc(110, 75, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(250, 40, 25, 0, Math.PI * 2);
        ctx.arc(280, 30, 30, 0, Math.PI * 2);
        ctx.arc(310, 45, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 地面
        ctx.fillStyle = '#dea673';
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
        // 草地
        ctx.fillStyle = '#5e7e32';
        ctx.fillRect(0, canvas.height - 80, canvas.width, 15);
    }
};

// 获取控制按钮
const pauseBtn = document.getElementById('pause-btn');
const muteBtn = document.getElementById('mute-btn');
// 初始化控制按钮文本
muteBtn.textContent = isMuted ? '🔇' : '🔈';

// 暂停/继续
pauseBtn.addEventListener('click', () => {
    if (!game.isRunning) return;
    if (!game.isPaused) {
        game.isPaused = true;
        pauseBtn.textContent = '继续';
        cancelAnimationFrame(animationId);
        backgroundMusic.pause();
    } else {
        game.isPaused = false;
        pauseBtn.textContent = '暂停';
        animationId = requestAnimationFrame(gameLoop);
        backgroundMusic.play();
    }
});

// 静音切换
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    [soundJump, soundScore, soundHit].forEach(s => s.muted = isMuted);
    muteBtn.textContent = isMuted ? '🔇' : '🔈';
    localStorage.setItem('flappyMuted', isMuted);
    backgroundMusic.muted = isMuted;
});

// 开始游戏
function startGame(selectedSpeed) {
    // Set game speed based on selection
    game.speed = selectedSpeed || 2; // Default to medium if not provided

    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    game.isRunning = true;
    game.score = 0;
    game.frames = 0; // 重置帧
    scoreDisplay.textContent = '0';
    bird.reset();
    pipes = [];
    backgroundMusic.play();
    requestAnimationFrame(gameLoop);
}

// 游戏结束
function gameOver() {
    game.isRunning = false;
    backgroundMusic.pause();
    soundHit.play();
    scoreEndDisplay.textContent = game.score;
    // 更新最高分
    if (game.score > highScore) {
        highScore = game.score;
        localStorage.setItem('flappyHighScore', highScore);
    }
    highScoreDisplay.textContent = highScore;
    gameOverScreen.style.display = 'flex';
}

// 重新开始游戏
function restartGame(speedToUse) {
    gameOverScreen.style.display = 'none';
    startGame(speedToUse); // Pass the speed to use
}

// 游戏主循环
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    background.draw();
    
    // 更新和绘制管道
    pipes.forEach((pipe, index) => {
        pipe.update();
        pipe.draw();
        
        // 移除超出屏幕的管道
        if (pipe.x + pipe.width < 0) {
            pipes.splice(index, 1);
        }
    });
    
    // 每120帧添加一个新的管道
    if (game.frames % 120 === 0) {
        pipes.push(new Pipe());
    }
    
    // 更新和绘制鸟
    bird.update();
    bird.draw();
    
    // 增加帧数
    game.frames++;
    
    // 如果游戏正在运行，继续循环
    if (game.isRunning && !game.isPaused) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// 事件监听
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (!game.isRunning && gameOverScreen.style.display !== 'flex' && startScreen.style.display !== 'none') {
            // 开始游戏（默认速度）
            startGame(game.speed);
        } else if (game.isRunning) {
            bird.jump();
        }
    }
});

canvas.addEventListener('click', function() {
    if (game.isRunning) {
        bird.jump();
    } else if (gameOverScreen.style.display !== 'flex' && startScreen.style.display !== 'none') {
        // 点击屏幕开始游戏（默认速度）
        startGame(game.speed);
    }
});

// 支持移动端触控
document.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (game.isRunning) {
        bird.jump();
    } else if (gameOverScreen.style.display !== 'flex' && startScreen.style.display !== 'none') {
        // 触控开始游戏（默认速度）
        startGame(game.speed);
    }
});

// Event Listeners for speed selection buttons (will be added to HTML)
document.getElementById('speed-slow').addEventListener('click', () => startGame(1.5));
document.getElementById('speed-medium').addEventListener('click', () => startGame(2));
document.getElementById('speed-fast').addEventListener('click', () => startGame(3));

// Remove the generic startScreen click listener as buttons now handle start
// startScreen.addEventListener('click', startGame); // Removed this line

restartButton.addEventListener('click', () => {
    // Restart with the current speed setting
    restartGame(game.speed);
});

// 初始化
background.draw();
bird.draw();
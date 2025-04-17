// 获取Canvas和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

console.log('森林冰火人 游戏脚本已加载');

// UI元素
const screens = {
    start: document.getElementById('start-screen'),
    levelSelect: document.getElementById('level-select-screen'),
    game: document.getElementById('game-screen'),
    pause: document.getElementById('pause-screen'),
    levelComplete: document.getElementById('level-complete-screen'),
    gameOver: document.getElementById('game-over-screen')
};

const ui = {
    levelNumber: document.getElementById('level-number'),
    gemsCollected: document.getElementById('gems-collected'),
    totalGems: document.getElementById('total-gems'),
    levelGemsCollected: document.getElementById('level-gems-collected'),
    levelTotalGems: document.getElementById('level-total-gems'),
    levelGrid: document.getElementById('level-grid'),
    gameOverMessage: document.getElementById('game-over-message')
};

// 按钮
const buttons = {
    start: document.getElementById('start-button'),
    levelSelect: document.getElementById('level-select-button'),
    back: document.getElementById('back-button'),
    pause: document.getElementById('pause-button'),
    resume: document.getElementById('resume-button'),
    restartLevel: document.getElementById('restart-level-button'),
    exitToMenu: document.getElementById('exit-to-menu-button'),
    nextLevel: document.getElementById('next-level-button'),
    replayLevel: document.getElementById('replay-level-button'),
    menu: document.getElementById('menu-button'),
    retry: document.getElementById('retry-button'),
    gameOverMenu: document.getElementById('game-over-menu-button')
};

// --- 游戏常量 ---
const GRAVITY = 0.5;
const MOVE_SPEED = 5;
const JUMP_POWER = -10;
const GROUND_FRICTION = 0.8; // 模拟地面摩擦力
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const TILE_SIZE = 40;

// --- 游戏状态 ---
let keys = {}; // 存储按键状态
const gameState = {
    currentScreen: 'start',
    currentLevel: 1,
    maxUnlockedLevel: 1,
    isPaused: false,
    platforms: [],
    pools: [],
    gems: [],
    doors: [],
    gemsCollected: 0,
    totalGems: 0,
    animationFrame: null,
    levelCompleted: {
        fire: false,
        water: false
    }
};

// 定义关卡
const levels = [
    // 关卡 1
    {
        name: "简单入门",
        platforms: [
            // 地面
            { x: 0, y: 560, width: 800, height: 40, type: 'normal' },
            // 左侧平台
            { x: 100, y: 480, width: 200, height: 40, type: 'normal' },
            // 中间平台
            { x: 350, y: 400, width: 100, height: 40, type: 'normal' },
            // 右侧平台
            { x: 500, y: 480, width: 200, height: 40, type: 'normal' },
        ],
        pools: [
            // 水池
            { x: 300, y: 540, width: 80, height: 20, type: 'water' },
            // 火池
            { x: 420, y: 540, width: 80, height: 20, type: 'fire' },
        ],
        gems: [
            // 红宝石 (火娃收集)
            { x: 150, y: 450, type: 'fire' },
            // 蓝宝石 (水娃收集)
            { x: 550, y: 450, type: 'water' },
        ],
        doors: [
            // 火门 (火娃终点)
            { x: 700, y: 480, type: 'fire' },
            // 水门 (水娃终点)
            { x: 750, y: 480, type: 'water' },
        ],
        // 玩家起始位置
        firePlayer: { x: 50, y: 520 },
        waterPlayer: { x: 100, y: 520 }
    },
    // 关卡 2
    {
        name: "双重跳跃",
        platforms: [
            // 地面
            { x: 0, y: 560, width: 800, height: 40, type: 'normal' },
            // 左侧平台
            { x: 100, y: 480, width: 100, height: 40, type: 'normal' },
            // 中间平台1
            { x: 250, y: 430, width: 100, height: 40, type: 'normal' },
            // 中间平台2
            { x: 400, y: 380, width: 100, height: 40, type: 'normal' },
            // 中间平台3
            { x: 550, y: 330, width: 100, height: 40, type: 'normal' },
            // 上层平台
            { x: 300, y: 280, width: 200, height: 40, type: 'normal' },
        ],
        pools: [
            // 水池
            { x: 200, y: 540, width: 150, height: 20, type: 'water' },
            // 火池
            { x: 450, y: 540, width: 150, height: 20, type: 'fire' },
        ],
        gems: [
            // 红宝石 (火娃收集)
            { x: 600, y: 300, type: 'fire' },
            { x: 300, y: 400, type: 'fire' },
            // 蓝宝石 (水娃收集)
            { x: 400, y: 250, type: 'water' },
            { x: 550, y: 300, type: 'water' },
        ],
        doors: [
            // 火门 (火娃终点)
            { x: 350, y: 240, type: 'fire' },
            // 水门 (水娃终点)
            { x: 450, y: 240, type: 'water' },
        ],
        // 玩家起始位置
        firePlayer: { x: 50, y: 520 },
        waterPlayer: { x: 100, y: 520 }
    },
    // 关卡 3
    {
        name: "协作挑战",
        platforms: [
            // 地面
            { x: 0, y: 560, width: 800, height: 40, type: 'normal' },
            // 左侧平台
            { x: 50, y: 480, width: 100, height: 20, type: 'normal' },
            // 中间低平台
            { x: 200, y: 520, width: 140, height: 20, type: 'normal' },
            // 中间高平台
            { x: 200, y: 380, width: 140, height: 20, type: 'normal' },
            // 右侧平台
            { x: 400, y: 450, width: 140, height: 20, type: 'normal' },
            // 右上平台
            { x: 600, y: 380, width: 140, height: 20, type: 'normal' },
            // 最上层平台
            { x: 350, y: 280, width: 100, height: 20, type: 'normal' },
        ],
        pools: [
            // 水池左
            { x: 150, y: 540, width: 50, height: 20, type: 'water' },
            // 水池右
            { x: 340, y: 540, width: 60, height: 20, type: 'water' },
            // 火池左
            { x: 400, y: 540, width: 60, height: 20, type: 'fire' },
            // 火池右
            { x: 540, y: 540, width: 60, height: 20, type: 'fire' },
            // 中间水池
            { x: 270, y: 500, width: 70, height: 20, type: 'water' },
            // 中间火池
            { x: 200, y: 500, width: 70, height: 20, type: 'fire' },
        ],
        gems: [
            // 红宝石 (火娃收集)
            { x: 400, y: 420, type: 'fire' },
            { x: 600, y: 350, type: 'fire' },
            { x: 380, y: 250, type: 'fire' },
            // 蓝宝石 (水娃收集)
            { x: 200, y: 350, type: 'water' },
            { x: 400, y: 420, type: 'water' },
            { x: 350, y: 250, type: 'water' },
        ],
        doors: [
            // 火门 (火娃终点)
            { x: 700, y: 520, type: 'fire' },
            // 水门 (水娃终点)
            { x: 750, y: 520, type: 'water' },
        ],
        // 玩家起始位置
        firePlayer: { x: 50, y: 520 },
        waterPlayer: { x: 80, y: 520 }
    }
];

// --- 玩家对象 ---
class Player {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'fire' 或 'water'
        this.velocityX = 0;
        this.velocityY = 0;
        this.isOnGround = false;
        this.isDead = false;
        this.reachedDoor = false;
        
        // 根据类型设置控制键和颜色
        if (type === 'fire') {
            this.color = 'red';
            this.controls = {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                up: 'ArrowUp'
            };
        } else {
            this.color = 'blue';
            this.controls = {
                left: 'KeyA',
                right: 'KeyD',
                up: 'KeyW'
            };
        }
    }

    applyGravity() {
        this.velocityY += GRAVITY;
    }

    handleInput() {
        if (this.isDead || this.reachedDoor) return;
        
        // 水平移动
        if (keys[this.controls.left]) {
            this.velocityX = -MOVE_SPEED;
        } else if (keys[this.controls.right]) {
            this.velocityX = MOVE_SPEED;
        } else {
            this.velocityX *= GROUND_FRICTION;
            if (Math.abs(this.velocityX) < 0.1) {
                this.velocityX = 0;
            }
        }

        // 跳跃
        if (keys[this.controls.up] && this.isOnGround) {
            this.velocityY = JUMP_POWER;
            this.isOnGround = false;
        }
    }

    updatePosition() {
        if (this.isDead || this.reachedDoor) return; // 如果死亡或到达终点，则不更新位置
        
        // 更新位置
        this.x += this.velocityX;
        this.y += this.velocityY;

        // 边界检测
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0; // 碰到左边界停止
        }
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
            this.velocityX = 0; // 碰到右边界停止
        }
        if (this.y < 0) { // 碰到顶部
            this.y = 0;
            this.velocityY = 0;
        }
        
        // 重置接地状态，将在碰撞检测中重新设置
        this.isOnGround = false;
        
        // 平台碰撞检测
        this.checkPlatformCollisions();
        
        // 特殊元素碰撞检测
        this.checkPoolCollisions();
        this.checkGemCollisions();
        this.checkDoorCollisions();
    }
    
    // 平台碰撞检测
    checkPlatformCollisions() {
        let onAnyPlatform = false; // 标记是否在任何平台上

        // 先处理垂直碰撞
        for (const platform of gameState.platforms) {
            const horizontalOverlap = this.x + this.width > platform.x && this.x < platform.x + platform.width;

            if (horizontalOverlap) {
                const previousBottom = this.y + this.height - this.velocityY;
                // 从上方落到平台上
                if (this.velocityY >= 0 && previousBottom <= platform.y && this.y + this.height >= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    onAnyPlatform = true;
                    break; // 找到一个支撑平台即可退出循环
                }
                // 从下方碰到平台
                const previousTop = this.y - this.velocityY;
                if (this.velocityY < 0 && previousTop >= platform.y + platform.height && this.y <= platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                    // 不设置 onAnyPlatform，因为是撞头
                }
            }
        }

        // 再处理水平碰撞 (基于调整后的 Y 坐标)
        for (const platform of gameState.platforms) {
             // 检查垂直重叠 (玩家的垂直范围与平台有交集)
            const verticalOverlap = this.y + this.height > platform.y && this.y < platform.y + platform.height;

            if (verticalOverlap) {
                const previousRight = this.x + this.width - this.velocityX;
                const previousLeft = this.x - this.velocityX;

                // 从左侧撞向平台
                if (this.velocityX > 0 && previousRight <= platform.x && this.x + this.width >= platform.x) {
                    this.x = platform.x - this.width;
                    this.velocityX = 0;
                }
                // 从右侧撞向平台
                else if (this.velocityX < 0 && previousLeft >= platform.x + platform.width && this.x <= platform.x + platform.width) {
                    this.x = platform.x + platform.width;
                    this.velocityX = 0;
                }
            }
        }

        // 更新 isOnGround 状态
        this.isOnGround = onAnyPlatform;

        // 检查是否触底 (地面)
        if (!onAnyPlatform && this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
            this.isOnGround = true;
        }
    }
    
    // 池子碰撞检测
    checkPoolCollisions() {
        for (const pool of gameState.pools) {
            if (this.x + this.width > pool.x && 
                this.x < pool.x + pool.width && 
                this.y + this.height > pool.y && 
                this.y < pool.y + pool.height) {
                
                // 火娃碰到水池或水娃碰到火池时死亡
                if ((this.type === 'fire' && pool.type === 'water') || 
                    (this.type === 'water' && pool.type === 'fire')) {
                    this.die();
                }
            }
        }
    }
    
    // 宝石碰撞检测
    checkGemCollisions() {
        for (let i = 0; i < gameState.gems.length; i++) {
            const gem = gameState.gems[i];
            
            // 检查碰撞和是否是对应类型的宝石
            if (!gem.collected && this.type === gem.type && 
                this.x + this.width > gem.x - 15 && 
                this.x < gem.x + 15 && 
                this.y + this.height > gem.y - 15 && 
                this.y < gem.y + 15) {
                
                gem.collected = true;
                gameState.gemsCollected++;
                updateHUD();
            }
        }
    }
    
    // 门碰撞检测
    checkDoorCollisions() {
        for (const door of gameState.doors) {
            if (this.type === door.type && 
                this.x + this.width > door.x - 20 && 
                this.x < door.x + 20 && 
                this.y + this.height > door.y - 30 && 
                this.y < door.y + 30) {
                
                // 玩家到达对应的门
                this.reachedDoor = true;
                gameState.levelCompleted[this.type] = true;
                
                // 检查是否所有条件都满足
                checkLevelCompletion();
            }
        }
    }
    
    // 死亡
    die() {
        this.isDead = true;
        
        // 显示游戏结束屏幕
        setTimeout(() => {
            if (gameState.players[0].isDead && gameState.players[1].isDead) {
                ui.gameOverMessage.textContent = "两位玩家都不幸牺牲了!";
            } else if (this.type === 'fire') {
                ui.gameOverMessage.textContent = "火娃不幸牺牲了!";
            } else {
                ui.gameOverMessage.textContent = "水娃不幸牺牲了!";
            }
            showScreen('gameOver');
        }, 1000);
    }
    
    draw() {
        if (this.isDead) return;
        
        ctx.save();
        
        // 玩家身体
        if (this.type === 'fire') {
            // 火娃 - 红色渐变
            const gradient = ctx.createRadialGradient(
                this.x + this.width/2, this.y + this.height/2, 5,
                this.x + this.width/2, this.y + this.height/2, 25
            );
            gradient.addColorStop(0, '#ffcc00');
            gradient.addColorStop(1, '#ff4d4d');
            ctx.fillStyle = gradient;
        } else {
            // 水娃 - 蓝色渐变
            const gradient = ctx.createRadialGradient(
                this.x + this.width/2, this.y + this.height/2, 5,
                this.x + this.width/2, this.y + this.height/2, 25
            );
            gradient.addColorStop(0, '#99ccff');
            gradient.addColorStop(1, '#3366ff');
            ctx.fillStyle = gradient;
        }
        
        // 绘制身体 (圆角矩形)
        const radius = 10;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        ctx.fill();
        
        // 绘制眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 + 5, this.y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 + 5, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 如果到达门，添加一个光环效果
        if (this.reachedDoor) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
            ctx.strokeStyle = this.type === 'fire' ? '#ff8c00' : '#00bfff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        ctx.restore();
    }
}

// --- 辅助函数 ---
// 游戏初始化
function init() {
    // 事件监听器
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // 按钮监听器
    buttons.start.addEventListener('click', () => {
        gameState.currentLevel = 1;
        loadLevel(gameState.currentLevel);
        showScreen('game');
    });
    
    buttons.levelSelect.addEventListener('click', () => {
        populateLevelSelect();
        showScreen('levelSelect');
    });
    
    buttons.back.addEventListener('click', () => {
        showScreen('start');
    });
    
    buttons.pause.addEventListener('click', () => {
        pauseGame();
    });
    
    buttons.resume.addEventListener('click', () => {
        resumeGame();
    });
    
    buttons.restartLevel.addEventListener('click', () => {
        loadLevel(gameState.currentLevel);
        showScreen('game');
    });
    
    buttons.exitToMenu.addEventListener('click', () => {
        cancelAnimationFrame(gameState.animationFrame);
        showScreen('start');
    });
    
    buttons.nextLevel.addEventListener('click', () => {
        if (gameState.currentLevel < levels.length) {
            gameState.currentLevel++;
            loadLevel(gameState.currentLevel);
            showScreen('game');
        } else {
            // 已经是最后一关
            showScreen('start');
        }
    });
    
    buttons.replayLevel.addEventListener('click', () => {
        loadLevel(gameState.currentLevel);
        showScreen('game');
    });
    
    buttons.menu.addEventListener('click', () => {
        showScreen('start');
    });
    
    buttons.retry.addEventListener('click', () => {
        loadLevel(gameState.currentLevel);
        showScreen('game');
    });
    
    buttons.gameOverMenu.addEventListener('click', () => {
        showScreen('start');
    });
    
    // 移动端触控按钮
    const fireLeftBtn = document.querySelector('.fire-left');
    const fireRightBtn = document.querySelector('.fire-right');
    const fireJumpBtn = document.querySelector('.fire-jump');
    const waterLeftBtn = document.querySelector('.water-left');
    const waterRightBtn = document.querySelector('.water-right');
    const waterJumpBtn = document.querySelector('.water-jump');

    const mapTouch = (btn, key) => {
        btn.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
        btn.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; });
    };
    mapTouch(fireLeftBtn, 'ArrowLeft');
    mapTouch(fireRightBtn, 'ArrowRight');
    mapTouch(fireJumpBtn, 'ArrowUp');
    mapTouch(waterLeftBtn, 'KeyA');
    mapTouch(waterRightBtn, 'KeyD');
    mapTouch(waterJumpBtn, 'KeyW');

    // 创建关卡选择按钮
    populateLevelSelect();
    
    // 显示开始屏幕
    showScreen('start');
}

// 填充关卡选择菜单
function populateLevelSelect() {
    ui.levelGrid.innerHTML = '';
    
    for (let i = 0; i < levels.length; i++) {
        const levelButton = document.createElement('button');
        levelButton.className = 'level-button';
        levelButton.textContent = (i + 1);
        
        if (i + 1 <= gameState.maxUnlockedLevel) {
            levelButton.addEventListener('click', () => {
                gameState.currentLevel = i + 1;
                loadLevel(gameState.currentLevel);
                showScreen('game');
            });
        } else {
            levelButton.classList.add('locked');
            levelButton.title = '尚未解锁';
        }
        
        ui.levelGrid.appendChild(levelButton);
    }
}

// 切换显示的屏幕
function showScreen(screenName) {
    // 隐藏所有屏幕
    for (const screen in screens) {
        screens[screen].style.display = 'none';
    }
    
    // 显示指定屏幕
    screens[screenName].style.display = 'flex';
    gameState.currentScreen = screenName;
    
    // 如果进入游戏屏幕，恢复游戏循环
    if (screenName === 'game' && !gameState.isPaused) {
        gameLoop();
    }
}

// 加载关卡
function loadLevel(levelIndex) {
    // 取消任何现有的动画帧
    if (gameState.animationFrame) {
        cancelAnimationFrame(gameState.animationFrame);
    }
    
    // 重置游戏状态
    gameState.isPaused = false;
    gameState.platforms = [];
    gameState.pools = [];
    gameState.gems = [];
    gameState.doors = [];
    gameState.gemsCollected = 0;
    gameState.levelCompleted = { fire: false, water: false };
    
    const level = levels[levelIndex - 1];
    
    // 更新UI
    ui.levelNumber.textContent = levelIndex;
    
    // 加载平台
    for (const platform of level.platforms) {
        gameState.platforms.push({
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: platform.height,
            type: platform.type
        });
    }
    
    // 加载池子
    for (const pool of level.pools) {
        gameState.pools.push({
            x: pool.x,
            y: pool.y,
            width: pool.width,
            height: pool.height,
            type: pool.type
        });
    }
    
    // 加载宝石
    for (const gem of level.gems) {
        gameState.gems.push({
            x: gem.x,
            y: gem.y,
            type: gem.type,
            collected: false
        });
    }
    
    // 加载门
    for (const door of level.doors) {
        gameState.doors.push({
            x: door.x,
            y: door.y,
            type: door.type
        });
    }
    
    // 创建玩家
    gameState.players = [
        new Player(level.firePlayer.x, level.firePlayer.y, PLAYER_WIDTH, PLAYER_HEIGHT, 'fire'),
        new Player(level.waterPlayer.x, level.waterPlayer.y, PLAYER_WIDTH, PLAYER_HEIGHT, 'water')
    ];
    
    // 更新宝石计数器
    gameState.totalGems = gameState.gems.length;
    updateHUD();
    console.log(`Level ${levelIndex} loaded: ${gameState.platforms.length} platforms, ${gameState.gems.length} gems, ${gameState.doors.length} doors.`); // 添加日志
}

// 暂停游戏
function pauseGame() {
    gameState.isPaused = true;
    cancelAnimationFrame(gameState.animationFrame);
    showScreen('pause');
}

// 恢复游戏
function resumeGame() {
    gameState.isPaused = false;
    showScreen('game');
    gameLoop();
}

// 更新HUD
function updateHUD() {
    ui.gemsCollected.textContent = gameState.gemsCollected;
    ui.totalGems.textContent = gameState.totalGems;
}

// 检查关卡是否完成
function checkLevelCompletion() {
    // 检查两个角色是否都到达了终点
    if (gameState.levelCompleted.fire && gameState.levelCompleted.water) {
        // 延迟显示完成屏幕，让玩家看到两个角色都到达了终点
        setTimeout(() => {
            ui.levelGemsCollected.textContent = gameState.gemsCollected;
            ui.levelTotalGems.textContent = gameState.totalGems;
            
            // 解锁下一关
            if (gameState.currentLevel >= gameState.maxUnlockedLevel && 
                gameState.currentLevel < levels.length) {
                gameState.maxUnlockedLevel = gameState.currentLevel + 1;
            }
            
            // 显示完成屏幕
            showScreen('levelComplete');
        }, 1000);
    }
}

// 游戏循环
function gameLoop() {
    if (gameState.isPaused || gameState.currentScreen !== 'game') { // 确保只在游戏界面运行
         if (gameState.animationFrame) {
             cancelAnimationFrame(gameState.animationFrame);
             gameState.animationFrame = null;
         }
         return;
    }
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    drawBackground();
    
    // 更新和绘制游戏对象
    updateAndDrawGameObjects(); // 确保调用
    
    // 继续游戏循环
    gameState.animationFrame = requestAnimationFrame(gameLoop);
}

// 绘制背景
function drawBackground() {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a3a');
    gradient.addColorStop(1, '#2a2a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制装饰性元素，如星星
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
        const x = Math.sin(i * 0.1 + Date.now() * 0.001) * canvas.width/2 + canvas.width/2;
        const y = Math.cos(i * 0.1 + Date.now() * 0.001) * canvas.height/2 + canvas.height/2;
        const size = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 更新和绘制游戏对象
function updateAndDrawGameObjects() {
    // 更新玩家
    for (const player of gameState.players) {
        player.applyGravity(); // 应用重力
        player.handleInput(); // 处理输入
        player.updatePosition(); // 更新位置和碰撞
    }

    console.log(`Drawing ${gameState.platforms.length} platforms.`); // 添加日志

    // 绘制平台
    for (const platform of gameState.platforms) {
        drawPlatform(platform);
    }
    
    // 绘制池子
    for (const pool of gameState.pools) {
        drawPool(pool);
    }
    
    // 绘制宝石
    for (const gem of gameState.gems) {
        if (!gem.collected) {
            drawGem(gem);
        }
    }
    
    // 绘制门
    for (const door of gameState.doors) {
        drawDoor(door);
    }
    
    // 绘制玩家 (在其他元素之上)
    for (const player of gameState.players) {
        player.draw();
    }
}

// 绘制平台
function drawPlatform(platform) {
    // console.log(`Drawing platform at x: ${platform.x}, y: ${platform.y}`); // 可选：更详细的日志
    ctx.fillStyle = '#5a5a7a';
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // 平台顶部高光
    ctx.fillStyle = '#6a6a8a';
    ctx.fillRect(platform.x, platform.y, platform.width, 5);
}

// 绘制池子
function drawPool(pool) {
    if (pool.type === 'water') {
        // 水池动画
        ctx.fillStyle = '#3366ff';
        ctx.fillRect(pool.x, pool.y, pool.width, pool.height);
        
        // 波浪效果
        ctx.strokeStyle = '#99ccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = pool.x; x < pool.x + pool.width; x += 10) {
            const offset = Math.sin(x * 0.1 + Date.now() * 0.003) * 3;
            if (x === pool.x) {
                ctx.moveTo(x, pool.y + offset);
            } else {
                ctx.lineTo(x, pool.y + offset);
            }
        }
        
        ctx.stroke();
    } else {
        // 火池动画
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(pool.x, pool.y, pool.width, pool.height);
        
        // 火焰效果
        for (let x = pool.x + 5; x < pool.x + pool.width - 5; x += 10) {
            const height = Math.sin(x * 0.1 + Date.now() * 0.005) * 5 + 8;
            
            const gradient = ctx.createLinearGradient(x, pool.y, x, pool.y - height);
            gradient.addColorStop(0, '#ff4d4d');
            gradient.addColorStop(1, '#ffcc00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(x - 5, pool.y);
            ctx.quadraticCurveTo(x, pool.y - height, x + 5, pool.y);
            ctx.fill();
        }
    }
}

// 绘制宝石
function drawGem(gem) {
    ctx.save();
    ctx.translate(gem.x, gem.y);
    
    // 旋转效果
    const rotation = Date.now() * 0.001;
    ctx.rotate(rotation);
    
    // 根据宝石类型设置颜色
    if (gem.type === 'fire') {
        ctx.fillStyle = '#ff4d4d';
    } else {
        ctx.fillStyle = '#3366ff';
    }
    
    // 绘制宝石 (六边形)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI * 2 / 6 * i;
        const x = Math.cos(angle) * 10;
        const y = Math.sin(angle) * 10;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    
    // 宝石高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// 绘制门
function drawDoor(door) {
    ctx.save();
    
    // 根据门的类型设置颜色
    const baseColor = door.type === 'fire' ? '#ff4d4d' : '#3366ff';
    const glowColor = door.type === 'fire' ? '#ffcc00' : '#99ccff';
    
    // 门的背景光晕
    const glowSize = 30 + Math.sin(Date.now() * 0.003) * 5;
    const gradient = ctx.createRadialGradient(
        door.x, door.y, 0,
        door.x, door.y, glowSize
    );
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(door.x - glowSize, door.y - glowSize, glowSize * 2, glowSize * 2);
    
    // 绘制门
    ctx.fillStyle = baseColor;
    ctx.fillRect(door.x - 15, door.y - 25, 30, 50);
    
    // 门的拱形顶部
    ctx.beginPath();
    ctx.arc(door.x, door.y - 25, 15, Math.PI, 0);
    ctx.fill();
    
    // 门的把手
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(door.x + (door.type === 'fire' ? -5 : 5), door.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// 添加键盘事件监听，让ESC键暂停游戏
document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && gameState.currentScreen === 'game') {
        if (gameState.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

// --- 启动游戏 ---
window.addEventListener('load', () => {
    console.log("游戏启动！火娃使用方向键，水娃使用 A W D。");
    init();
    // 不在这里直接 loadLevel 或 gameLoop，由按钮触发
});

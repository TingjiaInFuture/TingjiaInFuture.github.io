// 游戏状态
const gameState = {
    isRunning: false,
    currentPlayer: 0, // 0是玩家，1-3是电脑
    pot: 0,
    currentBet: 0,
    smallBlind: 5,
    bigBlind: 10,
    round: 0, // 0: 前翻牌, 1: 翻牌, 2: 转牌, 3: 河牌
    deck: [],
    communityCards: [],
    entranceFee: 500, // 新增：入场门槛，最低需要500筹码才能进入游戏
    players: [
        {
            name: "玩家",
            chips: 1000,
            bet: 0,
            cards: [],
            folded: false,
            isAllIn: false
        },
        {
            name: "电脑 1",
            chips: 1000,
            bet: 0,
            cards: [],
            folded: false,
            isAllIn: false
        },
        {
            name: "电脑 2",
            chips: 1000,
            bet: 0,
            cards: [],
            folded: false,
            isAllIn: false
        },
        {
            name: "电脑 3",
            chips: 1000,
            bet: 0,
            cards: [],
            folded: false,
            isAllIn: false
        }
    ]
};

// 扑克牌花色和点数
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suitSymbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
};

// DOM 元素
const startScreen = document.querySelector('.start-screen');
const gameArea = document.querySelector('.game-area');
const resultScreen = document.querySelector('.result-screen');
const startButton = document.querySelector('.start-button');
const restartButton = document.querySelector('.restart-button');
const potAmount = document.querySelector('.pot-amount');
const playerChipsAmount = document.querySelector('.player-chips-amount');
const gameMessage = document.querySelector('.game-message');
const resultMessage = document.querySelector('.result-message');

// 按钮
const foldButton = document.getElementById('fold-button');
const callButton = document.getElementById('call-button');
const raiseButton = document.getElementById('raise-button');
const betSlider = document.querySelector('.bet-slider');
const betAmount = document.querySelector('.bet-amount');

// 游戏初始化
function initGame() {
    // 检查玩家筹码是否满足入场门槛
    if (gameState.players[0].chips < gameState.entranceFee) {
        showEntranceFeeError();
        return;
    }
    
    gameState.isRunning = true;
    gameState.pot = 0;
    gameState.currentBet = 0;
    gameState.round = 0;
    gameState.communityCards = [];
    
    // 重置玩家状态
    gameState.players.forEach(player => {
        player.bet = 0;
        player.cards = [];
        player.folded = false;
        player.isAllIn = false;
    });
    
    // 更新UI
    updateUI();
    
    // 创建新牌组并洗牌
    createDeck();
    
    // 发牌
    dealCards();
    
    // 收取盲注
    collectBlinds();
    
    // 更新底池显示
    updatePotDisplay();
    
    // 开始第一轮下注
    startBettingRound();
}

// 显示入场门槛错误信息
function showEntranceFeeError() {
    resultMessage.textContent = `您的筹码不足${gameState.entranceFee}，无法进入游戏！`;
    resultScreen.style.display = 'flex';
    
    // 更改重新开始按钮文本为获取更多筹码
    const restartBtn = document.querySelector('.restart-button');
    restartBtn.textContent = "获取更多筹码";
    
    // 临时更改重新开始按钮功能为获取筹码
    restartBtn.removeEventListener('click', restartGame);
    restartBtn.addEventListener('click', getMoreChips, { once: true });
}

// 获取更多筹码
function getMoreChips() {
    // 给玩家1000筹码
    gameState.players[0].chips = 1000;
    
    // 恢复重新开始按钮的功能
    const restartBtn = document.querySelector('.restart-button');
    restartBtn.textContent = "再玩一局";
    restartBtn.addEventListener('click', restartGame);
    
    // 隐藏结果屏幕并开始游戏
    resultScreen.style.display = 'none';
    initGame();
}

// 创建牌组并洗牌
function createDeck() {
    gameState.deck = [];
    
    for (const suit of suits) {
        for (const value of values) {
            gameState.deck.push({
                suit: suit,
                value: value
            });
        }
    }
    
    // 洗牌
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

// 发牌
function dealCards() {
    // 每个玩家发两张牌
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < gameState.players.length; j++) {
            gameState.players[j].cards.push(gameState.deck.pop());
        }
    }
    
    // 显示玩家的牌
    displayPlayerCards();
}

// 显示玩家的牌
function displayPlayerCards() {
    const card1 = gameState.players[0].cards[0];
    const card2 = gameState.players[0].cards[1];
    
    document.getElementById('player-card-1').innerHTML = `<div class="card ${card1.suit}">
        ${suitSymbols[card1.suit]}${card1.value}
    </div>`;
    
    document.getElementById('player-card-2').innerHTML = `<div class="card ${card2.suit}">
        ${suitSymbols[card2.suit]}${card2.value}
    </div>`;
}

// 收取盲注
function collectBlinds() {
    // 小盲注
    placeBet(1, gameState.smallBlind);
    
    // 大盲注
    placeBet(2, gameState.bigBlind);
    
    gameState.currentBet = gameState.bigBlind;
}

// 玩家下注
function placeBet(playerIndex, amount) {
    const player = gameState.players[playerIndex];
    
    // 确保玩家有足够的筹码
    const actualBet = Math.min(player.chips, amount);
    
    player.chips -= actualBet;
    player.bet += actualBet;
    gameState.pot += actualBet;
    
    if (player.chips === 0) {
        player.isAllIn = true;
        
        // 如果是玩家全押，显示提示信息
        if (playerIndex === 0) {
            gameMessage.textContent = "你已全押！将自动进行游戏...";
        }
    }
    
    // 更新UI
    updatePlayerDisplay(playerIndex);
}

// 更新玩家显示
function updatePlayerDisplay(playerIndex) {
    if (playerIndex === 0) {
        // 更新玩家筹码显示
        playerChipsAmount.textContent = gameState.players[0].chips;
        document.querySelector('.player .player-bet').textContent = '$' + gameState.players[0].bet;
    } else {
        // 更新电脑玩家显示
        const opponent = document.getElementById(`opponent-${playerIndex}`);
        opponent.querySelector('.player-chips').textContent = '$' + gameState.players[playerIndex].chips;
        opponent.querySelector('.player-bet').textContent = '$' + gameState.players[playerIndex].bet;
    }
}

// 更新底池显示
function updatePotDisplay() {
    potAmount.textContent = gameState.pot;
}

// 开始下注轮
function startBettingRound() {
    // 如果只有一个玩家没有弃牌，则直接进入下一轮
    const activePlayers = gameState.players.filter(player => !player.folded);
    if (activePlayers.length === 1) {
        endHand(activePlayers[0]);
        return;
    }
    
    // 重置当前下注
    gameState.players.forEach(player => {
        player.bet = 0;
    });
    gameState.currentBet = 0;
    
    // 更新UI
    updateUI();
    
    // 判断当前轮次并处理
    if (gameState.round === 0) {
        gameMessage.textContent = "前翻牌圈: 轮到你行动了";
        gameState.currentPlayer = 0;
        enablePlayerControls();
    } else if (gameState.round === 1) {
        // 发翻牌
        dealCommunityCards(3);
        gameMessage.textContent = "翻牌圈: 轮到你行动了";
        gameState.currentPlayer = 0;
        enablePlayerControls();
    } else if (gameState.round === 2) {
        // 发转牌
        dealCommunityCards(1);
        gameMessage.textContent = "转牌圈: 轮到你行动了";
        gameState.currentPlayer = 0;
        enablePlayerControls();
    } else if (gameState.round === 3) {
        // 发河牌
        dealCommunityCards(1);
        gameMessage.textContent = "河牌圈: 轮到你行动了";
        gameState.currentPlayer = 0;
        enablePlayerControls();
    } else {
        // 比牌
        showdown();
    }
}

// 发公共牌
function dealCommunityCards(count) {
    for (let i = 0; i < count; i++) {
        gameState.communityCards.push(gameState.deck.pop());
    }
    
    // 显示公共牌
    displayCommunityCards();
}

// 显示公共牌
function displayCommunityCards() {
    for (let i = 0; i < gameState.communityCards.length; i++) {
        const card = gameState.communityCards[i];
        document.getElementById(`community-${i + 1}`).innerHTML = `<div class="card ${card.suit}">
            ${suitSymbols[card.suit]}${card.value}
        </div>`;
    }
}

// 启用玩家控制
function enablePlayerControls() {
    const callAmount = gameState.currentBet - gameState.players[0].bet;
    
    // 如果玩家已经全押，则不再启用任何控制
    if (gameState.players[0].isAllIn) {
        disablePlayerControls();
        setTimeout(computerTurn, 1000);
        return;
    }
    
    // 启用/禁用相关按钮
    foldButton.disabled = false;
    
    if (callAmount === 0) {
        callButton.textContent = "让牌";
    } else {
        callButton.textContent = `跟注 $${callAmount}`;
    }
    
    // 修复滑块功能，确保滑块可用
    if (gameState.players[0].chips > callAmount) {
        callButton.disabled = false;
        raiseButton.disabled = false;
        betSlider.disabled = false;
        
        // 设置滑块的最小和最大值
        // 最小加注值是当前最大下注的两倍（或者玩家的所有筹码）
        const minRaise = Math.min(gameState.currentBet * 2, gameState.players[0].chips);
        betSlider.min = minRaise;
        betSlider.max = gameState.players[0].chips;
        betSlider.value = minRaise;
        betAmount.textContent = '$' + minRaise;
        
        // 添加全押按钮功能
        const allInAmount = gameState.players[0].chips;
        // 添加全押选项
        if (allInAmount > callAmount) {
            raiseButton.textContent = `加注到 $${minRaise}`;
            const allInButton = document.createElement('button');
            allInButton.id = 'all-in-button';
            allInButton.className = 'action-button';
            allInButton.textContent = `全押 $${allInAmount}`;
            allInButton.onclick = playerAllIn;
            
            // 检查是否已经存在全押按钮
            const existingAllInButton = document.getElementById('all-in-button');
            if (!existingAllInButton) {
                raiseButton.parentNode.insertBefore(allInButton, raiseButton.nextSibling);
            }
        }
    } else {
        // 玩家只能全押或弃牌
        callButton.disabled = false;
        raiseButton.disabled = true;
        betSlider.disabled = true;
    }
}

// 玩家全押
function playerAllIn() {
    const allInAmount = gameState.players[0].chips;
    gameMessage.textContent = `你全押了 $${allInAmount}!`;
    placeBet(0, allInAmount);
    gameState.currentBet = Math.max(gameState.currentBet, gameState.players[0].bet);
    updatePotDisplay();
    
    // 禁用控制并进入电脑行动
    disablePlayerControls();
    setTimeout(computerTurn, 1000);
}

// 禁用玩家控制
function disablePlayerControls() {
    foldButton.disabled = true;
    callButton.disabled = true;
    raiseButton.disabled = true;
    betSlider.disabled = true;
    
    // 移除全押按钮（如果存在）
    const allInButton = document.getElementById('all-in-button');
    if (allInButton) {
        allInButton.remove();
    }
}

// 玩家弃牌
function playerFold() {
    gameState.players[0].folded = true;
    gameMessage.textContent = "你选择弃牌";
    
    // 禁用控制并进入电脑行动
    disablePlayerControls();
    setTimeout(computerTurn, 1000);
}

// 玩家跟注/让牌
function playerCall() {
    const callAmount = gameState.currentBet - gameState.players[0].bet;
    
    if (callAmount > 0) {
        gameMessage.textContent = `你跟注 $${callAmount}`;
        placeBet(0, callAmount);
        updatePotDisplay();
    } else {
        gameMessage.textContent = "你让牌";
    }
    
    // 禁用控制并进入电脑行动
    disablePlayerControls();
    setTimeout(computerTurn, 1000);
}

// 玩家加注
function playerRaise() {
    const raiseAmount = parseInt(betSlider.value);
    const callAmount = gameState.currentBet - gameState.players[0].bet;
    const totalBet = callAmount + raiseAmount;
    
    gameMessage.textContent = `你加注到 $${raiseAmount}`;
    placeBet(0, totalBet);
    gameState.currentBet = gameState.players[0].bet;
    
    updatePotDisplay();
    
    // 禁用控制并进入电脑行动
    disablePlayerControls();
    setTimeout(computerTurn, 1000);
}

// 电脑行动
function computerTurn() {
    // 找到下一个未弃牌的电脑玩家
    let nextPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
    
    while ((gameState.players[nextPlayer].folded || gameState.players[nextPlayer].isAllIn) && nextPlayer !== 0) {
        nextPlayer = (nextPlayer + 1) % gameState.players.length;
        
        // 如果所有玩家都已经全押或弃牌，直接进入下一轮
        const allPlayersDecided = gameState.players.every(player => 
            player.folded || player.isAllIn || player.bet >= gameState.currentBet);
            
        if (allPlayersDecided) {
            if (gameState.round < 3) {
                gameState.round++;
                setTimeout(startBettingRound, 1000);
            } else {
                setTimeout(showdown, 1000);
            }
            return;
        }
    }
    
    // 如果回到玩家，则这一轮结束
    if (nextPlayer === 0) {
        // 如果玩家已全押，直接开始下一轮
        if (gameState.players[0].isAllIn) {
            if (gameState.round < 3) {
                gameState.round++;
                setTimeout(startBettingRound, 1000);
            } else {
                setTimeout(showdown, 1000);
            }
            return;
        }
        
        gameState.round++;
        setTimeout(startBettingRound, 1000);
        return;
    }
    
    gameState.currentPlayer = nextPlayer;
    const player = gameState.players[nextPlayer];
    const callAmount = gameState.currentBet - player.bet;
    
    // 简单的电脑AI
    let decision = Math.random();
    
    if (callAmount === 0) {
        // 有60%的几率让牌，40%的几率加注
        if (decision < 0.6) {
            gameMessage.textContent = `${player.name} 让牌`;
            setTimeout(computerTurn, 1000);
        } else {
            const raiseAmount = Math.min(Math.floor(Math.random() * 50) + 10, player.chips);
            gameMessage.textContent = `${player.name} 加注到 $${raiseAmount}`;
            placeBet(nextPlayer, raiseAmount);
            gameState.currentBet = player.bet;
            updatePotDisplay();
            setTimeout(computerTurn, 1000);
        }
    } else {
        // 有50%的几率跟注，30%的几率弃牌，20%的几率加注
        if (decision < 0.5) {
            // 跟注
            gameMessage.textContent = `${player.name} 跟注 $${callAmount}`;
            placeBet(nextPlayer, callAmount);
            updatePotDisplay();
            setTimeout(computerTurn, 1000);
        } else if (decision < 0.8) {
            // 弃牌
            player.folded = true;
            gameMessage.textContent = `${player.name} 弃牌`;
            setTimeout(computerTurn, 1000);
        } else {
            // 加注
            const raiseAmount = Math.min(callAmount + Math.floor(Math.random() * 100) + 10, player.chips);
            gameMessage.textContent = `${player.name} 加注到 $${raiseAmount}`;
            placeBet(nextPlayer, raiseAmount);
            gameState.currentBet = player.bet;
            updatePotDisplay();
            setTimeout(computerTurn, 1000);
        }
    }
}

// 结束一手牌
function endHand(winner) {
    disablePlayerControls();
    gameMessage.textContent = `${winner.name} 赢了 $${gameState.pot}!`;
    
    // 分发奖金
    winner.chips += gameState.pot;
    
    // 更新显示
    updateUI();
    
    // 显示结果屏幕
    setTimeout(() => {
        resultMessage.textContent = `${winner.name} 赢了 $${gameState.pot}!`;
        resultScreen.style.display = 'flex';
    }, 2000);
}

// 比牌
function showdown() {
    // 这里实现真实的比牌逻辑比较复杂
    // 简单起见，我们随机选择一个胜利者

    const activePlayers = gameState.players.filter(p => !p.folded);
    if (activePlayers.length === 0) return;
    
    // 随机选择一个胜利者
    const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    
    // 结束这手牌
    endHand(winner);
}

// 更新UI
function updateUI() {
    // 更新玩家信息
    gameState.players.forEach((player, index) => {
        updatePlayerDisplay(index);
    });
    
    // 更新底池显示
    updatePotDisplay();
}

// 注册事件监听器
startButton.addEventListener('click', () => {
    // 检查入场门槛
    if (gameState.players[0].chips < gameState.entranceFee) {
        showEntranceFeeError();
        return;
    }
    
    startScreen.style.display = 'none';
    gameArea.style.display = 'flex';
    initGame();
});

restartButton.addEventListener('click', () => {
    resultScreen.style.display = 'none';
    initGame();
});

foldButton.addEventListener('click', playerFold);
callButton.addEventListener('click', playerCall);
raiseButton.addEventListener('click', playerRaise);

// 更新加注滑块显示
betSlider.addEventListener('input', () => {
    betAmount.textContent = '$' + betSlider.value;
    // 动态更新加注按钮文字
    raiseButton.textContent = `加注到 $${betSlider.value}`;
});

// 初始禁用玩家控制
disablePlayerControls();
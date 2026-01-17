// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.keys = {};
        this.gameState = 'playing'; // playing, won, lost
        this.collectionCards = 0;
        this.maxCards = 3;
        
        // 设置canvas原始尺寸
        this.canvasWidth = 1242;
        this.canvasHeight = 2208;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // 设置canvas显示尺寸（等比缩放，不裁剪）
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 背景图片
        this.backgroundImage = null;
        this.loadBackground();
        
        // 背景音乐
        this.bgm = null;
        this.initBGM();
        
        // 躲藏点图片
        this.hideImage = null;
        this.loadHideImage();
        
        // 每日运势词条库
        this.fortuneMessages = [
            '今日财运亨通，适合投资理财',
            '桃花运旺盛，单身者有机会邂逅良缘',
            '事业运上升，工作中会有贵人相助',
            '健康运势良好，适合开始新的运动计划',
            '学习运佳，适合进修提升自己',
            '人际关系和谐，朋友会给你带来惊喜',
            '创意灵感丰富，适合从事艺术创作',
            '旅行运不错，适合安排一次短途旅行',
            '沟通能力强，适合进行重要谈判',
            '心情愉悦，适合与家人朋友共度美好时光',
            '财运不错，可能会有意外收入',
            '工作顺利，项目进展顺利',
            '爱情甜蜜，与伴侣关系更加融洽',
            '健康无忧，身体状态良好',
            '机会来临，把握住能获得成功'
        ];
        
        // 初始化游戏对象
        // 画面尺寸从800x600调整为1242x2208，按比例缩放位置
        const scaleX = 1242 / 800; // 1.5525
        const scaleY = 2208 / 600; // 3.68
        
        this.player = new Player(400 * scaleX, 550 * scaleY);
        this.chengguans = [
            new Chengguan(650 * scaleX, 450 * scaleY),
            new Chengguan(650 * scaleX, 150 * scaleY)
        ];
        // 玩家的尺寸（radius * 2 = 40x40）
        const playerSize = 20 * 2; // 玩家半径20，所以尺寸是40
        
        this.hidingSpots = [
            new HidingSpot(150 * scaleX, 450 * scaleY, playerSize),
            new HidingSpot(400 * scaleX, 150 * scaleY, playerSize)
        ];
        this.buffs = [
            new Buff(200 * scaleX, 300 * scaleY, 'berserk', '狂暴攻击'),
            new Buff(600 * scaleX, 500 * scaleY, 'speed', '位移速度'),
            new Buff(600 * scaleX, 100 * scaleY, 'disguise', '伪装城管')
        ];
        this.obstacles = [
            { x: 0 * scaleX, y: 200 * scaleY, width: 200 * scaleX, height: 20 * scaleY },
            { x: 150 * scaleX, y: 100 * scaleY, width: 200 * scaleX, height: 20 * scaleY },
            { x: 450 * scaleX, y: 250 * scaleY, width: 200 * scaleX, height: 20 * scaleY },
            { x: 600 * scaleX, y: 400 * scaleY, width: 200 * scaleX, height: 20 * scaleY }
        ];
        
        this.entrance = { x: 400 * scaleX, y: 550 * scaleY, radius: 30 * Math.min(scaleX, scaleY) };
        this.exit = { x: 100 * scaleX, y: 100 * scaleY, radius: 30 * Math.min(scaleX, scaleY) };
        
        this.activeBuff = null;
        this.buffDuration = 0;
        this.isHiding = false;
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // 在用户交互时尝试播放背景音乐
        const tryPlayBGM = () => {
            if (this.bgm && this.bgm.paused) {
                this.bgm.play().catch(error => {
                    console.log('背景音乐播放失败:', error);
                });
            }
        };
        
        document.addEventListener('keydown', (e) => {
            // 首次按键时尝试播放背景音乐
            tryPlayBGM();
            
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.tryHide();
            }
            if (e.code === 'KeyE') {
                e.preventDefault();
                this.tryPickupBuff();
            }
        });
        
        // 点击游戏画布时也尝试播放背景音乐
        this.canvas.addEventListener('click', tryPlayBGM);
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('game-over-restart').addEventListener('click', () => {
            document.getElementById('game-over').classList.add('hidden');
            this.restart();
        });
    }
    
    resizeCanvas() {
        // 等比缩放canvas显示尺寸，不裁剪画面
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 60; // 减去padding
        const containerHeight = window.innerHeight - 300; // 减去header等高度
        
        const scaleX = containerWidth / this.canvasWidth;
        const scaleY = containerHeight / this.canvasHeight;
        const scale = Math.min(scaleX, scaleY, 1); // 取较小值，不放大
        
        this.canvas.style.width = (this.canvasWidth * scale) + 'px';
        this.canvas.style.height = (this.canvasHeight * scale) + 'px';
    }
    
    loadBackground() {
        // 加载背景图片
        const bgImage = new Image();
        bgImage.onload = () => {
            this.backgroundImage = bgImage;
        };
        bgImage.onerror = () => {
            console.error('背景图片加载失败: sucai_tinify/bg_neighborhood_01.png');
        };
        bgImage.src = 'sucai_tinify/bg_neighborhood_01.png';
    }
    
    initBGM() {
        // 初始化背景音乐
        this.bgm = new Audio('sucai_tinify/bgm.mp3');
        this.bgm.loop = true; // 设置循环播放
        this.bgm.volume = 0.5; // 设置音量（0-1之间，0.5表示50%音量）
        
        // 尝试播放音乐（可能需要用户交互才能播放）
        this.bgm.play().catch(error => {
            // 如果自动播放失败（需要用户交互），在用户第一次交互时播放
            console.log('背景音乐需要在用户交互后才能播放');
        });
    }
    
    loadHideImage() {
        // 加载躲藏点图片
        const hideImg = new Image();
        hideImg.onload = () => {
            this.hideImage = hideImg;
        };
        hideImg.onerror = () => {
            console.error('躲藏点图片加载失败: sucai_tinify/item_hide_01.png');
        };
        hideImg.src = 'sucai_tinify/item_hide_01.png';
    }
    
    tryHide() {
        if (this.gameState !== 'playing') return;
        
        for (let spot of this.hidingSpots) {
            const dist = Math.sqrt(
                Math.pow(this.player.x - spot.x, 2) + 
                Math.pow(this.player.y - spot.y, 2)
            );
            if (dist < 50) {
                this.isHiding = !this.isHiding;
                return;
            }
        }
        this.isHiding = false;
    }
    
    tryPickupBuff() {
        if (this.gameState !== 'playing') return;
        
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            const buff = this.buffs[i];
            const dist = Math.sqrt(
                Math.pow(this.player.x - buff.x, 2) + 
                Math.pow(this.player.y - buff.y, 2)
            );
            if (dist < 40) {
                this.activateBuff(buff.type);
                this.buffs.splice(i, 1);
                return;
            }
        }
    }
    
    activateBuff(type) {
        this.activeBuff = type;
        this.buffDuration = 300; // 5秒 (60fps * 5)
        
        switch(type) {
            case 'speed':
                this.player.speed = 6;
                break;
            case 'berserk':
                // 狂暴状态：可以短暂攻击城管
                break;
            case 'disguise':
                // 伪装状态：城管不会追逐
                break;
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // 更新buff持续时间
        if (this.buffDuration > 0) {
            this.buffDuration--;
            if (this.buffDuration === 0) {
                this.activeBuff = null;
                this.player.speed = 3;
            }
        }
        
        // 更新玩家
        if (!this.isHiding) {
            this.player.update(this.keys);
            
            // 检查与障碍物的碰撞
            for (let obstacle of this.obstacles) {
                if (this.checkCollision(this.player, obstacle)) {
                    this.player.resolveCollision(obstacle);
                }
            }
        }
        
        // 更新城管
        if (this.activeBuff !== 'disguise' && !this.isHiding) {
            for (let chengguan of this.chengguans) {
                chengguan.update(this.player.x, this.player.y);
            }
        }
        
        // 检查是否被城管抓到
        if (!this.isHiding && this.activeBuff !== 'berserk') {
            for (let chengguan of this.chengguans) {
                const dist = Math.sqrt(
                    Math.pow(this.player.x - chengguan.x, 2) + 
                    Math.pow(this.player.y - chengguan.y, 2)
                );
                if (dist < 40) {
                    this.lose('出餐失败，请提交罚款');
                    return;
                }
            }
        }
        
        // 检查是否到达出口
        const exitDist = Math.sqrt(
            Math.pow(this.player.x - this.exit.x, 2) + 
            Math.pow(this.player.y - this.exit.y, 2)
        );
        if (exitDist < 40) {
            // 到达出口直接结束游戏，显示随机运势
            this.win();
        }
    }
    
    checkCollision(player, obstacle) {
        return player.x - player.radius < obstacle.x + obstacle.width &&
               player.x + player.radius > obstacle.x &&
               player.y - player.radius < obstacle.y + obstacle.height &&
               player.y + player.radius > obstacle.y;
    }
    
    draw() {
        // 绘制背景（最底层）
        if (this.backgroundImage && this.backgroundImage.complete) {
            // 绘制背景图，缩放到canvas尺寸
            this.ctx.drawImage(
                this.backgroundImage,
                0, 0,
                this.canvasWidth,
                this.canvasHeight
            );
        } else {
            // 如果背景图未加载，使用默认背景色
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 绘制障碍物
        this.ctx.fillStyle = '#666';
        for (let obstacle of this.obstacles) {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        
        // 绘制入口
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(this.entrance.x, this.entrance.y, this.entrance.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('入口', this.entrance.x, this.entrance.y + 5);
        
        // 绘制出口
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(this.exit.x, this.exit.y, this.exit.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('出口', this.exit.x, this.exit.y + 5);
        
        // 绘制隐藏点
        for (let spot of this.hidingSpots) {
            spot.draw(this.ctx, this.hideImage);
        }
        
        // 绘制增益道具
        for (let buff of this.buffs) {
            buff.draw(this.ctx);
        }
        
        // 绘制城管
        for (let chengguan of this.chengguans) {
            if (this.activeBuff !== 'disguise' || this.isHiding) {
                chengguan.draw(this.ctx);
            }
        }
        
        // 绘制玩家
        if (!this.isHiding || this.activeBuff === 'disguise') {
            this.player.draw(this.ctx, this.activeBuff);
        }
        
        // 绘制buff状态
        if (this.activeBuff) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(10, 10, 200, 30);
            this.ctx.fillStyle = 'black';
            this.ctx.font = '16px Arial';
            const buffNames = {
                'berserk': '狂暴攻击',
                'speed': '位移速度',
                'disguise': '伪装城管'
            };
            this.ctx.fillText(`激活: ${buffNames[this.activeBuff]} (${Math.ceil(this.buffDuration / 60)}秒)`, 15, 32);
        }
        
        // 绘制隐藏状态
        if (this.isHiding) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(10, 50, 200, 30);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('隐藏中 (安全)', 15, 72);
        }
    }
    
    updateUI() {
        document.getElementById('collection-count').textContent = `${this.collectionCards}/${this.maxCards}`;
        if (this.gameState === 'won') {
            document.getElementById('game-status').textContent = '胜利！';
        } else if (this.gameState === 'lost') {
            document.getElementById('game-status').textContent = '失败';
        } else {
            document.getElementById('game-status').textContent = '游戏中';
        }
    }
    
    win() {
        this.gameState = 'won';
        this.updateUI();
        // 随机选择一条运势词条
        const randomFortune = this.fortuneMessages[Math.floor(Math.random() * this.fortuneMessages.length)];
        document.getElementById('game-over-title').textContent = '🎉 结束游戏';
        document.getElementById('game-over-message').textContent = `今日运势：${randomFortune}`;
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    lose(reason) {
        this.gameState = 'lost';
        this.updateUI();
        document.getElementById('game-over-title').textContent = '😿 游戏结束';
        document.getElementById('game-over-message').textContent = reason || '游戏失败';
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    restart() {
        this.gameState = 'playing';
        this.collectionCards = 0;
        // 画面尺寸从800x600调整为1242x2208，按比例缩放位置
        const scaleX = 1242 / 800; // 1.5525
        const scaleY = 2208 / 600; // 3.68
        
        this.player = new Player(400 * scaleX, 550 * scaleY);
        this.chengguans = [
            new Chengguan(650 * scaleX, 450 * scaleY),
            new Chengguan(650 * scaleX, 150 * scaleY)
        ];
        // 玩家的尺寸（radius * 2 = 40x40）
        const playerSize = 20 * 2; // 玩家半径20，所以尺寸是40
        this.hidingSpots = [
            new HidingSpot(150 * scaleX, 450 * scaleY, playerSize),
            new HidingSpot(400 * scaleX, 150 * scaleY, playerSize)
        ];
        this.buffs = [
            new Buff(200 * scaleX, 300 * scaleY, 'berserk', '狂暴攻击'),
            new Buff(600 * scaleX, 500 * scaleY, 'speed', '位移速度'),
            new Buff(600 * scaleX, 100 * scaleY, 'disguise', '伪装城管')
        ];
        this.activeBuff = null;
        this.buffDuration = 0;
        this.isHiding = false;
        this.updateUI();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 玩家类
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 3;
    }
    
    update(keys) {
        let dx = 0;
        let dy = 0;
        
        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
        
        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
            
            this.x += dx * this.speed;
            this.y += dy * this.speed;
            
            // 边界检查
            this.x = Math.max(this.radius, Math.min(1242 - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(2208 - this.radius, this.y));
        }
    }
    
    resolveCollision(obstacle) {
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const halfWidth = obstacle.width / 2;
        const halfHeight = obstacle.height / 2;
        
        // 计算最近点
        const closestX = Math.max(-halfWidth, Math.min(halfWidth, dx));
        const closestY = Math.max(-halfHeight, Math.min(halfHeight, dy));
        
        const distanceX = dx - closestX;
        const distanceY = dy - closestY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance < this.radius) {
            const overlap = this.radius - distance;
            const angle = Math.atan2(distanceY, distanceX);
            this.x += Math.cos(angle) * overlap;
            this.y += Math.sin(angle) * overlap;
        }
    }
    
    draw(ctx, activeBuff) {
        // 绘制玩家（猫）
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制眼睛
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 3, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制耳朵
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - 10);
        ctx.lineTo(this.x - 10, this.y - 20);
        ctx.lineTo(this.x - 5, this.y - 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y - 10);
        ctx.lineTo(this.x + 10, this.y - 20);
        ctx.lineTo(this.x + 5, this.y - 10);
        ctx.fill();
        
        // Buff特效
        if (activeBuff === 'berserk') {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        } else if (activeBuff === 'disguise') {
            ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 城管类
class Chengguan {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.normalSpeed = 1.5;
        this.chaseSpeed = 3.0; // 加速时的速度
        this.detectionRadius = 150; // 检测玩家的半径
    }
    
    update(playerX, playerY) {
        const distToPlayer = Math.sqrt(
            Math.pow(this.x - playerX, 2) + 
            Math.pow(this.y - playerY, 2)
        );
        
        // 始终跟随玩家，但在检测范围内时加速
        const currentSpeed = distToPlayer < this.detectionRadius ? this.chaseSpeed : this.normalSpeed;
        
        // 追逐玩家
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            this.x += (dx / length) * currentSpeed;
            this.y += (dy / length) * currentSpeed;
        }
        
        // 边界检查
        this.x = Math.max(this.radius, Math.min(1242 - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(2208 - this.radius, this.y));
    }
    
    draw(ctx) {
        // 绘制城管（八边形）
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const px = this.x + Math.cos(angle) * this.radius;
            const py = this.y + Math.sin(angle) * this.radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // 绘制眼睛（表示正在寻找）
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 隐藏点类
class HidingSpot {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size; // 尺寸与玩家相同（40x40）
    }
    
    draw(ctx, hideImage) {
        // 如果图片已加载且完整，使用图片绘制
        if (hideImage && hideImage.complete && hideImage.naturalWidth > 0) {
            try {
                ctx.drawImage(
                    hideImage,
                    this.x - this.size / 2,
                    this.y - this.size / 2,
                    this.size,
                    this.size
                );
                return; // 成功绘制图片，直接返回
            } catch (e) {
                console.warn('绘制躲藏点图片失败，使用后备方案:', e);
            }
        }
        
        // 如果图片未加载或绘制失败，使用默认绘制（后备方案）
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('隐藏点', this.x, this.y + 5);
    }
}

// 增益道具类
class Buff {
    constructor(x, y, type, name) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.type = type;
        this.name = name;
        this.pulse = 0;
    }
    
    draw(ctx) {
        this.pulse += 0.1;
        const size = this.radius + Math.sin(this.pulse) * 3;
        
        // 绘制三角形
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - size);
        ctx.lineTo(this.x - size, this.y + size);
        ctx.lineTo(this.x + size, this.y + size);
        ctx.closePath();
        ctx.fill();
        
        // 绘制名称
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y + 30);
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new Game();
});
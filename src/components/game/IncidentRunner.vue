<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { gameConfig } from '../../config/gameConfig';

const props = defineProps<{
  active: boolean;
}>();

const emit = defineEmits<{
  (e: 'gameOver', score: number): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const score = ref(0);
const isRunning = ref(false);
const animationFrameId = ref<number>(0);

// Game State
let speed = gameConfig.startSpeed;
let frameCount = 0;
let nextSpawnTime = 0;

// Indices for sequential mode
let obstacleIndex = 0;
let enemyIndex = 0;


// Entities
interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'hero' | 'obstacle' | 'enemy' | 'projectile' | 'bg' | 'enemy_projectile';
  label?: string;
  visualType?: string;
  color?: string;
  velocity?: { x: number; y: number };
  isDead?: boolean;
}

let hero: Entity = {
  x: 50,
  y: 0, // Set in init
  width: 40,
  height: 40,
  type: 'hero',
  velocity: { x: 0, y: 0 }
};

let obstacles: Entity[] = [];
let projectiles: Entity[] = [];


// Canvas Dimensions
const GROUND_HEIGHT = 50;
let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 400;

// Controls
const jump = () => {
    if (!isRunning.value) return;
    // can jump if on ground (y is close to ground level)
    const groundLevel = CANVAS_HEIGHT - GROUND_HEIGHT - hero.height;
    if (hero.y >= groundLevel - 5) {
        hero.velocity!.y = gameConfig.jumpForce;
    }
};

const move = (dir: 'left' | 'right' | 'stop') => {
    if (!isRunning.value) return;
    const moveSpeed = 6;
    if (dir === 'left') hero.velocity!.x = -moveSpeed;
    if (dir === 'right') hero.velocity!.x = moveSpeed;
    if (dir === 'stop') hero.velocity!.x = 0;
}

const shoot = () => {
    if (!isRunning.value) return;
    projectiles.push({
        x: hero.x + hero.width,
        y: hero.y + hero.height / 2,
        width: 10,
        height: 6,
        type: 'projectile',
        velocity: { x: 12, y: 0 },
        color: '#ff0' 
    });
};

const handleKeydown = (e: KeyboardEvent) => {
    if (!props.active) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        move('left');
    }
    if (e.code === 'ArrowRight') {
        e.preventDefault();
        move('right');
    }
    if (e.code === 'Enter' || e.code === 'KeyF') {
        e.preventDefault();
        shoot();
    }
};

const handleKeyup = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
         move('stop');
    }
};

const getNextItem = (list: any[], currentIndex: number): { item: any; nextIndex: number } => {
    if (gameConfig.spawnMode === 'sequential') {
        const item = list[currentIndex % list.length];
        return { item, nextIndex: currentIndex + 1 };
    } else {
        const item = list[Math.floor(Math.random() * list.length)];
        return { item, nextIndex: currentIndex }; 
    }
};

const spawnObstacle = () => {
    // Increase Enemy ratio for chaos
    const isEnemy = Math.random() > 0.5; 
    
    if (isEnemy) {
        const { item, nextIndex } = getNextItem(gameConfig.enemies, enemyIndex);
        enemyIndex = nextIndex;
        
        // Varying heights for chaos
        const yPos = CANVAS_HEIGHT - GROUND_HEIGHT - 60 - (Math.random() * 150);
        
        obstacles.push({
            x: CANVAS_WIDTH,
            y: yPos,
            width: 60, 
            height: 50,
            type: 'enemy',
            label: item.label,
            visualType: item.type, 
            color: gameConfig.colors.enemy,
            isDead: false,
            hasThrown: false,
            throwing: 0
        } as any);
    } else {
        const { item, nextIndex } = getNextItem(gameConfig.obstacles, obstacleIndex);
        obstacleIndex = nextIndex;

        obstacles.push({
            x: CANVAS_WIDTH,
            y: CANVAS_HEIGHT - GROUND_HEIGHT - 60,
            width: 60,
            height: 60,
            type: 'obstacle',
            label: item.label,
            visualType: item.type,
            color: gameConfig.colors.obstacle,
            monster: false
        } as any);
    }
};





// Visual Assets - Dark Duke Style (Grimy 90s Action)
// Legend: .=Transparent, K=Black, W=White, R=Red, D=DarkGrey, L=LightGrey, S=Skin, H=Hair, J=Jeans, V=Vest(Red), G=Gun, F=Fire, O=Orange

const PALETTE: Record<string, string> = {
    'K': '#020617', // Slate 950 (Black)
    'k': '#1e293b', // Slate 800 (Dark outline)
    'W': '#f1f5f9', // Slate 100
    'D': '#334155', // Slate 700 (Gun Metal)
    'L': '#94a3b8', // Slate 400 (Metal Highlight)
    'R': '#dc2626', // Red 600 (Blood/Vest)
    'r': '#991b1b', // Red 800 (Dark Vest)
    'S': '#fca5a5', // Skin (Peach)
    's': '#f87171', // Skin Shadow
    'H': '#facc15', // Hair (Blonde)
    'J': '#1d4ed8', // Jeans (Blue)
    'j': '#1e3a8a', // Jeans Shadow
    'G': '#475569', // Gun Grey
    'F': '#f97316', // Fire Orange
    'O': '#c2410c', // Dark Orange
    'Y': '#eab308', // Hazard Yellow
    'T': '#22c55e', // Toxic Green
    'M': '#a855f7', // Monster Purple
};

// 32x32 Hi-Res Grids
const SPRITES = {
    heroRun1: [
       "...........HHHHH.......",
       "..........HHHHHH.......",
       "..........KKKKKK.......",
       "..........KSSKSK.......",
       "..........KSSKSK.......",
       "..........KKKKKK.......",
       "..........SSSSSS.......",
       ".........RRRRRRRR......",
       "........RRRRRRRRRR.....",
       ".......DRRRRRRRRRRD.....",
       ".......DRRRRRRRRRRD.....",
       ".......D.RRRRRRRR.D.....",
       ".........JJJJJJJJ.......",
       ".........JJJJJJJJ.......",
       ".........JJ....JJ.......",
       ".........JJ....JJ.......",
       ".......KKK......KKK....."
    ],
    heroRun2: [
       "...........HHHHH.......",
       "..........HHHHHH.......",
       "..........KKKKKK.......",
       "..........KSSKSK.......",
       "..........KSSKSK.......",
       "..........KKKKKK.......",
       "..........SSSSSS.......",
       ".........RRRRRRRR......",
       "........RRRRRRRRRR.....",
       ".......DRRRRRRRRRRD.....",
       ".......DRRRRRRRRRRD.....",
       ".......D.RRRRRRRR.D.....",
       ".........JJJJJJJJ.......",
       ".........JJJJJJJJ.......",
       ".........JJ....JJ.......",
       "........JJ......JJ......",
       ".......KK........KK....."
    ],
    barrel: [ // "Obstacle"
        ".......KKKKKKKK.......",
        "......KLLLLLLLLK......",
        ".....KLYYYYYYYYYK.....",
        ".....KYTTTTTTTTYK.....",
        ".....KYTTTTTTTTYK.....",
        ".....KYTTTTTTTTYK.....",
        ".....KYTTTTTTTTYK.....",
        ".....KYTTTTTTTTYK.....",
        ".....KYTTTTTTTTYK.....",
        ".....KYTTTTTTTTYK.....",
        ".....KLYYYYYYYYYK.....",
        "......KLLLLLLLLK......"
    ],
    mine: [ // "Spike/Bomb"
        "..........K...........",
        ".........KAK..........",
        "........KAAAK.........",
        ".......KAAAAAK........",
        "......KAAAAAAAK.......",
        ".....KAAAAAAAAAK......",
        "....KAAAAAAAAAAAK.....",
        "...KAAARRRRRRAAAK.....",
        "..KAAARRRRRRRAAAK.....",
        "..KAAARRRRRRRAAAK.....",
        "...KAAARRRRRRAAAK.....",
        "....KAAAAAAAAAAAK.....",
    ],
    monster: [ // "Marius"
        "........MMMMMM........",
        "......MMMMMMMMMM......",
        ".....MMKKMMMMKKMM.....",
        "....MMKKMMMMMMKKMM....",
        "....MMKKMMMMMMKKMM....",
        "....MMMMMMMMMMMMMM....",
        "....MMMMRRRRRRMMMM....",
        ".....MMMRRRRRRMMM.....",
        "......MMMMMMMMMM......",
        ".....MMMMMMMMMMMM.....",
        "....MMMMMMMMMMMMMM....",
        "...MMM...MMMM...MMM...",
        ".........MMMM.........",
    ],
    throw: [ // Arms Up
        "........MMMMMM........",
        "......MMMMMMMMMM......",
        ".....MMKKMMMMKKMM.....",
        "....MMKKMMMMMMKKMM....",
        "...MMMMMMMMMMMMMMMM...",
        "...MMM.MMMMMMMM.MMM...",
        "..MMM..MMMRRMMM..MMM..",
        ".......MMMRRMMM.......",
        "......MMMMMMMMMM......",
        ".....MMMMMMMMMMMM.....",
    ],
    drone: [ 
        ".........DDD.........",
        ".......DDDDDDD.......",
        "......DDDDDDDDD......",
        ".....KKKDDDDDKKK.....",
        "....KKKKKRRRKKKKK....",
        "....KKKKKRRRKKKKK....",
        ".....KKKDDDDDKKK.....",
        "........DDDDD........",
        ".........DDD........."
    ]
};

const drawPixelSprite = (ctx: CanvasRenderingContext2D, sprite: string[], x: number, y: number, scale: number = 3) => {
    sprite.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const pixel = row[colIndex];
            if (pixel && pixel !== '.' && PALETTE[pixel]) {
                ctx.fillStyle = PALETTE[pixel];
                ctx.fillRect(x + colIndex * scale, y + rowIndex * scale, scale, scale);
            }
        }
    });
};

const update = () => {
    if (!isRunning.value) return;

    const ctx = canvasRef.value?.getContext('2d');
    if (!ctx || !canvasRef.value) return;
    
    // Set explicit render size 
    canvasRef.value.width = 1000;
    canvasRef.value.height = 500;
    
    CANVAS_WIDTH = canvasRef.value.width;
    CANVAS_HEIGHT = canvasRef.value.height;

    // Background - Dark Night
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Distant City Skyline
    ctx.fillStyle = '#1e293b'; 
    for(let i=0; i<CANVAS_WIDTH; i+=100) {
        const h = 100 + Math.sin(i + frameCount*0.01)*50;
        ctx.fillRect(i - (frameCount*0.5 % 100), CANVAS_HEIGHT - 100 - h, 60, h + 100);
    }
    
    // Draw Ground
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const gridOffset = (frameCount * speed) % 50;
    for(let i=0; i<CANVAS_WIDTH + 50; i+=50) {
        ctx.moveTo(i - gridOffset, CANVAS_HEIGHT - GROUND_HEIGHT);
        ctx.lineTo(i - gridOffset - 40, CANVAS_HEIGHT);
    }
    ctx.stroke();

    // ----------------- Physics -----------------
    const spriteScale = 3.5; 
    const heroHeight = 17 * spriteScale; 
    const heroWidth = 20 * spriteScale;
    
    hero.width = heroWidth;
    hero.height = heroHeight;
    const groundLevel = CANVAS_HEIGHT - GROUND_HEIGHT - heroHeight + 5; 

    // Update Hero position
    hero.velocity!.y += gameConfig.gravity;
    hero.y += hero.velocity!.y;
    
    // Hero X Movement (New)
    hero.x += hero.velocity!.x || 0;
    
    // Clamp X
    if (hero.x < 0) hero.x = 0;
    if (hero.x > CANVAS_WIDTH - hero.width) hero.x = CANVAS_WIDTH - hero.width;

    // Floor Collision
    if (hero.y > groundLevel) {
        hero.y = groundLevel;
        hero.velocity!.y = 0;
    }
    
    // Ceiling Collision
    if (hero.y < 0) {
        hero.y = 0;
        hero.velocity!.y = 0;
    }

    // Spawning logic
    frameCount++;
    
    // Time-based Speed Increase
    // 1% every 5 frames
    if (frameCount % 5 === 0) {
         const increaseAmt = 8 * 0.01; 
         const maxSpeed = 8 * 5.0; 
         if (speed < maxSpeed) {
             speed = Math.min(speed + increaseAmt, maxSpeed);
         }
    }

    if (frameCount > nextSpawnTime) {
        spawnObstacle();
        
        // High Density Tuning
        const speedMultiplier = speed / gameConfig.startSpeed;
        
        // Much tighter gaps: 30-50 frames divided by speed multiplier
        const baseGap = (30 + Math.random() * 20) / Math.sqrt(speedMultiplier); 
        const minGap = 20; // Very tight
        
        const actualGap = Math.max(minGap, baseGap);
        nextSpawnTime = frameCount + actualGap; 
    }
    
    // Update Icons/Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p || !p.velocity) continue;

        p.x += p.velocity.x;
        
        if (p.x > CANVAS_WIDTH || p.x < 0) {
            projectiles.splice(i, 1);
            continue;
        }

        if (p.type === 'projectile') {
            ctx.fillStyle = '#ef4444'; 
            ctx.fillRect(p.x - 10, p.y + 2, 10, 4);
            ctx.fillStyle = '#f8fafc'; 
            ctx.fillRect(p.x, p.y, p.width, p.height);
        } else {
             ctx.fillStyle = '#22c55e'; 
             ctx.beginPath();
             ctx.arc(p.x + 10, p.y + 10, 8, 0, Math.PI*2);
             ctx.fill();
             
             if (
                 hero.x < p.x + p.width &&
                 hero.x + hero.width > p.x &&
                 hero.y < p.y + p.height &&
                 hero.y + hero.height > p.y
             ) {
                 handleGameOver();
                 return;
             }
        }

        if (p.type === 'projectile') {
             for (const obs of obstacles) {
                 if ((obs.type === 'enemy' || (obs as any).monster === true) && !obs.isDead && 
                     p.x < obs.x + obs.width &&
                     p.x + p.width > obs.x &&
                     p.y < obs.y + obs.height &&
                     p.y + p.height > obs.y) {
                         obs.isDead = true;
                         projectiles.splice(i, 1);
                         score.value += 100;
                         ctx.fillStyle = '#f97316';
                         ctx.beginPath();
                         ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, 30, 0, Math.PI*2);
                         ctx.fill();
                         speed += gameConfig.startSpeed * 0.01; 
                         break; 
                 }
             }
        }
    }

    // Update Obstacles/Enemies
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (!obs) continue;
        if (obs.isDead) continue; 

        obs.x -= speed;

        const config = obs as any; 

        if (obs.type === 'enemy') {
             // -- Vertical Movement Logic --
             // Use sinewave based on frame count and random offset
             if (!config.yBase) config.yBase = obs.y; 
             if (!config.yOffset) config.yOffset = Math.random() * 100;
             if (!config.freq) config.freq = 0.05 + Math.random() * 0.05;
             if (!config.amp) config.amp = 40 + Math.random() * 60; // Reduced amplitude

             // Calculate new Y
             obs.y = config.yBase + Math.sin(frameCount * config.freq + config.yOffset) * config.amp;

             // Clamp to screen bounds
             const maxCeiling = 150; // Lower ceiling significantly so they stay in shot range
             const maxFloor = CANVAS_HEIGHT - GROUND_HEIGHT - obs.height - 10;
             if (obs.y < maxCeiling) obs.y = maxCeiling;
             if (obs.y > maxFloor) obs.y = maxFloor;


             // Marius Logic (Shooting)
             if (!config.hasThrown && obs.x < CANVAS_WIDTH - 200) {
                 // Shoot multiple times or randomly while on screen
                 if (Math.random() > 0.96) { 
                     projectiles.push({
                         x: obs.x,
                         y: obs.y + obs.height/2, // Shoot from current center Y
                         width: 20,
                         height: 20,
                         type: 'enemy_projectile',
                         velocity: { x: -8 - (speed * 0.5), y: 0 }, 
                         color: '#00ff00'
                     });
                     config.hasThrown = true; // Still limit to one burst or reset this
                     config.throwing = 30;
                     
                     // Allow multi-fire by random reset
                     if (Math.random() > 0.5) config.hasThrown = false;
                 }
             }

             const sprite = config.throwing && config.throwing > 0 ? SPRITES.throw : SPRITES.monster;
             if (config.throwing) config.throwing--;
             
             const finalSprite = config.visualType === 'monkey' ? sprite : SPRITES.drone;
             const finalScale = config.visualType === 'monkey' ? spriteScale : 4;
             
             drawPixelSprite(ctx, finalSprite, obs.x, obs.y, finalScale);
             
             ctx.fillStyle = '#ef4444'; 
             ctx.font = 'bold 12px monospace';
             ctx.textAlign = 'center';
             if (obs.label) ctx.fillText(obs.label, obs.x + obs.width/2, obs.y - 10);

        } else {
             let sprite = SPRITES.barrel; 
             if (config.visualType === 'fire') sprite = SPRITES.barrel;
             if (config.visualType === 'dynamite') sprite = SPRITES.mine;

             drawPixelSprite(ctx, sprite, obs.x, obs.y, spriteScale);
             
             ctx.fillStyle = '#facc15'; 
             ctx.font = 'bold 12px monospace';
             ctx.textAlign = 'center';
             if (obs.label) {
                 ctx.fillText(obs.label, obs.x + obs.width/2, obs.y + 90);
             }
        }

        // Collision
        const hitMargin = 15;
        if (
            hero.x + hitMargin < obs.x + obs.width - hitMargin &&
            hero.x + hero.width - hitMargin > obs.x + hitMargin &&
            hero.y + hitMargin < obs.y + obs.height - hitMargin &&
            hero.y + hero.height - hitMargin > obs.y + hitMargin
        ) {
            handleGameOver();
            return;
        }

        if (!obs.isDead && obs.x + obs.width < hero.x && (obs as any).passed !== true) {
            score.value += 100; 
            (obs as any).passed = true;
            speed += gameConfig.startSpeed * 0.02; 
        }

        if (obs.x < -300) {
            obstacles.splice(i, 1);
        }
    }

    // Draw Hero
    const runFrame = Math.floor(frameCount / (10 - Math.min(8, speed/2))) % 2 === 0 ? SPRITES.heroRun1 : SPRITES.heroRun2; // Animation speeds up
    drawPixelSprite(ctx, runFrame, hero.x, hero.y, spriteScale);

    // Draw HUD
    ctx.fillStyle = '#ef4444'; 
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(score.value)}`, 30, 40);
    
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#facc15';
    // Show speed relative to start
    const speedPct = Math.floor((speed / 8) * 100);
    ctx.fillText(`SPEED: ${speedPct}%`, CANVAS_WIDTH - 30, 40);
    
    
    ctx.shadowBlur = 0;

    animationFrameId.value = requestAnimationFrame(update);
};


const handleGameOver = () => {
    isRunning.value = false;
    cancelAnimationFrame(animationFrameId.value);
    emit('gameOver', score.value);
};


const resetGame = () => {
    score.value = 0;
    speed = gameConfig.startSpeed;
    frameCount = 0;
    nextSpawnTime = 0;

    
    obstacles = [];
    projectiles = [];
    
    hero.y = CANVAS_HEIGHT - GROUND_HEIGHT - hero.height;
    hero.velocity = { x: 0, y: 0 };
    
    isRunning.value = true;
    update();
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    if (props.active) {
        // Init canvas size
        if (canvasRef.value) {
            canvasRef.value.width = canvasRef.value.offsetWidth;
            canvasRef.value.height = canvasRef.value.offsetHeight;
        }
        resetGame();
    }
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    cancelAnimationFrame(animationFrameId.value);
});

// Expose restart to parent
defineExpose({ resetGame });
</script>

<template>
  <div class="w-full h-full relative bg-slate-950 font-mono">
    <canvas 
        ref="canvasRef"
        class="w-full h-full block"
    ></canvas>
    
    <!-- Mobile Controls Overlay -->
    <div class="absolute bottom-4 left-4 right-4 flex justify-between md:hidden">
        <button 
           class="bg-green-600/50 active:bg-green-600 text-white p-4 rounded-full border-2 border-green-400 w-20 h-20 flex items-center justify-center font-bold"
           @touchstart.prevent="jump"
        >
            JUMP
        </button>
        <button 
           class="bg-red-600/50 active:bg-red-600 text-white p-4 rounded-full border-2 border-red-400 w-20 h-20 flex items-center justify-center font-bold"
           @touchstart.prevent="shoot"
        >
            FIRE
        </button>
    </div>
  </div>
</template>

import { generateGrid, generateRandomB64String } from './generateGrid.js';
import { goToMainMenu, playSound, saveStats, STATS } from './menu.js';


const gameGridContainer = document.querySelector("#game-grid-container");
const gameGridSizerContainer = document.querySelector("#game-grid-sizer");
const gameGridBorderSvg = document.querySelector("#game-grid-border-svg");
const tileSelectorContainer = document.querySelector("#tile-selector");
const homeButton = document.querySelector("#home-button");
const hintButton = document.querySelector("#hint-button");

const hintUsesDisplay = document.querySelector("#hint-button > .button-counter");
const levelDisplay = document.querySelector("#level-display");
const timerDisplay = document.querySelector("#timer-display");
const spotsLeftDisplay = document.querySelector("#spots-display");
const levelTimeDisplay = document.querySelector("#level-time-display");
const globalTimeDisplay = document.querySelector("#global-time-display");
const livesDisplay = document.querySelector("#lives-display");
const seedDisplay = document.querySelector("#seed-display");

const levelEndScreen = document.querySelector("#level-end-screen");
const endScreenTitle = document.querySelector("#end-screen-title");
const endScreenStats = document.querySelector("#end-screen-stats");
const endScreenButtons = document.querySelector("#end-screen-buttons");
const endHideButton = document.querySelector("#end-hide-button");
const endHomeButton = document.querySelector("#end-home-button");
const endRetryButton = document.querySelector("#end-retry-button");



// Tile Ids
export const TILE_ID = {
    WALL: 1,
    GRID: 2,
    AIR: 3,
    RED: 5,
    BLUE: 6,
    YELLOW: 7,
    PURPLE: 8,
    WHITE: 9,
}

// Map tile IDs to CSS classes
const TILE_CLASS_MAP = {
    [TILE_ID.WALL]: 'tile wall',
    [TILE_ID.AIR]: 'tile air',
    [TILE_ID.GRID]: 'tile grid',
    [TILE_ID.RED]: 'tile block tile-red',
    [TILE_ID.BLUE]: 'tile block tile-blue',
    [TILE_ID.YELLOW]: 'tile block tile-yellow',
    [TILE_ID.PURPLE]: 'tile block tile-purple',
    [TILE_ID.WHITE]: 'tile block tile-white'
};

export const ALL_TILE_BLOCKS = [TILE_ID.RED, TILE_ID.BLUE, TILE_ID.YELLOW, TILE_ID.PURPLE, TILE_ID.WHITE];



export const o = {
    // grid generated
    grid: null,
    gridWidth: null,
    gridHeight: null,
    availableTiles: null,
    futureAvailableTiles: null,
    botAmount: null,
    spotsLeftGrid: null,

    // generation settings
    levelSizeMultiplier: 6,
    botAmountMultiplier: 1,
    //hole gen
    chanceHoles: 0.5,
    chanceHoleInvert: 0.3,
    chanceLockedTile: 0.5,
    // wall gen
    chanceDrunkWalls: 0.4,
    drunkRespawnChance: 0.02,
    drunkStepMultiplier: 3,

    // variables
    mode: null,
    seed: null,
    level: null,
    time: performance.now(),
    selectedAvailableTile: 0,
    inputDisabled: false,
    spotsLeftCount: null,
    globalTimeLeft: null,
    lives: 0,
    endScreen: false,
    blocksPlaced: null,
    invalidClicks: null,
    hintsUsed: 0,

    STATS: null,
    modeSaveLoc: null,

    // mode specifics
    modeGoalLevel: false,
    modeFindLast: false,
    modeHintCount: 0,
    modeLevelTime: 0,
    modeLivesCount: 0,
    modeGlobalTimeGain: 0,
    
    // settings
    lineLength: 3,
    gainHintEveryLevel: 10,
    hintsLeft: 0,
    botAnimationSpeed: 100,  // ms
    invalidMoveTimeout: 600,
    defaultSeedLength: 3,

    placeRandomTiles,
}
window.o = o;






let modeSettings = null;
export function startMode(customSettings) {
    modeSettings = customSettings;

    const defaultSettings = {
        mode: "void",
        seed: generateRandomB64String(o.defaultSeedLength),
        modeSaveLoc: STATS.mode,
        level: 1,
        time: 0,
        modeGoalLevel: false,
        modeFindLast: false,
        modeHintCount: 0,
        modeLivesCount: 0,
        modeGlobalTimeGain: 0,
        botAmountMultiplier: 1,
        modeLevelTime: 0,
        lineLength: 3,
        blocksPlaced: 0,
        invalidClicks: 0,
        hintsUsed: 0,
        hintsLeft: customSettings.modeHintCount ?? 0,
        lives: customSettings.modeLivesCount ?? 0,
    };

    Object.assign(o, defaultSettings, customSettings);

    resetDisplaysAndIntervals();
    if (o.lives) updateLivesDisplay();
    o.globalTimeLeft = 0;
    startGrid();
    if (o.modeGlobalTimeGain) startGlobalTimeCountdown();
    startTimer();
}





function startGrid() {
    // { grid, gridWidth, gridHeight, availableTiles, futureAvailableTiles, botAmount }
    console.time();
    const generatedGrid = generateGrid(o.seed, o.level);
    console.timeEnd();
    Object.assign(o, generatedGrid);

    o.selectedAvailableTile = 0;

    calculateSpotsLeft();
    levelDisplay.textContent = `Level ${o.level}${o.modeGoalLevel ? `/${o.modeGoalLevel}` : ''}`;
    spotsLeftDisplay.textContent = o.spotsLeftCount;
    seedDisplay.textContent = o.seed;
    hintUsesDisplay.textContent = o.hintsLeft;
    createGridDisplay();
    updateTileSelectorDisplay();

    if (o.modeLevelTime) startLevelTimeCountdown();
    if (o.modeFindLast) placeRandomTiles(Infinity, true);
    incrementGlobalTimeLeft();
}




















gameGridContainer.addEventListener('click', (event) => {
    if (o.inputDisabled) return;
    const target = event.target;
    if (target.className.includes(TILE_CLASS_MAP[TILE_ID.GRID])) {
        userPlaceTile(parseInt(target.dataset.x), parseInt(target.dataset.y), o.availableTiles[o.selectedAvailableTile]);
    }
});


tileSelectorContainer.addEventListener('click', (event) => {
    const target = event.target;
    const index = target.dataset.i;
    if (index) switchToAvailableTile(parseInt(index));
});
document.addEventListener('keydown', (event) => {
    if (document.body.classList.contains('game-active')) {
        const key = event.key;
        const num = parseInt(key);
        if (num && num <= o.availableTiles.length) switchToAvailableTile(num - 1);
    }
});


let hintTimeout = null;
let noHintTimeout = null;
let hintUsed = false;
hintButton.addEventListener('click', () => {
    if (o.hintsLeft > 0) showHint(1500);
    else {
        hintUsesDisplay.classList.add('no-hints');
        clearTimeout(noHintTimeout);
        noHintTimeout = setTimeout(() => hintUsesDisplay.classList.remove('no-hints'), 600);
    }
}, true);
    
function showHint(timeout, colored=false) {
    hintUsed = true;
    if (timeout) hintUsesDisplay.classList.add('using-hint');
    for (const tileElement of gameGridContainer.children) {
        const canPlaceSpot = o.spotsLeftGrid[tileElement.dataset.x][tileElement.dataset.y];
        if (canPlaceSpot !== SPOTS_LEFT_ID.INITIAL && canPlaceSpot !== SPOTS_LEFT_ID.IMPOSSIBLE) {
            tileElement.dataset.hint = true;
            if (colored) {
                tileElement.style.backgroundColor = 'color-mix(in oklab, var(--color-grid-cell) 70%, var(--tile-color) 30%)';
                tileElement.classList.add(TILE_CLASS_MAP[canPlaceSpot].split(' ')[2]);
            }
        }
    }
    gameGridContainer.classList.add('hint-active');
    clearTimeout(hintTimeout);
    if (timeout) hintTimeout = setTimeout(clearHint, timeout);
}
function clearHint() {
    clearTimeout(hintTimeout);
    gameGridContainer.classList.remove('hint-active');
    for (const tileElement of gameGridContainer.children) {
        delete tileElement.dataset.hint;
        // if (o.coloredHints) {
            tileElement.style.backgroundColor = '';
            if (tileElement.className.includes(TILE_CLASS_MAP[TILE_ID.GRID])) tileElement.className = TILE_CLASS_MAP[TILE_ID.GRID];
        // }
    }
}

window.addEventListener('unload', () => {
    if (!o.endScreen && body.classList.contains('game-active')) showEndScreen('quit', 0);
});
[homeButton, endHomeButton].forEach(x => x.addEventListener('click', () => {
    if (!o.endScreen) showEndScreen('quit', 0);
    resetDisplaysAndIntervals();
    goToMainMenu();
}));
endHideButton.addEventListener('click', () => levelEndScreen.classList.toggle('moveup'));
endRetryButton.addEventListener('click', () => {
    resetDisplaysAndIntervals();
    startMode(modeSettings);
});



function resetDisplaysAndIntervals() {
    clearInterval(timerInterval);
    timerDisplay.textContent = '';
    clearInterval(levelTimeInterval);
    levelTimeDisplay.textContent = '';
    clearInterval(globalTimeInterval);
    globalTimeDisplay.textContent = '';
    livesDisplay.textContent = '';
    enableGridInput(true);
    hideEndScreen();
    clearHint();
    hintUsesDisplay.classList.remove('using-hint');
    hintUsed = false;
    clearTimeout(gridCompleteTimeout);
}












let timerInterval = null;
function startTimer() {
    o.time = performance.now() - o.time;
    clearTimeout(timerInterval);
    timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
}
function updateTimerDisplay() {
    const time = performance.now() - o.time;
    timerDisplay.textContent = formatMinuteSeconds(time, 0);
}
function formatMinuteSeconds(time, fixed) {
    const minutes = Math.floor(time / 60_000).toString().padStart(2, '0');
    const seconds = (time / 1000 % 60).toFixed(fixed).padStart(2, '0');
    const [integerPart, decimalPart] = seconds.split('.');
    return `${minutes}:${integerPart.padStart(2, '0')}${decimalPart ? `.${decimalPart}` : ''}`;
}

let levelTime = null;
let levelTimeInterval = null;
function startLevelTimeCountdown() {
    levelTime = performance.now();
    clearTimeout(levelTimeInterval);
    levelTimeInterval = setInterval(updateLevelTimeDisplay, 0);
    updateLevelTimeDisplay();
}
function updateLevelTimeDisplay() {
    const time = o.modeLevelTime - (performance.now() - levelTime) / 1000;
    const totalSeconds = (time).toFixed(1);
    levelTimeDisplay.textContent = `${totalSeconds}`;
    if (time < 0) {
        gridFail();
        levelTimeDisplay.textContent = `0.0`;
    }
}

let globalTime = null;
let globalTimeInterval = null;
function startGlobalTimeCountdown() {
    globalTime = performance.now();
    clearTimeout(globalTimeInterval);
    globalTimeInterval = setInterval(updateGlobalTimeDisplay, 0);
    updateGlobalTimeDisplay();
}
function updateGlobalTimeDisplay() {
    const time = o.globalTimeLeft - (performance.now() - globalTime) / 1000;
    const totalSeconds = (time).toFixed(1);
    globalTimeDisplay.textContent = `${totalSeconds}`;
    if (time < 0) {
        gridFail();
        globalTimeDisplay.textContent = `0.0`;
    }
}
function incrementGlobalTimeLeft() {
    const factor = o.availableTiles.length / 2 + 0.5;   // 1->1  2->1.5  3->2  4->2.5  5->3
    o.globalTimeLeft += o.modeGlobalTimeGain * factor;
}



function updateTileSelectorDisplay() {
    tileSelectorContainer.innerHTML = '';
    o.availableTiles.forEach((availableTile, i) => {
        const selectableTile = document.createElement('div');
        selectableTile.className = TILE_CLASS_MAP[availableTile];
        if (i === o.selectedAvailableTile) selectableTile.classList.add('selected');
        selectableTile.dataset.i = i;
        tileSelectorContainer.append(selectableTile);
    });

    o.futureAvailableTiles.forEach((availableTile) => {
        const selectableTile = document.createElement('div');
        selectableTile.className = TILE_CLASS_MAP[availableTile];
        selectableTile.classList.add('future');
        tileSelectorContainer.append(selectableTile);
    });
}

function updateLivesDisplay() {
    livesDisplay.innerHTML = '';
    const numHearts = o.lives;
    const heartsPerRow = 3;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numHearts; i++) {
        if (i % heartsPerRow === 0) {
            const heartRow = document.createElement('div');
            heartRow.className = 'heart-row';
            fragment.appendChild(heartRow);
        }
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.textContent = '❤';
        fragment.lastChild.appendChild(heart);
    }
    livesDisplay.appendChild(fragment);
}
function loseLife() {
    o.lives--;
    const lastHeart = livesDisplay.lastChild.lastChild;
    lastHeart.classList.add('heart-lost');
    setTimeout(() => updateLivesDisplay(), o.invalidMoveTimeout);
    if (o.lives === 0) gridFail();
}


function createGridDisplay() {
    gameGridContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < o.gridHeight; y++) {
        for (let x = 0; x < o.gridWidth; x++) {
            const gridCell = document.createElement('div');
            gridCell.className = TILE_CLASS_MAP[o.grid[x][y]];
            gridCell.dataset.x = x;
            gridCell.dataset.y = y;
            fragment.append(gridCell);
        }
    }
    gameGridContainer.append(fragment);
    gameGridSizerContainer.style.setProperty('--grid-column-count', o.gridWidth);
    gameGridSizerContainer.style.setProperty('--grid-row-count', o.gridHeight);
    requestAnimationFrame(drawCustomGridBorder);
}


window.addEventListener('resize', drawCustomGridBorder);






function drawCustomGridBorder() {
    gameGridBorderSvg.innerHTML = '';

    const tileSize = gameGridContainer.clientHeight / o.gridHeight;
    gameGridSizerContainer.style.setProperty('--grid-tile-size', `${tileSize}px`);

    const overlap = tileSize / 10;
    let pathData = '';

    const isWall = (x, y) => (o.grid[x]?.[y] ?? TILE_ID.WALL) === TILE_ID.WALL;

    for (let y = 0; y < o.gridHeight; y++) {
        for (let x = 0; x < o.gridWidth; x++) {
            if (isWall(x, y)) continue;

            // top and bottom
            for (const dy of [-1, 1]) {
                if (isWall(x, y + dy)) {
                    const startX = x * tileSize - overlap * (isWall(x - 1, y + dy) ? 1 : -1);
                    const endX = (x + 1) * tileSize + overlap * (isWall(x + 1, y + dy) ? 1 : -1);
                    const lineY = (y + (dy === 1)) * tileSize + overlap * dy;
                    pathData += `M ${startX} ${lineY} L ${endX} ${lineY} `;
                }
            }
            // left and right
            for (const dx of [-1, 1]) {
                if (isWall(x + dx, y)) {
                    const startY = y * tileSize - overlap * (isWall(x + dx, y - 1) ? 1 : -1);
                    const endY = (y + 1) * tileSize + overlap * (isWall(x + dx, y + 1) ? 1 : -1);
                    const lineX = (x + (dx === 1)) * tileSize + overlap * dx;
                    pathData += `M ${lineX} ${startY} L ${lineX} ${endY} `;
                }
            }
        }
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', 'game-grid-border-path');
    path.setAttribute('d', pathData);
    gameGridBorderSvg.appendChild(path);
}















function getTileElement(x, y) {
    return gameGridContainer.querySelector(`[data-x="${x}"][data-y="${y}"]`);
}


function disableGridInput() {
    o.inputDisabled = true;
    gameGridContainer.classList.add('input-disabled');
}
function enableGridInput(force) {
    if (force || (!o.endScreen)) {
        o.inputDisabled = false;
        gameGridContainer.classList.remove('input-disabled');
    }
}


function switchToAvailableTile(index) {
    if (o.selectedAvailableTile !== index) {
        o.selectedAvailableTile = index;
        updateTileSelectorDisplay();
        playSound('tileSwitch');
    }
}












function userPlaceTile(x, y, tileId) {
    if (canPlaceTile(x, y, tileId, true)) {
        const { endBots } = placeTile(x, y, tileId);
        // bots
        if (!endBots) placeRandomTiles(o.botAmount);

        o.blocksPlaced++;
        if (hintUsed) {
            hintUsed = false;
            hintUsesDisplay.textContent = --o.hintsLeft;
            o.hintsUsed++;
            clearHint();
            hintUsesDisplay.classList.remove('using-hint');
        }
    }
    gameGridContainer.classList.remove('hint-active');
}
function placeTile(x, y, tileId, displayAfterDelay, dontPlaceIfLast) {
    o.grid[x][y] = tileId;
    updateSpotsLeftAtSpot(x, y);
    const spotsLeft = o.spotsLeftCount;

    if (dontPlaceIfLast && spotsLeft === 0) {
        o.grid[x][y] = TILE_ID.GRID;
        updateSpotsLeftAtSpot(x, y);
        return { didntPlaceLast: true };
    }

    if (!displayAfterDelay) placeTileVisual(x, y, tileId, spotsLeft);
    else setTimeout(() => placeTileVisual(x, y, tileId, Math.max(o.spotsLeftCount, spotsLeft)), displayAfterDelay);
    
    if (o.spotsLeftCount === 0) {
        zeroSpotsLeft();
        // if color switches don't do more bots.
        return { endBots: true };
    }
    return {};
}
function placeTileVisual(x, y, tileId, spotsLeft) {
    const tileElement = getTileElement(x, y);
    tileElement.className = TILE_CLASS_MAP[tileId];
    createBlockPlaceParticles(tileElement);
    playSound('tilePlace');
    spotsLeftDisplay.textContent = spotsLeft;
}



function canPlaceTile(x, y, tileId, drawLine) {
    if (o.grid[x][y] !== TILE_ID.GRID) return false;
    let valid = true;

    const directions = [
        [1, 0],  // Horizontal -
        [0, 1],  // Vertical |
        [1, 1],  // Diagonal \
        [1, -1]  // Diagonal /
    ];

    for (const [dx, dy] of directions) {
        for (let i = 0; i < o.lineLength; i++) {
            let sameTileIdCounter = 0;
            for (let j = 0; j < o.lineLength; j++) {
                // tile is the spot we are checking (x, y) -> skip
                if (i === j) continue;

                const tile = o.grid[x + (j - i) * dx]?.[y + (j - i) * dy];

                // tile is tileId, increase the counter
                if (tile === tileId) sameTileIdCounter++;

                // tile is outside of grid OR another color OR a wall -> valid
                else if (tile !== TILE_ID.AIR && tile !== TILE_ID.GRID) {
                    sameTileIdCounter = -Infinity;
                    break;
                }
            }
            // too many found in one line -> nope.
            if (sameTileIdCounter > o.lineLength - 3) {
                if (drawLine) {
                    const startX = x - i * dx;
                    const startY = y - i * dy;
                    const endX = x + (o.lineLength - 1 - i) * dx;
                    const endY = y + (o.lineLength - 1 - i) * dy;
                    drawInvalidLine(startX, startY, endX, endY);
                    valid = false;
                }
                else return false;
            }
        }
    }

    if (valid) return true;
    else {
        disableGridInput();
        playSound('invalidMove');
        o.invalidClicks++;
        if (o.lives > 0) loseLife();
        setTimeout(() => enableGridInput(), o.invalidMoveTimeout);
        return false;
    }
}



function placeRandomTiles(amount, dontPlaceIfLast) {
    if (!amount) return;
    const allXYPairs = Array.from({ length: o.gridWidth }).flatMap((_, x) => Array.from({ length: o.gridHeight }, (__, y) => [x, y]));
    const randomXY = shuffleArray(allXYPairs);

    let placed = 0;
    let changes = true;
    while (changes) {
        changes = false;
        for (const [x, y] of randomXY) {
            const spotsLeftTile = o.spotsLeftGrid[x][y];
            if (spotsLeftTile > 0) {
                // can place tile
                const displayAfterDelay = (placed + 1) * o.botAnimationSpeed / amount;
                const { didntPlaceLast, endBots } = placeTile(x, y, spotsLeftTile, displayAfterDelay, dontPlaceIfLast);
                if (endBots) return;
                if (!didntPlaceLast) {
                    placed++;
                    changes = true;
                    if (placed >= amount) return;
                }
            }
        }
    }
}

export function shuffleArray(array, rand=Math.random) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}





const SPOTS_LEFT_ID = {
    INITIAL: 0,
    IMPOSSIBLE: -1,
}


function calculateSpotsLeft() {
    o.spotsLeftGrid = Array(o.gridWidth).fill(null).map(() => Array(o.gridHeight).fill(SPOTS_LEFT_ID.INITIAL));
    o.spotsLeftCount = 0;
    for (let x = 0; x < o.gridWidth; x++) {
        for (let y = 0; y < o.gridHeight; y++) {
            const tile = o.grid[x][y];
            if (tile === TILE_ID.GRID) {
                for (const availableTile of o.availableTiles) {
                    if (canPlaceTile(x, y, availableTile, false)) {
                        o.spotsLeftGrid[x][y] = availableTile;
                        o.spotsLeftCount++;
                        break;
                    }
                }
            }
            else o.spotsLeftGrid[x][y] = SPOTS_LEFT_ID.IMPOSSIBLE;
        }
    }
    if (o.spotsLeftCount === 0) zeroSpotsLeft();
}


function updateSpotsLeftAtSpot(x, y) {
    const directions = [
        [1, 0],  // Horizontal -
        [0, 1],  // Vertical |
        [1, 1],  // Diagonal \
        [1, -1]  // Diagonal /
    ];

    // mark as completely unplacable
    if (o.grid[x][y] !== TILE_ID.GRID) {
        o.spotsLeftGrid[x][y] = SPOTS_LEFT_ID.IMPOSSIBLE;
        o.spotsLeftCount--;
    }
    else for (const availableTile of o.availableTiles) {
        if (canPlaceTile(x, y, availableTile, false)) {
            o.spotsLeftGrid[x][y] = availableTile;
            o.spotsLeftCount++;
            break;
        }
    }

    for (const [dx, dy] of directions) {
        for (let i = 1 - o.lineLength; i < o.lineLength; i++) {
            // if (0, 5) is being updated, update (0, 3) (0, 4) . (0, 6) (0, 7) horizontally
            if (i === 0) continue;

            const checkX = x + i * dx;
            const checkY = y + i * dy;
            const previousCanPlace = o.spotsLeftGrid[checkX]?.[checkY];
            if (previousCanPlace === undefined || previousCanPlace === SPOTS_LEFT_ID.IMPOSSIBLE) continue;
            let canPlace = false;

            for (const availableTile of o.availableTiles) {
                if (canPlaceTile(checkX, checkY, availableTile, false)) {
                    if (previousCanPlace === SPOTS_LEFT_ID.INITIAL) {
                        // if it was previously marked as unplacable
                        o.spotsLeftCount++;
                    }
                    canPlace = true;
                    o.spotsLeftGrid[checkX][checkY] = availableTile;
                    break;
                }
            }
            if (!canPlace && previousCanPlace !== SPOTS_LEFT_ID.INITIAL) {
                o.spotsLeftGrid[checkX][checkY] = SPOTS_LEFT_ID.INITIAL;
                o.spotsLeftCount--;
            }
        }
    }
}




function zeroSpotsLeft() {
    if (o.futureAvailableTiles.length > 0) {
        o.availableTiles.push(o.futureAvailableTiles.shift());
        updateTileSelectorDisplay();
        calculateSpotsLeft();
        spotsLeftDisplay.textContent = o.spotsLeftCount;
        
        if (o.modeLevelTime) startLevelTimeCountdown();
        if (o.modeFindLast) placeRandomTiles(Infinity, true);
        if (o.spotsLeftCount > 0) incrementGlobalTimeLeft();
    }
    else gridComplete();
}




let gridCompleteTimeout = null;
function gridComplete() {
    disableGridInput();
    clearInterval(levelTimeInterval);
    
    if (o.level === o.modeGoalLevel) {
        showEndScreen('win', 0);
    }
    else {
        gridCompleteTimeout = setTimeout(() => {
            o.level++;
            if (o.hintsLeft < 99 && o.level % o.gainHintEveryLevel === 0) hintUsesDisplay.textContent = ++o.hintsLeft;
            enableGridInput();
            startGrid();
        }, 1000);
    }
}

function gridFail() {
    disableGridInput();
    clearInterval(levelTimeInterval);
    clearInterval(globalTimeInterval);

    showEndScreen('lose', 600);
}













function showEndScreen(status, timeout) {
    updateTimerDisplay();
    clearInterval(timerInterval);
    clearInterval(levelTimeInterval);
    clearInterval(globalTimeInterval);
    o.endScreen = true;

    const endStats = {
        level: o.level,
        time: Math.round(performance.now() - o.time),
        blocksPlaced: o.blocksPlaced,
        invalidClicks: o.invalidClicks,
        hintsUsed: o.hintsUsed,
        seed: o.seed,
    };
    
    // --- STATS ---
    let newRecord = false;
    if (!o.statsSaveLoc[o.mode]) o.statsSaveLoc[o.mode] = {};
    const statsSaveLoc = o.statsSaveLoc[o.mode];
    if (status !== 'quit') statsSaveLoc.played = (statsSaveLoc.played || 0) + 1;

    if (endStats.level > (statsSaveLoc.best?.level ?? 0) && o.mode !== "custom") {
        // new pb!
        statsSaveLoc.best = endStats;
        newRecord = true;
    }
    // check if we can continue
    if (status === 'quit' && (!o.modeFindLast || !(o.modeGlobalTimeGain || o.modeLevelTime))) {
        let toSave = {};
        if (o.mode === 'custom') Object.assign(toSave, modeSettings);
        Object.assign(toSave, endStats);
        toSave.hintsLeft = o.hintsLeft;
        if (o.modeLivesCount > 1) toSave.lives = o.lives;
        statsSaveLoc.continue = toSave;
    }
    else delete statsSaveLoc.continue;
    saveStats();


    // --- Actually display the end screen ---
    setTimeout(() => {
        endScreenTitle.textContent = `You ${status}!`;
        endScreenStats.innerHTML = '';


        for (let [key, value] of Object.entries(endStats)) {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';

            if (key === 'level' && newRecord) statItem.classList.add('new-record');
            if (key === 'time') value = formatMinuteSeconds(value, 2);


            const statKey = document.createElement('span');
            statKey.className = 'stat-key';
            statKey.textContent = camelToTitleCase(key);
            const statValue = document.createElement('span');
            statValue.className = 'stat-value';
            statValue.textContent = value;
            statItem.append(statKey, statValue);
            endScreenStats.appendChild(statItem);
        }


        levelEndScreen.classList.add('visible');
        setTimeout(() => levelEndScreen.classList.add('moveup'), 30);


        showHint(0, true);
    }, timeout);
}

function hideEndScreen() {
    o.endScreen = false;
    levelEndScreen.classList.remove('visible');
    levelEndScreen.classList.remove('moveup');
}


function camelToTitleCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}






















function drawInvalidLine(startX, startY, endX, endY) {
    const lineLength = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI)

    const lineElement = document.createElement('div');
    lineElement.className = 'invalid-line-indicator';
    lineElement.style.setProperty('--line-length', lineLength);
    lineElement.style.setProperty('--line-rotation', `${angle}deg`);
    getTileElement(startX, startY).appendChild(lineElement);

    setTimeout(() => lineElement.remove(), o.invalidMoveTimeout);
}








let particleWrappers = 0;

function createBlockPlaceParticles(tileElement) {
    const particleWrapper = document.createElement('div');
    particleWrapper.className = 'particle-effect-wrapper';

    let numParticles;
    if (particleWrappers > 30) return;
    else if (particleWrappers > 10) numParticles = 5;
    else if (particleWrappers > 5) numParticles = 10;
    else numParticles = 14;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'tile-particle-fly-out';

        // Randomize
        const endRotation = Math.random() * 360;
        const endScale = 1 + Math.random() * 0.5;
        const duration = 0.4 + Math.random() * 0.4;

        particle.style.animationDuration = `${duration}s`; // Random duration
        particle.style.rotate = `${endRotation}deg`;
        particle.style.scale = endScale;
        setTimeout(() => particle.remove(), duration * 1000);
        particleWrapper.append(particle);
    }
    tileElement.append(particleWrapper);
    particleWrappers++;

    setTimeout(() => {
        particleWrapper.remove();
        particleWrappers--;
    }, 800);
}
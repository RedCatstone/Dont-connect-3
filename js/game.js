import { playSound } from './main.js';
import { generateGrid, generateRandomB64String } from './generateGrid.js';
import { goToMainMenu } from './menu.js';


const gameGridContainer = document.querySelector("#game-grid-container");
const gameGridSizerContainer = document.querySelector("#game-grid-sizer");
const tileSelectorContainer = document.querySelector("#tile-selector");
const hintButton = document.querySelector("#hint-button");
const homeButton = document.querySelector("#home-button");
const levelDisplay = document.querySelector("#level-display");
const timerDisplay = document.querySelector("#timer-display");
const countdownDisplay = document.querySelector("#countdown-display");
const spotsLeftDisplay = document.querySelector("#spots-display");


// Tile Ids
export const TILE_ID = {
    WALL: 0,
    GRID: 1,
    AIR: 2,
    RED: 5,
    BLUE: 6,
    YELLOW: 7,
    PURPLE: 8,
    WHITE: 9,
}

// Map tile IDs to CSS classes
const TILE_CLASS_MAP = {
    [TILE_ID.WALL]: 'tile block wall',
    [TILE_ID.AIR]: 'tile air',
    [TILE_ID.GRID]: 'tile grid',
    [TILE_ID.RED]: 'tile block tile-red',
    [TILE_ID.BLUE]: 'tile block tile-blue',
    [TILE_ID.YELLOW]: 'tile block tile-yellow',
    [TILE_ID.PURPLE]: 'tile block tile-purple',
    [TILE_ID.WHITE]: 'tile block tile-white'
};

export const ALL_TILE_BLOCKS = [TILE_ID.RED, TILE_ID.BLUE, TILE_ID.YELLOW, TILE_ID.PURPLE, TILE_ID.WHITE];


const MODE = {
    INFINITE: 0,
    FIND_LAST: 1,
}



export const o = {
    width: null,
    height: null,
    grid: null,
    lineLength: 3,
    inputDisabled: false,

    spotsLeftGrid: null,
    spotsLeftCount: null,

    seed: null,
    level: 1,
    time: performance.now(),
    timeLeft: 0,
    
    availableTiles: [TILE_ID.RED, TILE_ID.BLUE, TILE_ID.YELLOW],
    selectedAvailableTile: 0,
    botAmount: 0,
    botAnimationSpeed: 100,  // ms
    levelSizeGrowFactor: 1.2,
    chanceHoles: 1,
}
window.o = o;






export function startInfiniteMode(seed=generateRandomB64String(4)) {
    o.mode = MODE.INFINITE;
    o.level = 1;
    o.seed = seed;
    startTimer();
    initGrid();
}

export function startLastSpotMode(seed=generateRandomB64String(4)) {
    o.mode = MODE.FIND_LAST;
    o.timeLeft = 15;
    o.level = 1;
    o.seed = seed;


    o.seed = 'cat';
    o.timeLeft = 10000;
    startTimer();
    startCountdown();
    initGrid();
    placeRandomTiles(Infinity, true);
}





function initGrid() {
    generateGrid(o.seed + o.level);

    calculateSpotsLeft();
    if (o.selectedAvailableTile > o.availableTiles.length - 1) o.selectedAvailableTile = 0;

    levelDisplay.textContent = `Level ${o.level}`;
    spotsLeftDisplay.textContent = o.spotsLeftCount;
    createGridDisplay();
    updateTileSelectorDisplay();
}




















gameGridContainer.addEventListener('click', (event) => {
    if (o.inputDisabled) return;
    const target = event.target;
    if (target.className === TILE_CLASS_MAP[TILE_ID.GRID]) {
        userPlaceTile(parseInt(target.dataset.x), parseInt(target.dataset.y), o.availableTiles[o.selectedAvailableTile]);
    }
});


tileSelectorContainer.addEventListener('click', (event) => {
    const target = event.target;
    const index = target.dataset.i;
    if (index) switchToAvailableTile(parseInt(index));
});
document.addEventListener('keydown', (event) => {
    const key = event.key;
    const num = parseInt(key);
    if (num && num <= o.availableTiles.length) switchToAvailableTile(num - 1);
});


let hintTimeout = null;
hintButton.addEventListener('click', () => {
    for (let y = 0; y < o.height; y++) {
        for (let x = 0; x < o.width; x++) {
            const tileElement = getTileElement(x, y);
            if (o.spotsLeftGrid[x][y] > 0) tileElement.dataset.hint = true;
            else delete tileElement.dataset.hint;
        }
    }
    gameGridContainer.classList.add('hint-active');
    clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => gameGridContainer.classList.remove('hint-active'), 1500);
});


homeButton.addEventListener('click', () => {
    clearInterval(countdownInterval);
    clearInterval(timerInterval);
    countdownDisplay.textContent = '';
    timerDisplay.textContent = '';
    goToMainMenu(); 
});



window.addEventListener('resize', centerGridCss);
function centerGridCss() {
    const { width, height } = gameGridSizerContainer.getBoundingClientRect();

    const containerStyle = getComputedStyle(gameGridContainer);
    const padBorder = 2 * (parseFloat(containerStyle.padding) + parseFloat(containerStyle.borderWidth));

    const useWidth = width - padBorder;
    const useHeight = height - padBorder;
    const aspectRatio = o.width / o.height;

    let targetWidth = useWidth;
    let targetHeight = targetWidth / aspectRatio;
    if (targetHeight > useHeight) {
        targetHeight = useHeight;
        targetWidth = targetHeight * aspectRatio;
    }

    document.documentElement.style.setProperty('--grid-width', `${targetWidth}px`);
    document.documentElement.style.setProperty('--grid-height', `${targetHeight}px`);
}











let countdownInterval = null;
function startCountdown() {
    o.countdown = performance.now();
    clearTimeout(countdownInterval);
    countdownInterval = setInterval(updateCountdownDisplay, 0);
    updateCountdownDisplay();
}


function updateCountdownDisplay() {
    const time = o.timeLeft - (performance.now() - o.countdown) / 1000;
    const totalSeconds = (time).toFixed(time < 3 ? 1 : 0);
    countdownDisplay.textContent = `${totalSeconds}`;
    if (time < 0) {
        gridFail();
        clearInterval(countdownInterval);
        countdownDisplay.textContent = `0.0`;
    }
}






let timerInterval = null;
function startTimer() {
    o.time = performance.now();
    clearTimeout(timerInterval);
    timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
}


function updateTimerDisplay() {
    const time = performance.now() - o.time;
    const totalSeconds = Math.floor(time / 1000);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
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
}

function createGridDisplay() {
    gameGridContainer.innerHTML = '';
    document.documentElement.style.setProperty('--grid-column-count', o.width);
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < o.height; y++) {
        for (let x = 0; x < o.width; x++) {
            const gridCell = document.createElement('div');
            gridCell.className = TILE_CLASS_MAP[o.grid[x][y]];
            gridCell.dataset.x = x;
            gridCell.dataset.y = y;
            fragment.append(gridCell);
        }
    }
    gameGridContainer.append(fragment);
    setTimeout(() => centerGridCss(), 0);
}









function getTileElement(x, y) {
    return gameGridContainer.querySelector(`[data-x="${x}"][data-y="${y}"]`);
}


function switchToAvailableTile(index) {
    o.selectedAvailableTile = index;
    updateTileSelectorDisplay();
    playSound('tileSwitch');
}



function userPlaceTile(x, y, tileId) {
    if (canPlaceTile(x, y, tileId, true)) {
        placeTile(x, y, tileId);
        // bots
        placeRandomTiles(o.botAmount);
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
        return true;
    }

    if (o.spotsLeftCount === 0) gridComplete();

    if (!displayAfterDelay) placeTileVisual(x, y, tileId, spotsLeft);
    else setTimeout(() => placeTileVisual(x, y, tileId, Math.max(o.spotsLeftCount, spotsLeft)), displayAfterDelay);
}
function placeTileVisual(x, y, tileId, spotsLeft) {
    const tileElement = getTileElement(x, y);
    tileElement.className = TILE_CLASS_MAP[tileId];
    createBlockPlaceParticles(tileElement, getComputedStyle(tileElement).backgroundColor);
    playSound('tilePlace');
    spotsLeftDisplay.textContent = spotsLeft;
}


function gridComplete() {
    disableGridInput();
    clearInterval(countdownInterval);
    setTimeout(() => {
        enableGridInput();

        if (o.mode === MODE.INFINITE) {
            o.level++;
            initGrid();
        }

        if (o.mode === MODE.FIND_LAST) {
            o.level++;
            initGrid();
            startCountdown();
            placeRandomTiles(Infinity, true);
        }
    }, 1000);
}

function gridFail() {
    disableGridInput();
    setTimeout(() => {
        enableGridInput();

        if (o.mode === MODE.INFINITE || o.mode === MODE.FIND_LAST) {
            goToMainMenu();
        }
    }, 1000);
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

                // tile is outside of grid OR either another color or a wall -> valid
                else if (tile === undefined || (tile !== TILE_ID.AIR && tile !== TILE_ID.GRID)) {
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
        playSound('invalidMove');
        return false;
    }
}






function placeRandomTiles(amount, dontPlaceIfLast) {
    if (!amount) return;
    const allXYPairs = Array.from({ length: o.width }).flatMap((_, x) => Array.from({ length: o.height }, (__, y) => [x, y]));
    const randomXY = shuffleArray(allXYPairs);

    let placed = 0;
    let changes = true;
    while (changes) {
        changes = false;
        for (const [x, y] of randomXY) {
            const spotsLeftTile = o.spotsLeftGrid[x][y];
            if (spotsLeftTile > 0) {
                // can place tile
                placed++;
                changes = true;
                const displayAfterDelay = placed * o.botAnimationSpeed / amount;
                const lastSpot = placeTile(x, y, spotsLeftTile, displayAfterDelay, dontPlaceIfLast);
                if (dontPlaceIfLast && lastSpot) return;
                if (placed >= amount) return;
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





function calculateSpotsLeft() {
    o.spotsLeftGrid = Array(o.width).fill(null).map(() => Array(o.height).fill(0));
    o.spotsLeftCount = 0;
    for (let x = 0; x < o.width; x++) {
        for (let y = 0; y < o.height; y++) {
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
            else o.spotsLeftGrid[x][y] = -1;
        }
    }
    if (o.spotsLeftCount === 0) gridComplete();
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
        o.spotsLeftGrid[x][y] = -1;
        o.spotsLeftCount--;
    }
    else {
        for (const availableTile of o.availableTiles) {
            if (canPlaceTile(x, y, availableTile, false)) {
                o.spotsLeftGrid[x][y] = availableTile;
                o.spotsLeftCount++;
                // getTileElement(x, y).style.backgroundColor = 'red';
                break;
            }
        }
    }

    for (const [dx, dy] of directions) {
        for (let i = 1 - o.lineLength; i < o.lineLength; i++) {
            // if (0, 5) is being updated, update (0, 3) (0, 4) . (0, 6) (0, 7) horizontally
            if (i === 0) continue;

            const checkX = x + i * dx;
            const checkY = y + i * dy;
            const previousCanPlace = o.spotsLeftGrid[checkX]?.[checkY];
            if (previousCanPlace === undefined || previousCanPlace === -1) continue;
            let canPlace = false;

            for (const availableTile of o.availableTiles) {
                if (canPlaceTile(checkX, checkY, availableTile, false)) {
                    if (previousCanPlace === 0) {
                        // if it was previously marked as unplacable
                        o.spotsLeftCount++;
                    }
                    canPlace = true;
                    o.spotsLeftGrid[checkX][checkY] = availableTile;
                    break;
                }
            }
            if (!canPlace && previousCanPlace !== 0) {
                o.spotsLeftGrid[checkX][checkY] = 0;
                o.spotsLeftCount--;
            }
        }
    }
}


function disableGridInput() {
    o.inputDisabled = true;
    gameGridContainer.classList.add('input-disabled');
}
function enableGridInput() {
    o.inputDisabled = false;
    gameGridContainer.classList.remove('input-disabled');
}










function drawInvalidLine(startX, startY, endX, endY) {
    const lineLength = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI)

    const lineElement = document.createElement('div');
    lineElement.className = 'invalid-line-indicator';
    lineElement.style.rotate = `${angle}deg`;
    lineElement.style.setProperty('--line-length', lineLength);
    getTileElement(startX, startY).appendChild(lineElement);

    disableGridInput();
    setTimeout(() => {
        lineElement.remove();
        enableGridInput();
    }, 600);
}








let particleWrappers = 0;

function createBlockPlaceParticles(tileElement, tileColor) {
    const particleWrapper = document.createElement('div');
    particleWrapper.className = 'particle-effect-wrapper';

    if (particleWrappers >= 50) return;

    const numParticles = particleWrappers < 10 ? 10 + Math.floor(Math.random() * 5) : 5; // 10 to 14 particles
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'tile-particle-fly-out';
        particle.style.backgroundColor = tileColor;

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
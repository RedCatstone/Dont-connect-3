import { o, TILE, TILE_CLASS_MAP, TILE_BLOCK_COLOR_MAP, TUTORIAL_STEPS, saveStats } from './constants.js';
import { create2dGrid, generateGrid, generateRandomB64String } from './generateGrid.js';
import { goToMainMenu, playSound } from './menu.js';


const gameWrapper = document.getElementById('game-wrapper');
const gameGridContainer = document.getElementById('gamegrid-grid');
const gameGridSizerContainer = document.getElementById('gamegrid-sizer-height');
const gameGridGrid = document.getElementById('gamegrid-grid');
const gameGridBorderSvg = document.getElementById('gamegrid-border-svg');
const tileSelectorContainer = document.getElementById('tile-selector');
const homeButton = document.getElementById('home-button');
const hintButton = document.getElementById('hint-button');

const hintUsesDisplay = hintButton.querySelector('.button-counter');
const levelTimerInfoDisplay = document.getElementById('level-timer-info');
export const tutorialTextDisplay = document.getElementById('tutorial-text-display');
const levelDisplay = document.getElementById('level-display');
const timerDisplay = document.getElementById('timer-display');
const spotsLeftDisplay = document.getElementById('spots-display');
const levelTimeDisplay = document.getElementById('level-time-display');
const globalTimeWrapper = document.getElementById('global-time-wrapper');
const globalTimeDisplay = document.getElementById('global-time-display');
const livesDisplay = document.getElementById('lives-display');
const seedDisplay = document.getElementById('seed-display');

const levelEndScreen = document.getElementById('level-end-screen');
const endScreenTitle = document.getElementById('end-screen-title');
const endScreenStats = document.getElementById('end-screen-stats');
const endHideButton = document.getElementById('end-hide-button');
const endHomeButton = document.getElementById('end-home-button');
const endRetryButton = document.getElementById('end-retry-button');



export function startMode(customSettings) {
    const defaultSettings = {
        modeSettings: customSettings,
        seed: generateRandomB64String(o.defaultSeedLength),
        modeSaveLoc: null,
        level: 1,
        hardcodedLevels: {},
        time: 0,
        modeGoalLevel: 0,
        modeFindLast: false,
        modeHintCount: 0,
        modeLivesCount: 0,
        modeGlobalTimeGain: 0,
        botAmountMultiplier: 1,
        modeLevelTime: 0,
        lineLength: 3,
        blocksPlaced: 0,
        mistakes: 0,
        hintsUsed: 0,
        hintsLeft: customSettings.modeHintCount ?? 0,
        lives: customSettings.modeLivesCount ?? 0,
        previousBestLevel: customSettings.statsSaveLoc.best?.level ?? 0,
    };

    Object.assign(o, defaultSettings, customSettings);

    resetDisplaysAndIntervals();
    if (o.lives) updateLivesDisplay();
    if (o.modeGlobalTimeGain) startCountdown('global', 0, globalTimeDisplay);
    startGrid();
    startTimer();
}





function startGrid() {
    // { grid, availableTiles, futureAvailableTiles, botAmount }
    const generatedGrid = o.hardcodedLevels[o.level] ?? generateGrid(o.seed, o.level);
    o.grid = generatedGrid.grid.map(x => [...x]);
    o.gridHeight = generatedGrid.grid.length;
    o.gridWidth = generatedGrid.grid[0].length;
    o.botAmount = generatedGrid.botAmount;
    o.availableTiles = [...generatedGrid.availableTiles];
    o.futureAvailableTiles = [...generatedGrid.futureAvailableTiles];

    o.selectedAvailableTile = 0;

    calculateSpotsLeft();
    levelDisplay.textContent = `Level ${o.level}${o.modeGoalLevel ? `/${o.modeGoalLevel}` : ''}`;
    seedDisplay.textContent = o.seed;
    hintUsesDisplay.textContent = o.hintsLeft;
    createGridDisplay();
    updateTileSelectorDisplay();

    if (o.modeLevelTime) {
        const factor = (o.availableTiles.length + o.futureAvailableTiles.length) / 2 + 0.5;
        startCountdown('level', o.modeLevelTime * factor, levelTimeDisplay);
    }
    if (o.modeFindLast) placeRandomTiles(Infinity, true);
    if (o.modeGlobalTimeGain) incrementGlobalTimeLeft();
    
    if (o.seed === 'Tutorial') {
        levelTimerInfoDisplay.style.display = 'none';
        o.tutorialSubStep = -1;
        advanceTutorial();
    }
}













gameGridContainer.addEventListener('click', (event) => {
    if (o.inputDisabled) return;
    const target = event.target;
    if (target.className.includes(TILE_CLASS_MAP[TILE.GRID])) {
        const x = parseInt(target.dataset.x);
        const y = parseInt(target.dataset.y);
        userPlaceTile(y, x, o.availableTiles[o.selectedAvailableTile]);
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
        const canPlaceSpot = o.spotsLeftGrid[tileElement.dataset.y][tileElement.dataset.x];
        if (canPlaceSpot !== SPOTS_LEFT_ID.INITIAL && canPlaceSpot !== SPOTS_LEFT_ID.IMPOSSIBLE) {
            tileElement.classList.add('animating-hint-breathe');
            if (colored) {
                tileElement.style.setProperty('--tile-color', TILE_BLOCK_COLOR_MAP[canPlaceSpot]);
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
        tileElement.classList.remove('animating-hint-breathe');
        tileElement.style.setProperty('--tile-color', '');
    }
}

window.addEventListener('unload', () => {
    if (!o.endScreen && body.classList.contains('game-active')) saveCurrentGameStats(false);
});
[homeButton, endHomeButton].forEach(x => x.addEventListener('click', () => {
    if (!o.endScreen) saveCurrentGameStats(false);
    goToMainMenu();
}));
endHideButton.addEventListener('click', () => levelEndScreen.classList.toggle('moveup'));
endRetryButton.addEventListener('click', () => startMode(o.modeSettings));



function resetDisplaysAndIntervals() {
    clearInterval(timerInterval);
    clearTimeout(gridCompleteTimeout);
    for (const name in o.activeCountdowns) stopCountdown(name);
    timerDisplay.textContent = '';
    levelTimeDisplay.textContent = '';
    globalTimeDisplay.textContent = '';
    livesDisplay.textContent = '';
    tutorialTextDisplay.textContent = '';
    levelTimerInfoDisplay.style.display = '';
    enableGridInput(true);
    hideEndScreen();
    clearHint();
    hintUsesDisplay.classList.remove('using-hint');
    hintUsed = false;
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
export function formatMinuteSeconds(time, fixed) {
    const minutes = Math.floor(time / 60_000).toString().padStart(2, '0');
    const seconds = (time / 1000 % 60).toFixed(fixed).padStart(2, '0');
    const [integerPart, decimalPart] = seconds.split('.');
    return `${minutes}:${integerPart.padStart(2, '0')}${decimalPart ? `.${decimalPart}` : ''}`;
}

function startCountdown(name, durationInSeconds, timerDisplayElement) {
    stopCountdown(name);
    const deathTime = performance.now() + durationInSeconds * 1000;

    function update() {
        const remainingMs = o.activeCountdowns[name].deathTime - performance.now();
        if (remainingMs > 0) timerDisplayElement.textContent = (remainingMs / 1000).toFixed(1);
        else {
            timerDisplayElement.textContent = '0.0';
            gridFail();
            delete o.activeCountdowns[name];
        }
    }
    o.activeCountdowns[name] = { deathTime, id: setInterval(() => update(), 100) };
    timerDisplayElement.textContent = durationInSeconds.toFixed(1);
}

function stopCountdown(name) {
    if (o.activeCountdowns[name]) {
        clearInterval(o.activeCountdowns[name].id);
        delete o.activeCountdowns[name];
    }
}
function incrementGlobalTimeLeft() {
    const factor = !o.modeFindLast ? 1 : o.availableTiles.length / 2 + 0.5;   // 1->1  2->1.5  3->2  4->2.5  5->3
    const timeGainedSec = o.modeGlobalTimeGain * factor;
    o.activeCountdowns['global'].deathTime += timeGainedSec * 1000;

    const popup = document.createElement('span');
    popup.className = 'time-gained-popup';
    popup.textContent = `+${timeGainedSec.toFixed(1)}s`;
    globalTimeWrapper.appendChild(popup);
    setTimeout(() => {
        popup.remove();
    }, 1500);
}



function updateTileSelectorDisplay() {
    tileSelectorContainer.innerHTML = '';
    for (const [i, availableTile] of o.availableTiles.entries()) {
        const selectableTile = document.createElement('div');
        selectableTile.className = TILE_CLASS_MAP[availableTile];

        if (i === o.selectedAvailableTile) selectableTile.classList.add('selected');
        selectableTile.dataset.i = i;
        tileSelectorContainer.append(selectableTile);
    }

    for (const availableTile of o.futureAvailableTiles) {
        const selectableTile = document.createElement('div');
        selectableTile.className = TILE_CLASS_MAP[availableTile];
        selectableTile.classList.add('future');
        tileSelectorContainer.append(selectableTile);
    }

    gameWrapper.style.setProperty('--selected-tile-color', TILE_BLOCK_COLOR_MAP[o.availableTiles[o.selectedAvailableTile]]);
    gameWrapper.style.setProperty('--latest-tile-color', TILE_BLOCK_COLOR_MAP[o.availableTiles.at(-1)]);
}

function updateLivesDisplay() {
    livesDisplay.innerHTML = '';
    const numHearts = o.lives;
    const heartsPerRow = 5;
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
            gridCell.className = TILE_CLASS_MAP[o.grid[y][x]];
            gridCell.dataset.y = y;
            gridCell.dataset.x = x;
            fragment.append(gridCell);
        }
    }
    gameGridContainer.append(fragment);
    gameGridSizerContainer.style.setProperty('--grid-column-count', o.gridWidth);
    gameGridSizerContainer.style.setProperty('--grid-row-count', o.gridHeight);
    drawCustomGridBorder();
}


new ResizeObserver(() => drawCustomGridBorder()).observe(gameGridGrid);






function drawCustomGridBorder() {
    gameGridBorderSvg.innerHTML = '';

    const tileSize = gameGridContainer.clientHeight / o.gridHeight;
    gameGridSizerContainer.style.setProperty('--grid-tile-size', `${tileSize}px`);

    const overlap = tileSize / 10;
    let pathData = '';

    const isWall = (y, x) => (o.grid[y]?.[x] ?? TILE.WALL) === TILE.WALL;

    for (let y = 0; y < o.gridHeight; y++) {
        for (let x = 0; x < o.gridWidth; x++) {
            if (isWall(y, x)) continue;

            // top and bottom
            for (const dy of [-1, 1]) {
                if (isWall(y + dy, x)) {
                    const startX = x * tileSize - overlap * (isWall(y + dy, x - 1) ? 1 : -1);
                    const endX = (x + 1) * tileSize + overlap * (isWall(y + dy, x + 1) ? 1 : -1);
                    const lineY = (y + (dy === 1)) * tileSize + overlap * dy;
                    pathData += `M ${startX} ${lineY} L ${endX} ${lineY} `;
                }
            }
            // left and right
            for (const dx of [-1, 1]) {
                if (isWall(y, x + dx)) {
                    const startY = y * tileSize - overlap * (isWall(y - 1, x + dx) ? 1 : -1);
                    const endY = (y + 1) * tileSize + overlap * (isWall(y + 1, x + dx) ? 1 : -1);
                    const lineX = (x + (dx === 1)) * tileSize + overlap * dx;
                    pathData += `M ${lineX} ${startY} L ${lineX} ${endY} `;
                }
            }
        }
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', 'gamegrid-border-path');
    path.setAttribute('d', pathData);
    gameGridBorderSvg.appendChild(path);
}















function getTileElement(y, x) {
    return gameGridContainer.querySelector(`[data-y="${y}"][data-x="${x}"]`);
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
        playSound('switchTile');
    }
}











let lastX, lastY;
function userPlaceTile(y, x, tileId) {
    if (canPlaceTile(y, x, tileId, true)) {
        if (!o.tutorialDissallowValidMoves) {
            if (o.seed === 'Tutorial') tutorialOnGameEvent('tile_place');
            
            lastX = x;
            lastY = y
            const { endBots } = placeTile(y, x, tileId);
            
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
    }
    else if (o.seed === 'Tutorial') tutorialOnGameEvent('invalid_move');

    gameGridContainer.classList.remove('hint-active');
}

function placeTile(y, x, tileId, displayAfterDelay, dontPlaceIfLast) {
    o.grid[y][x] = tileId;
    updateSpotsLeftAtSpot(y, x);
    const spotsLeft = o.spotsLeftCount;

    if (dontPlaceIfLast && spotsLeft === 0) {
        o.grid[y][x] = TILE.GRID;
        updateSpotsLeftAtSpot(y, x);
        return { didntPlaceLast: true };
    }

    if (!displayAfterDelay) placeTileVisual(y, x, tileId, spotsLeft);
    else setTimeout(() => placeTileVisual(y, x, tileId, Math.max(o.spotsLeftCount, spotsLeft)), displayAfterDelay);
    
    if (o.spotsLeftCount === 0) {
        zeroSpotsLeft();
        // if color switches don't do more bots.
        return { endBots: true };
    }
    return {};
}
function placeTileVisual(y, x, tileId, spotsLeft) {
    const tileElement = getTileElement(y, x);
    tileElement.className = TILE_CLASS_MAP[tileId];
    createBlockPlaceParticles(tileElement);
    playSound('pOp');
    spotsLeftDisplay.textContent = `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''}`;
}



function canPlaceTile(y, x, tileId, drawLine) {
    if (o.grid[y][x] !== TILE.GRID) return false;
    const invalidLinesList = [];

    const directions = [
        [0, 1],  // Horizontal -
        [1, 0],  // Vertical |
        [1, 1],  // Diagonal \
        [-1, 1]  // Diagonal /
    ];

    for (const [dy, dx] of directions) {
        for (let i = 0; i < o.lineLength; i++) {
            let sameTileIdCounter = 0;
            for (let j = 0; j < o.lineLength; j++) {
                // tile is the spot we are checking (y, x) -> skip
                if (i === j) continue;

                const tile = o.grid[y + (j - i) * dy]?.[x + (j - i) * dx];

                // tile is tileId, increase the counter
                if (tile === tileId) sameTileIdCounter++;

                // tile is outside of grid OR another color OR a wall -> break out
                else if (tile !== TILE.AIR && tile !== TILE.GRID) {
                    sameTileIdCounter = -Infinity;
                    break;
                }
            }
            // too many found in one line -> nope.
            if (sameTileIdCounter > o.lineLength - 3) {
                if (drawLine) {
                    const startY = y - i * dy;
                    const startX = x - i * dx;
                    const endY = y + (o.lineLength - 1 - i) * dy;
                    const endX = x + (o.lineLength - 1 - i) * dx;
                    invalidLinesList.push([startY, startX, endY, endX]);
                }
                else return false;
            }
        }
    }
    if (invalidLinesList.length > 0) {
        drawInvalidLines(y, x, tileId, invalidLinesList);
        disableGridInput();
        playSound('error');
        o.mistakes++;
        if (o.lives > 0) loseLife();
        return false;
    }
    return true;
}



export function placeRandomTiles(amount, dontPlaceIfLast) {
    if (!amount) return;
    const allXYPairs = Array.from({ length: o.gridWidth }).flatMap((_, x) => Array.from({ length: o.gridHeight }, (__, y) => [y, x]));
    const randomXY = shuffleArray(allXYPairs);

    let placed = 0;
    let changes = true;
    while (changes) {
        changes = false;
        for (const [y, x] of randomXY) {
            const spotsLeftTile = o.spotsLeftGrid[y][x];
            if (spotsLeftTile > 0) {
                // can place tile
                const displayAfterDelay = (placed + 1) * o.botAnimationSpeed / amount;
                const { didntPlaceLast, endBots } = placeTile(y, x, spotsLeftTile, displayAfterDelay, dontPlaceIfLast);
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
    o.spotsLeftGrid = create2dGrid(o.gridHeight, o.gridWidth, SPOTS_LEFT_ID.INITIAL);
    o.spotsLeftCount = 0;
    for (let y = 0; y < o.gridHeight; y++) {
        for (let x = 0; x < o.gridWidth; x++) {
            const tile = o.grid[y][x];
            if (tile === TILE.GRID) {
                for (const availableTile of o.availableTiles) {
                    if (canPlaceTile(y, x, availableTile, false)) {
                        o.spotsLeftGrid[y][x] = availableTile;
                        o.spotsLeftCount++;
                        break;
                    }
                }
            }
            else o.spotsLeftGrid[y][x] = SPOTS_LEFT_ID.IMPOSSIBLE;
        }
    }
    spotsLeftDisplay.textContent = `${o.spotsLeftCount} spot${o.spotsLeftCount !== 1 ? 's' : ''}`;
    if (o.spotsLeftCount === 0) zeroSpotsLeft();
}


function updateSpotsLeftAtSpot(y, x) {
    const directions = [
        [0, 1],  // Horizontal -
        [1, 0],  // Vertical |
        [1, 1],  // Diagonal \
        [-1, 1]  // Diagonal /
    ];

    // mark as completely unplacable
    if (o.grid[y][x] !== TILE.GRID) {
        o.spotsLeftGrid[y][x] = SPOTS_LEFT_ID.IMPOSSIBLE;
        o.spotsLeftCount--;
    }
    else for (const availableTile of o.availableTiles) {
        if (canPlaceTile(y, x, availableTile, false)) {
            o.spotsLeftGrid[y][x] = availableTile;
            o.spotsLeftCount++;
            break;
        }
    }

    for (const [dy, dx] of directions) {
        for (let i = 1 - o.lineLength; i < o.lineLength; i++) {
            // if (0, 5) is being updated, update (0, 3) (0, 4) . (0, 6) (0, 7) horizontally
            if (i === 0) continue;

            const checkY = y + i * dy;
            const checkX = x + i * dx;
            const previousCanPlace = o.spotsLeftGrid[checkY]?.[checkX];
            if (previousCanPlace === undefined || previousCanPlace === SPOTS_LEFT_ID.IMPOSSIBLE) continue;
            let canPlace = false;

            for (const availableTile of o.availableTiles) {
                if (canPlaceTile(checkY, checkX, availableTile, false)) {
                    if (previousCanPlace === SPOTS_LEFT_ID.INITIAL) {
                        // if it was previously marked as unplacable
                        o.spotsLeftCount++;
                    }
                    canPlace = true;
                    o.spotsLeftGrid[checkY][checkX] = availableTile;
                    break;
                }
            }
            if (!canPlace && previousCanPlace !== SPOTS_LEFT_ID.INITIAL) {
                o.spotsLeftGrid[checkY][checkX] = SPOTS_LEFT_ID.INITIAL;
                o.spotsLeftCount--;
            }
        }
    }
}




function zeroSpotsLeft() {
    if (o.seed === 'Tutorial') tutorialOnGameEvent('color_complete');

    if (o.futureAvailableTiles.length > 0) {
        o.availableTiles.push(o.futureAvailableTiles.shift());
        updateTileSelectorDisplay();
        calculateSpotsLeft();

        const newlyUnlockedTile = [...document.querySelectorAll('#tile-selector :not(.future)')].at(-1);
        createBlockPlaceParticles(newlyUnlockedTile);

        if (o.modeFindLast) placeRandomTiles(Infinity, true);
        if (o.modeGlobalTimeGain && o.spotsLeftCount > 0) incrementGlobalTimeLeft();
    }
    else gridComplete();
}




let gridCompleteTimeout = null;
function gridComplete() {
    disableGridInput();
    stopCountdown('level');
    const globalTimeLeft = o.activeCountdowns['global']?.deathTime - performance.now();
    stopCountdown('global');
    
    if (o.level === o.modeGoalLevel) {
        showEndScreen('win', o.winLooseTimeout);
    }
    else {
        saveCurrentGameStats(true);
        gridCompleteTimeout = setTimeout(() => {
            o.level++;
            if (o.hintsLeft < 99 && o.level % o.gainHintEveryLevel === 0) hintUsesDisplay.textContent = ++o.hintsLeft;
            if (o.modeGlobalTimeGain) startCountdown('global', (globalTimeLeft + o.winLooseTimeout) / 1000, globalTimeDisplay);
            enableGridInput();
            startGrid();
        }, o.winLooseTimeout);
    }


    if (o.seed === 'Tutorial') tutorialOnGameEvent('grid_complete');
    playSound('win');
    
    // cascade animation
    const maxDist = Math.hypot(o.gridWidth, o.gridHeight);
    for (const tileElement of gameGridContainer.children) {
        const x = parseInt(tileElement.dataset.x);
        const y = parseInt(tileElement.dataset.y);

        const distance = Math.hypot(y - lastY, x - lastX);
        const delay = (distance / maxDist) * 600;

        tileElement.style.animationDelay = `${delay}ms`;
        tileElement.classList.add('animating-win');
    }
}

function gridFail() {
    disableGridInput();
    for (const name in o.activeCountdowns) stopCountdown(name);

    showEndScreen('lose', o.winLooseTimeout / 2);
    playSound('error');
}










function advanceTutorial() {
    const levelSteps = TUTORIAL_STEPS[o.level];
    const step = levelSteps[++o.tutorialSubStep];

    // fade out
    tutorialTextDisplay.style.opacity = '0';

    if (step) setTimeout(() => {
        // fade in
        tutorialTextDisplay.classList = `tile-${step.textColor ?? 'red'}`;
        tutorialTextDisplay.style.opacity = '1';
        tutorialTextDisplay.innerHTML = step.text;
    }, (o.tutorialSubStep === 0) ? 0 : 300);
}
function tutorialOnGameEvent(eventName) {
    const step = TUTORIAL_STEPS[o.level][o.tutorialSubStep];
    if (step?.waitFor === eventName) advanceTutorial();
}









function saveCurrentGameStats(gridWasSuccess) {
    const gameStats = {
        level: o.level + gridWasSuccess,   // +1 level if grid was completed successfully
        time: Math.round(performance.now() - o.time),
        blocksPlaced: o.blocksPlaced,
        mistakes: o.mistakes,
        hintsUsed: o.hintsUsed,
        seed: o.seed,
    };
    
    if (gridWasSuccess) o.statsSaveLoc.gridsDone = (o.statsSaveLoc.gridsDone || 0) + 1;

    const previousBestTime = o.statsSaveLoc.best?.time ?? Infinity;
    const newLevelRecord = gameStats.level > o.previousBestLevel;
    const newTimeRecord = gameStats.level === o.previousBestLevel  &&  gameStats.time < previousBestTime;
    if (newLevelRecord || newTimeRecord) o.statsSaveLoc.best = gameStats;

    // check if we can continue
    if (gameStats.level > 1) {
        if (!o.endScreen && !(o.modeGlobalTimeGain || o.modeLevelTime)) {
            const toSave = { ...gameStats };
            if (o.mode === 'custom') {
                Object.assign(toSave, o.modeSettings);
                delete toSave.statsSaveLoc;
            }
            toSave.hintsLeft = o.hintsLeft;
            toSave.previousBestLevel = o.previousBestLevel;
            if (o.modeLivesCount > 1) toSave.lives = o.lives;
            o.statsSaveLoc.continue = toSave;
        }
        else delete o.statsSaveLoc.continue;
    }
    saveStats();

    return { gameStats, newLevelRecord, newTimeRecord };
}











function showEndScreen(status, timeout) {
    updateTimerDisplay();
    clearInterval(timerInterval);
    clearTimeout(gridCompleteTimeout);
    for (const name in o.activeCountdowns) stopCountdown(name);
    o.endScreen = true;

    const { gameStats, newLevelRecord, newTimeRecord } = saveCurrentGameStats(status === 'win');

    setTimeout(() => {
        endScreenTitle.textContent = `You ${status}!`;
        endScreenStats.innerHTML = '';


        for (let [key, value] of Object.entries(gameStats)) {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';

            if (key === 'level' && newLevelRecord) statItem.classList.add('new-record');
            if (key === 'time' && newTimeRecord) statItem.classList.add('new-record');
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

        showHint(0, true);
        levelEndScreen.classList.add('visible');
        setTimeout(() => levelEndScreen.classList.add('moveup'), 30);
    }, timeout);
}

function hideEndScreen() {
    o.endScreen = false;
    levelEndScreen.classList.remove('visible');
    levelEndScreen.classList.remove('moveup');
}


export function camelToTitleCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}



















function drawInvalidLines(y, x, tileId, invalidLinesList) {
    const tileStaggerDelay = 50;
    const animationDuration = o.invalidMoveTimeout - (tileStaggerDelay * (o.lineLength - 1));

    // give the main tile the animation
    const mainTile = getTileElement(y, x);
    mainTile.style.setProperty('--tile-color', TILE_BLOCK_COLOR_MAP[tileId]);

    for (const [lineIndex, [startY, startX, endY, endX]] of invalidLinesList.entries()) {
        const lineStartDelay = lineIndex * o.invalidMoveTimeout;
        const dy = Math.sign(endY - startY);
        const dx = Math.sign(endX - startX);

        for (let i = 0; i < o.lineLength; i++) {
            const tileY = startY + i * dy;
            const tileX = startX + i * dx;
            const tileElement = getTileElement(tileY, tileX);
            const tileStartDelay = lineStartDelay + i * tileStaggerDelay;

            // start animation
            setTimeout(() => {
                tileElement.classList.add('animating-invalid-shake');
            }, tileStartDelay);

            // end animation
            if (tileY !== y || tileX !== x || lineIndex === invalidLinesList.length - 1) setTimeout(() => {
                tileElement.classList.remove('animating-invalid-shake');
            }, tileStartDelay + animationDuration);
        }
    }
    const allLinesFinished = o.invalidMoveTimeout * invalidLinesList.length;
    setTimeout(() => {
        enableGridInput();
        mainTile.style.setProperty('--tile-color', '');
    }, allLinesFinished);
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
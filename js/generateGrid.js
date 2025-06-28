import { genPatterns } from './genPatterns.js';
import { o, ALL_TILE_BLOCKS, shuffleArray, TILE_ID } from './game.js';





export function generateGrid(seed, level) {
    const rand = splitmix32(cyrb128(seed + level + seed)[0]);

    // grid size
    const total = (Math.log(level + 1) * o.levelSizeMultiplier);
    const randomSplit = rand() * total/4;
    const width = 2 + Math.round(total/4 + randomSplit);
    const height = 2 + Math.round(total/2 - randomSplit);
    const grid = Array(width).fill(null).map(() => Array(height).fill(TILE_ID.GRID));

    // available tiles
    let tiles = ALL_TILE_BLOCKS.slice(0, Math.ceil(Math.sqrt(level)));
    shuffleArray(tiles, rand);
    tiles = tiles.filter((x, i) => i === 0 || rand() > 0.5 + i * 0.1);   // always keep first, but randomly filter others
    const availableTiles = [];
    const futureAvailableTiles = [];
    tiles.forEach((tile, i) => {
        if (i === 0 || rand() > o.chanceLockedTile) availableTiles.push(tile);
        else futureAvailableTiles.push(tile)
    });

    // bot amount
    const botAmount = Math.ceil(rand() * Math.log(level) * o.botAmountMultiplier);

    // holes (patterns)
    if (level > 5) {
        if (rand() < o.chanceHoles) {
            const numPatterns = Math.ceil(rand() * Math.log(level)) ?? 0;
            placeTileRandomPattern(TILE_ID.AIR, numPatterns, grid, width, height, rand);
        }
    }

    // walls todo
    if (level > 10) {

    }


    return { grid, width, height, availableTiles, futureAvailableTiles, botAmount };
}


function placeTileRandomPattern(tileId, numPatterns, grid, gridWidth, gridHeight, rand) {
    const placementGrid = Array(gridWidth).fill(null).map(() => Array(gridHeight).fill(false));

    const filteredGenPatterns = genPatterns.filter(pattern => pattern.shape.length <= gridHeight && pattern.shape[0].length <= gridWidth);
    if (filteredGenPatterns.length === 0) return;

    for (let i = 0; i < numPatterns; i++) {
        // Pick a random pattern
        let pattern = filteredGenPatterns[Math.floor(rand() * filteredGenPatterns.length)];
        let patternShape = pattern.shape;
        
        let patternHeight = patternShape.length;
        let patternWidth = patternShape[0].length;

        // rotate randomly
        if (!pattern.noRotate) {
            let rotations;
            if (patternHeight < gridWidth || patternWidth < gridHeight) {
                rotations = Math.round(rand()) * 2;  // 0 2
            }
            else rotations = Math.floor(rand() * 4);  // 0 1 2 3
            patternShape = rotateMatrix(patternShape, rotations);
            
            if (rotations === 1 || rotations === 3) {
                [patternHeight, patternWidth] = [patternWidth, patternHeight];
            }
        }

        let paddingTileId;

        // invert randomly
        if (rand() < o.chanceHoleInvert) {
            patternShape = invertMatrix(patternShape);
            paddingTileId = TILE_ID.AIR;
        }

        // scale randomly
        const maxScaleX = Math.floor(gridWidth / patternWidth);
        const maxScaleY = Math.floor(gridHeight / patternHeight);
        const maxScale = Math.min(maxScaleX, maxScaleY);
        if (maxScale < 1) continue; // Skip if even 1x doesn't fit
        const scale = 1 + Math.floor((1 - rand()**2) * maxScale);
        patternHeight = patternHeight * scale;
        patternWidth = patternWidth * scale;

        // randomly find a valid, non-overlapping position
        const validXRange = gridWidth - patternWidth;
        const validYRange = gridHeight - patternHeight;
        for (let posAttempt = 0; posAttempt < 10; posAttempt++) {
            const startX = Math.floor(rand() * (validXRange + 1));
            const startY = Math.floor(rand() * (validYRange + 1));

            if (canPlacePatternAt(placementGrid, startX, startY, patternWidth, patternHeight)) {
                console.log(pattern.name);
                placePattern(grid, placementGrid, patternShape, startX, startY, scale, tileId, paddingTileId);
                break;
            }
        }
    }
}

function rotateMatrix(matrix, rotations=0) {
    for (let r = 0; r < rotations; r++) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const newMatrix = Array(cols).fill(0).map(() => Array(rows).fill(0));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                newMatrix[c][rows - 1 - r] = matrix[r][c];
            }
        }
        matrix = newMatrix;
    }
    return matrix;
}

function invertMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const newMatrix = Array(rows).fill(1).map(() => Array(cols).fill(1));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            newMatrix[r][c] = 1 - matrix[r][c];
        }
    }
    return newMatrix;
}


function canPlacePatternAt(placementGrid, startX, startY, width, height) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (placementGrid[startX + x]?.[startY + y]) {
                return false;
            }
        }
    }
    return true;
}

function placePattern(targetGrid, placementGrid, pattern, startX, startY, scale, tileId, paddingTileId) {
    const patternHeight = pattern.length;
    const patternWidth = pattern[0].length;

    const placePatternTile = (x, y, id) => {
        if (targetGrid[x]?.[y] !== undefined) {
            targetGrid[x][y] = id;
            placementGrid[x][y] = true;
        }
    };
    // padding
    if (paddingTileId !== undefined) {
        for (let x = startX - 1; x <= startX + scale*patternWidth; x++) {
            placePatternTile(x, startY - 1, paddingTileId);
            placePatternTile(x, startY + scale*patternHeight, paddingTileId);
        }
        for (let y = startY; y < startY + scale*patternHeight; y++) {
            placePatternTile(startX - 1, y, paddingTileId);
            placePatternTile(startX + scale*patternWidth, y, paddingTileId);
        }
    }
    // normal pattern
    for (let py = 0; py < patternHeight; py++) {
        for (let px = 0; px < patternWidth; px++) {
            if (pattern[py][px] === 1) {
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const gridX = startX + px * scale + sx;
                        const gridY = startY + py * scale + sy;
                        placePatternTile(gridX, gridY, tileId);
                    }
                }
            }
        }
    }
}
















// seeded random number generator from stackoverflow
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}



function splitmix32(a) {
    return function() {
        a |= 0;
        a = a + 0x9e3779b9 | 0;
        let t = a ^ a >>> 16;
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ t >>> 15;
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
}







export function generateRandomB64String(length) {
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  const base64String = btoa(String.fromCharCode.apply(null, randomBytes));
  return base64String
    .replace(/\+/g, '-') // Replace '+' with '-'
    .replace(/\//g, '_') // Replace '/' with '_'
    .replace(/=/g, '')   // Remove padding '='
    .substring(0, length);
}
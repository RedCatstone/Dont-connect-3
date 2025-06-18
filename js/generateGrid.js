import { genPatterns } from './genPatterns.js';
import { o, ALL_TILE_BLOCKS, shuffleArray, TILE_ID } from './game.js';






export function generateGrid(seed) {
    const rand = splitmix32(cyrb128(seed)[0]);

    // grid size
    const total = Math.log(o.level + 1) / Math.log(o.levelSizeGrowFactor);
    const randomSplit = rand() * total/4;
    o.width = 2 + Math.round(total/4 + randomSplit);
    o.height = 2 + Math.round(total/2 - randomSplit);

    // available tiles
    o.availableTiles = ALL_TILE_BLOCKS.slice(0, Math.ceil(Math.sqrt(o.level)));
    o.availableTiles = shuffleArray(o.availableTiles, rand).filter((x, i) => i === 0 || rand() > 0.5 + i * 0.1);   // always keep first, but randomly filter others

    // bot amount
    o.botAmount = Math.ceil(rand() * Math.log(o.level)) ?? 0;
    // o.botAmount = 10000;

    o.grid = Array(o.width).fill(null).map(() => Array(o.height).fill(TILE_ID.GRID));

    // holes (perlin noise)
    if (o.level > 5) {
        if (rand() < o.chanceHoles) {
            const numPatterns = Math.floor(rand() * Math.log(o.level)) ?? 0;
            placeTileRandomPattern(TILE_ID.AIR, numPatterns, rand);
        }
    }

    if (o.level > 10) {

    }
}


function placeTileRandomPattern(tileId, numPatterns, rand) {
    const placementGrid = Array(o.width).fill(null).map(() => Array(o.height).fill(false));

    const filteredGenPatterns = genPatterns.filter(pattern => pattern.shape.length <= o.height && pattern.shape[0].length <= o.width);

    for (let i = 0; i < numPatterns; i++) {
        // Pick a random pattern
        let pattern = filteredGenPatterns[Math.floor(rand() * filteredGenPatterns.length)];

        // rotate randomly
        if (!pattern.noRotate) {
            const rotations = Math.floor(rand() * 4);  // 0 to 3
            pattern.shape = rotateMatrix(pattern.shape, rotations);
        }

        let patternHeight = pattern.shape.length;
        let patternWidth = pattern.shape[0].length;

        // scale randomly
        const maxScaleX = Math.floor(o.width / patternWidth);
        const maxScaleY = Math.floor(o.height / patternHeight);
        const maxScale = Math.min(maxScaleX, maxScaleY);
        if (maxScale < 1) continue; // Skip if even 1x doesn't fit
        const scale = 1 + Math.floor((1 - rand()**2) * maxScale);
        patternHeight = patternHeight * scale;
        patternWidth = patternWidth * scale;

        // randomly find a valid, non-overlapping position
        const validXRange = o.width - patternWidth;
        const validYRange = o.height - patternHeight;
        for (let posAttempt = 0; posAttempt < 10; posAttempt++) {
            const startX = Math.floor(rand() * (validXRange + 1));
            const startY = Math.floor(rand() * (validYRange + 1));

            if (canPlacePatternAt(placementGrid, startX, startY, patternWidth, patternHeight)) {
                placePattern(o.grid, placementGrid, pattern.shape, startX, startY, scale, tileId);
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
function placePattern(targetGrid, placementGrid, pattern, startX, startY, scale, tileId) {
    const baseHeight = pattern.length;
    const baseWidth = pattern[0].length;

    for (let by = 0; by < baseHeight; by++) {
        for (let bx = 0; bx < baseWidth; bx++) {
            if (pattern[by][bx] === 1) {
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const gridX = startX + bx * scale + sx;
                        const gridY = startY + by * scale + sy;
                        if (targetGrid[gridX]?.[gridY] !== undefined) {
                           targetGrid[gridX][gridY] = tileId;
                           placementGrid[gridX][gridY] = true;
                        }
                    }
                }
            }
        }
    }
}

















// seeded random number generators from stackoverflow
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
  const urlSafeBase64 = base64String
    .replace(/\+/g, '-') // Replace '+' with '-'
    .replace(/\//g, '_') // Replace '/' with '_'
    .replace(/=/g, '');  // Remove padding '='
  return urlSafeBase64.substring(0, length);
}
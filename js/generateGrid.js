import { shuffleArray } from './game.js';
import { o, TILE, ALL_TILE_BLOCKS, holePatterns } from './constants.js';





export function generateGrid(seed, level) {
    const rand = getRandomFunction(seed + level + seed);

    // grid size
    const total = (Math.log(level + 1) * o.levelSizeMultiplier);
    const randomSplit = rand() * total/4;
    const gridHeight = 2 + Math.round(total/2 - randomSplit);
    const gridWidth = 2 + Math.round(total/4 + randomSplit);

    // walls
    const grid = generateWallsDrunkenWalk(gridHeight, gridWidth, rand);
    resizeGridToFit(grid);

    // symmetry
    if (rand() > o.chanceSymmetry) matrixSymmetrieLeftRight(grid);
    if (rand() > o.chanceSymmetry) matrixSymmetrieUpDown(grid);

    replaceSmallAreaTiles(grid, 2, TILE.WALL, TILE.GRID);
    replaceSmallAreaTiles(grid, 2, TILE.GRID, TILE.WALL);
    resizeGridToFit(grid);
    
    
    // holes (patterns)
    if (level > 9 && rand() < o.chanceHoles) {
        const numPatterns = Math.ceil(rand() * Math.log(level)) ?? 0;
        placeRandomHolePatterns(numPatterns, grid, rand);
    }

    // available tiles
    const availableTiles = [];
    const futureAvailableTiles = [];
    let maybeTiles = ALL_TILE_BLOCKS.slice(0, Math.ceil(Math.sqrt(level)));
    shuffleArray(maybeTiles, rand);
    for (const [i, tile] of maybeTiles.entries()) {
        if (i === 0 || rand() > 0.5 + i * 0.1) {   // always keep first, but randomly filter others
            if (i === 0 || rand() > o.chanceLockedTile) availableTiles.push(tile);
            else futureAvailableTiles.push(tile);
        }
    }

    // bot amount
    const botAmount = Math.floor(rand() * Math.log(level) * o.botAmountMultiplier) || 0;

    return { grid, availableTiles, futureAvailableTiles, botAmount };
}



export function create2dGrid(height, width, fill) {
    return Array(height).fill(null).map(() => Array(width).fill(fill));
}















export function randomTransformPattern(pattern, rand, gridHeight, gridWidth) {
    let patternShape = pattern.shape
    let patternHeight = patternShape.length;
    let patternWidth = patternShape[0].length;

    // flip randomly
    if (rand() > 0.5) patternShape = flipMatrixHorizontal(patternShape);

    // rotate randomly
    if (!pattern.noRotate) {
        const fitsAsIs = patternHeight <= gridHeight && patternWidth <= gridWidth;
        const fitsRotated = patternHeight <= gridWidth && patternWidth <= gridHeight;

        let rotations;
        if (fitsAsIs && fitsRotated) rotations = Math.floor(rand() * 4); // 0, 1, 2, or 3
        else if (fitsAsIs) rotations = Math.round(rand()) * 2; // 0 or 2
        else if (fitsRotated) rotations = Math.round(rand()) * 2 + 1; // 1 or 3
        patternShape = rotateMatrix(patternShape, rotations);
        
        if (rotations === 1 || rotations === 3) {
            [patternHeight, patternWidth] = [patternWidth, patternHeight];
        }
    }

    // scale randomly
    const maxScaleY = Math.floor(gridHeight / patternHeight);
    const maxScaleX = Math.floor(gridWidth / patternWidth);
    const maxScale = Math.min(maxScaleY, maxScaleX);
    const scale = 1 + Math.floor((1 - rand()**2) * maxScale);
    patternShape = scaleMatrix(patternShape, scale);

    return patternShape;
}

function rotateMatrix(matrix, rotations=0) {
    if (rotations % 4 === 0) return matrix;
    for (let r = 0; r < rotations; r++) {
        const height = matrix.length;
        const width = matrix[0].length;
        const newMatrix = Array(width).fill(null).map(() => Array(height));
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                newMatrix[x][height - 1 - y] = matrix[y][x];
            }
        }
        matrix = newMatrix;
    }
    return matrix;
}
function flipMatrixHorizontal(matrix) {
    const height = matrix.length;
    const width = matrix[0].length;
    const newMatrix = Array(height).fill(null).map(() => Array(width));
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const mirroredX = width - 1 - x;
            newMatrix[y][mirroredX] = matrix[y][x];
        }
    }
    return newMatrix;
}
function scaleMatrix(matrix, scale) {
    if (scale === 1) return matrix;
    const height = Math.round(matrix.length * scale);
    const width = Math.round(matrix[0].length * scale);
    const newMatrix = Array(height).fill(null).map(() => Array(width));
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const originalY = Math.floor(y / scale);
            const originalX = Math.floor(x / scale);
            newMatrix[y][x] = matrix[originalY][originalX];
        }
    }
    return newMatrix;
}





function matrixSymmetrieLeftRight(matrix) {
    const height = matrix.length;
    const width = matrix[0].length;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width / 2; x++) {
            const mirroredX = width - 1 - x;
            matrix[y][mirroredX] = matrix[y][x];
        }
    }
    return matrix;
}
function matrixSymmetrieUpDown(matrix) {
    const height = matrix.length;
    const width = matrix[0].length;
    for (let y = 0; y < height / 2; y++) {
        for (let x = 0; x < width; x++) {
            const mirroredY = height - 1 - y;
            matrix[mirroredY][x] = matrix[y][x];
        }
    }
    return matrix;
}















function placeRandomHolePatterns(numPatterns, grid, rand) {
    const gridHeight = grid.length;
    const gridWidth = grid[0].length;

    const filteredGenPatterns = holePatterns.filter(pattern => {
        const patternHeight = pattern.shape.length;
        const patternWidth = pattern.shape[0].length;
        // if it fits with/without rotations
        return (patternHeight <= gridHeight && patternWidth <= gridWidth) || (!pattern.noRotate && patternWidth <= gridHeight && patternHeight <= gridWidth);
    });
    if (filteredGenPatterns.length === 0) return;
    
    const placementGrid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));

    for (let i = 0; i < numPatterns; i++) {
        // Pick a random pattern
        const pattern = filteredGenPatterns[Math.floor(rand() * filteredGenPatterns.length)];
        const patternShape = randomTransformPattern(pattern, rand, gridWidth, gridHeight);
        const patternHeight = patternShape.length;
        const patternWidth = patternShape[0].length;

        // invert randomly
        const invertGridAir = rand() < o.chanceHoleInvert;

        // randomly find a valid, non-overlapping position
        const validYRange = gridHeight - patternHeight;
        const validXRange = gridWidth - patternWidth;
        for (let posAttempt = 0; posAttempt < 10; posAttempt++) {
            const startY = Math.floor(rand() * (validYRange + 1));
            const startX = Math.floor(rand() * (validXRange + 1));

            if (canPlacePatternAt(placementGrid, grid, startY, startX, patternWidth, patternHeight)) {
                const placeTiles = [TILE.AIR, TILE.GRID];
                if (invertGridAir) placeTiles.reverse();
                placePattern(grid, placementGrid, patternShape, startY, startX, ...placeTiles);
                break;
            }
        }
    }
}







function canPlacePatternAt(placementGrid, grid, startY, startX, width, height) {
    const MAX_WALL_RATIO = 0.1;

    let wallCounter = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (placementGrid[startY + y]?.[startX + x]) {
                return false;
            }
            if (grid[startY + y]?.[startX + x] === TILE.WALL) wallCounter++;
        }
    }
    return wallCounter / (width * height) <= MAX_WALL_RATIO;
}




function placePattern(grid, placementGrid, patternShape, startY, startX, mainTile, paddingTile) {
    const patternHeight = patternShape.length;
    const patternWidth = patternShape[0].length;

    const placePatternTile = (y, x, id, overwriteWalls) => {
        if (grid[y]?.[x] !== undefined && (overwriteWalls || grid[y][x] !== TILE.WALL)) {
            grid[y][x] = id;
            placementGrid[y][x] = true;
        }
    };

    let mainTileCoords = [];
    // padding
    for (let y = 0; y < patternHeight; y++) {
        for (let x = 0; x < patternWidth; x++) {
            if (patternShape[y][x] === 1) {
                const gridY = startY + y;
                const gridX = startX + x;
                mainTileCoords.push([gridY, gridX]);
                // +
                placePatternTile(gridY, gridX+1, paddingTile);
                placePatternTile(gridY, gridX-1, paddingTile);
                placePatternTile(gridY+1, gridX, paddingTile);
                placePatternTile(gridY-1, gridX, paddingTile);
                // x
                placePatternTile(gridY+1, gridX+1, paddingTile);
                placePatternTile(gridY+1, gridX-1, paddingTile);
                placePatternTile(gridY-1, gridX+1, paddingTile);
                placePatternTile(gridY-1, gridX-1, paddingTile);
            }
        }
    }
    // actually place the pattern
    for (const [y, x] of mainTileCoords) {
        placePatternTile(y, x, mainTile, true);
    }
}













function generateWallsPattern(gridWidth, gridHeight, rand) {    
    const PROBABILITY_SKEW_FACTOR = 4;  // higher = more likely to pick best fit

    const gridArea = gridWidth * gridHeight;
    const gridAspectRatio = gridWidth / gridHeight;

    const scoredPatterns = wallPatterns.map(pattern => {
        const pHeight = pattern.shape.length;
        const pWidth = pattern.shape[0].length;
        const pArea = pWidth * pHeight;
        const pAspectRatio = pWidth / pHeight;

        const areaDiff = Math.abs(gridArea - pArea) / Math.max(gridArea, pArea);
        const aspectDiff = Math.abs(gridAspectRatio - pAspectRatio) / Math.max(gridAspectRatio, pAspectRatio);
        let fitnessScore = areaDiff + aspectDiff;

        if (!pattern.noRotate) {
            const rotatedAspectDiff = Math.abs(gridAspectRatio - (1 / pAspectRatio)) / Math.max(gridAspectRatio, (1/ pAspectRatio));
            const rotatedFitnessScore = areaDiff + rotatedAspectDiff;
            fitnessScore = Math.min(fitnessScore, rotatedFitnessScore);
        }
        const weight = Math.pow(1 - Math.min(fitnessScore, 0.99), PROBABILITY_SKEW_FACTOR);
        return { pattern, weight };
    });

    // --- Weighted Random Selection ---
    const totalWeight = scoredPatterns.reduce((tot, x) => tot + x.weight, 0);
    let randomWeight = rand() * totalWeight;

    let chosenPatternData = null;
    for (const item of scoredPatterns) {
        randomWeight -= item.weight;
        if (randomWeight <= 0) {
            chosenPatternData = item.pattern;
            break;
        }
    }
    // Fallback in case of floating point issues or all weights being zero
    if (!chosenPatternData) chosenPatternData = scoredPatterns[scoredPatterns.length - 1].pattern;

    const patternShape = randomTransformPattern(chosenPatternData, rand, gridHeight, gridWidth);
    const patternHeight = patternShape.length;
    const patternWidth = patternShape[0].length;

    const grid = create2dGrid(gridHeight, gridWidth, TILE.WALL);
    // strech the pattern onto the grid
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const sourceX = (x / (gridWidth - 1)) * (patternWidth - 1);
            const sourceY = (y / (gridHeight - 1)) * (patternHeight - 1);

            const x1 = Math.floor(sourceX);
            const y1 = Math.floor(sourceY);
            const x2 = Math.min(x1 + 1, patternWidth - 1);
            const y2 = Math.min(y1 + 1, patternHeight - 1);

            const p11 = patternShape[y1][x1];
            const p12 = patternShape[y2][x1];
            const p21 = patternShape[y1][x2];
            const p22 = patternShape[y2][x2];

            const xFrac = sourceX - x1;
            const yFrac = sourceY - y1;

            const top = p11 * (1 - xFrac) + p21 * xFrac;
            const bottom = p12 * (1 - xFrac) + p22 * xFrac;
            if (top * (1 - yFrac) + bottom * yFrac > 0.5) grid[y][x] = TILE.GRID;
        }
    }
    return grid;
}











function generateWallsDrunkenWalk(gridHeight, gridWidth, rand) {
    const STEP_MULTIPLIER = 1.5 + 3.5 * rand();  // 1.5 to 5
    const RESPAWN_CHANCE = 0.02;

    const grid = create2dGrid(gridHeight, gridWidth, TILE.WALL);

    const totalSteps = Math.floor((gridHeight * gridWidth) * STEP_MULTIPLIER);
    let stepsTaken = 0;

    let centerY = Math.floor(gridHeight / 2);
    let centerX = Math.floor(gridWidth / 2);
    
    // start in the center
    let walkerY = centerY;
    let walkerX = centerX;

    while (stepsTaken < totalSteps) {
        grid[walkerY][walkerX] = TILE.GRID;

        const direction = Math.floor(rand() * 4);
        if (direction === 2 && walkerY > 0) walkerY--;
        else if (direction === 3 && walkerY < gridHeight - 1) walkerY++;
        else if (direction === 0 && walkerX > 0) walkerX--;
        else if (direction === 1 && walkerX < gridWidth - 1) walkerX++;

        // walker dies :((
        if (rand() < RESPAWN_CHANCE) [walkerY, walkerX] = [centerY, centerX];
        
        stepsTaken++;
    }
    return grid;
}


















function resizeGridToFit(grid) {
    const gridHeight = grid.length;
    const gridWidth = grid[0].length;

    let minY = gridHeight;
    let maxY = 0;
    let minX = gridWidth;
    let maxX = 0;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (grid[y][x] !== TILE.WALL) {
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
            }
        }
    }
    // modify in place
    grid.splice(maxY + 1);
    grid.splice(0, minY);
    for (let y = 0; y < grid.length; y++) {
        grid[y] = grid[y].slice(minX, maxX + 1);
    }
    return grid;
}


function replaceSmallAreaTiles(grid, threshold, targetTileId, replaceTileId) {
    const gridHeight = grid.length;
    const gridWidth = grid[0].length;
    const visited = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (visited[y][x] || grid[y][x] !== targetTileId) continue;
            // new island :o

            const curIslandCoords = [];
            const queue = [[y, x]];
            visited[y][x] = true;

            while (queue.length > 0) {
                const current = queue.shift();
                const [curY, curX] = current;
                curIslandCoords.push(current);

                // check all 4 neighbors
                for (const neighbor of [[curY+1, curX], [curY-1, curX], [curY, curX+1], [curY, curX-1]]) {
                    const [ny, nx] = neighbor;
                    if (ny >= 0 && ny < gridHeight && nx >= 0 && nx < gridWidth &&
                        !visited[ny][nx] && grid[ny][nx] === targetTileId) {
                        
                        visited[ny][nx] = true;
                        queue.push(neighbor);
                    }
                }
            }
            if (curIslandCoords.length <= threshold) {
                const isTouchingBorder = curIslandCoords.some(([tileY, tileX]) => 
                    tileY === 0 || tileY === gridHeight - 1 || tileX === 0 || tileX === gridWidth - 1
                );
                // it either is NOT a wall OR it IS a wall but its NOT touching the border
                if (targetTileId !== TILE.WALL || !isTouchingBorder) {
                    for (const [curY, curX] of curIslandCoords) {
                        grid[curY][curX] = replaceTileId;
                    }
                }
            }
        }
    }
}



















// seeded random number generator from stackoverflow
export function getRandomFunction(seed) {
    return sfc32(...cyrb128(seed));
}

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
function sfc32(a, b, c, d) {
    return function() {
        a |= 0; b |= 0; c |= 0; d |= 0;
        let t = (a + b | 0) + d | 0;
        d = d + 1 | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}







export function generateRandomB64String(length) {
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  const base64String = btoa(String.fromCharCode.apply(null, randomBytes));
  return base64String
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .substring(0, length);
}
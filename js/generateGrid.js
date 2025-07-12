import { genPatterns } from './genPatterns.js';
import { o, ALL_TILE_BLOCKS, shuffleArray, TILE } from './game.js';





export function generateGrid(seed, level) {
    const rand = getRandomFunction(seed + level + seed);

    // grid size
    const total = (Math.log(level + 1) * o.levelSizeMultiplier);
    const randomSplit = rand() * total/4;
    let gridWidth = 2 + Math.round(total/4 + randomSplit);
    let gridHeight = 2 + Math.round(total/2 - randomSplit);
    let grid = create2dGrid(gridWidth, gridHeight, TILE.GRID);

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
    const botAmount = Math.ceil(rand() * Math.log(level) * o.botAmountMultiplier) || 0;

    // walls
    if (level > 4 && rand() < o.chanceDrunkWalls) {
        grid = generateDrunkenWalkWalls(gridWidth, gridHeight, rand);
        const { newGrid, newWidth, newHeight } = resizeGridToFit(grid);
        grid = newGrid;
        gridWidth = newWidth;
        gridHeight = newHeight;
        replaceSmallAreaTiles(grid, 2, TILE.WALL, TILE.GRID);
    }
    
    // holes (patterns)
    if (level > 9 && rand() < o.chanceHoles) {
        const numPatterns = Math.ceil(rand() * Math.log(level)) ?? 0;
        placeRandomHolePatterns(numPatterns, grid, rand);
    }


    return { grid, availableTiles, futureAvailableTiles, botAmount };
}



export function create2dGrid(width, height, fill) {
    return Array(width).fill(null).map(() => Array(height).fill(fill));
}









function placeRandomHolePatterns(numPatterns, grid, rand) {
    const gridWidth = grid.length;
    const gridHeight = grid[0].length;

    const filteredGenPatterns = genPatterns.filter(pattern => {
        const patternHeight = pattern.shape.length;
        const patternWidth = pattern.shape[0].length;
        // if it fits with/without rotations
        return (patternHeight <= gridHeight && patternWidth <= gridWidth) || (!pattern.noRotate && patternWidth <= gridHeight && patternHeight <= gridWidth);
    });
    if (filteredGenPatterns.length === 0) return;
    
    const placementGrid = Array(gridWidth).fill(null).map(() => Array(gridHeight).fill(false));

    for (let i = 0; i < numPatterns; i++) {
        // Pick a random pattern
        let pattern = filteredGenPatterns[Math.floor(rand() * filteredGenPatterns.length)];
        let patternShape = pattern.shape;
        
        let patternHeight = patternShape.length;
        let patternWidth = patternShape[0].length;

        // rotate randomly
        if (!pattern.noRotate) {
            const fitsAsIs = patternHeight <= gridHeight && patternWidth <= gridWidth;
            const fitsRotated = patternHeight <= gridWidth && patternWidth <= gridHeight;

            let rotations;
            if (fitsAsIs && fitsRotated) rotations = Math.floor(rand() * 4); // 0, 1, 2, or 3
            else if (fitsAsIs) rotations = Math.round(rand()) * 2; // 0 or 2
            else if (fitsRotated) rotations = Math.round(rand()) * 2 + 1; // 1 or 3
            else throw new Error("huh? how this possbiel with the roation and stuff?");
            patternShape = rotateMatrix(patternShape, rotations);
            
            if (rotations === 1 || rotations === 3) {
                [patternHeight, patternWidth] = [patternWidth, patternHeight];
            }
        }

        // scale randomly
        const maxScaleX = Math.floor(gridWidth / patternWidth);
        const maxScaleY = Math.floor(gridHeight / patternHeight);
        const maxScale = Math.min(maxScaleX, maxScaleY);
        if (maxScale < 1) continue; // Skip if even 1x doesn't fit
        const scale = 1 + Math.floor((1 - rand()**2) * maxScale);
        patternHeight *= scale;
        patternWidth *= scale;

        // invert randomly
        let invert = rand() < o.chanceHoleInvert;

        // randomly find a valid, non-overlapping position
        const validXRange = gridWidth - patternWidth;
        const validYRange = gridHeight - patternHeight;
        for (let posAttempt = 0; posAttempt < 10; posAttempt++) {
            const startX = Math.floor(rand() * (validXRange + 1));
            const startY = Math.floor(rand() * (validYRange + 1));

            if (canPlacePatternAt(placementGrid, startX, startY, patternWidth, patternHeight)) {
                const placeTiles = [TILE.AIR, TILE.GRID];
                if (invert) placeTiles.reverse();
                placePattern(grid, placementGrid, patternShape, startX, startY, scale, ...placeTiles);
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




function placePattern(grid, placementGrid, pattern, startX, startY, scale, mainTile, paddingTile) {
    const patternHeight = pattern.length;
    const patternWidth = pattern[0].length;

    const placePatternTile = (x, y, id, overwriteWalls) => {
        if (grid[x]?.[y] !== undefined && (overwriteWalls || grid[x][y] !== TILE.WALL)) {
            grid[x][y] = id;
            placementGrid[x][y] = true;
        }
    };


    let coordsToPlaceTile1 = [];

    // padding
    for (let py = 0; py < patternHeight; py++) {
        for (let px = 0; px < patternWidth; px++) {
            const patternNum = pattern[py][px];
            if (patternNum === 1) {
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const gridX = startX + px * scale + sx;
                        const gridY = startY + py * scale + sy;
                        coordsToPlaceTile1.push([gridX, gridY]);

                        placePatternTile(gridX+1, gridY, paddingTile);
                        placePatternTile(gridX-1, gridY, paddingTile);
                        placePatternTile(gridX, gridY+1, paddingTile);
                        placePatternTile(gridX, gridY-1, paddingTile);

                        placePatternTile(gridX+1, gridY+1, paddingTile);
                        placePatternTile(gridX-1, gridY+1, paddingTile);
                        placePatternTile(gridX+1, gridY-1, paddingTile);
                        placePatternTile(gridX-1, gridY-1, paddingTile);
                    }
                }
            }
        }
    }
    // actually place the pattern
    for (const [x, y] of coordsToPlaceTile1) {
        placePatternTile(x, y, mainTile, true);
    }
}






function generateDrunkenWalkWalls(gridWidth, gridHeight, rand) {
    const grid = Array(gridWidth).fill(0).map(() => Array(gridHeight).fill(TILE.WALL));

    const totalSteps = Math.floor((gridWidth * gridHeight) * o.drunkStepMultiplier);
    let stepsTaken = 0;

    let centerX = Math.floor(gridWidth / 2);
    let centerY = Math.floor(gridWidth / 2);
    
    // start in the center
    let [walkerX, walkerY] = [centerX, centerY];

    while (stepsTaken < totalSteps) {
        grid[walkerX][walkerY] = TILE.GRID;

        const direction = Math.floor(rand() * 4);
        if (direction === 0 && walkerX > 0) walkerX--;
        else if (direction === 1 && walkerX < gridWidth - 1) walkerX++;
        else if (direction === 2 && walkerY > 0) walkerY--;
        else if (direction === 3 && walkerY < gridHeight - 1) walkerY++;

        // walker dies :((
        if (rand() < o.drunkRespawnChance) [walkerX, walkerY] = [centerX, centerY]
        
        stepsTaken++;
    }

    return grid;
}




function resizeGridToFit(grid) {
    const gridWidth = grid.length;
    const gridHeight = grid[0].length;

    let minX = gridWidth;
    let maxX = 0;
    let minY = gridHeight;
    let maxY = 0;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (grid[x][y] !== TILE.WALL) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    const newWidth = maxX - minX + 1;
    const newHeight = maxY - minY + 1;
    const newGrid = Array(newWidth).fill(null).map(() => Array(newHeight));

    for (let nx = 0; nx < newWidth; nx++) {
        for (let ny = 0; ny < newHeight; ny++) {
            newGrid[nx][ny] = grid[nx + minX][ny + minY];
        }
    }
    return { newGrid, newWidth, newHeight };
}


function replaceSmallAreaTiles(grid, threashold, targetTileId, replaceTileId) {
    const gridWidth = grid.length;
    const gridHeight = grid[0].length;
    const visited = Array(gridWidth).fill(null).map(() => Array(gridHeight).fill(false));

    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            if (visited[x][y] || grid[x][y] !== targetTileId) continue;
            // new island :o

            const curIslandCoords = [];
            const queue = [[x, y]];
            visited[x][y] = true;

            while (queue.length > 0) {
                const current = queue.shift();
                const [curX, curY] = current;
                curIslandCoords.push(current);

                // check all 4 neighbors
                for (const neighbor of [[curX+1, curY], [curX-1, curY], [curX, curY+1], [curX, curY-1]]) {
                    const [nx, ny] = neighbor;
                    if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight &&
                        !visited[nx][ny] && grid[nx][ny] === targetTileId) {
                        
                        visited[nx][ny] = true;
                        queue.push(neighbor);
                    }
                }
            }
            if (curIslandCoords.length <= threashold) {
                // smol island :o
                for (const [curX, curY] of curIslandCoords) {
                    grid[curX][curY] = replaceTileId;
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
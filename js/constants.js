import { placeRandomTiles } from "./game.js";
import { create2dGrid } from "./generateGrid.js";

// Tile Ids
export const TILE = {
    WALL: 1,
    GRID: 2,
    AIR: 3,
    RED: 5,
    BLUE: 6,
    YELLOW: 7,
    PURPLE: 8,
    WHITE: 9,
}
const T = TILE;

// Map tile IDs to CSS classes
export const TILE_CLASS_MAP = {
    [TILE.WALL]: 'tile wall',
    [TILE.AIR]: 'tile air',
    [TILE.GRID]: 'tile grid',
    [TILE.RED]: 'tile block tile-red',
    [TILE.BLUE]: 'tile block tile-blue',
    [TILE.YELLOW]: 'tile block tile-yellow',
    [TILE.PURPLE]: 'tile block tile-purple',
    [TILE.WHITE]: 'tile block tile-white'
};

export const TILE_BLOCK_COLOR_MAP = {
    [TILE.RED]: 'var(--tile-color-red)',
    [TILE.BLUE]: 'var(--tile-color-blue)',
    [TILE.YELLOW]: 'var(--tile-color-yellow)',
    [TILE.PURPLE]: 'var(--tile-color-purple)',
    [TILE.WHITE]: 'var(--tile-color-white)',
};

export const ALL_TILE_BLOCKS = Object.keys(TILE_BLOCK_COLOR_MAP).map(Number);





const STORAGE_KEY = 'dontConnect3';
export const STATS = getStats();

function getStats() {
    try {
        const rawStats = localStorage.getItem(STORAGE_KEY);
        return rawStats ? JSON.parse(rawStats) : {};
    } catch (error) {
        console.error("Failed to parse stats from localStorage:", error);
        return {};
    }
}
export function saveStats() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(STATS));
    } catch (error) {
        console.error("Failed to save stats to localStorage:", error);
    }
}








export const o = {
    // grid generated
    grid: null,
    gridHeight: null,
    gridWidth: null,
    availableTiles: null,
    futureAvailableTiles: null,
    botAmount: null,
    spotsLeftGrid: null,

    // generation settings
    levelSizeMultiplier: 6,
    botAmountMultiplier: 1,
    chanceHoles: 0.5,
    chanceHoleInvert: 0.3,
    chanceLockedTile: 0.5,
    chanceSymmetry: 0.5,

    // variables
    seed: null,
    level: null,
    hardcodedLevels: null,
    time: performance.now(),
    selectedAvailableTile: 0,
    inputDisabled: false,
    spotsLeftCount: null,
    lives: null,
    endScreen: false,
    blocksPlaced: null,
    mistakes: null,
    hintsUsed: null,
    levelTimeDeathTime: null,
    globalTimeDeathTime: null,
    activeCountdowns: {},
    tutorialDissallowValidMoves: false,
    levelDialogue: null,
    levelDialogueStep: null,
    previousBestLevel: null,
    modeSettings: null,

    STATS,
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
    volume: 1,
    winLooseTimeout: 1500,

    placeRandomTiles
}
window.o = o;



















export const HARDCODED_TUTORIAL_LEVELS = {
    1: {
        grid: create2dGrid(3, 5, T.GRID),
        availableTiles: [T.RED],
        futureAvailableTiles: [],
        levelDialogue: [
            { text: "Tap an empty spot to place a tile.", waitFor: 'tile_place' },
            { text: "Alright, try to place another tile!", waitFor: 'tile_place' },
            { text: "The grid is complete if you can't place any more tiles.", waitFor: 'grid_complete' }
        ],
    },
    2: {
        grid: create2dGrid(6, 6, T.GRID),
        availableTiles: [T.RED],
        futureAvailableTiles: [],
        levelDialogue: [
            { text: "Nice! Let's try a larger grid.", waitFor: 'grid_complete' }
        ],
    },
    3: {
        grid: [
            [T.GRID,T.GRID,T.GRID,T.WALL,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.WALL,T.GRID,T.GRID,T.GRID],
        ],
        availableTiles: [T.RED],
        futureAvailableTiles: [],
        levelDialogue: [
            { text: "Neat! Now solve this one.", waitFor: 'grid_complete' }
        ],
    },
    4: {
        grid: [
            [T.GRID,T.WALL,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.WALL,T.GRID],
        ],
        availableTiles: [T.RED],
        futureAvailableTiles: [T.BLUE],
        levelDialogue: [
            { text: "Keep going!", waitFor: 'color_complete' },
            { text: "Blue unlocked. Select it!", textColor: "blue", waitFor: 'grid_complete' }
        ],
    },
    5: {
        grid: [
            [T.WALL,T.GRID,T.GRID,T.GRID,T.WALL],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.WALL,T.GRID,T.GRID,T.GRID,T.WALL],
        ],
        availableTiles: [T.RED],
        futureAvailableTiles: [T.BLUE, T.PURPLE],
        levelDialogue: [
            { text: "If you ever get stuck, use a Hint.", waitFor: 'grid_complete' },
            { text: "Tutorial Complete!" }
        ],
    },
};























export const holePatterns = [
    {
        name: 'Donut',
        shape: [
            [1,1,1,1],
            [1,0,0,1],
            [1,0,0,1],
            [1,1,1,1],
        ]
    },
    {
        name: 'Thin L',
        shape: [
            [1,0,0],
            [1,0,0],
            [1,1,1],
        ]
    },
    {
        name: 'Thick L',
        canWall: true,
        shape: [
            [1,1,0,0],
            [1,1,0,0],
            [1,1,1,1],
            [1,1,1,1],
        ]
    },
    {
        name: 'Bar',
        shape: [
            [1,1,1,1,1],
            [1,1,1,1,1],
        ]
    },
    {
        name: 'Plus',
        canWall: true,
        shape: [
            [0,0,1,1,0,0],
            [0,0,1,1,0,0],
            [1,1,1,1,1,1],
            [1,1,1,1,1,1],
            [0,0,1,1,0,0],
            [0,0,1,1,0,0],
        ]
    },
    {
        name: 'X',
        canWall: true,
        shape: [
            [1,1,0,0,0,1,1],
            [1,1,1,0,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,1,1,0,1,1,1],
            [1,1,0,0,0,1,1],
        ]
    },
    {
        name: 'Heart',
        noRotate: true,
        canWall: true,
        shape: [
            [0,1,1,0,1,1,0],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
            [0,0,0,1,0,0,0],
        ]
    },
    {
        name: 'Pacman',
        shape: [
            [0,0,1,1,1,1,0],
            [0,1,1,1,1,1,1],
            [1,1,1,1,1,0,0],
            [1,1,1,0,0,0,0],
            [1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1],
            [0,0,1,1,1,1,0],
        ]
    },
    {
        name: 'Ghost',
        noRotate: true,
        canWall: true,
        shape: [
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,1,0,1,0,1,1],
            [1,0,0,1,0,0,1],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [1,0,1,0,1,0,1],
        ]
    },
    {
        name: 'Labyrinth',
        shape: [
            [0,0,0,0,1,0,0],
            [0,1,1,1,1,1,0],
            [0,1,0,0,0,0,0],
            [0,1,0,1,1,1,1],
            [0,1,0,1,0,0,0],
            [0,1,1,1,1,1,0],
            [0,0,0,0,0,0,0],
        ]
    },
    {
        name: 'Creeper',
        noRotate: true,
        canWall: true,
        shape: [
            [1,1,0,0,1,1],
            [1,1,0,0,1,1],
            [0,0,1,1,0,0],
            [0,1,1,1,1,0],
            [0,1,1,1,1,0],
            [0,1,0,0,1,0],
        ]
    },
    {
        name: '._.',
        noRotate: true,
        shape: [
            [0,0,0,0,0,0,0],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1],
            [0,0,0,0,0,0,0],
        ]
    },
    {
        name: 'Stripes',
        shape: [
            [1,1,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1],
        ]
    },
    {
        name: 'Wavy',
        shape: [
            [1,0,1,1,1,0,0,1,1],
            [1,0,1,0,0,0,0,1,1],
            [1,1,1,0,1,1,1,1,0],
            [0,0,0,0,1,0,0,0,0],
            [0,1,1,1,1,0,1,1,1],
            [0,1,0,0,0,0,1,0,0],
            [1,1,0,1,1,1,1,0,1],
        ]
    },
    {
        name: 'Inkspill',
        shape: [
            [0,0,0,1,1,0,0,0],
            [0,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,0],
            [0,1,1,0,0,1,1,1],
            [0,0,0,0,1,1,1,0],
            [0,0,1,0,1,0,0,0],
        ]
    },
    {
        name: 'Thirty',
        noRotate: true,
        shape: [
            [1,1,1,0,1,1,1],
            [0,0,1,0,1,0,1],
            [1,1,1,0,1,0,1],
            [0,0,1,0,1,0,1],
            [1,1,1,0,1,1,1],
        ]
    },
    {
        name: 'Spiral',
        shape: [
            [1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0],
            [1,0,1,1,1,1,1,1],
            [1,0,1,0,0,0,0,1],
            [1,0,1,0,1,1,0,1],
            [1,0,1,0,0,1,0,1],
            [1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1],
        ]
    },
    {
        name: 'Duck',
        noRotate: true,
        canWall: true,
        shape: [
            [0,0,0,1,1,1,0,0,0,0,0,0],
            [0,0,1,1,1,1,1,0,0,0,0,0],
            [1,1,1,0,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,1,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,0,0,0,1,1,1,1],
            [0,0,1,1,1,1,1,1,1,1,1,0],
            [0,0,0,1,1,1,1,1,1,1,0,0],
            [0,0,0,0,1,1,1,1,1,0,0,0],
        ]
    },
    {
        name: 'Sparkles',
        shape: [
            [0,0,0,1,0,0,0,0,0,0,0],
            [0,0,1,0,1,0,0,0,1,0,0],
            [0,0,0,1,0,0,0,1,0,1,0],
            [0,1,0,0,0,0,0,0,1,0,0],
            [1,0,1,0,0,0,0,0,0,0,0],
            [0,1,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,0,1,0,0,1,0],
            [0,0,0,0,0,1,0,0,1,0,1],
            [0,0,0,0,0,0,0,0,0,1,0],
        ]
    },
];
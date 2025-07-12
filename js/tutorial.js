import { o, startMode, TILE as T, levelTimerInfoDisplay, tutorialTextDisplay } from "./game.js";
import { create2dGrid } from "./generateGrid.js";
import { STATS } from "./menu.js";



let currentTutorialStep = 0;
const TUTORIAL_STEPS = [
    { // Level 1
        text: "Welcome! Tap an empty spot to place a tile.",
        waitFor: 'tile_place',
    },
    {
        text: "Alright, try to place another tile!",
        waitFor: 'tile_place',
    },
    {
        text: "The grid is complete if you can't place any more tiles.",
        waitFor: 'grid_complete',
    },
    { // Level 2
        text: "Nice! Let's try a larger grid.",
        waitFor: 'grid_complete',
    },
    { // Level 3
        text: "Neat! Now solve this one.",
        waitFor: 'grid_complete',
    },
    { // Level 4
        text: "Keep going!",
        waitFor: 'color_complete',
    },
    {
        text: "Blue unlocked. Select it!",
        color: "blue",
        waitFor: 'grid_complete',
    },
    { // Level 5
        text: "If you ever get stuck, use a Hint.",
        waitFor: 'grid_complete',
    },
    {
        text: "Tutorial Complete!",
    }
];


export function startTutorial() {
    const HARDCODED_TUTORIAL_LEVELS = {
        1: {
            grid: create2dGrid(5, 3, T.GRID),
            availableTiles: [T.RED],
            futureAvailableTiles: [],
            botAmount: 0,
        },
        2: {
            grid: create2dGrid(6, 6, T.GRID),
            availableTiles: [T.RED],
            futureAvailableTiles: [],
            botAmount: 0,
        },
        3: {
            grid: [
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
                [T.WALL,T.GRID,T.GRID,T.GRID,T.WALL],
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            ],
            availableTiles: [T.RED],
            futureAvailableTiles: [],
            botAmount: 0,
        },
        4: {
            grid: [
                [T.GRID,T.GRID,T.GRID],
                [T.WALL,T.GRID,T.GRID],
                [T.GRID,T.GRID,T.GRID],
                [T.GRID,T.GRID,T.WALL],
                [T.GRID,T.GRID,T.GRID],
            ],
            availableTiles: [T.RED],
            futureAvailableTiles: [T.BLUE],
            botAmount: 0,
        },
        5: {
            grid: [
                [T.WALL,T.GRID,T.GRID,T.GRID,T.GRID,T.WALL],
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
                [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
                [T.WALL,T.GRID,T.GRID,T.GRID,T.GRID,T.WALL],
            ],
            availableTiles: [T.RED],
            futureAvailableTiles: [T.BLUE, T.PURPLE],
            botAmount: 0,
        },
    };


    if (!STATS['tutorial']) STATS['tutorial'] = {};

    const modeSettings = {
        hardcodedLevels: HARDCODED_TUTORIAL_LEVELS,
        modeGoalLevel: Object.keys(HARDCODED_TUTORIAL_LEVELS).length,
        modeHintCount: 5,
        statsSaveLoc: STATS['tutorial'],
        seed: 'Tutorial',
    }
    startMode(modeSettings);

    levelTimerInfoDisplay.style.display = 'none';
    currentTutorialStep = -1;
    advanceTutorial();
}










function advanceTutorial() {
    const previousStep = TUTORIAL_STEPS[currentTutorialStep];
    const step = TUTORIAL_STEPS[++currentTutorialStep];

    o.tutorialDissallowValidMoves = step.waitFor === 'invalid_move';

    let waitingDelay;
    if (currentTutorialStep === 0) {
        waitingDelay = 0;
        tutorialTextDisplay.innerHTML = step.text;  // literally no idea why this is neccessary
    }
    else if (previousStep?.waitFor === 'grid_complete') waitingDelay = o.winLooseTimeout;
    else waitingDelay = 300;

    tutorialTextDisplay.style.opacity = '0';
    setTimeout(() => {
        tutorialTextDisplay.classList = `tile-${step.color ?? 'red'}`;
        tutorialTextDisplay.style.opacity = '';
        tutorialTextDisplay.innerHTML = step.text;
    }, waitingDelay);
}





export function tutorialOnGameEvent(eventName, eventData) {
    const step = TUTORIAL_STEPS[currentTutorialStep];

    if (step.waitFor === eventName) {
        if (!step.target || (step.target.x === eventData.x && step.target.y === eventData.y)) {
            advanceTutorial()
        }
    }
}
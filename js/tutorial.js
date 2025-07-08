import { levelTimerInfoDisplay, o, startMode, TILE as T, tutorialTextDisplay } from "./game.js";
import { create2dGrid } from "./generateGrid.js";
import { goToMainMenu, STATS } from "./menu.js";



const HARDCODED_TUTORIAL_LEVELS = {
    1: {
        grid: create2dGrid(4, 3, T.GRID),
        availableTiles: [T.RED],
        futureAvailableTiles: [],
        botAmount: 0,
    },
    2: {
        grid: create2dGrid(5, 5, T.GRID),
        availableTiles: [T.BLUE],
        futureAvailableTiles: [],
        botAmount: 0,
    },
    3: {
        grid: [
            [T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID],
            [T.WALL,T.GRID,T.GRID,T.WALL],
            [T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID],
        ],
        availableTiles: [T.RED],
        futureAvailableTiles: [T.BLUE],
        botAmount: 0,
    },
    4: {
        grid: [
            [T.WALL,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.WALL],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID],
            [T.WALL,T.GRID,T.GRID,T.GRID,T.GRID,T.GRID,T.WALL],
        ],
        availableTiles: [T.RED],
        futureAvailableTiles: [T.BLUE, T.PURPLE],
        botAmount: 0,
    },
};


let currentTutorialStep = 0;
const TUTORIAL_STEPS = [
    {
        text: "click an empty spot on the Grid to place a Tile.",
        waitFor: 'tile_place',
    },
    {
        text: "Now, try to get 3 in a row.",
        waitFor: 'invalid_move',
    },
    {
        text: "Oops, setting up for 3 in a row is not allowed.<br>Now place more Tiles!",
        waitFor: 'grid_complete',
    },
    {
        text: "Nice! now solve this one.",
        waitFor: 'grid_complete',
    },
    {
        text: "H",
        waitFor: 'color_complete',
    },
    {
        text: "You unlocked Blue. Select it!",
        waitFor: 'grid_complete',
    },
    {
        text: "If you ever get stuck, use a Hint.",
        waitFor: 'grid_complete',
    },
    {
        text: "Tutorial Completed!",
    }
];


export function startTutorial() {
    if (!STATS['tutorial']) STATS['tutorial'] = {};

    const modeSettings = {
        hardcodedLevels: HARDCODED_TUTORIAL_LEVELS,
        modeGoalLevel: Object.keys(HARDCODED_TUTORIAL_LEVELS).length,
        modeHintCount: 5,
        statsSaveLoc: STATS['tutorial'],
        seed: 'Tutorial',
        tutorialCallback: onGameEvent,
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

    tutorialTextDisplay.style.opacity = '0';
    if (currentTutorialStep === 0) tutorialTextDisplay.innerHTML = step.text;

    let waitingDelay;
    if (currentTutorialStep === 0) waitingDelay = 0;
    else if (previousStep?.waitFor === 'grid_complete') waitingDelay = o.winLooseTimeout;
    else waitingDelay = 300;

    setTimeout(() => {
        tutorialTextDisplay.style.opacity = '';
        tutorialTextDisplay.innerHTML = step.text;
    }, waitingDelay);

}

function finishTutorial() {
    levelTimerInfoDisplay.style.display = '';
    goToMainMenu();
}





function onGameEvent(eventName, eventData) {
    const step = TUTORIAL_STEPS[currentTutorialStep];

    if (step.waitFor === eventName) {
        if (!step.target || (step.target.x === eventData.x && step.target.y === eventData.y)) {
            advanceTutorial()
        }
    }
}
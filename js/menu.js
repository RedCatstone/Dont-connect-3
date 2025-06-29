import { o, startMode } from './game.js';


const menuMain = document.getElementById('menu-main');
const menuPlay = document.getElementById('menu-mode');
const menuCustom = document.getElementById('menu-custom');

const mainPlayButton = document.getElementById('main-play-button');
const mainSettingsButton = document.getElementById('main-settings-button');
const mainAboutButton = document.getElementById('main-about-button');

const modePlayButtons = document.querySelectorAll('.mode-play-button');
const modeContinueButtons = document.querySelectorAll('.mode-continue-button');
const modeStatDisplays = document.querySelectorAll('.mode-stats');

const customSettingsGrid = document.querySelector("#menu-custom > .settings-grid");
const customSeedInput = document.getElementById('custom-seed-input');
const customLevelInput = document.getElementById('custom-level-input');
const customInfiniteCheck = document.getElementById('custom-infinite-check');
const customFindLastCheck = document.getElementById('custom-findlast-check');
const customHintsInput = document.getElementById('custom-hints-input');
const customLivesInput = document.getElementById('custom-lives-input');
const customGlobalTimeGainInput = document.getElementById('custom-global-time-gain-input');
const customBotMultiplierInput = document.getElementById('custom-bot-multiplier-input');
const customPlayButton = document.getElementById('custom-play-button');

// not in the menu
const customLineLengthInput = document.getElementById('custom-line-length-input');
const customLevelTimeInput = document.getElementById('custom-level-time-input');

export let currentMenu = null;




goToMainMenu();
document.addEventListener('keydown', (event) => {
    if (currentMenu && currentMenu !== menuMain && event.key === 'Escape') switchMenu(menuMain);
});

let advancedModeCounter = 0;
let advancedModeLastClickTimeout = 0;
document.addEventListener('click', (event) => {
    if (event.target.type === 'submit') playSound('tileSwitch');
    if (event.target.id === 'menu-custom' || event.target.parentElement.id === 'menu-custom') {
        // advanced mode after 5 clicks
        clearTimeout(advancedModeLastClickTimeout);
        advancedModeLastClickTimeout = setTimeout(() => advancedModeCounter = 0, 500);
        if (++advancedModeCounter === 5) customSettingsGrid.classList.add('advanced-mode');
    }
}, true);






// --- MAIN MENU ---
mainPlayButton.addEventListener('click', () => {
    updatePlayMenuStats();
    switchMenu(menuPlay);
});







// --- MODE MENU ---
modePlayButtons.forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    if (mode === "custom") {
        switchMenu(menuCustom);
        customSettingsGrid.classList.remove('advanced-mode');
        customLineLengthInput.value = '';
        customLevelTimeInput.value = '';
        customSeedInput.maxLength = o.defaultSeedLength;
    }
    else handlePlay(mode);
}));

modeContinueButtons.forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    handlePlay(mode, true);
}));


function updatePlayMenuStats() {
    modeStatDisplays.forEach(modeStats => {
        const mode = modeStats.dataset.mode;
        const bestStatDiv = modeStats.querySelector('.mode-best-stat');
        if (bestStatDiv) bestStatDiv.textContent = STATS[mode]?.best?.level || '';
        const playedStatDiv = modeStats.querySelector('.mode-played-stat');
        if (playedStatDiv) playedStatDiv.textContent = STATS[mode]?.played || '';
    });

    modeContinueButtons.forEach(button => {
        const mode = button.dataset.mode;
        button.style.display = STATS[mode]?.continue ? 'block' : 'none';
    });
}



function handlePlay(mode, shouldContinue) {
    let modeSettings = {};
    if (mode === 'endless') modeSettings = { modeInfinite: true, modeHintCount: 2 };
    if (mode === 'hardcore') modeSettings = { modeInfinite: true, modeLivesCount: 1 };
    if (mode === 'findlast') modeSettings = { modeInfinite: true, modeFindLast: true, modeGlobalTimeGain: 4 };
    modeSettings.mode = mode;

    if (shouldContinue) Object.assign(modeSettings, STATS[mode].continue);

    goToGame();
    startMode(modeSettings);
}










// --- CUSTOM GAME MENU ---
customPlayButton.addEventListener('click', () => {
    goToGame();
    const rawSettings = {
        seed: customSeedInput.value || undefined,
        level: getNumber(customLevelInput.value),
        modeInfinite: customInfiniteCheck.checked,
        modeFindLast: customFindLastCheck.checked,
        modeHintCount: getNumber(customHintsInput.value),
        modeLivesCount: getNumber(customLivesInput.value),
        modeGlobalTimeGain: getNumber(customGlobalTimeGainInput.value),
        botAmountMultiplier: getNumber(customBotMultiplierInput.value),
        
        // not in the menu
        modeLevelTime: getNumber(customLevelTimeInput?.value),
        lineLength: getNumber(customLineLengthInput?.value),
        mode: "custom",
    };

    const cleanSettings = Object.fromEntries(
        Object.entries(rawSettings).filter(([_, value]) => value !== undefined)
    );
    startMode(cleanSettings);
});

function getNumber(input) {
    const result = parseInt(input, 10);
    return Number.isNaN(result) ? undefined : result;
}



document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.type === 'number' && target && target.max) {
        const min = parseInt(target.min);
        const max = parseInt(target.max);
        const value = parseInt(target.value);

        if (value > max) target.value = max;
        if (value < min) target.value = min;
    }
    if (target.type === 'text' && (target.dataset.allowedChars || target.maxLength)) {
        const originalValue = target.value;
        const originalCursorPos = target.selectionStart;
        const invalidCharsRegex = new RegExp(`[^${target.dataset.allowedChars}]`, 'g');
        const finalValue = originalValue.replace(invalidCharsRegex, '');

        if (originalValue !== finalValue) {
            const originalSliceBeforeCursor = originalValue.slice(0, originalCursorPos);
            const sanitizedSliceBeforeCursor = originalSliceBeforeCursor.replace(invalidCharsRegex, '');
            const charsRemoved = originalSliceBeforeCursor.length - sanitizedSliceBeforeCursor.length;
            const newCursorPos = originalCursorPos - charsRemoved;

            target.value = finalValue;
            target.setSelectionRange(newCursorPos, newCursorPos);
        }
    }
});

















function goToGame() {
    document.body.classList.remove('menu-active');
    document.body.classList.add('game-active');
    currentMenu.classList.remove('active');
    currentMenu = null;
}
export function goToMenu() {
    document.body.classList.remove('game-active');
    document.body.classList.add('menu-active');
}

export function goToMainMenu() {
    goToMenu();
    switchMenu(menuMain);
}



function switchMenu(menu) {
    if (currentMenu) currentMenu.classList.remove('active');
    if (menu) {
        menu.classList.add('active');
        currentMenu = menu;
    }
}


















const sounds = {};
loadSound('tilePlace', 'sounds/pOp.wav');
loadSound('invalidMove', 'sounds/error.wav');
loadSound('tileSwitch', 'sounds/switchTile.wav');

function loadSound(name, path) {
    sounds[name] = new Audio(path);
    sounds[name].preload = 'auto';
}
export function playSound(name) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(error => console.error(`Error playing sound "${name}":`, error));
}






const STORAGE_KEY = 'dontConnect3_stats';
export const STATS = getStats();
o.STATS = STATS;

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
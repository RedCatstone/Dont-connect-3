import { o, startMode } from './game.js';
import { getRandomFunction } from './generateGrid.js';


const menuMain = document.getElementById('menu-main');
const menuPlay = document.getElementById('menu-mode');
const menuCustom = document.getElementById('menu-custom');

const mainPlayButton = document.getElementById('main-play-button');
const mainSettingsButton = document.getElementById('main-settings-button');
const mainAboutButton = document.getElementById('main-about-button');

const modeHeader = document.querySelector('#menu-mode > h1');
const modeSelectionGrid = document.querySelector('#menu-mode > .mode-selection-grid');
const modeCardTemplate = document.getElementById('mode-card-template');
const modeDailyButton = document.getElementById('mode-daily-button');
const dailyResetsInDisplay = document.getElementById('daily-resets-in-display');

const customSettingsGrid = document.querySelector("#menu-custom > .settings-grid");
const customSeedInput = document.getElementById('custom-seed-input');
const customLevelInput = document.getElementById('custom-level-input');
const customGoalLevelInput = document.getElementById('custom-goal-level-input');
const customFindLastCheck = document.getElementById('custom-findlast-check');
const customHintsInput = document.getElementById('custom-hints-input');
const customLivesInput = document.getElementById('custom-lives-input');
const customGlobalTimeGainInput = document.getElementById('custom-global-time-gain-input');
const customBotMultiplierInput = document.getElementById('custom-bot-multiplier-input');
const customPlayButton = document.getElementById('custom-play-button');

// not in the menu
const customLineLengthInput = document.getElementById('custom-line-length-input');
const customLevelTimeInput = document.getElementById('custom-level-time-input');

const style = window.getComputedStyle(document.documentElement);
const menuSpeed = parseInt(style.getPropertyValue('--menu-speed'));

export let currentMenu = null;




goToMainMenu();
document.addEventListener('keydown', (event) => {
    if (currentMenu && event.key === 'Escape') switchMenu(menuMain);
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



const GAMEMODE = {
    endless: 'Endless',
    hardcore: 'Hardcore',
    findlast: 'Find Last',
    custom: 'Custom',
};


for (const [gamemodeId, gamemodeDisplay] of Object.entries(GAMEMODE)) {
    const cardClone = modeCardTemplate.content.cloneNode(true);

    cardClone.querySelector('.mode-card').dataset.mode = gamemodeId;
    cardClone.querySelector('.mode-title').textContent = gamemodeDisplay;
    
    cardClone.querySelector('.mode-play-button').addEventListener('click', () => {
        if (gamemodeId === 'custom') {
            switchMenu(menuCustom);
            customSettingsGrid.classList.remove('advanced-mode');
            customLineLengthInput.value = '';
            customLevelTimeInput.value = '';
            customSeedInput.maxLength = o.defaultSeedLength;
        }
        else handlePlay(gamemodeId);
    });
    cardClone.querySelector('.mode-continue-button').addEventListener('click', () => handlePlay(gamemodeId, true));

    modeSelectionGrid.appendChild(cardClone);
}
const modeCards = document.querySelectorAll('.mode-card');














// --- MAIN MENU ---
mainPlayButton.addEventListener('click', () => {
    modeMenuDaily = false;
    updatePlayMenuStats();
    switchMenu(menuPlay);
});







// --- MODE MENU ---
let modeMenuDaily = false;

function updatePlayMenuStats() {
    let dailySeed;
    let statsSaveLoc;

    if (modeMenuDaily) {
        dailySeed = getDailySeed();
        if (!STATS.daily) STATS.daily = {};
        if (!STATS.daily[dailySeed]) STATS.daily[dailySeed] = {};
        statsSaveLoc = STATS.daily[dailySeed];
    }
    else {
        if (!STATS.mode) STATS.mode = {};
        statsSaveLoc = STATS.mode;
    }

    for (const modeCard of modeCards) {
        const mode = modeCard.dataset.mode;
        modeCard.style.display = '';

        modeCard.querySelector('.mode-best-stat').textContent = statsSaveLoc[mode]?.best?.level || '';
        modeCard.querySelector('.mode-played-stat').textContent = statsSaveLoc[mode]?.played || '';
        modeCard.querySelector('.mode-continue-button').style.display = statsSaveLoc[mode]?.continue ? '' : 'none';
        modeCard.classList.remove('completed');
        
        if (modeMenuDaily) {
            if (mode === 'endless' || mode === 'custom') {
                modeCard.style.display = 'none';
                continue;
            }

            if (statsSaveLoc[mode]?.best?.level >= getDailyLength(dailySeed, mode)) {
                modeCard.classList.add('completed');
            }
        }
    }
    
    modeHeader.textContent = modeMenuDaily ? 'Select a Daily' : 'Select a Mode';
    modeDailyButton.textContent = modeMenuDaily ? 'Normal' : 'Daily';
}

let dailyResetInInterval = null;
modeDailyButton.addEventListener('click', () => {
    modeMenuDaily = !modeMenuDaily;
    if (modeMenuDaily) {
        clearInterval(dailyResetInInterval); 
        dailyResetsInDisplay.textContent = `Resets in: ${getTimeUntilNextUTCDay()}`;
        dailyResetInInterval = setInterval(() => dailyResetsInDisplay.textContent = `Resets in: ${getTimeUntilNextUTCDay()}`, 1000);
    }
    else {
        dailyResetsInDisplay.textContent = '';
        clearInterval(dailyResetInInterval);
    }
    updatePlayMenuStats();
});



function handlePlay(mode, shouldContinue) {
    let modeSettings = {};
    if (mode === 'endless') modeSettings = { modeGoalLevel: 0, modeHintCount: 2 };
    if (mode === 'hardcore') modeSettings = { modeGoalLevel: 0, modeLivesCount: 1 };
    if (mode === 'findlast') modeSettings = { modeGoalLevel: 0, modeFindLast: true, modeGlobalTimeGain: 4 };
    modeSettings.mode = mode;

    if (modeMenuDaily) {
        modeSettings.seed = getDailySeed() + mode[0];
        modeSettings.modeGoalLevel = getDailyLength(modeSettings.seed, mode);
        if (!STATS.daily) STATS.daily = {};
        if (!STATS.daily[modeSettings.seed]) STATS.daily[modeSettings.seed] = {};
        modeSettings.statsSaveLoc = STATS.daily[modeSettings.seed];
    }
    else {
        if (!STATS.mode) STATS.mode = {};
        modeSettings.statsSaveLoc = STATS.mode;
    }


    if (shouldContinue) Object.assign(modeSettings, modeSettings.statsSaveLoc[mode].continue);

    goToGame();
    startMode(modeSettings);
}


function getDailySeed() {
    const date = new Date();
    return `${date.getUTCDate()}-${date.getUTCMonth() + 1}-${date.getUTCFullYear()}`;
    const monthString = date.toLocaleString('en-us', { month: 'long', timeZone: 'UTC' });
}

function getDailyLength(dailySeed, mode) {
    const rand = getRandomFunction(dailySeed + mode);
    return Math.floor(10 + 20 * rand());
}

function getTimeUntilNextUTCDay() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}















// --- CUSTOM GAME MENU ---
customPlayButton.addEventListener('click', () => {
    goToGame();
    if (!STATS.mode) STATS.mode = {};
    const rawSettings = {
        seed: customSeedInput.value || undefined,
        level: getNumber(customLevelInput.value),
        modeGoalLevel: getNumber(customGoalLevelInput.value),
        modeFindLast: customFindLastCheck.checked,
        modeHintCount: getNumber(customHintsInput.value),
        modeLivesCount: getNumber(customLivesInput.value),
        modeGlobalTimeGain: getNumber(customGlobalTimeGainInput.value),
        botAmountMultiplier: getNumber(customBotMultiplierInput.value),
        // advanced settings
        modeLevelTime: getNumber(customLevelTimeInput.value),
        lineLength: getNumber(customLineLengthInput.value),
        mode: "custom",
        statsSaveLoc: STATS.mode,
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
    requestAnimationFrame(() => switchMenu(menuMain));
}




function switchMenu(menu) {
    if (currentMenu === menu) return;

    if (currentMenu) {
        currentMenu.classList.remove('active');
    }

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
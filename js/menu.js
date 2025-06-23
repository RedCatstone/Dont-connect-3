import { o, startMode } from './game.js';


const menuMain = document.getElementById('menu-main');
const menuPlay = document.getElementById('menu-play');
const menuCustom = document.getElementById('menu-custom');

const mainPlayButton = document.getElementById('main-play-button');
const mainSettingsButton = document.getElementById('main-settings-button');
const mainAboutButton = document.getElementById('main-about-button');

const playEndlessButton = document.getElementById('play-endless-button');
const playHardcoreButton = document.getElementById('play-hardcore-button');
const playFindLastButton = document.getElementById('play-find-last-button');
const playCustomButton = document.getElementById('play-custom-button');

const customSeedInput = document.getElementById('custom-seed-input');
const customLevelInput = document.getElementById('custom-level-input');
const customInfiniteCheck = document.getElementById('custom-infinite-check');
const customFindLastCheck = document.getElementById('custom-find-last-check');
const customHintsInput = document.getElementById('custom-hints-input');
const customLivesInput = document.getElementById('custom-lives-input');
const customGlobalTimeGainInput = document.getElementById('custom-global-time-gain-input');
const customBotMultiplierInput = document.getElementById('custom-bot-multiplier-input');
const customPlayButton = document.getElementById('custom-play-button');

// not in the menu
const customLineLengthInput = document.getElementById('custom-line-length-input');
const customLevelTimeInput = document.getElementById('custom-level-time-input');

let currentMenu = null;




goToMainMenu();
document.addEventListener('keydown', (event) => {
    if (currentMenu && currentMenu !== menuMain && event.key === 'Escape') switchMenu(menuMain);
});
document.addEventListener('click', (event) => {
    if (event.target.type === 'submit') playSound('tileSwitch');
}, true);






// --- MAIN MENU ---
mainPlayButton.addEventListener('click', () => {
    switchMenu(menuPlay);
});




// --- PLAY MENU ---
playEndlessButton.addEventListener('click', () => {
    goToGame();
    startMode({
        modeInfinite: true,
        mode: "endless",
    });
});
playHardcoreButton.addEventListener('click', () => {
    goToGame();
    startMode({
        modeInfinite: true,
        modeLivesCount: 1,
        mode: "hardcore",
    });
});
playFindLastButton.addEventListener('click', () => {
    goToGame();
    startMode({
        modeInfinite: true,
        modeFindLast: true,
        modeHintCount: 0,
        modeGlobalTimeGain: 4,
        mode: "findlast",
    });
});
playCustomButton.addEventListener('click', () => {
    switchMenu(menuCustom);
    customSeedInput.maxLength = o.defaultSeedLength;
});





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
        modeLevelTime: getNumber(customLineLengthInput?.value),
        lineLength: getNumber(customLevelTimeInput?.value),
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
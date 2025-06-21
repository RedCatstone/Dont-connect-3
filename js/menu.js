import { o, startMode } from './game.js';
import { formatSeedLevel } from './generateGrid.js';


const menuMain = document.getElementById('menu-main');
const menuPlay = document.getElementById('menu-play');
const menuCustom = document.getElementById('menu-custom');

const mainPlayButton = document.getElementById('main-play-button');
const mainSettingsButton = document.getElementById('main-settings-button');
const mainAboutButton = document.getElementById('main-about-button');

const playEndlessButton = document.getElementById('play-endless-button');
const playLivesButton = document.getElementById('play-lives-button');
const playFindLastButton = document.getElementById('play-find-last-button');
const playCustomButton = document.getElementById('play-custom-button');

const customSeedInput = document.getElementById('custom-seed-input');
const customLevelInput = document.getElementById('custom-level-input');
const customInfiniteCheck = document.getElementById('custom-infinite-check');
const customFindLastCheck = document.getElementById('custom-find-last-check');
const customHintsInput = document.getElementById('custom-hints-input');
const customLivesInput = document.getElementById('custom-lives-input');
const customLevelTimeInput = document.getElementById('custom-level-time-input');
const customGlobalTimeGainInput = document.getElementById('custom-global-time-gain-input');
const customPlayButton = document.getElementById('custom-play-button');

let currentMenu = null;




goToMainMenu();
document.addEventListener('keydown', (event) => {
    if (currentMenu && currentMenu !== menuMain && event.key === 'Escape') switchMenu(menuMain);
});






// --- MAIN MENU ---
mainPlayButton.addEventListener('click', () => {
    switchMenu(menuPlay);
});




// --- PLAY MENU ---
playEndlessButton.addEventListener('click', () => {
    o.level = 1;
    o.modeInfinite = true;
    o.modeFindLast = false;
    o.modeHintCount = 5;
    o.modeLevelTime = 0;
    o.modeLivesCount = 0;
    o.modeGlobalTimeGain = 0;
    goToGame();
    startMode();
});
playLivesButton.addEventListener('click', () => {
    o.level = 1;
    o.modeInfinite = true;
    o.modeFindLast = false;
    o.modeHintCount = 5;
    o.modeLevelTime = 0;
    o.modeLivesCount = 5;
    o.modeGlobalTimeGain = 0;
    goToGame();
    startMode();
});
playFindLastButton.addEventListener('click', () => {
    o.level = 1;
    o.modeInfinite = true;
    o.modeFindLast = true;
    o.modeHintCount = 2;
    o.modeLevelTime = 0;
    o.modeLivesCount = 0;
    o.modeGlobalTimeGain = 6;
    goToGame();
    startMode();
});
playCustomButton.addEventListener('click', () => {
    switchMenu(menuCustom);
});





// --- CUSTOM GAME MENU ---
customPlayButton.addEventListener('click', () => {
    o.level = parseInt(customLevelInput.value || 1);
    o.modeInfinite = customInfiniteCheck.checked;
    o.modeFindLast = customFindLastCheck.checked;
    o.modeHintCount = parseInt(customHintsInput.value || 0);
    o.modeLivesCount = parseInt(customLivesInput.value);
    o.modeLevelTime = parseInt(customLevelTimeInput.value);
    o.modeGlobalTimeGain = parseInt(customGlobalTimeGainInput.value);
    goToGame();
    startMode(customSeedInput.value || undefined);
});

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
})

















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
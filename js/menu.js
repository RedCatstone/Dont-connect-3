import { camelToTitleCase, formatMinuteSeconds, o, startMode } from './game.js';
import { getRandomFunction } from './generateGrid.js';
import { startTutorial } from './tutorial.js';


const menuMain = document.getElementById('menu-main');
const menuPlay = document.getElementById('menu-mode');

const mainPlayButton = document.getElementById('main-play-button');
const mainTutorialButton = document.getElementById('main-tutorial-button');
const mainSettingsButton = document.getElementById('main-settings-button');
const mainAboutButton = document.getElementById('main-about-button');

const modeTabsContainer = document.getElementById('mode-tabs');
const modeSelectionGrid = document.querySelector('#menu-mode .mode-selection-grid');
const modeSettingsGrid = document.getElementById('custom-settings-grid');
const modeCardTemplate = document.getElementById('mode-card-template');
const dailyResetsInDisplay = document.getElementById('daily-resets-in-display');

const style = window.getComputedStyle(document.documentElement);






export let currentMenu = null;
let activeTabId = 'normal';
let dailyResetInInterval = null;




goToMainMenu();
document.addEventListener('keydown', (event) => {
    if (currentMenu && event.key === 'Escape') switchMenu(menuMain);
});














// --- MAIN MENU ---
mainPlayButton.addEventListener('click', () => {
    if (STATS.tutorial) {
        renderActiveTabContent();
        switchMenu(menuPlay);
    }
    else {
        goToGame();
        startTutorial();
    }
});
mainTutorialButton.addEventListener('click', () => {
    goToGame();
    startTutorial();
});
















// --- MODE MENU ---
const normalEndlessSettings = { modeHintCount: 2 };
const normalHardcoreSettings = { modeHintCount: 2, modeLivesCount: 1 };
const normalFindlastSettings = { modeHintCount: 2, modeFindLast: true };

const timedEndlessSettings = { ...normalEndlessSettings, modeHintCount: 0, modeGlobalTimeGain: 10 };
const timedHardcoreSettings = { ...normalHardcoreSettings, modeHintCount: 0, modeLevelTime: 20 };
const timedFindlastSettings = { ...normalFindlastSettings, modeHintCount: 0, modeGlobalTimeGain: 3 };

const TABS_DATA = {
    normal: [
        { id: 'endless', title: 'Endless', settings: normalEndlessSettings },
        { id: 'hardcore', title: 'Hardcore', settings: normalHardcoreSettings },
        { id: 'findlast', title: 'Find Last', settings: normalFindlastSettings },
    ],
    timed: [
        { id: 'endless', title: 'Endless', settings: timedEndlessSettings },
        { id: 'hardcore', title: 'Hardcore', settings: timedHardcoreSettings },
        { id: 'findlast', title: 'Find Last', settings: timedFindlastSettings },
    ],
    daily: [
        { id: 'endless', title: 'Endless', settings: timedEndlessSettings },
        { id: 'hardcore', title: 'Hardcore', settings: normalHardcoreSettings },
        { id: 'findlast', title: 'Find Last', settings: timedFindlastSettings }
    ],
    custom: [
        { id: 'custom', title: 'Play' }
    ]
};


// setup tab buttons
for (const tabId in TABS_DATA) {
    const button = document.createElement('button');
    button.className = 'mode-tab-button';
    button.textContent = camelToTitleCase(tabId);
    button.dataset.tabId = tabId;
    modeTabsContainer.appendChild(button);
}

modeTabsContainer.addEventListener('click', (e) => {
    if (e.target.matches('.mode-tab-button') && activeTabId !== e.target.dataset.tabId) {
        activeTabId = e.target.dataset.tabId;
        renderActiveTabContent();
        modeSettingsGrid.classList.remove('advanced-mode');
    }
});





const CUSTOM_GAME_SETTINGS = [
    [
        { label: 'Seed', type: 'text', placeholder: 'Random', maxLength: o.defaultSeedLength, allowedChars: 'A-Za-z0-9_-' },
        { label: 'Level', type: 'number', placeholder: '1', value: 1, min: 1, max: 99 }
    ],
    [{ label: 'Goal Level', type: 'number', placeholder: 'Disabled', min: 1, max: 999 }],
    [{ label: 'Find Last', type: 'checkbox' }],
    [{ label: 'Hints', type: 'number', placeholder: '0', value: 2, min: 0, max: 99 }],
    [{ label: 'Lives', type: 'number', placeholder: 'Disabled', min: 0, max: 15 }],
    [{ label: 'Time Limit Gain', type: 'number', placeholder: 'Disabled', min: 0, max: 60 }],
    [{ label: 'Bot Multiplier', type: 'number', placeholder: 'Normal', min: 0, max: 10 }],
    [{ label: 'Level Time Limit', type: 'number', placeholder: 'Disabled', min: 0, max: 99, advanced: true }],
    [{ label: 'Line Length', type: 'number', placeholder: '3', value: 3, min: 3, max: 5, advanced: true }],
];

generateCustomSettingsGrid();








function renderActiveTabContent() {
    modeSelectionGrid.innerHTML = '';
    document.querySelectorAll('.mode-tab-button').forEach(x => x.classList.toggle('active', x.dataset.tabId === activeTabId));

    if (activeTabId === 'daily') {
        dailyResetsInDisplay.style.display = '';
        updateDailyTimer();
    } else {
        dailyResetsInDisplay.style.display = 'none';
        clearInterval(dailyResetInInterval);
    }

    if (activeTabId === 'custom') modeSettingsGrid.style.display = '';
    else modeSettingsGrid.style.display = 'none';


    // --- Generate Mode Cards ---
    for (const mode of TABS_DATA[activeTabId]) {
        const cardClone = modeCardTemplate.content.cloneNode(true);
        const card = cardClone.querySelector('.mode-card');
        card.dataset.modeCategory = activeTabId;
        card.dataset.mode = mode.id;
        
        const modeLength = getModeLength(activeTabId, mode.id);
        card.querySelector('.mode-title').textContent = camelToTitleCase(mode.title) + (modeLength ? ` (${modeLength})`: '');
        
        const statsSaveLoc = getStatsSaveLoc(activeTabId, mode.id);
        if (statsSaveLoc.best) {
            const bestStats = card.querySelector('.best-stats');
            const bestLevelSpan = document.createElement('span');
            bestLevelSpan.textContent = statsSaveLoc.best.level;
            bestStats.append(bestLevelSpan);
            if (mode.settings?.modeLevelTime || mode.settings?.modeGlobalTimeGain || activeTabId === 'daily') {
                const bestTimeSpan = document.createElement('span');
                bestTimeSpan.textContent = formatMinuteSeconds(statsSaveLoc.best.time, 2);
                bestStats.append(bestTimeSpan);
            }
        }
        card.classList.toggle('completed', statsSaveLoc.best?.level > modeLength);
        
        const playButton = card.querySelector('.mode-play-button');
        const continueButton = card.querySelector('.mode-continue-button');
        if (mode.settings?.modeLevelTime || mode.settings?.modeGlobalTimeGain) {
            playButton.dataset.customIcon = 'timer';
        }
        continueButton.style.display = statsSaveLoc.continue ? '' : 'none';
        continueButton.querySelector('.button-counter').textContent = statsSaveLoc.continue?.level;
        playButton.addEventListener('click', () => handlePlay(mode, statsSaveLoc));
        continueButton.addEventListener('click', () => handlePlay(mode, statsSaveLoc, true));

        modeSelectionGrid.appendChild(cardClone);
    }
}




function generateCustomSettingsGrid() {
    for (const settings of CUSTOM_GAME_SETTINGS) {
        const settingItem = document.createElement('label');
        settingItem.classList.add('setting-item');
        if (settings.length > 1) settingItem.classList.add('big');

        for (const setting of settings) {
            const settingId = `custom-${setting.label.toLowerCase().replaceAll(' ', '-')}-input`;
            if (settings.length === 1) settingItem.htmlFor = settingId;
            if (setting.advanced) settingItem.classList.add('advanced');

            const settingLabel = document.createElement('label');
            settingLabel.textContent = setting.label;
            settingLabel.htmlFor = settingId;

            const input = document.createElement('input');
            const inputHtml = {
                id: settingId,
                type: setting.type,
                checked: setting.type === 'checkbox' ? setting.value : undefined,
                value: setting.type !== 'checkbox' ? setting.value : undefined,
                placeholder: setting.placeholder,
                min: setting.min,
                max: setting.max,
                maxLength: setting.maxLength,
            };
            for (const key in inputHtml) {
                if (inputHtml[key] === undefined) delete inputHtml[key];
            }
            Object.assign(input, inputHtml);
            if (setting.allowedChars) input.dataset.allowedChars = setting.allowedChars;

            
            const wrapperDiv = document.createElement('div');
            wrapperDiv.classList.add('setting-wrapper-div');
            wrapperDiv.append(settingLabel, input);
            settingItem.append(wrapperDiv);
        }
        modeSettingsGrid.append(settingItem);
    }
    modeSettingsGrid.display = 'none';
    modeSettingsGrid.addEventListener('input', () => {
        // save new settings
        TABS_DATA.custom[0].settings = Object.fromEntries(Object.entries({
            seed: document.getElementById('custom-seed-input').value || undefined,
            level: getNumber(document.getElementById('custom-level-input').value),
            modeGoalLevel: getNumber(document.getElementById('custom-goal-level-input').value),
            modeFindLast: document.getElementById('custom-find-last-input').checked,
            modeHintCount: getNumber(document.getElementById('custom-hints-input').value),
            modeLivesCount: getNumber(document.getElementById('custom-lives-input').value),
            modeGlobalTimeGain: getNumber(document.getElementById('custom-time-limit-gain-input').value),
            botAmountMultiplier: getNumber(document.getElementById('custom-bot-multiplier-input').value),
            // advanced settings
            modeLevelTime: getNumber(document.getElementById('custom-level-time-limit-input').value),
            lineLength: getNumber(document.getElementById('custom-line-length-input').value),
        }).filter(([_, value]) => value !== undefined));
        // refresh play mode card
        renderActiveTabContent();
    });
}







function handlePlay(mode, statsSaveLoc, shouldContinue) {
    const modeSettings = { ...mode.settings, statsSaveLoc };
    if (activeTabId === 'daily') {
        modeSettings.seed = getDailySeed() + mode.id[0];
        modeSettings.modeGoalLevel = getModeLength(activeTabId, mode.id);
    }
    if (shouldContinue) Object.assign(modeSettings, statsSaveLoc.continue);
    modeSettings.statsSaveLoc = statsSaveLoc;
    goToGame();
    startMode(modeSettings);
}


function getNumber(input) {
    const result = parseInt(input, 10);
    return Number.isNaN(result) ? undefined : result;
}







function getStatsSaveLoc(modeCategory, mode) {
    if (!STATS[modeCategory]) STATS[modeCategory] = {};
    let base = STATS[modeCategory];
    if (modeCategory === 'daily') {
        const dailySeed = getDailySeed();
        if (!base[dailySeed]) base[dailySeed] = {}
        base = base[getDailySeed()];
    }
    if (!base[mode]) base[mode] = {};
    return base[mode];
}

function getDailySeed() {
    const date = new Date();
    return `${date.getUTCDate()}-${date.getUTCMonth() + 1}-${date.getUTCFullYear()}`;
}

function getModeLength(modeCategory, mode) {
    if (modeCategory === 'daily') {
        const rand = getRandomFunction(getDailySeed() + mode[0]);
        return Math.floor(12 + 10 * rand());
    }
}

function updateDailyTimer() {
    clearInterval(dailyResetInInterval);
    setDailyTimerText();
    dailyResetInInterval = setInterval(setDailyTimerText, 1000);
}
function setDailyTimerText() {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const diff = tomorrow - now;
    const h = Math.floor(diff / 3600_000);
    const m = Math.floor((diff % 3600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    
    const monthString = now.toLocaleString('en-us', { month: 'long', timeZone: 'UTC' });
    const dayNumber = now.getUTCDate();
    const dayString = getDaySuffix(now.getUTCDate());
    dailyResetsInDisplay.textContent = `${monthString} ${dayNumber}${dayString} - Resets in: ${h}h ${m}m ${s}s`;
}
function getDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
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
        const invalidCharsRegex = new RegExp(`[^${target.dataset.allowedChars ?? ''}]`, 'g');
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


let advancedModeCounter = 0;
let advancedModeLastClickTimeout = 0;
document.addEventListener('click', (event) => {
    if (event.target.type) playSound('switchTile');

    if (activeTabId === 'custom' && event.target === menuPlay || event.target.parentElement === menuPlay) {
        // advanced mode after 5 clicks
        clearTimeout(advancedModeLastClickTimeout);
        advancedModeLastClickTimeout = setTimeout(() => advancedModeCounter = 0, 500);
        if (++advancedModeCounter === 5) modeSettingsGrid.classList.add('advanced-mode');
    }
}, true);

















function goToGame() {
    document.body.classList.remove('menu-active');
    document.body.classList.add('game-active');
    currentMenu.classList.remove('active');
    currentMenu = null;
    clearInterval(dailyResetInInterval);
}
function goToMenu() {
    document.body.classList.remove('game-active');
    document.body.classList.add('menu-active');
}

export function goToMainMenu() {
    goToMenu();
    requestAnimationFrame(() => switchMenu(menuMain));
}




function switchMenu(menu) {
    if (currentMenu === menu) return;
    if (menu === menuMain) mainTutorialButton.style.display = STATS.tutorial ? '' : 'none';

    if (currentMenu) {
        currentMenu.classList.remove('active');
    }

    if (menu) {
        menu.classList.add('active');
        currentMenu = menu;
    }
}


















const sounds = {};
loadSound('pOp', 'sounds/pOp.wav');
loadSound('error', 'sounds/error.wav');
loadSound('switchTile', 'sounds/switchTile.wav');
loadSound('win', 'sounds/win.wav');

function loadSound(name, path) {
    sounds[name] = new Audio(path);
    sounds[name].preload = 'auto';
}
export function playSound(name) {
    sounds[name].currentTime = 0;
    sounds[name].volume = o.volume;
    sounds[name].play().catch(error => console.error(`Error playing sound "${name}":`, error));
}






const STORAGE_KEY = 'dontConnect3';
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
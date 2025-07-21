import { HARDCODED_TUTORIAL_LEVELS, o, STATS } from './constants.js';
import { camelToTitleCase, formatMinuteSeconds, startMode } from './game.js';
import { getRandomFunction } from './generateGrid.js';


const menuMain = document.getElementById('menu-main');
const menuPlay = document.getElementById('menu-mode');

const mainPlayButton = document.getElementById('main-play-button');
const mainSettingsButton = document.getElementById('main-settings-button');
const mainAboutButton = document.getElementById('main-about-button');

const modeTabsContainer = document.getElementById('mode-tabs');
const modeSelectionGrid = document.querySelector('#menu-mode .mode-selection-grid');
const modeSettingsGrid = document.getElementById('custom-settings-grid');
const modeCardTemplate = document.getElementById('modecard-template');
const dailyResetsInDisplay = document.getElementById('daily-resets-in-display');






export let currentMenu = menuMain;
let activeTabId = 'normal';
let dailyResetInInterval = null;




document.addEventListener('keydown', (event) => {
    if (currentMenu && event.key === 'Escape') switchMenu(menuMain);
});














// --- MAIN MENU ---
mainPlayButton.addEventListener('click', () => {
    if (!STATS.tutorial) handlePlay(tutorialMode);
    else {
        renderActiveTabContent();
        switchMenu(menuPlay);
    }
});
















// --- MODE MENU ---
const tutorialMode = {
    id: 'tutorial',
    title: 'How To Play',
    settings: {
        seed: 'Tutorial',
        hardcodedLevels: HARDCODED_TUTORIAL_LEVELS,
        modeGoalLevel: Object.keys(HARDCODED_TUTORIAL_LEVELS).length,
        modeHintCount: 5,
    },
    medals: {
        author: 17000,
        gold: 30000,
    }
};

const endlessSettings = { modeHintCount: 2 };
const hardcoreSettings = { modeHintCount: 2, modeLivesCount: 1 };
const findlastSettings = { modeHintCount: 2, modeFindLast: true };

const TABS_DATA = {
    normal: [
        tutorialMode,
        { id: 'endless', title: 'Endless', settings: { ...endlessSettings, modeHintCount: 2 }, medals: { author: 187, gold: 100 } },
        { id: 'hardcore', title: 'Hardcore', settings: { ...hardcoreSettings, modeHintCount: 2, }, medals: { author: 38, gold: 20 } },
        { id: 'findlast', title: 'Find Last', settings: { ...findlastSettings, modeHintCount: 2, }, medals: { author: 200, gold: 100 } },
    ],
    timed: [
        { id: 'endless', title: 'Endless', settings: { ...endlessSettings, modeGlobalTimeGain: 10, }, medals: { author: 43, gold: 25 } },
        { id: 'hardcore', title: 'Hardcore', settings: { ...hardcoreSettings, modeLevelTime: 20, }, medals: { author: 30, gold: 15 } },
        { id: 'findlast', title: 'Find Last', settings: { ...findlastSettings, modeGlobalTimeGain: 3, }, medals: { author: 58, gold: 30 } },
    ],
    daily: [
        { id: 'endless', title: 'Endless', settings: { ...endlessSettings } },
        { id: 'hardcore', title: 'Hardcore', settings: { ...hardcoreSettings } },
        { id: 'findlast', title: 'Find Last', settings: { ...findlastSettings } },
    ],
    custom: [
        { id: 'custom', title: 'Play', settings: {} },
    ]
};


// setup tab buttons
updateDailyModeSettings();
for (const [tabId, modes] of Object.entries(TABS_DATA)) {
    const button = document.createElement('button');
    button.className = 'mode-tab-button';
    button.textContent = camelToTitleCase(tabId);
    button.dataset.tabId = tabId;
    modeTabsContainer.appendChild(button);

    if (tabId !== 'daily') for (const mode of modes) {
        // add statsSaveLoc to all modes
        mode.settings.statsSaveLoc = getStatsSaveLoc(tabId, mode);
        // add bronze/silver medals to all modes
        const medals = mode.medals;
        if (medals) {
            if (mode.settings.modeGoalLevel) { // time
                medals.silver = medals.gold*2;
                medals.bronze = medals.gold*5;
            }
            else { // level
                medals.silver = Math.floor(medals.gold/2);
                medals.bronze = Math.floor(medals.gold/5);
            }
        }
    }
}




modeTabsContainer.addEventListener('click', (e) => {
    if (e.target.matches('.mode-tab-button') && activeTabId !== e.target.dataset.tabId) {
        activeTabId = e.target.dataset.tabId;
        if (activeTabId === 'daily') updateDailyModeSettings();
        renderActiveTabContent();
        modeSettingsGrid.classList.remove('advanced-mode');
    }
});




const CUSTOM_GAME_SETTINGS = [
    [
     { label: 'Seed', type: 'text', placeholder: 'Random', maxLength: o.defaultSeedLength, allowedChars: 'A-Za-z0-9_-' },
     { label: 'Level', type: 'number', placeholder: '1', value: 1, min: 1, max: 99 }
    ],
    [{ label: 'Goal Level', type: 'number', placeholder: 'Infinite', min: 1, max: 999 }],
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
        const card = cardClone.querySelector('.modecard');
        card.dataset.modeCategory = activeTabId;
        card.dataset.mode = mode.id;
        
        const modeLength = mode.settings.modeGoalLevel;
        const modeTitleElement = card.querySelector('.mode-title');
        modeTitleElement.querySelector('.mode-title-text').textContent = camelToTitleCase(mode.title);
        if (modeLength) modeTitleElement.querySelector('.mode-title-length').textContent =  `(${modeLength})`;
        
        const statsSaveLoc = mode.settings.statsSaveLoc;
        if (statsSaveLoc.best) {
            const bestStats = card.querySelector('.best-stats');
            const bestLevel = statsSaveLoc.best.level;
            const bestTime = statsSaveLoc.best.time;
            const medals = mode.medals;

            if (bestLevel !== modeLength + 1) {
                const bestLevelSpan = document.createElement('span');
                bestLevelSpan.textContent = `Level ${bestLevel}`;
                if (medals) {
                    if (bestLevel >= medals.author) card.classList.add("author");
                    else if (bestLevel >= medals.gold) card.classList.add("gold"), bestLevelSpan.dataset.afterText = ` / ${medals.author}`;
                    else if (bestLevel >= medals.silver) card.classList.add("silver"), bestLevelSpan.dataset.afterText = ` / ${medals.gold}`;
                    else if (bestLevel >= medals.bronze) card.classList.add("bronze"), bestLevelSpan.dataset.afterText = ` / ${medals.silver}`;
                    else bestLevelSpan.dataset.afterText = ` / ${medals.bronze}`;
                }
                bestStats.append(bestLevelSpan);
            }

            if (bestLevel === modeLength + 1 || mode.settings.modeLevelTime || mode.settings.modeGlobalTimeGain) {
                const bestTimeSpan = document.createElement('span');
                bestTimeSpan.textContent = formatMinuteSeconds(bestTime, 2);
                if (medals && bestLevel === modeLength + 1) {
                    if (bestTime <= medals.author) card.classList.add("author");
                    else if (bestTime <= medals.gold) card.classList.add("gold"), bestTimeSpan.dataset.afterText = ` / ${formatMinuteSeconds(medals.author, 2)}`;
                    else if (bestTime <= medals.silver) card.classList.add("silver"), bestTimeSpan.dataset.afterText = ` / ${formatMinuteSeconds(medals.gold, 2)}`;
                    else if (bestTime <= medals.bronze) card.classList.add("bronze"), bestTimeSpan.dataset.afterText = ` / ${formatMinuteSeconds(medals.silver, 2)}`;
                    else bestTimeSpan.dataset.afterText = `/ ${formatMinuteSeconds(medals.bronze, 2)}`;
                }
                bestStats.append(bestTimeSpan);
            }
        }
        card.classList.toggle('completed', statsSaveLoc.best?.level > modeLength);
        
        const playButton = card.querySelector('.mode-play-button');
        const continueButton = card.querySelector('.mode-continue-button');
        if (mode.settings.modeLevelTime || mode.settings.modeGlobalTimeGain) playButton.dataset.customIcon = 'timer';
        continueButton.style.display = statsSaveLoc.continue ? '' : 'none';
        continueButton.querySelector('.button-counter').textContent = statsSaveLoc.continue?.level;
        playButton.addEventListener('click', () => handlePlay(mode));
        continueButton.addEventListener('click', () => handlePlay(mode, true));

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
            statsSaveLoc: TABS_DATA.custom[0].settings.statsSaveLoc,
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







function handlePlay(mode, shouldContinue) {
    const modeSettings = { ...mode.settings };
    if (activeTabId === 'daily') updateDailyModeSettings();
    if (shouldContinue) Object.assign(modeSettings, modeSettings.statsSaveLoc.continue);
    goToGame();
    startMode(modeSettings);
}


function getNumber(input) {
    const result = parseInt(input, 10);
    return Number.isNaN(result) ? undefined : result;
}







function getStatsSaveLoc(modeCategory, mode) {
    let base = STATS;
    if (mode.id !== 'tutorial') {
        if (!base[modeCategory]) base[modeCategory] = {};
        base = base[modeCategory];
        if (modeCategory === 'daily') {
            const dailySeed = mode.settings.seed.slice(0, -1);
            if (!base[dailySeed]) base[dailySeed] = {}
            base = base[dailySeed];
        }
    }
    if (!base[mode.id]) base[mode.id] = {};
    return base[mode.id];
}

function updateDailyModeSettings() {
    const now = new Date();
    const dailySeed = `${now.getUTCDate()}-${now.getUTCMonth() + 1}-${now.getUTCFullYear()}`;

    for (const mode of TABS_DATA.daily) {
        const rand = getRandomFunction(dailySeed + mode.id[0]);
        const modeLengthMultiplier = {
            endless: 1,
            hardcore: 2/3,
            findlast: 1
        };
        const modeLength = Math.floor((12 + 10 * rand()) * modeLengthMultiplier[mode.id]);

        mode.settings.seed = dailySeed + mode.id[0];
        mode.settings.modeGoalLevel = modeLength;
        mode.settings.statsSaveLoc = getStatsSaveLoc('daily', mode);

        const timeForOneLevel = {
            endless: 24_000,
            hardcore: 9_000,
            findlast: 9_000
        };
        const author = modeLength * timeForOneLevel[mode.id];
        mode.medals = {
            author,
            gold: author * 1.5,
            silver: author * 2,
            bronze: author * 5
        };
        console.log(formatMinuteSeconds(mode.medals.author, 2))
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
    const daySuffix = getDaySuffix(now.getUTCDate());
    dailyResetsInDisplay.textContent = `${monthString} ${dayNumber}${daySuffix} - ${h}h ${m}m ${s}s`;
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
    if (currentMenu) {
        currentMenu.classList.remove('active');
    }
    if (menu) {
        menu.classList.add('active');
        currentMenu = menu;
    }
}











const sounds = {};
loadSound('pOp', 'pOp.wav');
loadSound('error', 'error.wav');
loadSound('switchTile', 'switchTile.wav');
loadSound('win', 'win.wav');

function loadSound(name, fileName) {
    sounds[name] = new Audio(`sounds/${fileName}`);
    sounds[name].preload = 'auto';
}
export function playSound(name) {
    sounds[name].currentTime = 0;
    sounds[name].volume = o.volume;
    sounds[name].play().catch(error => console.error(`Error playing sound "${name}":`, error));
}
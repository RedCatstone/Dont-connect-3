import { startInfiniteMode, startLastSpotMode } from './game.js';


const menusContainer = document.querySelector("#menus");

const mainMenu = document.getElementById("menu-main");
const playMenu = document.getElementById("menu-play");

const mainButtonPlay = document.getElementById("play-button");
const mainButtonSettings = document.getElementById("settings-button");
const mainButtonAbout = document.getElementById("about-button");

const playButtonInfinite = document.getElementById("infinite-button");
const playButtonFindLast = document.getElementById("find-last-button");
const playButtonIdk2 = document.getElementById("idk2-button");

let currentMenu = null;

goToMainMenu();
mainButtonPlay.addEventListener('click', () => {
    switchMenu(playMenu);
});


playButtonInfinite.addEventListener('click', () => {
    goToGame();
    startInfiniteMode();
});

playButtonFindLast.addEventListener('click', () => {
    goToGame();
    startLastSpotMode();
});







function goToGame() {
    document.body.classList.remove('menu-active');
    document.body.classList.add('game-active');
}
export function goToMenu() {
    document.body.classList.remove('game-active');
    document.body.classList.add('menu-active');
}
export function goToMainMenu() {
    goToMenu();
    switchMenu(mainMenu);
}


function switchMenu(menu) {
    if (currentMenu) currentMenu.classList.remove('active');
    if (menu) {
        menu.classList.add('active');
        currentMenu = menu;
    }
}
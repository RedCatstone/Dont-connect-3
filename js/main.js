const sounds = {};

init();

function init() {
    loadSound('tilePlace', 'sounds/pOp.wav');
    loadSound('invalidMove', 'sounds/error.wav');
    loadSound('tileSwitch', 'sounds/switchTile.wav');
}
function loadSound(name, path) {
    sounds[name] = new Audio(path);
    sounds[name].preload = 'auto';
}
export function playSound(name) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(error => console.error(`Error playing sound "${name}":`, error));
}
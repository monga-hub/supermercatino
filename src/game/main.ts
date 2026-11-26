import { Game as MainGame } from './scenes/Game';
import { Hud } from './scenes/Hud';
import { AUTO, Game, Scale, Types } from 'phaser';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#2b1d16',
    scale: {
        mode: Scale.RESIZE,
        width: '100%',
        height: '100%',
    },
    scene: [MainGame, Hud],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;

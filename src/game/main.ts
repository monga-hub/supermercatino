import { Game as MainGame } from './scenes/Game';
import { Hud } from './scenes/Hud';
import { AUTO, Game, Scale, Types } from 'phaser';
import { DPR } from './dpr';

// The canvas has DPR pixels per CSS pixel and is shown at CSS size (zoom 1/DPR): sharp on retina.
// Scenes work in canvas pixels; the Hud camera zooms by DPR so its layout stays in CSS pixels.
const config: Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#2b1d16',
    scale: { mode: Scale.NONE, zoom: 1 / DPR },
    scene: [MainGame, Hud],
};

const StartGame = (parent: string) => {
    const box = document.getElementById(parent)!;
    const size = () => [box.clientWidth * DPR, box.clientHeight * DPR] as const;
    const game = new Game({ ...config, parent, width: size()[0], height: size()[1] });
    const fit = () => game.scale.resize(...size());
    fit();
    window.addEventListener('resize', fit);
    return game;
};

export default StartGame;

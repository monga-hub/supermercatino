# Builds public/assets/kit.png + kit.json (Phaser JSON-hash atlas) from the Gemini sheets in art/sheets/.
# Each sheet is a regular grid; each cell holds one piece on a flat white background.
# Usage: python3 tools/kit.py
import json, pathlib, numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
TILE_W = 64
RES = 2  # frames stored at 2x, drawn at 0.5 scale: sharp when zoomed in

# (sheet, cols, rows, size, names), size per piece or per sheet:
#   ('w', f): each piece scaled to f x tile width, anchored bottom-centre of the piece (furniture: stands on the cell's bottom vertex);
#   ('h', px): the whole sheet scaled so its first piece is px tall, anchored on each cell's centre line
#             (characters: walk frames don't jitter sideways, seated/reaching poses keep their relative size).
WALK = lambda n: [f'{n}_walk_0', f'{n}_walk_1', f'{n}_walk_2']
SHEETS = [
    ('arredi.jpg', 3, 3, ('w', 1.0), ['scaffale', 'scaffale_Pasta', 'scaffale_Latticini', 'scaffale_Salumi', 'scaffale_Pane',
                                      'scaffale_Frutta', 'scaffale_Detersivi', 'cassa', None]),  # door: see WALLS
    *[(f'{sheet}.jpg', 3, 3, ('h', h), WALK(kind) + [f'{kind}_angry_0', f'{kind}_angry_1', f'{kind}_angry_2',
                                                    f'{kind}_idle', f'{kind}_pay', f'{kind}_pick'])
      for sheet, kind, h in [('cliente', 'signora', 44), ('mamma', 'mamma', 44), ('vecchietta', 'vecchietta', 38),
                             ('giovane', 'giovane', 46), ('ponzone', 'ponzone', 46), ('orso', 'orso', 58),
                             ('ispettore', 'ispettore', 48), ('furbetto', 'furbetto', 46)]],
    ('cassiere.jpg', 3, 2, ('h', 46), WALK('cassiere') + ['cassiere_seduto', 'cassiere_scan_0', 'cassiere_scan_1']),
    ('icone.jpg', 3, 2, ('w', 0.66), ['icona_restock', 'icona_arrivo', 'icona_soldi', 'icona_felice', 'icona_arrabbiato', 'icona_cestino']),
    ('magazziniere.jpg', 3, 2, ('h', 46), WALK('magazziniere') + ['magazziniere_carry_0', 'magazziniere_carry_1', 'magazziniere_carry_2']),
    ('guardia.jpg', 3, 2, ('h', 48), WALK('guardia') + ['guardia_idle', 'guardia_fischio', 'guardia_ferma']),
    ('capo.jpg', 3, 2, ('h', 46), WALK('capo') + ['capo_idle', 'capo_scrive', 'capo_indica']),
    ('pulizie.jpg', 3, 2, ('h', 46), WALK('pulizie') + ['pulizie_mop_0', 'pulizie_mop_1', 'pulizie_mop_2']),
    ('bancone.jpg', 3, 1, ('w', 1.0), ['bancone', 'bancone_vuoto', ('pacchetto_salumi', 0.35)]),
    ('banconiere.jpg', 4, 2, ('h', 48), WALK('banconiere') + ['banconiere_idle', 'banconiere_slice_0', 'banconiere_slice_1', 'banconiere_give', None]),
    ('imprevisti.jpg', 3, 1, ('w', 0.66), [('carrello', 0.6), 'icona_carrello', 'icona_ispezione']),
    ('forno.jpg', 2, 2, ('w', 1.0), ['forno', 'forno_vuoto', ('frigo', 0.7), ('frigo_vuoto', 0.7)]),
    ('spogliatoio.jpg', 3, 1, ('w', 0.66), [('armadietti', 1.0), 'icona_pausa', 'icona_stanco']),
    ('beccato.jpg', 1, 1, ('w', 0.66), ['icona_beccato']),
    ('esterno.jpg', 3, 3, ('w', 1.0), [('albero', 1.4), ('cipresso', 0.6), ('cespuglio', 0.9), ('lampione', 0.24), ('panchina', 0.9), ('fioriera', 0.8), ('auto_rossa', 1.5), ('ape', 1.2), ('auto_bianca', 1.5)]),
    ('interni.jpg', 3, 2, ('w', 0.5), [('pianta', 0.5), ('piantina', 0.4), ('estintore', 0.3), ('ceste', 0.45), ('scopa', 0.45), ('pomodoro', 0.45)]),
    ('magazzino.jpg', 3, 2, ('w', 0.9), ['merce_Pasta', 'merce_Latticini', 'merce_Salumi', 'merce_Pane', 'merce_Frutta', 'merce_Detersivi']),
    ('sporco.jpg', 3, 2, ('w', 0.8), ['macchia_0', 'macchia_1', 'macchia_2', ('cestino', 0.3), ('icona_pulisci', 0.66), ('cartello_bagnato', 0.4)]),
]

def run(mask):
    """Indices of the longest run of True: the piece itself, not a speck separated by empty rows/columns."""
    best, start = (0, 0), None
    for i, v in enumerate(list(mask) + [False]):
        if v and start is None: start = i
        if not v and start is not None:
            if i - start > best[1] - best[0]: best = (start, i)
            start = None
    return np.arange(*best)

def cutout(img):
    """White sheet background -> transparent: light, unsaturated pixels connected to the cell border."""
    a = np.asarray(img.convert('RGB')).astype(int)
    mx, mn = a.max(2), a.min(2)
    bg = (mn > 232) & (mx - mn < 18)
    m = np.zeros_like(bg); m[0, :] = m[-1, :] = m[:, 0] = m[:, -1] = True; m &= bg
    while True:  # flood fill from the border
        d = m.copy(); d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]; d &= bg
        if (d == m).all(): break
        m = d
    alpha = np.where(m, 0, 255)
    rows, cols = run((alpha > 0).sum(1) > 3), run((alpha > 0).sum(0) > 3)  # ignore JPEG specks and stray marks
    rgba = Image.fromarray(np.dstack([a, alpha]).astype(np.uint8), 'RGBA')
    return rgba.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1)), cols[0]

def pieces():
    """Yields (name, image, anchor_x) for every piece of every sheet."""
    for sheet, cols, rows, (kind, v), names in SHEETS:
        path = ROOT / 'art/sheets' / sheet
        if not path.exists():
            print('skip', sheet); continue
        img = Image.open(path)
        cw, ch = img.width // cols, img.height // rows
        f = None
        for i, name in enumerate(names):
            if not name: continue
            name, w = name if isinstance(name, tuple) else (name, v)
            p, left = cutout(img.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)))
            if kind == 'w': f, ax = w * TILE_W * RES / p.width, 0.5
            else: f, ax = f or v * RES / p.height, min(1, max(0, (cw / 2 - left) / p.width))
            yield name, p.resize((max(1, round(p.width * f)), max(1, round(p.height * f))), Image.LANCZOS), round(ax, 3)

WALL_H = 60  # game px
MURETTO_H = 16  # low front walls
# (frame, panel index in pareti.jpg, horizontal crop as fractions of the panel): textures are front views.
WALLS = [('muro', 0, (0.0, 0.5)), ('muro_poster', 1, (0.25, 0.75)), ('porta', 2, (0.08, 0.92))]

def slant(tex, dark, wall_h=WALL_H):
    """Front-view texture -> wall standing on a cell's top-left edge (frame bottom-centre = edge midpoint + 8 px down)."""
    w, h = 32 * RES, wall_h * RES
    tex = tex.resize((w, h), Image.LANCZOS)
    top = Image.new('RGBA', (w, 3 * RES), (70, 40, 25, 255)); tex.paste(top, (0, 0))  # wall cap
    if dark: tex = Image.eval(tex.convert('RGB'), lambda c: int(c * 0.82)).convert('RGBA')
    # output (x, y) -> texture (x, y + 16 - x/2) in RES units: the bottom edge rises 16 px over 32 px
    out = tex.transform((w, h + 16 * RES), Image.AFFINE, (1, 0, 0, 0.5, 1, -16 * RES), Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    return out

def walls():
    path = ROOT / 'art/sheets/pareti.jpg'
    if not path.exists(): return []
    img = Image.open(path).convert('RGBA'); cw = img.width // 3
    out = []
    for name, i, (a, b) in WALLS:
        panel, _ = cutout(img.crop((i * cw, 0, (i + 1) * cw, img.height)))
        tex = panel.crop((round(a * panel.width), 0, round(b * panel.width), panel.height))
        out += [(f'{name}_l', slant(tex, False), 0.5), (f'{name}_r', slant(tex, True).transpose(Image.FLIP_LEFT_RIGHT), 0.5)]
        if name == 'muro':  # low front wall (cutaway): the bottom of the plain wall
            low = tex.crop((0, round(tex.height * 0.62), tex.width, tex.height))
            out += [('muretto_l', slant(low, False, MURETTO_H), 0.5), ('muretto_r', slant(low, True, MURETTO_H).transpose(Image.FLIP_LEFT_RIGHT), 0.5)]
    return out

def main():
    items = list(pieces()) + walls()
    W, pad, x, y, rowh, at = 1024, 2, 0, 0, 0, {}
    for name, p, _ in items:  # shelf packing, rows left to right
        if x + p.width > W: x, y, rowh = 0, y + rowh + pad, 0
        at[name] = (x, y); x += p.width + pad; rowh = max(rowh, p.height)
    out = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
    frames = {}
    for name, p, ax in items:
        out.paste(p, at[name])
        frames[name] = {'frame': {'x': at[name][0], 'y': at[name][1], 'w': p.width, 'h': p.height},
                        'anchor': {'x': ax, 'y': 1},  # every frame: pooled images take their origin from it
                        'rotated': False, 'trimmed': False,
                        'sourceSize': {'w': p.width, 'h': p.height},
                        'spriteSourceSize': {'x': 0, 'y': 0, 'w': p.width, 'h': p.height}}
    dst = ROOT / 'public/assets'; dst.mkdir(parents=True, exist_ok=True)
    out.save(dst / 'kit.png', optimize=True)
    (dst / 'kit.json').write_text(json.dumps({'frames': frames, 'meta': {'image': 'kit.png', 'scale': RES}}, indent=1))
    print(len(frames), 'frames', out.size)

if __name__ == '__main__':
    main()

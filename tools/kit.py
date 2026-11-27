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
#   ('foot', f): the first piece's lowest point (its front foot) on the cell's bottom vertex, scaled so its far side reaches
#             f x half a tile from there: off-centre gondolas stay inside their cell (playtest 2026-11-27); the other
#             pieces (same unit, other states) take the same scale and anchor;
#   ('h', px): the whole sheet scaled so its first piece is px tall, anchored on each cell's centre line
#             (characters: walk frames don't jitter sideways, seated/reaching poses keep their relative size).
# Every walk_2 is rebuilt from walk_0 with the legs mirrored around the hips: the Gemini sheets put the same leg forward in
# all three walk frames, so the walk never alternated (playtest 2026-11-27). Columns kept to the walker's own legs
# (fractions of the cell) where a child or a cane stands beside them; the cleaner's mop crosses her legs: left as painted.
LEG_WINDOW = {'mamma': (0.2, 0.64), 'vecchietta': (0.35, 0.74)}
NO_LEG_SWAP = {'pulizie'}
# Where the legs start, as a fraction of the figure's height, where thighs overlap (one run) and the automatic search stops at the knees.
LEG_TOP = {'giovane': 0.63, 'ponzone': 0.77, 'furbetto': 0.74, 'capo': 0.62, 'mamma': 0.71, 'magazziniera': 0.66, 'orso': 0.88}
SEATED = 1.3  # seated cashiers drawn bigger, to match the two-cell counter (playtest 2026-11-27)
STATES = lambda b: [b, f'{b}_mezzo', f'{b}_vuoto']
WALK = lambda n: [f'{n}_walk_0', f'{n}_walk_1', f'{n}_walk_2']
# Mamma is painted facing screen left, unlike the rest (draw.ts mirrors by walking direction, assuming bottom-right): mirrored here (playtest 2026-11-27).
FACES_LEFT = {*WALK('mamma'), 'mamma_angry_0', 'mamma_angry_1', 'mamma_angry_2'}
SHEETS = [
    ('arredi.jpg', 3, 3, ('w', 1.0), ['scaffale', None, None, None, None, None, None, None, None]),  # goods: STATES sheets; till: cassa.jpg; door: see WALLS
    # milestone 25: one sheet per unit, full / half / empty
    *[(f'{sheet}.jpg', 3, 1, size, STATES(base)) for sheet, base, size in [
        ('scaffale_pasta', 'scaffale_Pasta', ('foot', 1.0)), ('scaffale_frutta', 'scaffale_Frutta', ('foot', 1.0)), ('scaffale_detersivi', 'scaffale_Detersivi', ('foot', 1.0)),
        ('frigo', 'frigo', ('h', 96)), ('forno_stati', 'forno', ('w', 1.0)), ('bancone_stati', 'bancone', ('w', 1.0))]],  # fridge by height: its door opens wide
    *[(f'{sheet}.jpg', 3, 3, ('h', h), WALK(kind) + [f'{kind}_angry_0', f'{kind}_angry_1', f'{kind}_angry_2',
                                                    f'{kind}_idle', f'{kind}_pay', f'{kind}_pick'])
      for sheet, kind, h in [('cliente', 'signora', 44), ('mamma', 'mamma', 44), ('vecchietta', 'vecchietta', 38),
                             ('giovane', 'giovane', 46), ('ponzone', 'ponzone', 46), ('orso', 'orso', 58),
                             ('ispettore', 'ispettore', 48), ('furbetto', 'furbetto', 46)]],
    ('cassiere.jpg', 3, 2, ('h', 46), WALK('cassiere') + [('cassiere_seduto', SEATED), ('cassiere_scan_0', SEATED), ('cassiere_scan_1', SEATED)]),
    ('icone.jpg', 3, 2, ('w', 0.66), ['icona_restock', 'icona_arrivo', 'icona_soldi', 'icona_felice', 'icona_arrabbiato', 'icona_cestino']),
    ('magazziniere.jpg', 3, 2, ('h', 46), WALK('magazziniere') + ['magazziniere_carry_0', 'magazziniere_carry_1', 'magazziniere_carry_2']),
    # playtest 2026-11-27: men at the till, women in the warehouse too; a straight checkout lane
    ('cassiere_m.jpg', 3, 2, ('h', 46), WALK('cassiere_m') + [('cassiere_m_seduto', SEATED), ('cassiere_m_scan_0', SEATED), ('cassiere_m_scan_1', SEATED)]),
    ('magazziniera.jpg', 3, 2, ('h', 46), WALK('magazziniera') + ['magazziniera_carry_0', 'magazziniera_carry_1', 'magazziniera_carry_2']),
    ('cassa.jpg', 2, 1, ('w', 1.0), [('cassa', 1.1), ('sgabello', 0.3)]),  # playtest 2026-11-27: register at the exit end, by the cashier; one cell
    ('guardia.jpg', 3, 2, ('h', 48), WALK('guardia') + ['guardia_idle', 'guardia_fischio', 'guardia_ferma']),
    ('capo.jpg', 3, 2, ('h', 46), WALK('capo') + ['capo_idle', 'capo_scrive', 'capo_indica']),
    ('pulizie.jpg', 3, 2, ('h', 46), WALK('pulizie') + ['pulizie_mop_0', 'pulizie_mop_1', 'pulizie_mop_2']),
    ('bancone.jpg', 3, 1, ('w', 1.0), [None, None, ('pacchetto_salumi', 0.35)]),  # counter: bancone_stati.jpg
    ('banconiere.jpg', 4, 2, ('h', 48), WALK('banconiere') + ['banconiere_idle', 'banconiere_slice_0', 'banconiere_slice_1', 'banconiere_give', None]),
    ('imprevisti.jpg', 3, 1, ('w', 0.66), [('carrello', 0.6), 'icona_carrello', 'icona_ispezione']),
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

def unline(img, cols):
    """Gemini sometimes draws dark lines between the cells: whiten near-full-height dark columns around each cell border."""
    a = np.asarray(img).astype(int)
    dark = (a.max(2) < 120).sum(0) > img.height * 0.5
    out = a.copy()
    for k in range(1, cols):
        b = k * img.width // cols
        for x in range(max(0, b - 40), min(img.width, b + 40)):
            if dark[x]: out[:, max(0, x - 3):x + 4] = 255
    return Image.fromarray(out.astype(np.uint8))

def runs(row):
    """(start, end) of the painted runs in a row of booleans, specks and hairline gaps ignored."""
    out = []
    for x in np.nonzero(row)[0]:
        if out and x - out[-1][1] <= 3: out[-1][1] = x
        else: out.append([x, x])
    return [r for r in out if r[1] - r[0] >= 3]

def swap_legs(cell, window=(0, 1), top=None):
    """The legs (rows from the feet up while two runs show, i.e. up to the crotch or the hem) mirrored around their middle."""
    a = np.array(cell); w = a.shape[1]; x0, x1 = round(window[0] * w), round(window[1] * w)
    fg = a[:, x0:x1].min(2) < 235
    ys = np.nonzero(fg.sum(1) > 3)[0]; y, miss = ys.max(), 0
    while y > 0 and len(runs(fg[y])) < 2: y -= 1  # up from the soles to the first row with both legs
    while y > 0 and miss < 3: y -= 1; miss = miss + 1 if len(runs(fg[y])) < 2 else 0
    hem = y + miss + 1
    if top: hem = round(ys.min() + top * (ys.max() - ys.min()))
    r = runs(fg[hem]); xc = x0 + (r[0][0] + r[-1][1]) / 2
    src = np.round(2 * xc - np.arange(x0, x1)).astype(int); ok = (src >= x0) & (src < x1)
    legs = np.full_like(a[hem:, x0:x1], 255); legs[:, ok] = a[hem:, src[ok]]; a[hem:, x0:x1] = legs
    return Image.fromarray(a)

def pieces():
    """Yields (name, image, anchor_x) for every piece of every sheet."""
    for sheet, cols, rows, (kind, v), names in SHEETS:
        path = ROOT / 'art/sheets' / sheet
        if not path.exists():
            print('skip', sheet); continue
        img = unline(Image.open(path).convert('RGB'), cols)
        cw, ch = img.width // cols, img.height // rows
        f = None
        for i, name in enumerate(names):
            if not name: continue
            name, w = name if isinstance(name, tuple) else (name, None)  # 'w': own width; 'h': size multiplier
            cell = lambda j: img.crop(((j % cols) * cw, (j // cols) * ch, (j % cols + 1) * cw, (j // cols + 1) * ch))
            k = name.removesuffix('_walk_2')
            swap = k != name and k not in NO_LEG_SWAP
            p, left = cutout(swap_legs(cell(names.index(f'{k}_walk_0')), LEG_WINDOW.get(k, (0, 1)), LEG_TOP.get(k)) if swap else cell(i))
            if kind == 'w': f = k = (w or v) * TILE_W * RES / p.width; ax = 0.5
            elif kind == 'foot':
                if f is None:
                    a = np.array(p.getchannel('A')) > 128; ys, xs = np.nonzero(a)
                    xb = xs[ys >= ys.max() - 2].mean()  # front foot
                    f, foot = v * TILE_W / 2 * RES / max(xb, p.width - xb), xb / p.width
                k = f; ax = foot
            else: f = f or v * RES / p.height; k = f * (w or 1); ax = min(1, max(0, (cw / 2 - left) / p.width))
            if name in FACES_LEFT: p, ax = p.transpose(Image.FLIP_LEFT_RIGHT), 1 - ax
            yield name, p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS), round(ax, 3)

WALL_H = 60  # game px
MURETTO_H = 16  # low front walls
# (frame, panel index in pareti2.jpg, horizontal crop as fractions of the panel): textures are front views.
# Panels: outer wall with window, inner tiled wall, outer wall with poster, sliding door (playtest 2026-11-27).
WALLS = [('muro', 0, (0.03, 0.24)), ('muro_finestra', 0, (0.12, 0.88)), ('muro_poster', 2, (0.12, 0.88)), ('porta', 3, (0.04, 0.96)),
         ('muro_interno', 1, (0.14, 0.62))]
WALL_TOP = 0.2  # the panels fade out at the top: dropped

def slant(tex, dark, wall_h=WALL_H):
    """Front-view texture -> wall standing on a cell's top-left edge (frame bottom-centre = edge midpoint + 8 px down)."""
    w, h = 32 * RES, wall_h * RES
    tex = tex.resize((w, h), Image.LANCZOS)
    top = Image.new('RGBA', (w, 3 * RES), (70, 40, 25, 255)); tex.paste(top, (0, 0))  # wall cap
    if dark: tex = Image.merge('RGBA', [*Image.eval(tex.convert('RGB'), lambda c: int(c * 0.82)).split(), tex.getchannel('A')])  # keeps holes
    # output (x, y) -> texture (x, y + 16 - x/2) in RES units: the bottom edge rises 16 px over 32 px
    out = tex.transform((w, h + 16 * RES), Image.AFFINE, (1, 0, 0, 0.5, 1, -16 * RES), Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    return out

def walls():
    path = ROOT / 'art/sheets/pareti2.jpg'
    if not path.exists(): return []
    img = Image.open(path).convert('RGBA'); cw = img.width // 4
    out = []
    for name, i, (a, b) in WALLS:
        panel, _ = cutout(img.crop((i * cw, 0, (i + 1) * cw, img.height)))
        tex = panel.crop((round(a * panel.width), round(WALL_TOP * panel.height), round(b * panel.width), panel.height))
        out += [(f'{name}_l', slant(tex, False), 0.5), (f'{name}_r', slant(tex, True).transpose(Image.FLIP_LEFT_RIGHT), 0.5)]
        if name == 'muro':  # low front wall (cutaway): the bottom of the plain wall
            low = tex.crop((0, round(tex.height * 0.6), tex.width, tex.height))
            out += [('muretto_l', slant(low, False, MURETTO_H), 0.5), ('muretto_r', slant(low, True, MURETTO_H).transpose(Image.FLIP_LEFT_RIGHT), 0.5)]
    shutter = ROOT / 'art/sheets/serranda.jpg'  # warehouse doorway (playtest 2026-11-27): open roller shutter, panel 0 of 2, housing kept
    if shutter.exists():
        img = Image.open(shutter).convert('RGBA')
        tex, _ = cutout(img.crop((0, 0, img.width // 2, img.height)))  # the empty opening is white and touches the border: transparent
        out += [('serranda_l', slant(tex, False), 0.5), ('serranda_r', slant(tex, True).transpose(Image.FLIP_LEFT_RIGHT), 0.5)]
    return out

def main():
    items = list(pieces()) + walls()
    # the full fridge's door swings open to the left: line its body (the right part) up with the closed ones
    wm = next(p.width for n, p, _ in items if n == 'frigo_mezzo')
    items = [(n, p, round(1 - wm / 2 / p.width, 3) if n == 'frigo' else 0.5 if n in ('frigo_mezzo', 'frigo_vuoto') else ax) for n, p, ax in items]
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

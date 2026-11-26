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
                                      'scaffale_Frutta', 'scaffale_Detersivi', 'cassa', ('porta', 0.7)]),
    ('cliente.jpg', 3, 3, ('h', 44), WALK('cliente') + ['cliente_angry_0', 'cliente_angry_1', 'cliente_angry_2',
                                                        'cliente_idle', 'cliente_pay', 'cliente_pick']),
    ('cassiere.jpg', 3, 2, ('h', 46), WALK('cassiere') + ['cassiere_seduto', 'cassiere_scan_0', 'cassiere_scan_1']),
    ('magazziniere.jpg', 3, 2, ('h', 46), WALK('magazziniere') + ['magazziniere_carry_0', 'magazziniere_carry_1', 'magazziniere_carry_2']),
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
            name, w = name if isinstance(name, tuple) else (name, v)
            p, left = cutout(img.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)))
            if kind == 'w': f, ax = w * TILE_W * RES / p.width, 0.5
            else: f, ax = f or v * RES / p.height, min(1, max(0, (cw / 2 - left) / p.width))
            yield name, p.resize((max(1, round(p.width * f)), max(1, round(p.height * f))), Image.LANCZOS), round(ax, 3)

def main():
    items = list(pieces())
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

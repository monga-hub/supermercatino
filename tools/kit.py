# Builds public/assets/kit.png + kit.json (Phaser JSON-hash atlas) from the Gemini sheets in art/sheets/.
# Each sheet is a regular grid; each cell holds one piece on a flat white background.
# Usage: python3 tools/kit.py
import json, pathlib, numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
TILE_W = 64
RES = 2  # frames stored at 2x, drawn at 0.5 scale: sharp when zoomed in

# (sheet, cols, rows, [(name, size)]) — size: ('w', fraction of tile width) or ('h', height in game px).
# Anchor: objects stand on the bottom vertex of their cell, people on the cell centre (both bottom-centre of the frame).
SHEETS = [
    ('arredi.jpg', 3, 3, [
        ('scaffale', ('w', 1.0)), ('scaffale_Pasta', ('w', 1.0)), ('scaffale_Latticini', ('w', 1.0)),
        ('scaffale_Salumi', ('w', 1.0)), ('scaffale_Pane', ('w', 1.0)), ('scaffale_Frutta', ('w', 1.0)),
        ('scaffale_Detersivi', ('w', 1.0)), ('cassa', ('w', 1.0)), ('porta', ('w', 0.7)),
    ]),
    ('personaggi.jpg', 3, 2, [
        ('cliente', ('h', 44)), ('cliente_arrabbiato', ('h', 44)), ('cassiere_seduto', ('h', 38)),
        ('cassiere', ('h', 46)), ('magazziniere', ('h', 46)), ('magazziniere_scatolone', ('h', 46)),
    ]),
]

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
    rows = np.where((alpha > 0).sum(1) > 3)[0]; cols = np.where((alpha > 0).sum(0) > 3)[0]  # ignore JPEG specks
    rgba = Image.fromarray(np.dstack([a, alpha]).astype(np.uint8), 'RGBA')
    return rgba.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))

def pieces():
    for sheet, cols, rows, names in SHEETS:
        path = ROOT / 'art/sheets' / sheet
        if not path.exists():
            print('skip', sheet); continue
        img = Image.open(path)
        cw, ch = img.width // cols, img.height // rows
        for i, (name, (kind, v)) in enumerate(names):
            p = cutout(img.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)))
            f = v * TILE_W * RES / p.width if kind == 'w' else v * RES / p.height
            yield name, p.resize((max(1, round(p.width * f)), max(1, round(p.height * f))), Image.LANCZOS)

def main():
    items = list(pieces())
    W, pad, x, y, rowh, at = 1024, 2, 0, 0, 0, {}
    for name, p in items:  # shelf packing, rows left to right
        if x + p.width > W: x, y, rowh = 0, y + rowh + pad, 0
        at[name] = (x, y); x += p.width + pad; rowh = max(rowh, p.height)
    out = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
    frames = {}
    for name, p in items:
        out.paste(p, at[name])
        frames[name] = {'frame': {'x': at[name][0], 'y': at[name][1], 'w': p.width, 'h': p.height},
                        'rotated': False, 'trimmed': False,
                        'sourceSize': {'w': p.width, 'h': p.height},
                        'spriteSourceSize': {'x': 0, 'y': 0, 'w': p.width, 'h': p.height}}
    dst = ROOT / 'public/assets'; dst.mkdir(parents=True, exist_ok=True)
    out.save(dst / 'kit.png', optimize=True)
    (dst / 'kit.json').write_text(json.dumps({'frames': frames, 'meta': {'image': 'kit.png', 'scale': RES}}, indent=1))
    print(len(frames), 'frames', out.size)

if __name__ == '__main__':
    main()

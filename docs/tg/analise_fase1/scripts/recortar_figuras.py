# -*- coding: utf-8 -*-
"""Gera recortes dos diagramas na resolucao original (sem upscale), lado maior <= MAX px.
Saida: figuras/recortes/figNN_rCcC.png (linha/coluna) + figuras/recortes/indice_recortes.csv
"""
import csv, json, math, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX = 1400       # lado maior do recorte
OVER = 120       # sobreposicao entre recortes (px) para nao cortar texto
figs = json.load(open(os.path.join(ROOT, 'figuras', 'figuras.json'), encoding='utf-8'))
out = os.path.join(ROOT, 'figuras', 'recortes')
rows = []
for f in figs:
    if not f['arquivos'] or f['num'] > 30:   # so diagramas e prototipos (Fig. 1-30)
        continue
    path = os.path.join(ROOT, 'figuras', f['arquivos'][0])
    im = Image.open(path)
    w, h = im.size
    nx, ny = math.ceil(w / MAX), math.ceil(h / MAX)
    if nx == 1 and ny == 1:
        rows.append([f['num'], f['arquivos'][0], w, h, 'inteira', path]); continue
    sw, sh = math.ceil(w / nx), math.ceil(h / ny)
    for r in range(ny):
        for c in range(nx):
            x0, y0 = max(0, c * sw - OVER), max(0, r * sh - OVER)
            x1, y1 = min(w, (c + 1) * sw + OVER), min(h, (r + 1) * sh + OVER)
            name = f'fig{f["num"]:02d}_r{r+1}c{c+1}.png'
            im.crop((x0, y0, x1, y1)).save(os.path.join(out, name))
            rows.append([f['num'], f['arquivos'][0], w, h, f'{name} ({x0},{y0})-({x1},{y1})', os.path.join(out, name)])
with open(os.path.join(out, 'indice_recortes.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
    wr = csv.writer(fh, delimiter=';'); wr.writerow(['Figura', 'Arquivo', 'Largura', 'Altura', 'Recorte', 'Caminho'])
    wr.writerows(rows)
for r in rows:
    print(r[0], r[1], f'{r[2]}x{r[3]}', r[4])

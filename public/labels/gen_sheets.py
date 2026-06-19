# -*- coding: utf-8 -*-
"""拼版：每 4 张标签合成一张 100x150mm 标签纸，纵向叠放，带裁切线，输出多页 PDF。"""
import os
import openpyxl
from PIL import Image, ImageDraw
import gen_labels as g

DPI = 300
SHEET_W, SHEET_H = 1181, 1772        # 100x150mm @300dpi
ROWS = 4                              # 每页 4 张
SLOT_W, SLOT_H = SHEET_W, SHEET_H // ROWS   # 每张标签槽位 (1181x443 ≈ 100x37.5mm)
OUT_DIR = "/sessions/optimistic-vibrant-hamilton/mnt/outputs"

def load_rows():
    wb = openpyxl.load_workbook(g.XLSX, data_only=True)
    ws = wb.active
    rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue
        name, shelf, price = (row + (None, None, None))[:3]
        if not name or not shelf:
            continue
        rows.append((name, shelf, price))
    return rows

def make_sheet(batch):
    sheet = Image.new("RGB", (SHEET_W, SHEET_H), "white")
    for idx, rec in enumerate(batch):
        lbl = g.render_label(*rec)                       # 2362x886
        lbl = lbl.resize((SLOT_W, SLOT_H), Image.LANCZOS) # 缩放进槽位
        sheet.paste(lbl, (0, idx * SLOT_H))
    # 裁切线（标签间细灰线，便于裁剪）
    d = ImageDraw.Draw(sheet)
    for r in range(1, ROWS):
        y = r * SLOT_H
        d.line([(0, y), (SHEET_W, y)], fill=(170, 170, 170), width=1)
    return sheet

def main():
    rows = load_rows()
    sheets = [make_sheet(rows[i:i+ROWS]) for i in range(0, len(rows), ROWS)]
    out = os.path.join(OUT_DIR, "A区货架标签_100x150_4张每页.pdf")
    sheets[0].save(out, "PDF", resolution=DPI, save_all=True,
                   append_images=sheets[1:])
    print("标签数:", len(rows), "页数:", len(sheets), "->", out)
    sheets[0].save(os.path.join(OUT_DIR, "_sheet_sample.png"))

if __name__ == "__main__":
    main()

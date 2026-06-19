# -*- coding: utf-8 -*-
"""超市货架标签批量生成：读 A区.xlsx，按 PSD 样式渲染，每张标签 1 页(200x75mm)合成多页 PDF。"""
import os, math
import openpyxl
from PIL import Image, ImageDraw, ImageFont

# ---------- 配置 ----------
DPI = 300
LBL_W, LBL_H = 2362, 886            # 单张标签像素 (=200x75mm @300dpi)
SHEAR = math.tan(math.radians(7))   # 模拟钉钉进步体 7° 斜体
MARGIN = 0.12                        # 内容四周留白比例(上下左右),越大边距越多
# 钉钉进步体下载不到，用 Noto Sans CJK Bold 代替；若有原字体把路径填到 FONT_OVERRIDE
FONT_OVERRIDE = os.environ.get("LABEL_FONT", "").strip()
NOTO = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
FONT_PATH = FONT_OVERRIDE if FONT_OVERRIDE and os.path.exists(FONT_OVERRIDE) else NOTO
USE_SHEAR = not (FONT_OVERRIDE and os.path.exists(FONT_OVERRIDE))  # 用原字体时不再额外加斜

UPLOADS = "/sessions/optimistic-vibrant-hamilton/mnt/uploads"
XLSX = os.path.join(UPLOADS, "A区.xlsx")
OUT_DIR = "/sessions/optimistic-vibrant-hamilton/mnt/outputs"
BLACK = (0, 0, 0, 255)

_font_cache = {}
def font(sz):
    sz = int(sz)
    if sz not in _font_cache:
        try:
            _font_cache[sz] = ImageFont.truetype(FONT_PATH, sz)
        except Exception:
            _font_cache[sz] = ImageFont.truetype(FONT_PATH, sz, index=0)
    return _font_cache[sz]

def text_size(s, f):
    l, t, r, b = f.getbbox(s)
    return r - l, b - t, l, t

def fit_font(s, max_w, max_h):
    """二分找使文本同时不超过 max_w/max_h 的字号"""
    lo, hi, best = 6, int(max_h * 1.6) + 4, 6
    while lo <= hi:
        mid = (lo + hi) // 2
        w, h, _, _ = text_size(s, font(mid))
        if w <= max_w and h <= max_h:
            best = mid; lo = mid + 1
        else:
            hi = mid - 1
    return best

def draw_text(base, s, box, *, align="center", valign="center",
              size=None, max_fill=0.92):
    """把 s 画进 box=(x0,y0,x1,y1)。size=None 时按 box 自适应。可选斜体。"""
    if s is None or s == "":
        return
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    sz = size or fit_font(s, bw * max_fill, bh * max_fill)
    f = font(sz)
    w, h, ox, oy = text_size(s, f)
    # 在一张刚好容纳的透明图上绘制，便于斜切
    pad = int(h * 0.4) + 4
    tile = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    d.text((pad - ox, pad - oy), s, font=f, fill=BLACK)
    if USE_SHEAR:
        nw = tile.width + int(tile.height * SHEAR) + 2
        tile = tile.transform((nw, tile.height), Image.AFFINE,
                              (1, SHEAR, -SHEAR * tile.height, 0, 1, 0),
                              resample=Image.BICUBIC)
    tw, th = tile.width, tile.height
    # 对齐
    if align == "left":   px = x0 - pad
    elif align == "right":px = x1 - tw + pad
    else:                 px = x0 + (bw - tw) // 2
    if valign == "top":   py = y0 - pad
    elif valign == "bottom": py = y1 - th + pad
    else:                 py = y0 + (bh - th) // 2
    base.alpha_composite(tile, (int(px), int(py)))

def rounded_dashed(draw, box, radius, width, dash=46, gap=30):
    """虚线圆角矩形边框"""
    x0, y0, x1, y1 = box
    def seg(p0, p1):
        (ax, ay), (bx, by) = p0, p1
        length = math.hypot(bx - ax, by - ay)
        if length == 0: return
        ux, uy = (bx - ax) / length, (by - ay) / length
        d = 0
        while d < length:
            e = min(d + dash, length)
            draw.line([(ax + ux * d, ay + uy * d), (ax + ux * e, ay + uy * e)],
                      fill=BLACK, width=width)
            d += dash + gap
    # 四条直边（避开圆角）
    seg((x0 + radius, y0), (x1 - radius, y0))
    seg((x0 + radius, y1), (x1 - radius, y1))
    seg((x0, y0 + radius), (x0, y1 - radius))
    seg((x1, y0 + radius), (x1, y1 - radius))
    # 四个圆角弧（虚线）
    for cx, cy, a0, a1 in [
        (x0 + radius, y0 + radius, 180, 270),
        (x1 - radius, y0 + radius, 270, 360),
        (x1 - radius, y1 - radius, 0, 90),
        (x0 + radius, y1 - radius, 90, 180)]:
        steps = 22
        on = True; acc = 0
        prev = None
        for i in range(steps + 1):
            ang = math.radians(a0 + (a1 - a0) * i / steps)
            p = (cx + radius * math.cos(ang), cy + radius * math.sin(ang))
            if prev is not None:
                seglen = math.hypot(p[0]-prev[0], p[1]-prev[1])
                # 简单按弧分段交替
                if (i // 2) % 2 == 0:
                    draw.line([prev, p], fill=BLACK, width=width)
            prev = p

def fmt_price(v):
    if v is None: return ""
    if isinstance(v, (int, float)):
        if float(v).is_integer(): return str(int(v))
        return ("%g" % v)
    return str(v)

def parse_shelf(code):
    """A1-1-1 -> ('A1','-01','-01')"""
    parts = str(code).split("-")
    region = parts[0]
    lvl = parts[1] if len(parts) > 1 else ""
    col = parts[2] if len(parts) > 2 else ""
    lvl = "-" + lvl.zfill(2) if lvl != "" else ""
    col = "-" + col.zfill(2) if col != "" else ""
    return region, lvl, col

def split_name(name):
    name = str(name).strip()
    if " " in name:
        i = name.rfind(" ")
        return [name[:i].strip(), name[i+1:].strip()]
    return [name]

def render_label(name, shelf, price):
    img = Image.new("RGBA", (LBL_W, LBL_H), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    # 左侧虚线圆角框
    rounded_dashed(d, (64, 38, 1115, 850), radius=64, width=7)
    region, lvl, col = parse_shelf(shelf)
    # 区号
    draw_text(img, region, (431, 134, 755, 344), align="center", valign="center")
    # 层
    draw_text(img, lvl, (105, 471, 420, 680), align="center", valign="center")
    draw_text(img, "层", (424, 471, 512, 553), align="center", valign="center")
    draw_text(img, "LEVEL", (166, 700, 426, 780), align="center", valign="center")
    # 列
    draw_text(img, col, (630, 471, 948, 680), align="center", valign="center")
    draw_text(img, "列", (981, 470, 1069, 554), align="center", valign="center")
    draw_text(img, "COLUMN", (630, 699, 999, 782), align="center", valign="center")
    # 商品名（最多两行，顶对齐左对齐）
    lines = split_name(name)
    nbox = (1164, 111, 2024, 374)
    nx0, ny0, nx1, ny1 = nbox
    nbw, nbh = nx1 - nx0, ny1 - ny0
    line_h = nbh / 2 - 6
    # 每行字号取能容下最宽行的
    sz = min(fit_font(L, nbw, line_h) for L in lines) if lines else 60
    f = font(sz)
    cy = ny0
    for L in lines:
        draw_text(img, L, (nx0, int(cy), nx1, int(cy + line_h)),
                  align="left", valign="top", size=sz)
        cy += line_h + 6
    # 售价区
    draw_text(img, "售价", (1205, 549, 1390, 642), align="left", valign="center")
    draw_text(img, "PRICE", (1156, 666, 1503, 781), align="left", valign="center")
    draw_text(img, "RM", (1554, 653, 1800, 779), align="left", valign="center")
    # 价格：高度上限下调约20%(190->152)，右边界收到2300留页边距，避免4位价格顶边
    draw_text(img, fmt_price(price), (1818, 610, 2300, 762),
              align="left", valign="center")
    img = img.convert("RGB")
    if MARGIN > 0:                       # 内容整体缩小并居中,四周留白边
        s = 1 - MARGIN
        cw, ch = int(LBL_W * s), int(LBL_H * s)
        inner = img.resize((cw, ch), Image.LANCZOS)
        canvas = Image.new("RGB", (LBL_W, LBL_H), "white")
        canvas.paste(inner, ((LBL_W - cw) // 2, (LBL_H - ch) // 2))
        img = canvas
    return img

def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb.active
    rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:  # 表头
            continue
        name, shelf, price = (row + (None, None, None))[:3]
        if not name or not shelf:   # 跳过空白行
            continue
        rows.append((name, shelf, price))
    print("有效标签数:", len(rows))
    imgs = [render_label(*r) for r in rows]
    out_pdf = os.path.join(OUT_DIR, "A区货架标签.pdf")
    imgs[0].save(out_pdf, "PDF", resolution=DPI, save_all=True,
                 append_images=imgs[1:])
    print("PDF:", out_pdf, "页数:", len(imgs))
    # 存一张样张 PNG 便于核对
    imgs[0].save(os.path.join(OUT_DIR, "_sample_label.png"))

if __name__ == "__main__":
    main()

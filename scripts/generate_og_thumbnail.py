import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
img = Image.new('RGBA', (W, H), (11, 15, 25, 255))
draw = ImageDraw.Draw(img)

# 1. Background Gradient (Dark Slate to Deep Blue/Navy)
for y in range(H):
    ratio = y / H
    r = int(11 * (1 - ratio) + 4 * ratio)
    g = int(15 * (1 - ratio) + 10 * ratio)
    b = int(25 * (1 - ratio) + 40 * ratio)
    draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

# 2. Isometric / Architectural Grid pattern on the right side
grid_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
grid_draw = ImageDraw.Draw(grid_overlay)

# Perspective grid lines
for x in range(500, W + 300, 40):
    grid_draw.line([(x, 0), (x - 250, H)], fill=(30, 58, 138, 45), width=1)
for y in range(0, H + 200, 35):
    grid_draw.line([(500, y), (W, y - 100)], fill=(30, 58, 138, 45), width=1)

# Subtle dots at intersections
for x in range(550, W, 80):
    for y in range(50, H, 70):
        grid_draw.rectangle([x-1, y-1, x+1, y+1], fill=(56, 189, 248, 70))

# 3. Stylized 3D High-rise Buildings / Silhouettes on the right
buildings = [
    # (x, w, h, fill_color, border_color)
    (680, 70, 260, (15, 23, 42, 220), (56, 189, 248, 140)),
    (770, 95, 380, (17, 24, 39, 230), (245, 158, 11, 180)),
    (885, 80, 310, (15, 23, 42, 220), (56, 189, 248, 140)),
    (980, 110, 440, (30, 41, 59, 240), (96, 165, 250, 200)),
    (1105, 85, 240, (15, 23, 42, 220), (56, 189, 248, 140)),
    # Front layer buildings
    (720, 80, 200, (10, 15, 30, 250), (14, 165, 233, 190)),
    (830, 100, 260, (15, 23, 42, 250), (251, 191, 36, 220)),
    (945, 85, 220, (10, 15, 30, 250), (14, 165, 233, 190)),
    (1045, 100, 320, (20, 30, 50, 250), (56, 189, 248, 220)),
]

base_y = 570
for bx, bw, bh, bfill, bborder in buildings:
    by = base_y - bh
    # Building block
    grid_draw.rectangle([bx, by, bx + bw, base_y], fill=bfill, outline=bborder, width=2)
    # Windows grid
    for wx in range(bx + 8, bx + bw - 8, 14):
        for wy in range(by + 12, base_y - 12, 20):
            # Window glow
            win_alpha = 180 if (wx * 7 + wy * 13) % 5 == 0 else 70
            grid_draw.rectangle([wx, wy, wx + 6, wy + 9], fill=(245, 158, 11, win_alpha) if (wx + wy) % 3 == 0 else (56, 189, 248, win_alpha))

# Construction Crane on top of the tallest building (980, base_y - 440)
cx = 1040
cy = base_y - 440
# Mast (vertical)
grid_draw.line([(cx, cy), (cx, cy - 70)], fill=(245, 158, 11, 240), width=3)
# Jib (horizontal arm)
grid_draw.line([(cx - 70, cy - 65), (cx + 100, cy - 65)], fill=(245, 158, 11, 240), width=3)
# Cable
grid_draw.line([(cx + 60, cy - 65), (cx + 60, cy - 25)], fill=(226, 232, 240, 200), width=1)
# Hook
grid_draw.rectangle([cx + 57, cy - 25, cx + 63, cy - 18], fill=(245, 158, 11, 255))
# Tie wires
grid_draw.line([(cx, cy - 70), (cx - 70, cy - 65)], fill=(245, 158, 11, 160), width=1)
grid_draw.line([(cx, cy - 70), (cx + 30, cy - 65)], fill=(245, 158, 11, 160), width=1)

img = Image.alpha_composite(img, grid_overlay)
draw = ImageDraw.Draw(img)

# 4. Vignette / Left-side darkening for text readability
vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
v_draw = ImageDraw.Draw(vignette)
for x in range(W):
    if x < 650:
        alpha = int(220 * (1 - (x / 650) ** 1.8))
        v_draw.line([(x, 0), (x, H)], fill=(8, 12, 22, alpha))
img = Image.alpha_composite(img, vignette)
draw = ImageDraw.Draw(img)

# 5. Fonts setup
font_path = "C:/Windows/Fonts/malgunbd.ttf"
font_regular = "C:/Windows/Fonts/malgun.ttf"

font_badge = ImageFont.truetype(font_path, 16)
font_title = ImageFont.truetype(font_path, 60)
font_subtitle = ImageFont.truetype(font_path, 30)
font_desc = ImageFont.truetype(font_regular, 20)
font_pill = ImageFont.truetype(font_path, 16)
font_company = ImageFont.truetype(font_path, 14)
font_logo = ImageFont.truetype(font_path, 18)

# 6. Render Elements on the Left Side
left_margin = 70

# Category Pill Badge (Top)
pill_text = "도시 정비사업 턴제 경영·전략 시뮬레이션"
pill_x, pill_y = left_margin, 65
pill_w = 345
pill_h = 32
draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=16, fill=(15, 23, 42, 230), outline=(56, 189, 248, 180), width=1)
draw.text((pill_x + 16, pill_y + 6), pill_text, font=font_badge, fill=(56, 189, 248, 255))

# Main Title: "재건축 크래프트" with glow effect
title_text = "재건축 크래프트"
title_x, title_y = left_margin, 115

# Glow shadow behind title
for offset in [(0, 3), (2, 2), (-2, 2), (0, 0)]:
    draw.text((title_x + offset[0], title_y + offset[1]), title_text, font=font_title, fill=(180, 83, 9, 200))
draw.text((title_x, title_y), title_text, font=font_title, fill=(251, 191, 36, 255))

# Subtitle: ": 시공사 수주전쟁"
sub_text = ": 시공사 수주전쟁"
sub_x = title_x + 400
sub_y = title_y + 24
draw.text((sub_x, sub_y), sub_text, font=font_subtitle, fill=(241, 245, 249, 255))

# English Title Tag
eng_text = "RECONSTRUCTION CRAFT"
eng_y = title_y + 80
draw.text((left_margin, eng_y), eng_text, font=font_badge, fill=(148, 163, 184, 255))

# Accent bar
draw.line([(left_margin, eng_y + 30), (left_margin + 500, eng_y + 30)], fill=(245, 158, 11, 220), width=3)

# Description Catchphrase
desc_lines = [
    "15개 단지, 8개 건설사, 수십조원의 시공권 격돌!",
    "조합원 마음을 얻어라! 하지만 회사의 돈과 캐파는 무한하지 않다.",
    "3D 도시 지도에서 펼쳐지는 리얼 정비사업 수주 전략 시뮬레이터"
]
desc_y = eng_y + 48
for i, line in enumerate(desc_lines):
    color = (255, 255, 255, 255) if i == 0 else (203, 213, 225, 230)
    draw.text((left_margin, desc_y + i * 28), line, font=font_desc, fill=color)

# Feature Badges
features = [
    ("15개 신시가지 단지", (59, 130, 246)),
    ("8대 건설사 격돌", (245, 158, 11)),
    ("단독입찰·수의계약", (168, 85, 247)),
    ("반독점 밸런스 엔진", (16, 185, 129)),
]

feat_y = desc_y + len(desc_lines) * 28 + 24
cur_x = left_margin
for ftext, fcolor in features:
    fw = len(ftext) * 14 + 24
    draw.rounded_rectangle([cur_x, feat_y, cur_x + fw, feat_y + 34], radius=6, fill=(15, 23, 42, 230), outline=(*fcolor, 180), width=1)
    draw.text((cur_x + 12, feat_y + 7), ftext, font=font_pill, fill=(*fcolor, 255))
    cur_x += fw + 12

# 7. 8 Construction Companies Row (At the bottom)
comp_bar_y = 530
draw.text((left_margin, comp_bar_y - 24), "참여 가상 건설사 8개사 라인업", font=font_badge, fill=(148, 163, 184, 255))

companies = [
    ("태성건설", (2, 132, 199)),
    ("한강건설", (22, 163, 74)),
    ("대륙건설", (220, 38, 38)),
    ("미래건설", (139, 92, 246)),
    ("정우건설", (234, 88, 12)),
    ("세원건설", (8, 145, 178)),
    ("동방건설", (225, 29, 72)),
    ("신화건설", (217, 119, 6)),
]

chip_x = left_margin
for cname, ccolor in companies:
    # Chip pill
    chip_w = 68
    draw.rounded_rectangle([chip_x, comp_bar_y, chip_x + chip_w, comp_bar_y + 28], radius=4, fill=(15, 23, 42, 220), outline=(*ccolor, 200), width=1)
    # Color dot
    draw.ellipse([chip_x + 8, comp_bar_y + 9, chip_x + 18, comp_bar_y + 19], fill=(*ccolor, 255))
    draw.text((chip_x + 22, comp_bar_y + 6), cname[:2], font=font_company, fill=(241, 245, 249, 255))
    chip_x += chip_w + 8

# Top Right Logo: databrew
logo_x = W - 180
logo_y = 40
draw.rounded_rectangle([logo_x, logo_y, logo_x + 130, logo_y + 36], radius=6, fill=(15, 23, 42, 200), outline=(100, 116, 139, 120), width=1)
draw.ellipse([logo_x + 12, logo_y + 11, logo_x + 24, logo_y + 23], fill=(245, 158, 11, 255))
draw.text((logo_x + 30, logo_y + 8), "databrew", font=font_logo, fill=(255, 255, 255, 255))

# Save image
output_path = "public/og-thumbnail.png"
img.save(output_path, "PNG", quality=95)
print(f"Successfully generated {output_path} ({W}x{H})")

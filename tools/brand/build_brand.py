"""GoodPush brand kit — logos (SVG, text converted to paths), PNGs, profile pictures, favicons.
   python3 tools/brand/build_brand.py      (needs: fonttools brotli pillow playwright)
Writes static/brand/* (served at /brand/…) and static/favicon.ico + static/favicon-96x96.png."""
import io, os, base64
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'static', 'brand')
os.makedirs(OUT, exist_ok=True)
INK, PAPER, SUN, CREAM = '#141414', '#FBF8F1', '#F6E36B', '#EEE7D2'

# ---------- wordmark as vector paths (Unbounded ExtraBold, tracking -0.02em) ----------
font = TTFont(os.path.join(ROOT, 'node_modules/@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2'))
font = instantiateVariableFont(font, {'wght': 800})
gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font['head'].unitsPerEm
cap = font['OS/2'].sCapHeight or 700

def wordmark(text='GOODPUSH', size=100):
    """→ (svg path d, width, cap height) at font-size `size`, baseline at y=cap."""
    s = size / upm
    x, d = 0.0, []
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, cap * s)))
        d.append(pen.getCommands())
        x += gs[g].width * s - 0.02 * size
    return ' '.join(d), x + 0.02 * size, cap * s

def smiley(color=INK, mood='smile'):
    line = CREAM if color == INK else INK
    eyes = (f'<rect x="38" y="35" width="7.5" height="18" rx="3.75" fill="{line}"/><path d="M55 45.5h9" stroke="{line}" stroke-width="7" stroke-linecap="round"/>' if mood == 'wink'
            else f'<rect x="38" y="35" width="7.5" height="18" rx="3.75" fill="{line}"/><rect x="54.5" y="35" width="7.5" height="18" rx="3.75" fill="{line}"/>')
    return (f'<circle cx="50" cy="50" r="50" fill="{color}"/><circle cx="50" cy="50" r="33" fill="none" stroke="{line}" stroke-width="7"/>{eyes}'
            f'<path d="M33 57.5c3.6 9.4 9.8 13.8 17 13.8s13.4-4.4 17-13.8" fill="none" stroke="{line}" stroke-width="7" stroke-linecap="round"/>'
            f'<path d="M29.5 41.5h4.5M29 49.5h3.5{"M66 41.5h4.5" if mood == "smile" else ""}" stroke="{line}" stroke-width="3" stroke-linecap="round" opacity=".9"/>')

def write(name, svg):
    open(os.path.join(OUT, name), 'w').write(svg)
    return svg

d, w, ch = wordmark()
def lockup(text_color, smiley_color, pad=0):
    s = ch * 1.32                      # smiley a bit taller than the capitals
    gap = s * 0.32
    W, H = s + gap + w + 2 * pad, s + 2 * pad
    ty = pad + (s - ch) / 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.1f} {H:.1f}" width="{W:.0f}" height="{H:.0f}">'
            f'<title>GoodPush</title><g transform="translate({pad} {pad}) scale({s / 100:.4f})">{smiley(smiley_color)}</g>'
            f'<path transform="translate({pad + s + gap:.1f} {ty:.1f})" d="{d}" fill="{text_color}"/></svg>')

svgs = {
    'goodpush-logo.svg': lockup(INK, INK),
    'goodpush-logo-light.svg': lockup(PAPER, SUN),
    'goodpush-logo-sun.svg': lockup(INK, SUN),
    'goodpush-wordmark.svg': f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {ch:.1f}" width="{w:.0f}" height="{ch:.0f}"><title>GoodPush</title><path d="{d}" fill="{INK}"/></svg>',
    'goodpush-smiley.svg': f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>GoodPush</title>{smiley(INK)}</svg>',
    'goodpush-smiley-sun.svg': f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>GoodPush</title>{smiley(SUN)}</svg>',
    'goodpush-app-icon.svg': f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>GoodPush</title><rect width="100" height="100" rx="24" fill="{SUN}"/><g transform="translate(12 12) scale(.76)">{smiley(INK)}</g></svg>',
}
for k, v in svgs.items():
    write(k, v)

def profile(label=None):
    """1080×1080 profile picture — reads well as a tiny circle."""
    pill = ''
    if label:
        ld, lw, lch = wordmark(label, 120)
        pw, ph = lw + 120, lch + 90
        pill = (f'<rect x="{540 - pw / 2:.1f}" y="{900 - ph / 2:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{ph / 2:.1f}" fill="{INK}"/>'
                f'<path transform="translate({540 - lw / 2:.1f} {900 - lch / 2:.1f})" d="{ld}" fill="{SUN}"/>')
    y = 120 if label else 190
    size = 640 if label else 700
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080"><rect width="1080" height="1080" fill="{SUN}"/>'
            f'<g transform="translate({540 - size / 2} {y}) scale({size / 100})">{smiley(INK)}</g>{pill}</svg>')

for lab in (None, 'EN', 'ES', 'FR'):
    write(f'goodpush-profile{"-" + lab.lower() if lab else ""}.svg', profile(lab))

# ---------- rasterize ----------
def png(svg, path, width, height, transparent=True):
    page.set_viewport_size({'width': width, 'height': height})
    page.set_content(f'<html><body style="margin:0;background:transparent">'
                     f'<img style="display:block;width:{width}px;height:{height}px" src="data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}"></body></html>')
    page.wait_for_timeout(50)
    page.screenshot(path=path, omit_background=transparent)

with sync_playwright() as p:
    page = p.chromium.launch().new_page()
    for name in ('goodpush-logo', 'goodpush-logo-light', 'goodpush-logo-sun'):
        svg = svgs[name + '.svg']
        vb = [float(x) for x in svg.split('viewBox="')[1].split('"')[0].split()]
        W = 2400; H = round(W * vb[3] / vb[2])
        png(svg, os.path.join(OUT, name + '.png'), W, H)
    png(svgs['goodpush-smiley.svg'], os.path.join(OUT, 'goodpush-smiley.png'), 1024, 1024)
    png(svgs['goodpush-app-icon.svg'], os.path.join(OUT, 'goodpush-app-icon.png'), 1024, 1024)
    for lab in ('', '-en', '-es', '-fr'):
        png(open(os.path.join(OUT, f'goodpush-profile{lab}.svg')).read(), os.path.join(OUT, f'goodpush-profile{lab}.png'), 1080, 1080, False)
    # favicons
    icon = svgs['goodpush-app-icon.svg']
    png(icon, os.path.join(ROOT, 'static', 'favicon-96x96.png'), 96, 96)
    png(icon, '/tmp/fav256.png', 256, 256)

Image.open('/tmp/fav256.png').save(os.path.join(ROOT, 'static', 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
open(os.path.join(ROOT, 'static', 'favicon.svg'), 'w').write(icon)
print('brand kit →', OUT)

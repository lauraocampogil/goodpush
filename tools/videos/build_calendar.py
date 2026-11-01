import json, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter

S = '/tmp/claude-0/-home-claude/33288c41-647a-53d4-8c0f-6d13a5a9a9ce/scratchpad/'
P = [p for p in json.load(open(S + 'phrases.json')) if not p['premium']]
clean = lambda t: t.replace('*', '')

THEMES = {  # weekday -> theme (Mon=0)
    0: 'discipline', 1: 'study', 2: 'calm', 3: 'sport', 4: 'build', 5: 'selflove', 6: 'faith'}
TL = {
    'discipline': ('Discipline', 'Disciplina', 'Discipline'),
    'study': ('Study', 'Estudios', 'Études'),
    'calm': ('Calm', 'Calma', 'Calme'),
    'sport': ('Sport', 'Deporte', 'Sport'),
    'build': ('Build', 'Emprender', 'Entreprendre'),
    'selflove': ('Self-love', 'Amor propio', 'Amour de soi'),
    'faith': ('Faith', 'Fe', 'Foi'),
}
DAY = {'en': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}

# Posting times (local time of each account's audience) — Brussels time in brackets for EN
TIMES = {
    'Morning': ('14:00 (8:00 New York)', '08:00', '07:30'),
    'Midday': ('18:00 (12:00 New York)', '14:00', '12:30'),
    'Evening': ('23:00 (17:00 New York)', '21:00', '20:30'),
}

FORMATS = {
    'A': ('Lock-screen push', 'The GoodPush notification lands on an iPhone lock screen, then the phrase fills the screen. 6–8 s.'),
    'B': ('Pick 1, 2 or 3', '3 phrases appear one by one with a number. On-screen: "Which one do you need today?" Comments = reach. 8–10 s.'),
    'C': ('POV app demo', 'Screen recording: open GoodPush, pick a vibe, the push arrives. Soft CTA. 10–15 s.'),
    'D': ('Phrase on b-roll', 'One phrase in big type over calm footage (free stock: city, sky, gym, desk…). Trending sound. 6–8 s.'),
    'E': ('Carousel / photo mode', '5 slides: 4 phrases of the theme + last slide "Get one every day → link in bio". Instagram carousel / TikTok photo mode.'),
    'F': ('Streak series', '"Day 12 of getting a good push every day 🔥" — screen of the app streak + today\'s phrase. Builds a recurring series.'),
}

HOOK = {
    'A': ('Your push for today 🔔', 'Tu push de hoy 🔔', 'Ton push du jour 🔔'),
    'B': ('Which one do you need today? 1, 2 or 3', '¿Cuál necesitas hoy? 1, 2 o 3', 'Lequel il te faut aujourd\'hui ? 1, 2 ou 3'),
    'C': ('POV: your phone motivates you every morning', 'POV: tu móvil te motiva cada mañana', 'POV : ton téléphone te motive chaque matin'),
    'D': ('Read this before you give up', 'Lee esto antes de rendirte', 'Lis ça avant d\'abandonner'),
    'E': ('{t}: 4 reminders you needed', '{t}: 4 frases que necesitabas', '{t} : 4 rappels dont tu avais besoin'),
    'F': ('Day {n} of a good push every day 🔥', 'Día {n} recibiendo un buen empujón 🔥', 'Jour {n} d\'un bon push chaque jour 🔥'),
}

CTA_LINE = ('Get one every day on your lock screen — link in bio. 14 days free.',
            'Recibe una cada día en tu pantalla de bloqueo — link en la bio. 14 días gratis.',
            'Reçois-en une chaque jour sur ton écran verrouillé — lien en bio. 14 jours gratuits.')
SOFT = ('Save it for later 💛', 'Guárdala para luego 💛', 'Garde-la pour plus tard 💛')
ASK = ('Comment your number 👇', 'Comenta tu número 👇', 'Commente ton numéro 👇')

HASH_BASE = ('#motivation #dailymotivation #mindset #goodpush',
             '#motivación #frasesmotivadoras #mentalidad #goodpush',
             '#motivation #citationdujour #mindset #goodpush')
HASH_THEME = {
    'discipline': ('#discipline #habits #selfimprovement', '#disciplina #habitos #superacion', '#discipline #habitudes #developpementpersonnel'),
    'study': ('#studymotivation #studytok #exams', '#estudiar #motivacionestudio #examenes', '#motivationetudes #etudiant #examens'),
    'calm': ('#calm #anxietyrelief #mentalhealth', '#calma #ansiedad #saludmental', '#calme #anxiete #santementale'),
    'sport': ('#gymmotivation #fitnessmotivation #football', '#motivaciondeportiva #gym #futbol', '#motivationsport #salledesport #foot'),
    'build': ('#entrepreneur #startup #buildinpublic', '#emprendedor #emprendimiento #negocios', '#entrepreneur #startup #business'),
    'selflove': ('#selflove #confidence #healing', '#amorpropio #autoestima #sanar', '#amourdesoi #confianceensoi #guerison'),
    'faith': ('#gratitude #hope #faith', '#gratitud #esperanza #fe', '#gratitude #espoir #foi'),
}

used = {}
def take(theme, k=1):
    pool = [p for p in P if p['cat'] == theme]
    i = used.get(theme, 0)
    out = [pool[(i + j) % len(pool)] for j in range(k)]
    used[theme] = i + k
    return out

START = dt.date(2026, 11, 2)
DAYS = 30
rows = []
streak_n = 0
for d in range(DAYS):
    date = START + dt.timedelta(days=d)
    theme = THEMES[date.weekday()]
    # Rotation: morning A (or F on Sundays), midday B/C alternating (C twice a week), evening D/E alternating
    mid = 'C' if date.weekday() in (1, 4) else 'B'
    eve = 'E' if date.weekday() in (2, 5) else 'D'
    morning = 'F' if date.weekday() == 6 else 'A'
    for slot, fmt in (('Morning', morning), ('Midday', mid), ('Evening', eve)):
        n = 3 if fmt == 'B' else 4 if fmt == 'E' else 1
        ph = take(theme, n)
        if fmt == 'F':
            streak_n += 7
        hook = [h.format(t=TL[theme][li], n=streak_n or 7) for li, h in enumerate(HOOK[fmt])]
        txt = []
        for li, lang in enumerate(('en', 'es', 'fr')):
            if n == 1:
                txt.append(clean(ph[0][lang]))
            else:
                txt.append('\n'.join(f'{k + 1}. {clean(p[lang])}' for k, p in enumerate(ph)))
        cta = fmt in ('A', 'C', 'E', 'F')
        caps = []
        for li in range(3):
            first = clean(ph[0][('en', 'es', 'fr')[li]]) if n == 1 else hook[li]
            end = CTA_LINE[li] if cta else (ASK[li] if fmt == 'B' else SOFT[li])
            caps.append(f'{first}\n\n{end}')
        tags = [f'{HASH_THEME[theme][li]} {HASH_BASE[li]}' for li in range(3)]
        rows.append([date, DAY['en'][date.weekday()], TL[theme][0], slot,
                     TIMES[slot][0], TIMES[slot][1], TIMES[slot][2],
                     f'{fmt} · {FORMATS[fmt][0]}',
                     *hook, *txt, *caps, *tags,
                     'Yes' if cta else 'No', ', '.join(p['id'] for p in ph),
                     'To do', 'To do', 'To do', None, None, None])

wb = Workbook()
F = 'Arial'
H = Font(name=F, bold=True, color='FFFFFF', size=10)
HF = PatternFill('solid', fgColor='141414')
SUN = PatternFill('solid', fgColor='F6E36B')
INP = PatternFill('solid', fgColor='FFF7CC')
thin = Side(style='thin', color='DDDDDD')
B = Border(bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top')

# ---------- Read me ----------
ws = wb.active
ws.title = 'Read me'
lines = [
    ('GoodPush — social content plan (30 days)', 'title'),
    ('3 accounts (EN / ES / FR) × 3 posts a day = 9 posts a day, faceless, under 30 minutes a day.', None),
    ('', None),
    ('How it fits in < 30 min/day', 'h'),
    ('1. Each row is ONE idea made once and exported in 3 languages (same video, different text). So you design 3 videos a day, not 9.', None),
    ('2. Batch once a week (Sunday, ~1.5–2 h): make the 21 videos of the week from the rows below, then schedule all 63 posts.', None),
    ('3. Daily (10–15 min): reply to comments, pin the best one, note the views in the green columns.', None),
    ('4. Every format is a template: only the text changes. The phrases come from the GoodPush library, already translated.', None),
    ('', None),
    ('Weekly rhythm', 'h'),
    ('Mon Discipline · Tue Study · Wed Calm · Thu Sport · Fri Build · Sat Self-love · Sun Faith/Gratitude — matches the vibes in the app.', None),
    ('Morning = A (lock-screen push) · Sunday morning = F (streak series) · Midday = B (pick 1/2/3), C (app demo) on Tue & Fri · Evening = D (phrase on b-roll), E (carousel) on Wed & Sat.', None),
    ('About 1 in 2 posts has a soft call to action (link in bio · 14 days free). The others are pure motivation — that is what gets shared.', None),
    ('', None),
    ('Posting times', 'h'),
    ('Times are in each audience\'s local time. EN targets the US + UK, so its times are written in Brussels time with New York in brackets.', None),
    ('After 2 weeks, open TikTok Studio → Analytics → Followers → "Most active times" for each account and move the slots to your real peaks.', None),
    ('', None),
    ('How to use the Calendar tab', 'h'),
    ('Yellow columns = you edit them: Status (To do → Ready → Scheduled → Posted) for each account, and the views after 48 h.', None),
    ('Grey columns = filled in for you (hook, phrase, caption, hashtags). Change anything you like.', None),
    ('Phrase IDs link back to the app\'s library (src/lib/data/phrases.ts), so the video and the app say the same thing.', None),
    ('', None),
    ('Rules that keep the accounts safe', 'h'),
    ('Only phrases from the GoodPush library or your own. No film clips, celebrity speeches or other people\'s videos (copyright strikes kill new accounts).', None),
    ('Music: use the sounds offered inside TikTok/Instagram (licensed there). Footage: your own or free stock (e.g. Pexels, Pixabay — check each clip\'s licence).', None),
    ('Put "goodpush-app.vercel.app" (later goodpush.app) in each bio with ?utm_source=tiktok_en etc., so PostHog shows which account brings sign-ups.', None),
]
for i, (t, kind) in enumerate(lines, 1):
    c = ws.cell(row=i, column=1, value=t)
    c.font = Font(name=F, bold=kind in ('title', 'h'), size=16 if kind == 'title' else 11 if kind == 'h' else 10)
    c.alignment = Alignment(wrap_text=True, vertical='top')
ws.column_dimensions['A'].width = 130

# ---------- Calendar ----------
cal = wb.create_sheet('Calendar')
head = ['Date', 'Day', 'Theme', 'Slot', 'Time EN (Brussels)', 'Time ES (Spain)', 'Time FR (Brussels/Paris)', 'Format',
        'Hook EN (on screen)', 'Hook ES', 'Hook FR', 'Phrase(s) EN', 'Phrase(s) ES', 'Phrase(s) FR',
        'Caption EN', 'Caption ES', 'Caption FR', 'Hashtags EN', 'Hashtags ES', 'Hashtags FR',
        'CTA?', 'Phrase IDs', 'Status EN', 'Status ES', 'Status FR', 'Views EN (48 h)', 'Views ES (48 h)', 'Views FR (48 h)']
cal.append(head)
for r in rows:
    cal.append(r)
widths = [11, 6, 11, 9, 20, 12, 14, 22, 28, 28, 28, 40, 40, 40, 44, 44, 44, 34, 34, 34, 7, 14, 12, 12, 12, 12, 12, 12]
for i, w in enumerate(widths, 1):
    cal.column_dimensions[get_column_letter(i)].width = w
for c in cal[1]:
    c.font, c.fill = H, HF
    c.alignment = Alignment(wrap_text=True, vertical='center')
cal.row_dimensions[1].height = 32
n = len(rows) + 1
for row in cal.iter_rows(min_row=2, max_row=n):
    for c in row:
        c.font = Font(name=F, size=9)
        c.alignment = wrap
        c.border = B
    row[0].number_format = 'ddd d mmm'
    for c in row[22:28]:
        c.fill = INP
    if row[3].value == 'Morning':
        for c in row[:4]:
            c.fill = SUN
cal.freeze_panes = 'I2'
cal.auto_filter.ref = f'A1:{get_column_letter(len(head))}{n}'
dv = DataValidation(type='list', formula1='"To do,Ready,Scheduled,Posted,Skipped"', allow_blank=True)
cal.add_data_validation(dv)
dv.add(f'W2:Y{n}')
green = PatternFill('solid', fgColor='C8EBD3')
cal.conditional_formatting.add(f'W2:Y{n}', CellIsRule(operator='equal', formula=['"Posted"'], fill=green))
cal.conditional_formatting.add(f'W2:Y{n}', CellIsRule(operator='equal', formula=['"Scheduled"'], fill=PatternFill('solid', fgColor='DCD3F2')))

# ---------- Formats ----------
fm = wb.create_sheet('Formats')
fm.append(['Code', 'Format', 'How to make it (template — only the text changes)', 'When', 'Tool'])
when = {'A': 'Every morning (Mon–Sat)', 'B': 'Midday (Mon, Wed, Thu, Sat, Sun)', 'C': 'Midday (Tue, Fri)', 'D': 'Evening (Mon, Tue, Thu, Fri, Sun)', 'E': 'Evening (Wed, Sat)', 'F': 'Sunday morning'}
tool = {'A': 'GoodPush video template (I can generate these automatically)', 'B': 'Template in CapCut / Canva', 'C': 'Phone screen recording + CapCut', 'D': 'Free stock footage + CapCut text', 'E': 'Canva carousel template (1080×1350)', 'F': 'Screenshot of the app + text'}
for k, (name, how) in FORMATS.items():
    fm.append([k, name, how, when[k], tool[k]])
for i, w in enumerate([7, 22, 80, 30, 46], 1):
    fm.column_dimensions[get_column_letter(i)].width = w
for c in fm[1]:
    c.font, c.fill = H, HF
for row in fm.iter_rows(min_row=2):
    for c in row:
        c.font = Font(name=F, size=10)
        c.alignment = wrap

# ---------- Tracking (formulas) ----------
tr = wb.create_sheet('Tracking')
tr.append(['Week starting', 'Planned per account', 'Posted EN', 'Posted ES', 'Posted FR', 'Views EN', 'Views ES', 'Views FR', 'Total views', 'Avg views / post'])
for w in range(5):
    start = START + dt.timedelta(days=7 * w)
    r = w + 2
    tr.cell(row=r, column=1, value=start).number_format = 'd mmm yyyy'
    rng = lambda col: f"Calendar!${col}$2:${col}${n}"
    dates = rng('A')
    crit = f'">="&$A{r},{dates},"<"&($A{r}+7)'
    tr.cell(row=r, column=2, value=f'=COUNTIFS({dates},">="&$A{r},{dates},"<"&($A{r}+7))')
    for j, col in enumerate(['W', 'X', 'Y']):
        tr.cell(row=r, column=3 + j, value=f'=COUNTIFS({dates},">="&$A{r},{dates},"<"&($A{r}+7),{rng(col)},"Posted")')
    for j, col in enumerate(['Z', 'AA', 'AB']):
        tr.cell(row=r, column=6 + j, value=f'=SUMIFS({rng(col)},{dates},">="&$A{r},{dates},"<"&($A{r}+7))')
    tr.cell(row=r, column=9, value=f'=SUM(F{r}:H{r})')
    tr.cell(row=r, column=10, value=f'=IFERROR(I{r}/SUM(C{r}:E{r}),0)').number_format = '#,##0'
tot = 7
tr.cell(row=tot, column=1, value='Total')
for col in range(2, 10):
    L = get_column_letter(col)
    tr.cell(row=tot, column=col, value=f'=SUM({L}2:{L}6)')
tr.cell(row=tot, column=10, value='=IFERROR(I7/SUM(C7:E7),0)').number_format = '#,##0'
tr.cell(row=9, column=1, value='Filled automatically from the Calendar tab: mark posts as "Posted" and type the views after 48 h.')
for i, w in enumerate([16, 18, 11, 11, 11, 11, 11, 11, 12, 15], 1):
    tr.column_dimensions[get_column_letter(i)].width = w
for c in tr[1]:
    c.font, c.fill = H, HF
    c.alignment = Alignment(wrap_text=True)
for row in tr.iter_rows(min_row=2, max_row=9):
    for c in row:
        c.font = Font(name=F, size=10, bold=(c.row == tot))

out = '/mnt/user-data/outputs/GoodPush-content-calendar.xlsx'
wb.save(out)
print(out, len(rows))

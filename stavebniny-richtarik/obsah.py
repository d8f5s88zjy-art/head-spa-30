# Obsahový engine: rozloží HTML pôvodného webu na typované bloky (produkt, nadpis, text,
# zoznam, obrázky, logá, PDF, tabuľka, značky, galéria) a vykreslí ich do moderných komponentov.
import re, html, os
from lxml import html as LH, etree

ROOT = os.path.dirname(os.path.abspath(__file__))
OLD = 'http://www.stavebninyrichtarik.sk'

# staré kreslené ikony kategórií, na nový web nepatria
SKIP_IMG = {'2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '237'}
# podnadpisy vnútri produktu, nie sú to nové položky
SUBLABELS = {'technické parametre', 'charakteristika', 'rozmery', 'produkty', 'technické listy', 'sortiment výrobkov', 'ceny'}

BLANK = object()


class Line:
    __slots__ = ('text', 'html', 'imgs', 'pdfs', 'links', 'bold', 'level', 'colon')

    def __init__(self):
        self.text = ''; self.html = ''; self.imgs = []; self.pdfs = []; self.links = []; self.bold = False; self.level = 0; self.colon = False

    def empty(self):
        return not self.text and not self.imgs and not self.pdfs


def _img_id(src):
    m = re.search(r'img=(\d+)', src or '')
    if m: return m.group(1)
    m = re.search(r'images/gallery/_?(\d+)\.jpg', src or '')
    return m.group(1) if m else None


class Parser:
    def __init__(self, img_sizes, pdf_local, url2path, page_path, rel):
        self.S = img_sizes; self.PDF = pdf_local; self.U = url2path; self.path = page_path; self.rel = rel
        self.pre = '../' * page_path.count('/')

    # ---------- 1. HTML -> riadky ----------
    def lines(self, raw):
        try:
            root = LH.fragment_fromstring(raw, create_parent='div')
        except Exception:
            return []
        for el in root.xpath('.//script|.//iframe|.//hr|.//*[@id="content_gallery_navigation"]|.//a[@class="nodisplay"]|.//*[@id="panContent"]|.//comment()'):
            p = el.getparent()
            if p is not None: p.remove(el)
        for el in root.xpath('.//h5'):
            if _txt(el).strip().lower() == 'galéria': el.getparent().remove(el)
        out = []
        self._flow(root, out)
        return out

    def _flow(self, el, out):
        """Prejde blokové prvky v poradí a vyrába riadky."""
        for ch in el:
            if not isinstance(ch.tag, str): continue
            t = ch.tag
            if t == 'table':
                self._table(ch, out); out.append(BLANK)
            elif t in ('ul', 'ol'):
                items = [self._inline(li) for li in ch.xpath('./li')]
                out.append(('list', [l.html for l in items if not l.empty()])); out.append(BLANK)
            elif t in ('p', 'div', 'h1', 'h2', 'h3', 'h4', 'h6', 'td', 'th', 'li', 'blockquote', 'center'):
                if t == 'div' and ch.xpath('./p|./div|./table|./ul|./ol'):
                    self._flow(ch, out); continue
                lvl = int(t[1]) if t in ('h1', 'h2', 'h3', 'h4') else 0
                for ln in self._split(ch):
                    if lvl: ln.bold = True; ln.level = lvl
                    out.append(ln)
                out.append(BLANK)
            else:
                ln = self._inline(ch)
                if not ln.empty(): out.append(ln); out.append(BLANK)

    def _table(self, tb, out):
        if 'content_gallery' in (tb.get('class') or '') or tb.xpath('.//a[@rel="gallery"]'):
            ids = []
            for a in tb.xpath('.//a[@href]'):
                i = _img_id(a.get('href'))
                if i and os.path.exists(os.path.join(ROOT, 'img/g', i + '.webp')): ids.append((i, a.get('title') or ''))
            out.append(('gallery', ids)); return
        rows = [r for r in tb.xpath('./tbody/tr|./tr') if r.xpath('./td|./th')]
        if not rows: return
        cells = [r.xpath('./td|./th') for r in rows]
        # tabuľka značiek: 2 stĺpce, vľavo logo, vpravo tučný názov a popis
        if all(len(c) == 2 for c in cells) and sum(1 for c in cells if c[1].xpath('.//strong|.//b')) >= max(1, len(cells) - 1) and not any(c[1].xpath('.//table') for c in cells):
            brands = []
            for c in cells:
                a = c[0].xpath('.//a[@href]'); im = c[0].xpath('.//img')
                logo = _img_id(im[0].get('src')) if im else None
                name = _txt(c[1].xpath('.//strong|.//b')[0]).strip(' -–:') if c[1].xpath('.//strong|.//b') else ''
                full = _txt(c[1]).strip()
                desc = re.sub(r'^\s*' + re.escape(name) + r'\s*[-–:]?\s*', '', full, flags=re.I).strip(' -–')
                brands.append({'logo': logo if logo and logo in self.S else None, 'url': a[0].get('href') if a else None, 'name': name.title() if name.isupper() else name, 'text': desc[:1].upper() + desc[1:]})
            out.append(('brands', brands)); return
        # dátová tabuľka: bez vnorených tabuliek a obrázkov, krátke bunky
        nested = tb.xpath('.//table|.//img|.//p')
        if not nested and len(rows) >= 2 and max(len(c) for c in cells) >= 2 and all(len(_txt(x)) < 220 for c in cells for x in c):
            data = []
            for r in cells:
                row = []
                for x in r:
                    row.append({'h': bool(x.xpath('./strong|./b|./span/strong')) and len(_txt(x)) < 60 or x.tag == 'th', 'html': self._inline(x).html,
                                'cs': int(x.get('colspan') or 1), 'rs': int(x.get('rowspan') or 1)})
                data.append(row)
            if any(any(x['html'].strip() for x in r) for r in data): out.append(('table', data))
            return
        # rozkladová tabuľka: bunky ako bežný tok
        for r in cells:
            for x in r:
                if x.xpath('./p|./div|./table|./ul'):
                    self._flow(x, out)
                    # text priamo v bunke okrem blokov
                    ln = self._inline(x, skip_blocks=True)
                    if not ln.empty(): out.append(ln); out.append(BLANK)
                else:
                    for ln in self._split(x): out.append(ln)
                    out.append(BLANK)

    def _split(self, el):
        """Rozdelí odsek podľa <br> na riadky."""
        parts = [[]]

        def walk(node, bold):
            if node.text and node.text.strip('\xa0 \n\t'): parts[-1].append(('t', node.text, bold))
            elif node.text and parts[-1]: parts[-1].append(('t', ' ', bold))
            for c in node:
                if not isinstance(c.tag, str):
                    if c.tail and c.tail.strip('\xa0 \n\t'): parts[-1].append(('t', c.tail, bold))
                    continue
                if c.tag == 'br':
                    parts.append([])
                elif c.tag == 'img':
                    parts[-1].append(('i', c, bold))
                elif c.tag == 'a' and c.get('href'):
                    parts[-1].append(('a', c, bold));
                elif c.tag in ('table', 'ul', 'ol', 'p', 'div'):
                    pass
                else:
                    walk(c, bold or c.tag in ('strong', 'b', 'h1', 'h2', 'h3', 'h4'))
                if c.tail and c.tail.strip('\xa0 \n\t'): parts[-1].append(('t', c.tail, bold))
                elif c.tail and parts[-1]: parts[-1].append(('t', ' ', bold))
        walk(el, el.tag in ('h1', 'h2', 'h3', 'h4'))
        out = []
        for p in parts:
            ln = self._mk(p)
            if not ln.empty(): out.append(ln)
        return out

    def _inline(self, el, skip_blocks=False):
        parts = [[]]

        def walk(node, bold):
            if node.text and node.text.strip('\xa0 \n\t'): parts[-1].append(('t', node.text, bold))
            for c in node:
                if not isinstance(c.tag, str): continue
                if c.tag == 'img': parts[-1].append(('i', c, bold))
                elif c.tag == 'a' and c.get('href'): parts[-1].append(('a', c, bold))
                elif c.tag == 'br': parts[-1].append(('t', ' ', bold))
                elif c.tag in ('table', 'ul', 'ol', 'p', 'div') and skip_blocks: pass
                else: walk(c, bold or c.tag in ('strong', 'b'))
                if c.tail and c.tail.strip('\xa0 \n\t'): parts[-1].append(('t', c.tail, bold))
        walk(el, el.tag in ('strong', 'b'))
        return self._mk(parts[0])

    def _mk(self, items):
        ln = Line(); txt = []; hs = []; allbold = True; anytext = False; nb = 0; nall = 0
        for kind, v, bold in items:
            if kind == 't':
                s = re.sub(r'[\xa0\s]+', ' ', v)
                if s.strip(): anytext = True
                n = len(s.strip()); nall += n; nb += n if bold else 0
                if not bold and s.strip(): allbold = False
                txt.append(s); hs.append(f'<strong>{html.escape(s)}</strong>' if bold and s.strip() else html.escape(s))
            elif kind == 'i':
                i = _img_id(v.get('src'))
                if i and i in self.S and i not in SKIP_IMG: ln.imgs.append((i, (v.get('alt') or '').strip()))
                elif i and os.path.exists(os.path.join(ROOT, 'img/g', i + '.webp')): ln.imgs.append(('g' + i, (v.get('alt') or '').strip()))
            elif kind == 'a':
                href = (v.get('href') or '').strip(); t = re.sub(r'[\xa0\s]+', ' ', _txt(v)).strip()
                inner_imgs = [_img_id(im.get('src')) for im in v.xpath('.//img')]
                for im in v.xpath('.//img'):
                    i = _img_id(im.get('src'))
                    if i and i in self.S and i not in SKIP_IMG: ln.imgs.append((i, (im.get('alt') or '').strip()))
                if href.lower().endswith('.pdf') or re.search(r'/files/\d+\.', href):
                    b = os.path.basename(href)
                    loc = self.pre + 'pdf/' + b if b in self.PDF else (href if href.startswith('http') else OLD + '/' + href.lstrip('/'))
                    if href.lower().endswith('.pdf'): ln.pdfs.append((loc, t))
                    continue
                if href.startswith('javascript') or not t:
                    if t: txt.append(t); hs.append(html.escape(t)); anytext = True; allbold = allbold and bold
                    continue
                if href in self.U: href = self.rel(self.path, self.U[href])
                elif re.search(r'images/gallery/(\d+)\.jpg', href): continue
                anytext = True; nall += len(t); nb += len(t) if bold else 0
                if not bold: allbold = False
                txt.append(t)
                hs.append(f'<a href="{html.escape(href)}"{" target=_blank rel=noopener" if href.startswith("http") else ""}>{html.escape(t)}</a>')
        ln.text = re.sub(r'\s+', ' ', ''.join(txt)).strip() if anytext else ''
        ln.colon = ln.text.endswith(':') or ln.text.endswith(':,')
        ln.text = ln.text.strip(' :,\xa0').strip()
        if re.match(r'^[/\\.,:;\-–_\s]*$', ln.text) or ln.text in ('/f', 'f/'): ln.text = ''; hs = []
        ln.html = re.sub(r'\s+', ' ', ''.join(hs)).strip()
        ln.html = re.sub(r'</strong>\s*<strong>', ' ', ln.html)
        ln.html = re.sub(r'^\s*<strong>\s*[\-•*]\s*', '<strong>', ln.html)
        ln.bold = bool(ln.text) and (allbold or (nall and nb / nall >= 0.8))
        if ln.bold: ln.html = '<strong>' + re.sub(r'</?strong>', '', ln.html) + '</strong>'
        return ln

    # ---------- 2. riadky -> bloky ----------
    def blocks(self, raw):
        lines = self.lines(raw)
        out = []; prod = None; para = None; param_mode = False

        def close_prod():
            nonlocal prod, param_mode
            if prod:
                out.append(('item', prod)); prod = None
            param_mode = False

        def close_para():
            nonlocal para
            if para:
                out.append(('para', para)); para = None

        def push(kind, val):
            close_para()
            if out and out[-1][0] == kind and kind in ('images', 'pdfs', 'list', 'logos'):
                out[-1][1].extend(val)
            else:
                out.append((kind, list(val)))

        i = 0; prev_blank = True
        while i < len(lines):
            ln = lines[i]; i += 1
            if ln is BLANK:
                prev_blank = True
                close_para()
                nxt = next((l for l in lines[i:] if l is not BLANK), None)
                nxt_pdf = isinstance(nxt, Line) and nxt.pdfs and (not nxt.text or all(t in nxt.text for _, t in nxt.pdfs))
                if prod and prod['pdfs'] and not param_mode and not nxt_pdf: close_prod()
                param_mode = False
                continue
            if isinstance(ln, tuple):
                close_prod(); close_para()
                if ln[0] == 'list' and out and out[-1][0] == 'list': out[-1][1].extend(ln[1])
                else: out.append(ln)
                prev_blank = True; continue
            was_blank = prev_blank; prev_blank = False
            words = ln.text.split()
            short = len(ln.text) <= 90
            # tučná odrážka je nadpis
            if ln.bold and short and re.match(r'^[\-•*]\s*\S', ln.text) and not ln.imgs:
                ln.text = re.sub(r'^[\-•*]\s*', '', ln.text); words = ln.text.split()
            # podtitul v zátvorke patrí k názvu položky
            if prod and ln.bold and ln.text.startswith('(') and not prod['text'] and not prod['params'] and not prod['imgs']:
                prod['title'] += ' ' + ln.text; continue
            # zalomený riadok odrážky pokračuje
            if not was_blank and not ln.bold and ln.text and not ln.imgs and not ln.pdfs and not re.match(r'^\s*(?:[\-•*]|\d+\.)\s', ln.text):
                last = None
                if prod and prod['list'] and not prod['text'][len(prod['text']):]: last = ('prod', None)
                if out and out[-1][0] == 'list' and para is None and not prod:
                    if not re.search(r'[.!?:]$', re.sub(r'<[^>]+>', '', out[-1][1][-1]).strip()):
                        out[-1][1][-1] += ' ' + ln.html; continue
                if prod and prod['list'] and (not prod['text'] or prod['text'][-1][0] != 'p' or True):
                    lst = re.sub(r'<[^>]+>', '', prod['list'][-1]).strip()
                    if not re.search(r'[.!?:]$', lst) and not param_mode:
                        prod['list'][-1] += ' ' + ln.html; continue
            # riadok len s obrázkami
            if not ln.text and ln.imgs and not ln.pdfs:
                # produkt bez obrázka, ktorý má len názov a obrázok príde na ďalšom riadku
                if prod and not prod['imgs'] and not prod['text'] and not prod['params']:
                    prod['imgs'].extend(ln.imgs); continue
                close_prod()
                def _small(x): return not x[0].startswith('g') and (self.S.get(x[0], (0, 0))[1] <= 130 or self.S.get(x[0], (0, 0))[0] <= 130)
                sm = [x for x in ln.imgs if _small(x)]; bg = [x for x in ln.imgs if not _small(x)]
                if sm and (not out or all(k in ('logos', 'images') for k, _ in out)): push('logos', sm)
                elif sm: push('images', sm)
                if bg: push('images', bg)
                continue
            # riadok s PDF
            if ln.pdfs and (not ln.text or len(ln.text) < 40 or all(t in ln.text for _, t in ln.pdfs)):
                if prod: prod['pdfs'].extend(ln.pdfs); prod['imgs'].extend(ln.imgs)
                else:
                    push('pdfs', ln.pdfs)
                    if ln.imgs: push('images', ln.imgs)
                continue
            # podnadpis vnútri produktu
            low = ln.text.lower().strip(' :.,')
            if ln.bold and short and (low in SUBLABELS or (prod and low.endswith('parametre'))) and not ln.imgs:
                if prod:
                    if 'parametre' in low or low == 'rozmery':
                        param_mode = True
                    else:
                        prod['text'].append(('sub', ln.html))
                else:
                    push('heading', [(ln.text, 3)])
                continue
            # parameter v tučnom písme (Šírka: 27 cm) patrí k otvorenej položke
            if prod and ln.bold and not ln.imgs and re.match(r'^([A-Za-zÀ-ž0-9 .()/,+-]{2,40}?)\s*:\s*\d', ln.text):
                pm = re.match(r'^(.+?)\s*:\s*(.+)$', ln.text)
                prod['params'].append((pm.group(1).strip(), pm.group(2).strip())); continue
            # číslované tučné riadky bez popisu sú zoznam (1.tehla, 2.stará tehla)
            if ln.bold and short and re.match(r'^\d+\.\s*\S', ln.text) and not ln.imgs:
                nxt2 = next((l for l in lines[i:] if l is not BLANK), None)
                if (out and out[-1][0] == 'list' and not prod) or not (isinstance(nxt2, Line) and nxt2.text and not nxt2.bold and not nxt2.imgs):
                    close_prod(); push('list', [re.sub(r'^\s*(<strong>)?\s*\d+\.\s*', r'\1', ln.html)]); continue
            # krok alebo položka: jeden obrázok a dlhší text bez tučného názvu
            if ln.imgs and ln.text and not ln.bold and len(ln.text) > 20 and not prod:
                close_para()
                out.append(('item', {'title': '', 'imgs': list(ln.imgs), 'text': [('p', ln.html)], 'params': [], 'pdfs': list(ln.pdfs), 'list': []})); continue
            # tučný riadok s dvojbodkou na konci je nadpis časti
            if ln.bold and short and ln.colon and not ln.imgs and low not in SUBLABELS:
                close_prod(); close_para(); out.append(('heading', [(ln.text, 3)])); continue
            # nadpis alebo začiatok položky
            if ln.bold and short and (len(words) <= 14) and not re.match(r'^[\-•*]', ln.text):
                letters = [c for c in ln.text if c.isalpha()]
                upper = sum(1 for c in letters if c.isupper()) / max(1, len(letters))
                # popisok k obrázkom: nadpis hneď za obrázkami a pred ďalšími obrázkami alebo koncom
                nxt = lines[i] if i < len(lines) else None
                nxt2 = next((l for l in lines[i:] if l is not BLANK), None)
                if out and out[-1][0] == 'images' and not ln.imgs and not prod and (nxt2 is None or (isinstance(nxt2, Line) and not nxt2.text and nxt2.imgs)):
                    out[-1][1][-1] = (out[-1][1][-1][0], ln.text); continue
                close_prod()
                if upper >= 0.7 and not ln.imgs and len(ln.text) > 3 and ln.level != 3:
                    close_para(); out.append(('heading', [(ln.text, 2)])); continue
                if ln.level == 3 and not ln.imgs:
                    close_para(); out.append(('heading', [(ln.text, 2)])); continue
                close_para()
                prod = {'title': ln.text, 'imgs': list(ln.imgs), 'text': [], 'params': [], 'pdfs': list(ln.pdfs), 'list': []}
                continue
            # zoznamový riadok
            m = re.match(r'^\s*(?:[\-•*]|\d+\.)\s+(.+)$', ln.text)
            if m and not prod:
                push('list', [re.sub(r'^\s*(?:[\-•*]|\d+\.)\s+', '', ln.html)]); continue
            if m and prod and re.match(r'^\s*[\-•*]', ln.text):
                prod['list'].append(re.sub(r'^\s*[\-•*]\s+', '', ln.html)); continue
            # parameter
            if prod:
                pm = re.match(r'^([A-Za-zÀ-ž0-9 .()/,+-]{2,40}?)\s*:\s*(.{1,120})$', ln.text)
                if pm and not ln.imgs and len(pm.group(1).split()) <= 4 and not pm.group(2).endswith(','):
                    prod['params'].append((pm.group(1).strip(), pm.group(2).strip())); continue
                if param_mode and not ln.imgs:
                    pm = re.match(r'^(.*?\S)\s+((?:min\.|max\.|\d|\+).*)$', ln.text)
                    if pm: prod['params'].append((pm.group(1).strip(), pm.group(2).strip())); continue
                    if len(ln.text) < 40:
                        w = ln.text.split()
                        if len(w) >= 2 and re.search(r'\d', w[-1]): prod['params'].append((' '.join(w[:-1]), w[-1]))
                        else: prod['params'].append((ln.text, ''))
                        continue
                if ln.imgs and not ln.text:
                    prod['imgs'].extend(ln.imgs); continue
                prod['text'].append(('p', ln.html)); prod['imgs'].extend(ln.imgs); continue
            # bežný text
            if ln.imgs and ln.text:
                push('images', ln.imgs)
            if ln.text:
                if para is None: para = []
                para.append(ln.html)
        close_prod(); close_para()
        return self._post(out)

    def _post(self, blocks):
        """Drobné úpravy: prázdne bloky preč, logá na začiatku, obrázky bez textu za produktom patria produktu."""
        res = []
        for b in blocks:
            k, v = b
            if k in ('images', 'logos', 'pdfs', 'list') and not v: continue
            if k == 'para' and not any(x.strip() for x in v): continue
            if k == 'item' and not (v['imgs'] or v['text'] or v['params'] or v['pdfs'] or v['list']):
                res.append(('heading', [(v['title'], 3)])); continue
            res.append(b)
        return res

    # ---------- 3. bloky -> HTML ----------
    def render(self, blocks, kind='katalog'):
        out = []; i = 0
        while i < len(blocks):
            k, v = blocks[i]
            if k == 'item':
                j = i
                while j < len(blocks) and blocks[j][0] == 'item': j += 1
                items = [b[1] for b in blocks[i:j]]
                cards = [it for it in items if it['imgs'] or it['params'] or it['pdfs']]
                if len(cards) >= max(1, len(items) // 2) and any(it['imgs'] or it['params'] for it in items):
                    cls = 'prods' if any(it['imgs'] for it in items) else 'prods noimg'
                    out.append(f'<div class="{cls}">' + ''.join(self._item(it, card=True) for it in items) + '</div>')
                else:
                    out.append('<div class="arts">' + ''.join(self._item(it, card=False) for it in items) + '</div>')
                i = j; continue
            i += 1
            if k == 'heading':
                for t, lvl in v:
                    out.append(f'<h{lvl} class="sh rv"><span>{html.escape(_nice(t))}</span></h{lvl}>')
            elif k == 'para':
                out.append('<div class="txt rv">' + ''.join(f'<p>{p}</p>' for p in v) + '</div>')
            elif k == 'list':
                out.append('<ul class="ticks rv">' + ''.join(f'<li>{x}</li>' for x in v) + '</ul>')
            elif k == 'logos':
                out.append('<div class="logos rv">' + ''.join(self._img(x, cls='', lb=False) for x in v) + '</div>')
            elif k == 'images':
                n = len(v)
                out.append(f'<div class="figs rv n{min(n, 4)}">' + ''.join(self._fig(x) for x in v) + '</div>')
            elif k == 'pdfs':
                out.append('<div class="pdfs rv">' + ''.join(self._pdf(h, t) for h, t in v) + '</div>')
            elif k == 'table':
                out.append(self._tbl(v))
            elif k == 'brands':
                out.append('<div class="brands-grid">' + ''.join(self._brand(b) for b in v) + '</div>')
            elif k == 'gallery':
                out.append('<div class="galeria rv">' + ''.join(f'<a href="{self.pre}img/g/{i}.webp" data-lb="1" data-cap="{html.escape(c)}"><img src="{self.pre}img/gt/{i}.webp" alt="{html.escape(c or "Fotografia")}" loading="lazy"></a>' for i, c in v) + '</div>')
        return '\n'.join(out)

    def _src(self, i):
        return f'{self.pre}img/g/{i[1:]}.webp' if i.startswith('g') else f'{self.pre}img/p/{i}.webp'

    def _img(self, x, cls='', lb=True):
        i, alt = x
        w, h = self.S.get(i, (0, 0))
        img = f'<img src="{self._src(i)}" alt="{html.escape(_alt(alt))}" loading="lazy"{f" width={w} height={h}" if w else ""}>'
        if lb and (w >= 260 or h >= 200):
            return f'<a href="{self._src(i)}" data-lb="1" class="{cls}">{img}</a>'
        return f'<span class="{cls}">{img}</span>'

    def _fig(self, x):
        i, alt = x
        cap = _alt(alt)
        w, h = self.S.get(i, (0, 0))
        return f'<figure class="fig{" wide" if w > 700 and w > h * 1.6 else ""}">{self._img(x)}{f"<figcaption>{html.escape(cap)}</figcaption>" if cap else ""}</figure>'

    def _pdf(self, h, t):
        t = re.sub(r'\.pdf\s*$', '', t.strip(), flags=re.I).strip(' -') or 'Stiahnuť PDF'
        return f'<a class="pdf" href="{html.escape(h)}" target="_blank" rel="noopener"><span>{html.escape(t)}</span></a>'

    def _item(self, it, card):
        title = html.escape(_nice(it['title'])) if it['title'] else ''
        body = ''
        for kind, h in it['text']:
            body += f'<p class="lbl">{h}</p>' if kind == 'sub' else f'<p>{h}</p>'
        if it['list']: body += '<ul class="ticks">' + ''.join(f'<li>{x}</li>' for x in it['list']) + '</ul>'
        if it['params']:
            body += '<dl class="params">' + ''.join(f'<div><dt>{html.escape(k)}</dt><dd>{html.escape(v) if v else "<span class=na>neuvedené</span>"}</dd></div>' for k, v in it['params']) + '</dl>'
        if it['pdfs']: body += '<div class="pdfs">' + ''.join(self._pdf(h, t) for h, t in it['pdfs']) + '</div>'
        if card:
            imgs = it['imgs']
            media = ''
            if imgs and all(not x[0].startswith('g') and self.S.get(x[0], (0, 0))[0] <= 160 and self.S.get(x[0], (0, 0))[1] <= 160 for x in imgs):
                ic = ''.join(self._img(x, cls='', lb=False) for x in imgs[:2])
                return f'<article class="prod icon rv"><div class="prod-icon">{ic}</div><div class="prod-body">{f"<h3>{title}</h3>" if title else ""}{body}</div></article>'
            if imgs:
                big = imgs[0]
                media = f'<div class="prod-media">{self._img(big, cls="main")}'
                if len(imgs) > 1: media += '<div class="thumbs">' + ''.join(self._img(x, cls="th") for x in imgs[1:5]) + '</div>'
                media += '</div>'
            return f'<article class="prod rv{" step" if not title else ""}">{media}<div class="prod-body">{f"<h3>{title}</h3>" if title else ""}{body}</div></article>'
        media = ''.join(self._fig(x) for x in it['imgs'])
        return f'<section class="art rv">{f"<h3>{title}</h3>" if title else ""}{body}{f"<div class=figs>{media}</div>" if media else ""}</section>'

    def _tbl(self, data):
        rows = ''
        for n, r in enumerate(data):
            cells = ''
            for c in r:
                tag = 'th' if (c['h'] and n == 0) or (n == 0 and all(x['h'] for x in r)) else 'td'
                attrs = (f' colspan={c["cs"]}' if c['cs'] > 1 else '') + (f' rowspan={c["rs"]}' if c['rs'] > 1 else '')
                cells += f'<{tag}{attrs}>{c["html"]}</{tag}>'
            rows += f'<tr>{cells}</tr>'
        return f'<div class="scroll rv"><table class="tbl">{rows}</table></div>'

    def _brand(self, b):
        logo = f'<div class="bl"><img src="{self._src(b["logo"])}" alt="{html.escape(b["name"])}" loading="lazy"></div>' if b['logo'] else f'<div class="bl txt"><span>{html.escape(b["name"][:1])}</span></div>'
        link = f'<a class="site" href="{html.escape(b["url"])}" target="_blank" rel="noopener">Web výrobcu</a>' if b['url'] else ''
        return f'<article class="znacka rv">{logo}<div class="bt"><h3>{html.escape(b["name"])}</h3><p>{html.escape(b["text"])}</p>{link}</div></article>'

    def plain(self, blocks):
        """Čistý text pre vyhľadávanie a úryvky."""
        t = []
        for k, v in blocks:
            if k == 'item': t.append(v['title']); t.extend(re.sub(r'<[^>]+>', '', h) for _, h in v['text']); t.extend(f'{a} {b}' for a, b in v['params'])
            elif k in ('para', 'list'): t.extend(re.sub(r'<[^>]+>', '', x) for x in v)
            elif k == 'heading': t.extend(x for x, _ in v)
            elif k == 'brands': t.extend(f'{b["name"]} {b["text"]}' for b in v)
            elif k == 'table': t.extend(re.sub(r'<[^>]+>', '', c['html']) for r in v for c in r)
        return html.unescape(' '.join(x for x in t if x))


def _txt(el):
    return html.unescape(re.sub(r'\s+', ' ', ''.join(el.itertext())))


def _nice(t):
    t = t.strip(' :.-–*')
    t = re.sub(r'\s+', ' ', t)
    if t.isupper() and len(t) > 4:
        t = t[:1] + t[1:].lower()
    return t[:1].upper() + t[1:] if t else t


def _alt(alt):
    """Popisok z alt textu, len ak vyzerá ako ľudský text."""
    a = (alt or '').strip()
    if not a or re.match(r'^[\w\-]{0,14}$', a) or re.search(r'\d{3,}|_|\.(jpg|gif|png|ashx)', a, re.I) or len(a.split()) < 2:
        return ''
    if re.match(r'^[a-z0-9 ]+$', a) and len(a) < 18: return ''
    return a.replace('_', ' ')

#!/usr/bin/env python3
"""Resize masthead glyphs and build per-article social cards.

Run from the repo root. Writes WebP glyphs, src/data/articles.json,
and public/og/ PNG cards. No extra packages: Pillow only.

  python3 scripts/build-chrome-assets.py              full run
  python3 scripts/build-chrome-assets.py --og SLUG..  only redraw the og cards
                                                      for those catalog slugs
                                                      from src/data/articles.json
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
LANDING = ROOT / "public" / "landing"
DATA = ROOT / "src" / "data" / "articles.json"
OG = ROOT / "public" / "og"

# Hub doors display at 36px. Section h1 glyphs are about the same.
# 72px tall is 2x. The caliper on a section title is about 41px, so 82px.
GLYPHS = {
    "hub-brain-overhead.png": 72,
    "hub-economics.png": 72,
    "hub-risk.png": 72,
    "hub-systems.png": 72,
    "tools-caliper.png": 82,
}

GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"
GEORGIA_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
HELVETICA = "/System/Library/Fonts/Helvetica.ttc"

BG = (8, 10, 16, 255)
INK = (248, 250, 252, 235)
MUTED = (248, 250, 252, 140)
AMBER = (217, 119, 6, 255)


# Watch-list briefs (the locked brief format in AGENTS.md). Each keeps the URL
# of the essay it replaced. Title and description come from the page's
# const title and const subhead; the date is the brief's publish day, locked so
# a later rebuild does not use a commit day; minutes is the rendered reading
# time, because most of a brief's words are computed at build time.
BRIEFS = {
    "src/pages/risk/when-force-majeure-hits-the-ai-build-out.astro": ("2026-10-05", 3),
    "src/pages/risk/six-percent-that-stays.astro": ("2026-10-05", 2),
    "src/pages/risk/when-the-spender-runs-the-printer.astro": ("2026-10-05", 3),
    "src/pages/risk/oil-and-the-100-line.astro": ("2026-10-05", 2),
    "src/pages/economics/jobs-print-was-strong-mix-is-the-story.astro": ("2026-10-05", 3),
    "src/pages/economics/still-1998-not-1999.astro": ("2026-10-05", 3),
}

# Rendered reading time for pages whose words partly live in frontmatter data
# (digest cards), which readingMinutes() in src/lib/site.ts cannot see.
MINUTES = {
}



def page_const(path: Path, name: str) -> str:
    match = re.search(rf"const {name} = '((?:[^'\\]|\\.)*)'", path.read_text())
    if not match:
        raise SystemExit(f"no const {name} in {path}")
    return match.group(1).replace("\\'", "'")


def git_date(path: Path) -> str:
    out = subprocess.check_output(
        ["git", "log", "--follow", "--diff-filter=A", "--format=%aI", "--", str(path)],
        cwd=ROOT,
        text=True,
    )
    lines = [line for line in out.splitlines() if line.strip()]
    if not lines:
        raise SystemExit(f"no git date for {path}")
    return lines[-1][:10]


def href_to_file(href: str) -> Path | None:
    rel = href.strip("/")
    direct = ROOT / "src" / "pages" / f"{rel}.astro"
    nested = ROOT / "src" / "pages" / rel / "index.astro"
    if direct.exists():
        return direct
    if nested.exists():
        return nested
    return None


def frontmatter(path: Path) -> str:
    text = path.read_text()
    parts = text.split("---", 2)
    if len(parts) < 3:
        return ""
    return parts[1]


def pick(match: re.Match[str]) -> str:
    return next(group for group in match.groups() if group is not None)


def rows_from(path: Path) -> list[dict]:
    text = frontmatter(path)
    hrefs = re.findall(r"href:\s*'([^']+)'", text)
    titles = [pick(m) for m in re.finditer(r"title:\s*'([^']*)'|title:\s*\"([^\"]*)\"", text)]
    deks = [pick(m) for m in re.finditer(r"dek:\s*'([^']*)'|dek:\s*\"([^\"]*)\"", text)]
    if not (len(hrefs) == len(titles) == len(deks)):
        raise SystemExit(f"row mismatch in {path}: {len(hrefs)} {len(titles)} {len(deks)}")
    return [{"href": h, "title": t, "description": d} for h, t, d in zip(hrefs, titles, deks)]


def expand(row: dict) -> list[dict]:
    target = href_to_file(row["href"])
    if target is None:
        raise SystemExit(f"missing page for {row['href']}")
    if target.name == "index.astro":
        return rows_from(target)
    return [row]


def article_from(row: dict, section: str, series: str, crumbs: list[dict]) -> dict:
    target = href_to_file(row["href"])
    if target is None or target.name == "index.astro":
        raise SystemExit(f"not an article: {row['href']}")
    rel = str(target.relative_to(ROOT))
    minutes = None
    if rel in BRIEFS:
        date, minutes = BRIEFS[rel]
        row = {**row, "title": page_const(target, "title"), "description": page_const(target, "subhead")}
    elif target.name == "what-an-agent-swarm-is.astro":
        # Explainer date is locked. A later catalog rebuild must not use the commit day.
        date = "2026-09-27"
    elif target.name == "what-xai-has-running.astro":
        # Brief date is locked to the page kicker. A later catalog rebuild must not use the commit day.
        date = "2026-10-04"
    elif target.name == "glossary.astro":
        # Glossary card date is locked. A later catalog rebuild must not use the commit day.
        date = "2026-09-28"
    elif target.name == "terafab.astro":
        # Hardware pack date is locked. A later catalog rebuild must not use the commit day.
        date = "2026-09-13"
    elif target.name == "memphis-colossus.astro":
        # Hardware pack date is locked. A later catalog rebuild must not use the commit day.
        date = "2026-09-13"
    elif target.name in {
        "mtia.astro",
        "blackwell.astro",
        "rubin.astro",
        "instinct.astro",
        "meta.astro",
        "prometheus.astro",
        "hyperion.astro",
        "eagle-mountain.astro",
        "meta-nuclear.astro",
    }:
        # Hardware pack date is locked. A later catalog rebuild must not use the commit day.
        date = "2026-10-04"
    elif target.name == "gpt-6.1-sol.astro":
        # Model card date is locked. A later catalog rebuild must not use the commit day.
        date = "2026-09-29"
    elif target.name == "dots.astro":
        # Model card date is locked. A later catalog rebuild must not use the commit day.
        date = "2026-09-29"
    elif target.name == "claude-haiku-5-5.astro":
        # Model card date is locked. A later catalog rebuild must not use the commit day.
        date = "2026-10-07"
    else:
        date = git_date(target)
    if minutes is None and rel in MINUTES:
        minutes = MINUTES[rel]
    href = row["href"] if row["href"].endswith("/") else row["href"] + "/"
    slug = href.strip("/").replace("/", "-")
    item = {
        "href": href,
        "title": row["title"],
        "description": row["description"],
        "date": date,
        "section": section,
        "series": series,
        "crumbs": crumbs,
        "file": rel,
        "slug": slug,
    }
    if minutes is not None:
        item["minutes"] = minutes
    return item


def build_catalog_real() -> list[dict]:
    items: list[dict] = []
    econ_crumbs = [{"href": "/economics/", "label": "Economics"}]
    for row in rows_from(ROOT / "src/pages/economics.astro"):
        items.append(article_from(row, "economics", "economics", econ_crumbs))

    # /risk/ cards come from src/data/risk-cards.json; title and dek come from each page.
    risk_crumbs = [{"href": "/risk/", "label": "Risk"}]
    for record in json.loads((ROOT / "src" / "data" / "risk-cards.json").read_text()):
        href = record["slug"] if record["slug"].endswith("/") else record["slug"] + "/"
        target = href_to_file(href)
        if target is None:
            raise SystemExit(f"missing page for {href}")
        row = {"href": href, "title": page_const(target, "title"), "description": page_const(target, "subhead")}
        items.append(article_from(row, "risk", "risk", risk_crumbs))

    ai_crumbs = [{"href": "/ai/", "label": "A.I."}]
    dives = [
        {
            "href": "/ai/glossary/",
            "title": "AI glossary",
            "description": "Twenty plain terms for models, serving, and agents on this site",
        },
        {
            "href": "/ai/swarms/what-an-agent-swarm-is/",
            "title": "What an agent swarm is, and what 10,000 of them can do",
            "description": "Two swarms, two breakthroughs, every metric on the table.",
        },
        {
            "href": "/ai/what-xai-has-running/",
            "title": "What xAI has running",
            "description": "A first-cluster claim, not a finished campus.",
        },
        {
            "href": "/ai/models/typesafe/jev/",
            "title": "Jev",
            "description": "Typed decisions for software, not a chat flagship.",
        },
    ]
    for row in dives:
        crumbs = ai_crumbs
        if row["href"].endswith("/jev/"):
            crumbs = ai_crumbs + [{"href": "/ai/models/typesafe/", "label": "TypeSafe"}]
        if row["href"].startswith("/ai/swarms/"):
            crumbs = ai_crumbs + [{"href": "/ai/swarms/", "label": "Agent swarms"}]
        items.append(article_from(row, "ai", "ai-dive", crumbs))

    labs = [
        ("anthropic", "Anthropic", "/ai/models/anthropic/", "src/pages/ai/models/anthropic/index.astro"),
        ("openai", "OpenAI", "/ai/models/openai/", "src/pages/ai/models/openai/index.astro"),
        ("xai", "xAI", "/ai/models/xai/", "src/pages/ai/models/xai/index.astro"),
        ("google", "Google", "/ai/models/google/", "src/pages/ai/models/google/index.astro"),
        ("meta", "Meta", "/ai/models/meta/", "src/pages/ai/models/meta/index.astro"),
        ("deepseek", "DeepSeek", "/ai/models/deepseek/", "src/pages/ai/models/deepseek/index.astro"),
        ("open-weight", "Open weight", "/ai/models/open-weight/", "src/pages/ai/models/open-weight/index.astro"),
    ]
    for series, label, href, index in labs:
        crumbs = [{"href": "/ai/", "label": "A.I."}, {"href": href, "label": label}]
        rows: list[dict] = []
        for row in rows_from(ROOT / index):
            rows.extend(expand(row))
        for row in rows:
            items.append(article_from(row, "ai", f"ai-{series}", crumbs))

    hw_crumbs = ai_crumbs + [{"href": "/ai/hardware/", "label": "Hardware"}]
    # Chip cards are families. Meta's buy is one stack page. Terafab is the factory.
    # The fabric card links to the campus page, so it is not a second essay.
    hardware_rows = [
        {
            "href": "/ai/hardware/chips/terafab/",
            "title": "Terafab",
            "description": "Chip fab. SpaceX and Tesla. Phase 1 is $16.8B.",
        },
        {
            "href": "/ai/hardware/data-centers/memphis-colossus/",
            "title": "Memphis / Colossus",
            "description": "Training campus in Memphis. 170 PB/s memory bandwidth and 2.8 Tb/s per server.",
        },
        {
            "href": "/ai/hardware/chips/mtia/",
            "title": "MTIA",
            "description": "MTIA 300, 400, 450, and 500. The 300 is in production with 216 GB HBM3E. The 400 is a 72-accelerator rack. Compute FLOPS from the 300 to the 500 is 25x.",
        },
        {
            "href": "/ai/hardware/chips/blackwell/",
            "title": "Blackwell",
            "description": "GB300 NVL72 is 72 Blackwell Ultra GPUs and 36 Grace CPUs, with 20 TB of GPU memory, 130 TB/s NVLink, and 1,440 PFLOPS of FP4 Tensor Core with sparsity.",
        },
        {
            "href": "/ai/hardware/chips/rubin/",
            "title": "Rubin",
            "description": "The Rubin GPU is 50 PFLOPS of NVFP4 inference and 288 GB of HBM4. Vera Rubin NVL72 is 72 Rubin GPUs and 36 Vera CPUs.",
        },
        {
            "href": "/ai/hardware/chips/instinct/",
            "title": "Instinct",
            "description": "The custom Instinct GPU is based on the MI450 architecture, with Venice EPYC CPUs, ROCm, and Helios. MI300 and MI350 are the series Meta already runs.",
        },
        {
            "href": "/ai/hardware/chips/meta/",
            "title": "Meta stack",
            "description": "Meta's stack is MTIA, a Broadcom 2nm accelerator through 2029, millions of Nvidia Blackwell and Rubin GPUs, and up to 6 gigawatts of AMD Instinct.",
        },
        {
            "href": "/ai/hardware/data-centers/prometheus/",
            "title": "Prometheus",
            "description": "New Albany, Ohio. Over 1 gigawatt and tens of thousands of graphics chips once complete.",
        },
        {
            "href": "/ai/hardware/data-centers/hyperion/",
            "title": "Hyperion",
            "description": "Richland Parish, Louisiana. 5 gigawatts and more than $50 billion.",
        },
        {
            "href": "/ai/hardware/data-centers/eagle-mountain/",
            "title": "Eagle Mountain",
            "description": "Utah. Raised to more than $3 billion on 14 September 2026.",
        },
        {
            "href": "/ai/hardware/power/meta-nuclear/",
            "title": "Meta nuclear package",
            "description": "Up to 6.6 gigawatts by 2035.",
        },
    ]
    theme_crumbs = {
        "chips": {"href": "/ai/hardware/chips/", "label": "Chips"},
        "data-centers": {"href": "/ai/hardware/data-centers/", "label": "Data centers"},
        "power": {"href": "/ai/hardware/power/", "label": "Power"},
    }
    for row in hardware_rows:
        theme = next(name for name in theme_crumbs if f"/{name}/" in row["href"])
        items.append(article_from(row, "ai", "ai-hardware", hw_crumbs + [theme_crumbs[theme]]))

    opinion_crumbs = [{"href": "/opinions/", "label": "Opinions"}]
    opinion_rows = json.loads((ROOT / "src" / "data" / "opinions.json").read_text())
    for row in opinion_rows:
        target = href_to_file(row["href"])
        if target is None or target.name == "index.astro":
            continue
        items.append(
            article_from(
                {
                    "href": row["href"],
                    "title": row["title"],
                    "description": row["dek"],
                },
                "opinions",
                "opinions",
                opinion_crumbs,
            )
        )
    return items


def resize_glyphs() -> dict[str, dict[str, int]]:
    sizes: dict[str, dict[str, int]] = {}
    for name, height in GLYPHS.items():
        src = LANDING / name
        if not src.exists():
            # Already converted on an earlier run; the source PNG is gone.
            continue
        image = Image.open(src).convert("RGBA")
        width = max(1, round(image.width * (height / image.height)))
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        dest = src.with_suffix(".webp")
        resized.save(dest, "WEBP", quality=82, method=6)
        sizes[name] = {"width": width, "height": height, "bytes": dest.stat().st_size}
        src.unlink()
    return sizes


def font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    if path.endswith(".ttc"):
        return ImageFont.truetype(path, size=size, index=index)
    return ImageFont.truetype(path, size=size)


def wrap(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = word if not current else f"{current} {word}"
        if draw.textlength(trial, font=face) <= max_w:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def fit_title(draw: ImageDraw.ImageDraw, text: str, max_w: int, max_lines: int = 4) -> tuple[ImageFont.FreeTypeFont, list[str]]:
    for size in (64, 56, 48, 42, 36, 32):
        face = font(GEORGIA, size)
        lines = wrap(draw, text, face, max_w)
        if len(lines) <= max_lines:
            return face, lines
    face = font(GEORGIA, 30)
    return face, wrap(draw, text, face, max_w)[:5]


def draw_mark(draw: ImageDraw.ImageDraw, x: int, y: int, size: int) -> None:
    draw.rectangle([x, y, x + size, y + size], outline=INK, width=2)
    small = font(HELVETICA, 16, 0)
    large = font(HELVETICA, 28, 1)
    draw.text((x + 12, y + 10), "26", font=small, fill=INK)
    ry = "Ry"
    ry_w = draw.textlength(ry, font=large)
    draw.text((x + (size - ry_w) / 2, y + size - 40), ry, font=large, fill=INK)


def new_card() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (1200, 630), BG)
    return image, ImageDraw.Draw(image)


def save_card(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, "PNG", optimize=True)


def card_section(name: str, dek: str, dest: Path) -> None:
    image, draw = new_card()
    draw_mark(draw, 88, 78, 84)
    draw.text((196, 96), "Rycode", font=font(GEORGIA, 42), fill=INK)
    draw.rectangle([88, 196, 1112, 198], fill=AMBER)
    face, lines = fit_title(draw, name, 980, 2)
    y = 240
    for line in lines:
        draw.text((88, y), line, font=face, fill=INK)
        y += face.size + 12
    draw.text((88, 540), dek, font=font(HELVETICA, 28, 0), fill=MUTED)
    save_card(image, dest)


def card_article(section: str, title: str, dest: Path) -> None:
    image, draw = new_card()
    draw.text((88, 72), section.upper(), font=font(HELVETICA, 26, 1), fill=AMBER)
    draw.rectangle([88, 118, 220, 122], fill=AMBER)
    face, lines = fit_title(draw, title, 1000, 4)
    y = 160
    for line in lines:
        draw.text((88, y), line, font=face, fill=INK)
        y += face.size + 14
    draw_mark(draw, 88, 500, 64)
    draw.text((172, 516), "Rycode", font=font(GEORGIA, 32), fill=INK)
    save_card(image, dest)


SECTION_LABELS = {
    "economics": "Economics",
    "risk": "Risk",
    "ai": "A.I.",
    "opinions": "Opinions",
}


def og_only(slugs: list[str]) -> None:
    """Redraw article og cards for the given catalog slugs, nothing else."""
    articles = {a["slug"]: a for a in json.loads(DATA.read_text())}
    for slug in slugs:
        article = articles.get(slug)
        if article is None:
            raise SystemExit(f"no catalog slug {slug}")
        dest = OG / "articles" / f"{slug}.png"
        card_article(SECTION_LABELS[article["section"]], article["title"], dest)
        print("og", dest.relative_to(ROOT), dest.stat().st_size)


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "--og":
        og_only(sys.argv[2:])
        return
    sizes = resize_glyphs()
    print("glyphs", json.dumps(sizes, indent=2))
    articles = build_catalog_real()
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(articles, indent=2) + "\n")
    print(f"articles {len(articles)}")

    sections = {
        "home": ("Rycode", "Economics, risk, and systems."),
        "economics": ("Economics", "Prices, cycles, and trade-offs."),
        "risk": ("Risk", "Tails and what actually breaks."),
        "ai": ("A.I.", "Models, hardware, and deep dives."),
        "about": ("About", "Notes by Jeffrey."),
        "contact": ("Contact", "Write to Rycode."),
    }
    for key, (name, dek) in sections.items():
        card_section(name, dek, OG / "sections" / f"{key}.png")
    for article in articles:
        label = SECTION_LABELS[article["section"]]
        card_article(label, article["title"], OG / "articles" / f"{article['slug']}.png")
    print("og bytes", sum(p.stat().st_size for p in OG.rglob("*.png")))


if __name__ == "__main__":
    main()

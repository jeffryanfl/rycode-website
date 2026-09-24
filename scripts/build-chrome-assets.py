#!/usr/bin/env python3
"""Resize masthead glyphs and build per-article social cards.

Run from the repo root. Writes WebP glyphs, src/data/articles.json,
and public/og/ PNG cards. No extra packages: Pillow only.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
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
    date = git_date(target)
    if target.name == "next-token-engine.astro":
        # The A.I. index already publishes this date. The file landed earlier.
        date = "2026-08-25"
    href = row["href"] if row["href"].endswith("/") else row["href"] + "/"
    slug = href.strip("/").replace("/", "-")
    return {
        "href": href,
        "title": row["title"],
        "description": row["description"],
        "date": date,
        "section": section,
        "series": series,
        "crumbs": crumbs,
        "file": str(target.relative_to(ROOT)),
        "slug": slug,
    }


def build_catalog_real() -> list[dict]:
    items: list[dict] = []
    econ_crumbs = [{"href": "/economics/", "label": "Economics"}]
    for row in rows_from(ROOT / "src/pages/economics.astro"):
        items.append(article_from(row, "economics", "economics", econ_crumbs))

    risk_crumbs = [{"href": "/risk/", "label": "Risk"}]
    for row in rows_from(ROOT / "src/pages/risk.astro"):
        items.append(article_from(row, "risk", "risk", risk_crumbs))

    ai_crumbs = [{"href": "/ai/", "label": "A.I."}]
    dives = [
        {
            "href": "/ai/chat-models-write-strings-system-one-returns-decisions/",
            "title": "Chat models write strings. System One returns typed decisions.",
            "description": "Why Jev changes the scoreboard for software automation",
        },
        {
            "href": "/ai/ten-thousand-agents-is-not-a-genius/",
            "title": "The claimed math breakthrough was agent scale and token spend",
            "description": "Ten thousand agents is not a genius",
        },
        {
            "href": "/ai/next-token-engine/",
            "title": "A next-token engine with an RLVR post-train and a tool loop.",
            "description": "How staged training and tools shape a next-token engine.",
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
    for row in rows_from(ROOT / "src/pages/ai/hardware/index.astro"):
        items.append(article_from(row, "ai", "ai-hardware", hw_crumbs))
    return items


def resize_glyphs() -> dict[str, dict[str, int]]:
    sizes: dict[str, dict[str, int]] = {}
    for name, height in GLYPHS.items():
        src = LANDING / name
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


def main() -> None:
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
        "tools": ("Tools", "Calculators."),
        "dashboards": ("Dashboards", "Build vs. Buy and Control Effectiveness."),

        "about": ("About", "Notes by Jeffrey."),
        "contact": ("Contact", "Write to Rycode."),
    }
    for key, (name, dek) in sections.items():
        card_section(name, dek, OG / "sections" / f"{key}.png")
    for article in articles:
        label = {"economics": "Economics", "risk": "Risk", "ai": "A.I."}[article["section"]]
        card_article(label, article["title"], OG / "articles" / f"{article['slug']}.png")
    print("og bytes", sum(p.stat().st_size for p in OG.rglob("*.png")))


if __name__ == "__main__":
    main()

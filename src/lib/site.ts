import fs from 'node:fs';
import path from 'node:path';
import articlesJson from '../data/articles.json';

export const AUTHOR = 'Jeffrey';

export type Crumb = { href: string; label: string };

export type Article = {
  href: string;
  title: string;
  description: string;
  date: string;
  section: 'economics' | 'risk' | 'ai' | 'opinions';
  series: string;
  crumbs: Crumb[];
  file: string;
  slug: string;
  /** Read time for pages whose text is built from feeds, where the source file undercounts. */
  minutes?: number;
};

export const articles = articlesJson as Article[];

const byHref = new Map(articles.map((article) => [article.href, article]));

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

/** Pages that ship horizontal table scrollers enhanced by public/scroll-regions.js */
export function pageNeedsScrollRegions(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (p === '/ai/') return true;
  if (p === '/ai/models/archive/') return true;
  if (p === '/ai/ai-regulation/') return true;
  if (p.includes('/economics/saas')) return true;
  if (p.startsWith('/ai/swarms')) return true;
  if (p.startsWith('/ai/models/')) return true;
  if (p.startsWith('/ai/hardware/')) return true;
  return false;
}

export function findArticle(pathname: string): Article | undefined {
  return byHref.get(normalizePath(pathname));
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[month - 1]} ${year}`;
}

/** Rough read time from the page source. Markup and expressions are not words. */
export function readingMinutes(file: string): number {
  const raw = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  const body = raw.replace(/^---[\s\S]*?---/, '');
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ');
  const words = text.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word));
  return Math.max(1, Math.round(words.length / 220));
}

export type ArticleNav = {
  article: Article;
  prev: Article | null;
  next: Article | null;
  sectionPrev: Article | null;
  sectionNext: Article | null;
  related: Article[];
  minutes: number;
};

export function articleNav(pathname: string): ArticleNav | null {
  const article = findArticle(pathname);
  if (!article) return null;

  const siblings = articles.filter((item) => item.series === article.series);
  const index = siblings.findIndex((item) => item.href === article.href);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index < siblings.length - 1 ? siblings[index + 1] : null;
  const skip = new Set(
    [article.href, prev?.href, next?.href].filter((href): href is string => Boolean(href)),
  );

  const nearest = siblings
    .map((item, itemIndex) => ({ item, dist: Math.abs(itemIndex - index) }))
    .filter((entry) => entry.dist > 1)
    .sort((a, b) => a.dist - b.dist)
    .map((entry) => entry.item);

  let related = nearest.slice(0, 3);
  if (related.length < 3) {
    const sectionPool = articles.filter(
      (item) =>
        item.section === article.section &&
        !skip.has(item.href) &&
        !related.some((pick) => pick.href === item.href),
    );
    related = [...related, ...sectionPool].slice(0, 3);
  }
  if (related.length < 2) {
    const rest = siblings.filter(
      (item) => item.href !== article.href && !related.some((pick) => pick.href === item.href),
    );
    related = [...related, ...rest].slice(0, 3);
  }

  const inSection = articles.filter((item) => item.section === article.section);
  const sectionIndex = inSection.findIndex((item) => item.href === article.href);
  const sectionPrev = sectionIndex > 0 ? inSection[sectionIndex - 1] : null;
  const sectionNext =
    sectionIndex >= 0 && sectionIndex < inSection.length - 1 ? inSection[sectionIndex + 1] : null;

  return {
    article,
    prev,
    next,
    sectionPrev,
    sectionNext,
    related,
    minutes: article.minutes ?? readingMinutes(article.file),
  };
}

const OG_ROOT = path.join(process.cwd(), 'public');
const META_CHIP_OG = '/og/articles/ai-hardware-chips-meta.png';

function sectionOgImage(section: Article['section']): string {
  if (section === 'economics') return '/og/sections/economics.png';
  if (section === 'risk') return '/og/sections/risk.png';
  if (section === 'ai') return '/og/sections/ai.png';
  return '/og/sections/home.png';
}

function articleOgImage(article: Article): string {
  const card = `/og/articles/${article.slug}.png`;
  if (fs.existsSync(path.join(OG_ROOT, card.slice(1)))) return card;
  if (/^ai-hardware-chips-meta-(nvidia|amd|broadcom)$/.test(article.slug)) return META_CHIP_OG;
  return sectionOgImage(article.section);
}

export function ogImageFor(pathname: string): string {
  const current = normalizePath(pathname);
  const article = findArticle(current);
  if (article) return articleOgImage(article);
  if (current.startsWith('/economics/')) return '/og/sections/economics.png';
  if (current.startsWith('/risk/')) return '/og/sections/risk.png';
  if (current.startsWith('/ai/')) return '/og/sections/ai.png';
  if (current.startsWith('/opinions/')) return '/og/sections/home.png';
  if (current.startsWith('/about/')) return '/og/sections/about.png';
  if (current.startsWith('/contact/')) return '/og/sections/contact.png';
  return '/og/sections/home.png';
}

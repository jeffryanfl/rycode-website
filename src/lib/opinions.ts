import opinionsJson from '../data/opinions.json';
import { findArticle, normalizePath } from './site';

export type Opinion = {
  href: string;
  title: string;
  dek: string;
  date: string;
  related: string[];
  image?: string;
};

export const opinions = opinionsJson as Opinion[];

export function opinionSlug(href: string): string {
  return href.replace(/^\/opinions\//, '').replace(/\/$/, '');
}

export type RelatedLink = {
  href: string;
  title: string;
};

/** related[] is other pages on this site. Prefer the article title when one exists. */
export function relatedOnSite(hrefs: string[]): RelatedLink[] {
  return hrefs.map((raw) => {
    const href = normalizePath(raw);
    const article = findArticle(href);
    if (article) return { href: article.href, title: article.title };
    const opinion = opinions.find((item) => normalizePath(item.href) === href);
    if (opinion) return { href: opinion.href, title: opinion.title };
    return { href, title: href };
  });
}

export function opinionPaths(): string[] {
  return opinions.map((item) => normalizePath(item.href));
}

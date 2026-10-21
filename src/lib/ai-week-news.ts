/** Shared feed item types for ai-feed-history.json (ticker + scripts). */
export type AiFeedItem = {
  id: string;
  date: string;
  tag: string;
  headline: string;
  why: string;
  url: string;
  source: string;
  status: 'confirmed' | 'reported' | 'claim' | string;
};

export type AiFeedHistory = {
  schema: string;
  updated: string;
  items: AiFeedItem[];
};

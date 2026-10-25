import pack from '../../docs/ai/hardware.datacenters.json';
import plantsFile from '../../docs/ai/hardware.plants.json';
import { homesFor as homesForMath } from './homes-math.mjs';

export type ImageKind = 'official' | 'illustration' | 'pending';

export type SourcedText = {
  text: string;
  source: string;
};

export type SourcedPart = {
  text: string;
  source: string;
};

export type DataCenterChip = {
  type: string;
  count: number | null;
  countText: string | null;
  source: string;
};

export type DataCenterUsedFor = {
  who: string;
  what: string;
  source: string;
};

export type DataCenterCompute = {
  text: string;
  basis: 'stated' | 'derived';
  source: string;
  method?: string;
  chipHref?: string;
};

export type DataCenterPower = {
  mw: number;
  text: string;
  kind: 'running' | 'planned' | 'grid-connection' | 'on-site-generation';
  source: string;
  homesQualifier?: string;
};

export type DataCenterSite = {
  id: string;
  name: string;
  ownerName: string;
  dek: string;
  asOf: string;
  location: SourcedText;
  owner: SourcedText;
  operator: SourcedText | null;
  status: { value: string; note: string; source: string };
  statusSegments?: SourcedPart[];
  locationSegments?: SourcedPart[];
  powerSegments?: SourcedPart[];
  waterSegments?: SourcedPart[];
  power: DataCenterPower | null;
  powerPlanned?: DataCenterPower;
  powerSupplement?: { mw: number; homesQualifier: string; source: string };
  chips: DataCenterChip[];
  compute: DataCenterCompute | null;
  usedFor: DataCenterUsedFor[];
  cooling: SourcedText | null;
  water: SourcedText | null;
  network: SourcedText | null;
  cost: SourcedText | null;
  site: SourcedText | null;
  extraRows: { label: string; text: string; source: string }[];
  onSiteGeneration?: SourcedText;
  gridNotes?: SourcedText;
  image: {
    src: string;
    alt: string;
    credit: string;
    creditUrl: string;
    kind: ImageKind;
  };
  notes: { text: string; source: string; claim: boolean }[];
  updates: { date: string; text: string; source: string }[];
  sourceKeys: string[];
};

export type DataCenterSource = {
  key: string;
  label: string;
  url: string;
  primary: boolean;
};

export type DataCenterRealTerms = {
  kwhPerHomeYear: number;
  dataYear: number;
  sourceKey: string;
  fetched: string;
};

const STATUS_LABEL: Record<string, string> = {
  running: 'Running',
  'partly-running': 'Partly running',
  'under-construction': 'Under construction',
  planned: 'Planned',
};

const sites = pack.sites as DataCenterSite[];
const sourcesMap = pack.sources as Record<string, { label: string; url: string; primary?: boolean }>;
const realTerms = pack.realTerms as DataCenterRealTerms;

/** Round MW to US-home equivalent at EIA average; two significant figures with "about". */
export function homesFor(mw: number, kwhPerHomeYear = realTerms.kwhPerHomeYear): string {
  return homesForMath(mw, kwhPerHomeYear);
}

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function updateSortKey(label: string): number {
  const match = /^(\d{1,2})\s+(\w{3})\s+(\d{4})$/.exec(label.trim());
  if (!match) return 0;
  const day = Number(match[1]);
  const month = MONTHS[match[2]] ?? 0;
  const year = Number(match[3]);
  return Date.UTC(year, month, day);
}

export function sortedUpdates(site: DataCenterSite): DataCenterSite['updates'] {
  return [...site.updates].sort((a, b) => updateSortKey(b.date) - updateSortKey(a.date)).slice(0, 8);
}

export function homesSubLine(): string {
  return `As many US homes as use the same electricity in a year, if the site ran at full power all year. EIA average: ${realTerms.kwhPerHomeYear.toLocaleString('en-US')} kWh per home (${realTerms.dataYear}).`;
}

export function datacenterSite(id: string): DataCenterSite {
  const site = sites.find((item) => item.id === id);
  if (!site) throw new Error(`Missing data-center site ${id}`);
  return site;
}

export function datacenterIds(): string[] {
  return sites.map((site) => site.id);
}

export function statusLabel(value: string): string {
  return STATUS_LABEL[value] ?? value;
}

export function notStatedBy(ownerName: string): string {
  return `Not stated by ${ownerName}`;
}

export function orderedSources(site: DataCenterSite): DataCenterSource[] {
  const keys = [...site.sourceKeys];
  if (!keys.includes(realTerms.sourceKey)) keys.push(realTerms.sourceKey);
  const unique = [...new Set(keys)];
  unique.sort((a, b) => {
    const ap = sourcesMap[a]?.primary ? 1 : 0;
    const bp = sourcesMap[b]?.primary ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return site.sourceKeys.indexOf(a) - site.sourceKeys.indexOf(b);
  });
  return unique.map((key) => {
    const row = sourcesMap[key];
    if (!row) throw new Error(`Missing source ${key} on site ${site.id}`);
    return { key, label: row.label, url: row.url, primary: Boolean(row.primary) };
  });
}

/** Sources listed on the page (EIA omitted when there is no homes figure). */
export function sourcesForPage(site: DataCenterSite): DataCenterSource[] {
  const all = orderedSources(site);
  if (site.power?.mw) return all;
  return all.filter((source) => source.key !== realTerms.sourceKey);
}

/** Contiguous 1..N anchor numbers matching the visible Sources list. */
export function displayAnchors(site: DataCenterSite): Record<string, number> {
  const anchors: Record<string, number> = {};
  sourcesForPage(site).forEach((source, index) => {
    anchors[source.key] = index + 1;
  });
  return anchors;
}

/** @deprecated Use displayAnchors for in-page cites. */
export function sourceAnchors(site: DataCenterSite): Record<string, number> {
  return displayAnchors(site);
}

export function headlinePower(site: DataCenterSite): string | undefined {
  return site.power?.text;
}

export function headlineHomes(site: DataCenterSite): string | undefined {
  if (!site.power?.mw) return undefined;
  const homes = homesFor(site.power.mw);
  const qualifier = site.power.homesQualifier;
  return qualifier ? `${homes} homes, ${qualifier}` : `${homes} homes`;
}

export function headlineChips(site: DataCenterSite): string | undefined {
  if (!site.chips.length) return undefined;
  const parts = site.chips.map((chip) => {
    const count = chip.countText ?? (chip.count != null ? String(chip.count) : '');
    return count ? `${count}: ${chip.type}` : chip.type;
  });
  return parts.join('; ');
}

export function headlineStatus(site: DataCenterSite): string {
  const label = statusLabel(site.status.value);
  return site.status.note ? `${label}. ${site.status.note}` : label;
}

export function cardUsedFor(site: DataCenterSite): string | undefined {
  if (!site.usedFor.length) return undefined;
  return site.usedFor.map((row) => `${row.who}: ${row.what}`).join('; ');
}

export type SiteCardRows = {
  power: string;
  chips: string;
  usedFor: string;
};

/** Index card rows for converted data-center plants. */
export function siteCardRows(id: string): SiteCardRows | undefined {
  const site = sites.find((item) => item.id === id);
  if (!site) return undefined;
  return {
    power: headlinePower(site) ?? 'Not stated',
    chips: headlineChips(site) ?? 'Not stated',
    usedFor: cardUsedFor(site) ?? 'Not stated',
  };
}

export function siteCardImage(id: string): DataCenterSite['image'] | undefined {
  return sites.find((item) => item.id === id)?.image;
}

export function siteCardOwner(id: string): string | undefined {
  return sites.find((item) => item.id === id)?.owner.text;
}

const dcPlantIds = new Set(
  (plantsFile.plants as { id: string; theme: string }[])
    .filter((plant) => plant.theme === 'data-centers')
    .map((plant) => plant.id),
);

export function assertDatacenterPlantIds(): void {
  for (const site of sites) {
    if (!dcPlantIds.has(site.id)) {
      throw new Error(`datacenters.json site ${site.id} has no data-centers plant in hardware.plants.json`);
    }
  }
}

export { realTerms, pack as datacenterPack };

/** EIA homes equivalent math (shared by datacenters pack and tests). */
export const KWH_PER_HOME_YEAR_DEFAULT = 10791;

export function homesFor(mw: number, kwhPerHomeYear = KWH_PER_HOME_YEAR_DEFAULT): string {
  const raw = (mw * 1000 * 8760) / kwhPerHomeYear;
  const rounded = Number(raw.toPrecision(2));
  return `about ${rounded.toLocaleString('en-US')}`;
}

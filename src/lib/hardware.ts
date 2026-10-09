import plantsFile from '../../docs/ai/hardware.plants.json';
import themesFile from '../../docs/ai/hardware.themes.json';

export type HardwareCard = {
  title: string;
  dek: string;
  value: string;
  label: string;
  href: string;
  /** Other labs on this door, when the headline is still one plant's figure. */
  kicker?: string;
  /** Package photo. When set, the card shows it and opens the figure on hover. */
  image?: string;
  /** Alt text for the package photo. */
  imageAlt?: string;
  /** Short caption over the photo, when the photo is not the chip the card's figure names. */
  imageCaption?: string;
};

type HardwarePlant = HardwareCard & {
  id: string;
  theme: string;
  lab: string;
};

const plants = plantsFile.plants as HardwarePlant[];

function labsFor(themeId: string): string[] {
  const names: string[] = [];
  for (const plant of plants) {
    if (plant.theme !== themeId) continue;
    if (!plant.lab) throw new Error(`Missing lab on hardware plant ${plant.id}`);
    if (!names.includes(plant.lab)) names.push(plant.lab);
  }
  return names;
}

/** Theme doors on /ai/hardware/. Titles and deks come from the pack JSON. */
export const hardwareThemes: HardwareCard[] = themesFile.themes.map((theme) => {
  const labs = labsFor(theme.id);
  const joined = labs.join(' · ');
  return {
    title: theme.title,
    dek: theme.dek,
    value: theme.value,
    label: theme.label,
    href: theme.href,
    kicker: labs.length > 1 && theme.value !== joined ? joined : undefined,
  };
});

export function hardwareTheme(id: string): HardwareCard {
  const theme = themesFile.themes.find((item) => item.id === id);
  if (!theme) throw new Error(`Missing hardware theme ${id}`);
  return theme;
}

/** Plant cards for one theme. An empty list means the theme index shows the quiet card. */
export function hardwarePlants(themeId: string): HardwareCard[] {
  return plants.filter((plant) => plant.theme === themeId);
}

/** Plants for one theme, in file order, under the lab each page already belongs to. */
export function hardwarePlantsByLab(themeId: string): { lab: string; cards: HardwareCard[] }[] {
  const groups: { lab: string; cards: HardwareCard[] }[] = [];
  for (const plant of plants) {
    if (plant.theme !== themeId) continue;
    if (!plant.lab) throw new Error(`Missing lab on hardware plant ${plant.id}`);
    let group = groups.find((item) => item.lab === plant.lab);
    if (!group) {
      group = { lab: plant.lab, cards: [] };
      groups.push(group);
    }
    group.cards.push(plant);
  }
  return groups;
}

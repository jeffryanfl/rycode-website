import plantsFile from '../../docs/ai/hardware.plants.json';
import themesFile from '../../docs/ai/hardware.themes.json';

export type HardwareCard = {
  title: string;
  dek: string;
  value: string;
  label: string;
  href: string;
};

/** Theme doors on /ai/hardware/. Titles and deks come from the pack JSON. */
export const hardwareThemes: HardwareCard[] = themesFile.themes;

export function hardwareTheme(id: string): HardwareCard {
  const theme = themesFile.themes.find((item) => item.id === id);
  if (!theme) throw new Error(`Missing hardware theme ${id}`);
  return theme;
}

/** Plant cards for one theme. An empty list means the theme index shows the quiet card. */
export function hardwarePlants(themeId: string): HardwareCard[] {
  return plantsFile.plants.filter((plant) => plant.theme === themeId);
}

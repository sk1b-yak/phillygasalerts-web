import type { FC } from 'react';
import type { LogoProps } from './types';
import { ShellLogo } from './ShellLogo';
import { BPLogo } from './BPLogo';
import { SunocoLogo } from './SunocoLogo';
import { ChevronLogo } from './ChevronLogo';
import { LukoilLogo } from './LukoilLogo';
import { ExxonLogo } from './ExxonLogo';
import { WawaLogo } from './WawaLogo';
import { CostcoLogo } from './CostcoLogo';
import { CitgoLogo } from './CitgoLogo';
import { ValeroLogo } from './ValeroLogo';
import { DefaultLogo } from './DefaultLogo';
import { ConocoLogo } from './ConocoLogo';
import { SpeedwayLogo } from './SpeedwayLogo';
import { LibertyLogo } from './LibertyLogo';
import { RoyalFarmsLogo } from './RoyalFarmsLogo';
import { SeventySixLogo } from './SeventySixLogo';
import { GiantLogo } from './GiantLogo';
import { PhillipsLogo } from './PhillipsLogo';
import { SevenElevenLogo } from './SevenElevenLogo';
import { GulfLogo } from './GulfLogo';
import { MarathonLogo } from './MarathonLogo';
import { SinclairLogo } from './SinclairLogo';
import { BJsLogo } from './BJsLogo';
import { SamsClubLogo } from './SamsClubLogo';
import { MobilLogo } from './MobilLogo';
import { IndependentLogo } from './IndependentLogo';

export const LOGO_REGISTRY: Record<string, FC<LogoProps>> = {
  shell: ShellLogo,
  bp: BPLogo,
  amoco: BPLogo,
  exxon: ExxonLogo,
  wawa: WawaLogo,
  chevron: ChevronLogo,
  costco: CostcoLogo,
  sunoco: SunocoLogo,
  citgo: CitgoLogo,
  valero: ValeroLogo,
  lukoil: LukoilLogo,
  conoco: ConocoLogo,
  speedway: SpeedwayLogo,
  liberty: LibertyLogo,
  'royal farms': RoyalFarmsLogo,
  royalfarms: RoyalFarmsLogo,
  royal: RoyalFarmsLogo,
  '76': SeventySixLogo,
  seventysix: SeventySixLogo,
  giant: GiantLogo,
  'phillips 66': PhillipsLogo,
  phillips: PhillipsLogo,
  '7-eleven': SevenElevenLogo,
  '7eleven': SevenElevenLogo,
  gulf: GulfLogo,
  marathon: MarathonLogo,
  sinclair: SinclairLogo,
  mobil: MobilLogo,
  "bj's": BJsLogo,
  bjs: BJsLogo,
  "sam's club": SamsClubLogo,
  "sam's": SamsClubLogo,
  sams: SamsClubLogo,
  us: IndependentLogo,
  usa: IndependentLogo,
  unbranded: IndependentLogo,
  independent: IndependentLogo,
  default: DefaultLogo,
};

export function getLogo(stationName: string, brand?: string): FC<LogoProps> {
  if (brand) {
    const b = brand.toLowerCase();
    if (LOGO_REGISTRY[b]) return LOGO_REGISTRY[b];
    for (const key of Object.keys(LOGO_REGISTRY)) {
      if (key !== 'default' && b.includes(key)) return LOGO_REGISTRY[key];
    }
  }
  if (!stationName) return DefaultLogo;
  const lower = stationName.toLowerCase();
  const nameBrand = lower.split(' - ')[0].trim();
  if (LOGO_REGISTRY[nameBrand]) return LOGO_REGISTRY[nameBrand];
  for (const key of Object.keys(LOGO_REGISTRY)) {
    if (key !== 'default' && lower.includes(key)) return LOGO_REGISTRY[key];
  }
  return IndependentLogo;
}

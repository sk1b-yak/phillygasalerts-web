import { useState, useMemo } from 'react';
import { LOGO_REGISTRY } from './registry';
import { LogoProps } from './types';

interface UseBrandLogoOptions {
  stationName: string;
  isDarkMode?: boolean;
}

export function useBrandLogo({ stationName, isDarkMode = false }: UseBrandLogoOptions) {
  const [isHovered, setIsHovered] = useState(false);

  const brandInfo = useMemo(() => {
    const name = (stationName || '').toLowerCase();

    for (const [brand, Component] of Object.entries(LOGO_REGISTRY)) {
      if (name.includes(brand)) {
        return {
          Component,
          brand,
          exists: true,
        };
      }
    }

    return {
      Component: LOGO_REGISTRY.default,
      brand: 'default',
      exists: false,
    };
  }, [stationName]);

  const logoProps: LogoProps = {
    size: 64,
    isDarkMode,
    isHovered,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return {
    LogoComponent: brandInfo.Component,
    brand: brandInfo.brand,
    logoProps,
    isHovered,
    setIsHovered,
  };
}
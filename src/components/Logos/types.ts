import React from 'react';

export interface LogoProps {
  size?: number;
  className?: string;
  isDarkMode?: boolean;
  isHovered?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  brandColor?: string;
}

export interface BrandLogoMap {
  [key: string]: React.FC<LogoProps>;
}

export type BrandName =
  | 'shell'
  | 'bp'
  | 'amoco'
  | 'sunoco'
  | 'chevron'
  | 'lukoil'
  | 'exxon'
  | 'wawa'
  | 'costco'
  | 'citgo'
  | 'valero'
  | 'conoco'
  | 'speedway'
  | 'liberty'
  | 'royal farms'
  | '76'
  | 'giant'
  | 'phillips 66'
  | '7-eleven'
  | 'gulf'
  | 'marathon'
  | 'sinclair'
  | 'mobil'
  | "bj's"
  | "sam's club"
  | 'independent'
  | string;

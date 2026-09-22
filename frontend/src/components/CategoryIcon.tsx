import { Boxes, Package } from 'lucide-react';
import Image from 'next/image';
import type { IconType } from 'react-icons';
import { FaMicrosoft } from 'react-icons/fa6';
import { RiOpenaiFill } from 'react-icons/ri';
import { SiAutodesk, SiClaude, SiDuolingo, SiGooglegemini, SiIlovepdf, SiNetflix, SiNordvpn, SiSpotify, SiX, SiYoutube } from 'react-icons/si';
import { TbBrandAdobe } from 'react-icons/tb';

const vectorIcons: Record<string, IconType> = {
  chatgpt: RiOpenaiFill, gemini: SiGooglegemini, claude: SiClaude, grok: SiX,
  youtube: SiYoutube, netflix: SiNetflix, vpn: SiNordvpn, spotify: SiSpotify,
  adobe: TbBrandAdobe, office: FaMicrosoft, ilovepdf: SiIlovepdf,
  autodesk: SiAutodesk, duolingo: SiDuolingo,
};

const imageIcons: Record<string, string> = {
  capcut: 'https://www.tadhub.store/brands/capcut-official.png',
  canva: 'https://www.tadhub.store/brands/canva-official.png',
  jetbrains: 'https://www.tadhub.store/brands/jetbrains-official.svg',
  leonardo: 'https://www.tadhub.store/brands/leonardo-official.svg',
};

export function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
  if (category === 'all') return <Boxes size={size} strokeWidth={1.8} aria-hidden="true" />;
  if (category === 'other') return <Package size={size} strokeWidth={1.8} aria-hidden="true" />;
  if (imageIcons[category]) return <Image className="brand-logo-image" src={imageIcons[category]} width={size} height={size} alt="" aria-hidden="true" draggable={false} unoptimized />;
  const Icon = vectorIcons[category] || Package;
  return <Icon size={size} aria-hidden="true" focusable={false} />;
}

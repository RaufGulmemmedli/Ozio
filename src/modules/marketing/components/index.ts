export { Hero, type HeroProps } from './Hero';
export { HeroVisual, type HeroVisualCopy, type HeroVisualProps } from './HeroVisual';
export { EyebrowChip, type EyebrowChipProps } from './EyebrowChip';
export { TrustRow, type TrustRowProps } from './TrustRow';
export { SectionHeader, type SectionHeaderProps } from './SectionHeader';
export { StatsPanel, type StatEntry, type StatsPanelProps } from './StatsPanel';
export { BentoGrid, type BentoEntry, type BentoGridProps } from './BentoGrid';
export { HowSteps, type HowStepsProps, type StepEntry } from './HowSteps';
export { TenPanel, type TenPanelProps } from './TenPanel';
export { StampCard, type StampCardProps } from './StampCard';
export { MarketSection, type MarketChip, type MarketSectionProps } from './MarketSection';
export { ProductCard, type ProductCardProps } from './ProductCard';
export { Faq, type FaqEntry, type FaqProps } from './Faq';
export { DownloadPanel, type DownloadPanelProps } from './DownloadPanel';
export { StoreBadges, type StoreBadgesProps } from './StoreBadges';
export { CtaLink, type CtaLinkProps, type CtaSize, type CtaVariant } from './CtaLink';
export { TileGrid, type TileEntry, type TileGridProps } from './TileGrid';
export { RatesTable, type RateRow, type RatesTableProps } from './RatesTable';
export { PartnerGrid, type PartnerEntry, type PartnerGridProps } from './PartnerGrid';
export { InfoPanel, type InfoPanelProps, type ValueRow } from './InfoPanel';
export { PageIntro, type PageIntroProps } from './PageIntro';
export { LegalDoc, type LegalDocProps, type LegalSectionCopy } from './LegalDoc';
export { JsonLd, type JsonLdProps } from './JsonLd';

/**
 * `<MarketingHeader>` and `<ContactForm>` are deliberately NOT re-exported.
 *
 * Both are `'use client'`, and `<ContactForm>` drags react-hook-form + zod +
 * five form controls behind it. A barrel that names them puts them in the client
 * module graph of every route that imports anything from this barrel — which
 * would land the contact form's chunk on `/`, against the 90 KB gz first-load
 * budget in architecture/07 §JS budget. The two files that need them import them
 * by path instead: `(marketing)/layout.tsx` and `(marketing)/contact/page.tsx`.
 */
export type { MarketingHeaderProps } from './MarketingHeader';
export type { ContactFormProps } from './ContactForm';

export {
  brandText,
  floatClass,
  proseClass,
  railClass,
  typeBentoTitle,
  typeCardKicker,
  typeEyebrow,
  typeFaqTitle,
  typeHero,
  typeLead,
  typePanelTitle,
  typeSectionTitle,
  typeStatValue,
  typeStepNumber,
} from './type';

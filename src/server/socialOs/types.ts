/** ClearPath Social OS — site-owned direct publishing (no Buffer / Zapier / Make). */

export type SocialPlatform =
  // Top social / video
  | 'facebook'
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'reddit'
  | 'snapchat'
  | 'pinterest'
  | 'discord'
  | 'threads'
  | 'telegram'
  | 'whatsapp'
  | 'twitch'
  | 'bluesky'
  // Professional / networking
  | 'xing'
  | 'viadeo'
  | 'shapr'
  | 'lunchclub'
  | 'polywork'
  | 'wellfound'
  | 'fishbowl'
  | 'blind'
  | 'opportunity'
  | 'meetup'
  | 'alignable'
  | 'bark'
  | 'gust'
  | 'researchgate';

export type PostStatus =
  | 'draft'
  | 'queued'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled'
  | 'packaged';

/**
 * Site-owned publisher modes:
 * - dry_run: forced offline / test
 * - direct: ClearPath adapter posted to the platform API or ClearPath-owned webhook
 * - package: credentials missing — package written under data/social-os/packages for founder confirm
 */
export type PublishMode = 'dry_run' | 'direct' | 'package';

export type DeliveryKind = 'api' | 'webhook' | 'package';

export type SocialPost = {
  id: string;
  createdAt: string;
  updatedAt: string;
  platform: SocialPlatform;
  title?: string;
  body: string;
  linkUrl?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: string;
  status: PostStatus;
  publishMode: PublishMode;
  externalIds?: {
    platformPostId?: string;
    packagePath?: string;
  };
  lastError?: string;
  publishedAt?: string;
  source?: 'manual' | 'template' | 'growth_os' | 'api';
  meta?: Record<string, unknown>;
};

export type PlatformReadiness = {
  platform: SocialPlatform;
  label: string;
  group: 'social' | 'networking';
  delivery: DeliveryKind;
  configured: boolean;
  credentialHint: string;
};

export type SocialOsConfig = {
  siteUrl: string;
  brandName: string;
  defaultLinkUrl: string;
  utmCampaign: string;
  dryRun: boolean;
  /** Count of platforms with live credentials (API or webhook). */
  platformsConfigured: number;
  platformsTotal: number;
  schedulerIntervalMs: number;
  middlemen: 'none';
};

export type CreatePostInput = {
  platform: SocialPlatform;
  body: string;
  title?: string;
  linkUrl?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: string | null;
  status?: 'draft' | 'queued';
  publishMode?: PublishMode;
  source?: SocialPost['source'];
  meta?: Record<string, unknown>;
};

export type TemplateKind =
  | 'clarity_cta'
  | 'education_tip'
  | 'founder_story'
  | 'feature_highlight'
  | 'market_lesson';

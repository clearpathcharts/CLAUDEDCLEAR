import type { DeliveryKind, PlatformReadiness, SocialPlatform } from './types';

export type PlatformMeta = {
  id: SocialPlatform;
  label: string;
  group: 'social' | 'networking';
  /** Preferred delivery when credentials exist. */
  preferredDelivery: DeliveryKind;
  /** Env keys that enable live direct delivery (any one group). */
  credentialEnv: string[];
  credentialHint: string;
};

/**
 * Full ClearPath-owned channel catalog.
 * No Buffer / Zapier / Hootsuite — each network is reached by our adapter.
 */
export const PLATFORM_CATALOG: PlatformMeta[] = [
  // —— Top social / video ——
  {
    id: 'facebook',
    label: 'Facebook',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN', 'SOCIAL_FACEBOOK_PAGE_ID'],
    credentialHint: 'SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN + SOCIAL_FACEBOOK_PAGE_ID (Meta Graph)',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_INSTAGRAM_ACCESS_TOKEN', 'SOCIAL_INSTAGRAM_BUSINESS_ACCOUNT_ID'],
    credentialHint: 'SOCIAL_INSTAGRAM_ACCESS_TOKEN + SOCIAL_INSTAGRAM_BUSINESS_ACCOUNT_ID',
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_X_BEARER_TOKEN'],
    credentialHint: 'SOCIAL_X_BEARER_TOKEN (or SOCIAL_X_ACCESS_TOKEN + SOCIAL_X_ACCESS_SECRET)',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_TIKTOK_ACCESS_TOKEN'],
    credentialHint: 'SOCIAL_TIKTOK_ACCESS_TOKEN (Content Posting API)',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_YOUTUBE_ACCESS_TOKEN'],
    credentialHint: 'SOCIAL_YOUTUBE_ACCESS_TOKEN (YouTube Data API)',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_LINKEDIN_ACCESS_TOKEN', 'SOCIAL_LINKEDIN_AUTHOR_URN'],
    credentialHint: 'SOCIAL_LINKEDIN_ACCESS_TOKEN + SOCIAL_LINKEDIN_AUTHOR_URN',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_REDDIT_CLIENT_ID', 'SOCIAL_REDDIT_CLIENT_SECRET', 'SOCIAL_REDDIT_USERNAME', 'SOCIAL_REDDIT_PASSWORD'],
    credentialHint: 'SOCIAL_REDDIT_CLIENT_ID/SECRET + USERNAME/PASSWORD (+ optional SUBREDDIT)',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    group: 'social',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_SNAPCHAT_ACCESS_TOKEN', 'SOCIAL_WEBHOOK_SNAPCHAT'],
    credentialHint: 'SOCIAL_SNAPCHAT_ACCESS_TOKEN or SOCIAL_WEBHOOK_SNAPCHAT',
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_PINTEREST_ACCESS_TOKEN', 'SOCIAL_PINTEREST_BOARD_ID'],
    credentialHint: 'SOCIAL_PINTEREST_ACCESS_TOKEN + SOCIAL_PINTEREST_BOARD_ID',
  },
  {
    id: 'discord',
    label: 'Discord',
    group: 'social',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_DISCORD_WEBHOOK_URL'],
    credentialHint: 'SOCIAL_DISCORD_WEBHOOK_URL (ClearPath-owned channel webhook)',
  },
  {
    id: 'threads',
    label: 'Threads',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_THREADS_ACCESS_TOKEN', 'SOCIAL_THREADS_USER_ID'],
    credentialHint: 'SOCIAL_THREADS_ACCESS_TOKEN + SOCIAL_THREADS_USER_ID',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_TELEGRAM_BOT_TOKEN', 'SOCIAL_TELEGRAM_CHAT_ID'],
    credentialHint: 'SOCIAL_TELEGRAM_BOT_TOKEN + SOCIAL_TELEGRAM_CHAT_ID',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_WHATSAPP_TOKEN', 'SOCIAL_WHATSAPP_PHONE_NUMBER_ID'],
    credentialHint: 'SOCIAL_WHATSAPP_TOKEN + SOCIAL_WHATSAPP_PHONE_NUMBER_ID (Cloud API)',
  },
  {
    id: 'twitch',
    label: 'Twitch',
    group: 'social',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_TWITCH_ACCESS_TOKEN', 'SOCIAL_WEBHOOK_TWITCH'],
    credentialHint: 'SOCIAL_TWITCH_ACCESS_TOKEN or SOCIAL_WEBHOOK_TWITCH',
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    group: 'social',
    preferredDelivery: 'api',
    credentialEnv: ['SOCIAL_BLUESKY_HANDLE', 'SOCIAL_BLUESKY_APP_PASSWORD'],
    credentialHint: 'SOCIAL_BLUESKY_HANDLE + SOCIAL_BLUESKY_APP_PASSWORD',
  },
  // —— Professional / networking ——
  {
    id: 'xing',
    label: 'Xing',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_XING', 'SOCIAL_XING_ACCESS_TOKEN'],
    credentialHint: 'SOCIAL_WEBHOOK_XING or SOCIAL_XING_ACCESS_TOKEN',
  },
  {
    id: 'viadeo',
    label: 'Viadeo',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_VIADEO'],
    credentialHint: 'SOCIAL_WEBHOOK_VIADEO',
  },
  {
    id: 'shapr',
    label: 'Shapr',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_SHAPR'],
    credentialHint: 'SOCIAL_WEBHOOK_SHAPR',
  },
  {
    id: 'lunchclub',
    label: 'Lunchclub',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_LUNCHCLUB'],
    credentialHint: 'SOCIAL_WEBHOOK_LUNCHCLUB',
  },
  {
    id: 'polywork',
    label: 'Polywork',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_POLYWORK'],
    credentialHint: 'SOCIAL_WEBHOOK_POLYWORK',
  },
  {
    id: 'wellfound',
    label: 'Wellfound (AngelList)',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_WELLFOUND'],
    credentialHint: 'SOCIAL_WEBHOOK_WELLFOUND',
  },
  {
    id: 'fishbowl',
    label: 'Fishbowl',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_FISHBOWL'],
    credentialHint: 'SOCIAL_WEBHOOK_FISHBOWL',
  },
  {
    id: 'blind',
    label: 'Blind',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_BLIND'],
    credentialHint: 'SOCIAL_WEBHOOK_BLIND',
  },
  {
    id: 'opportunity',
    label: 'Opportunity',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_OPPORTUNITY'],
    credentialHint: 'SOCIAL_WEBHOOK_OPPORTUNITY',
  },
  {
    id: 'meetup',
    label: 'Meetup',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_MEETUP', 'SOCIAL_MEETUP_ACCESS_TOKEN'],
    credentialHint: 'SOCIAL_WEBHOOK_MEETUP or SOCIAL_MEETUP_ACCESS_TOKEN',
  },
  {
    id: 'alignable',
    label: 'Alignable',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_ALIGNABLE'],
    credentialHint: 'SOCIAL_WEBHOOK_ALIGNABLE',
  },
  {
    id: 'bark',
    label: 'Bark',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_BARK'],
    credentialHint: 'SOCIAL_WEBHOOK_BARK',
  },
  {
    id: 'gust',
    label: 'Gust',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_GUST'],
    credentialHint: 'SOCIAL_WEBHOOK_GUST',
  },
  {
    id: 'researchgate',
    label: 'ResearchGate',
    group: 'networking',
    preferredDelivery: 'webhook',
    credentialEnv: ['SOCIAL_WEBHOOK_RESEARCHGATE'],
    credentialHint: 'SOCIAL_WEBHOOK_RESEARCHGATE',
  },
];

export const ALL_PLATFORMS: SocialPlatform[] = PLATFORM_CATALOG.map((p) => p.id);

export const PLATFORM_SET = new Set<SocialPlatform>(ALL_PLATFORMS);

export function getPlatformMeta(platform: SocialPlatform): PlatformMeta {
  const meta = PLATFORM_CATALOG.find((p) => p.id === platform);
  if (!meta) throw new Error(`Unknown platform: ${platform}`);
  return meta;
}

function cleanEnv(name: string): string {
  return (process.env[name] || '').trim();
}

/** True if this platform has enough env to attempt live delivery. */
export function isPlatformConfigured(platform: SocialPlatform): boolean {
  const meta = getPlatformMeta(platform);
  const webhook = cleanEnv(`SOCIAL_WEBHOOK_${platform.toUpperCase()}`);
  if (webhook) return true;
  if (cleanEnv('SOCIAL_DIRECT_WEBHOOK_URL')) return true;

  // X: bearer OR oauth1 pair
  if (platform === 'x') {
    if (cleanEnv('SOCIAL_X_BEARER_TOKEN')) return true;
    if (cleanEnv('SOCIAL_X_ACCESS_TOKEN') && cleanEnv('SOCIAL_X_ACCESS_SECRET')) return true;
  }

  // Platforms that need ALL listed credential env keys (excluding optional webhook keys already handled)
  const required = meta.credentialEnv.filter((k) => !k.startsWith('SOCIAL_WEBHOOK_'));
  if (required.length === 0) return false;
  return required.every((k) => Boolean(cleanEnv(k)));
}

export function listPlatformReadiness(): PlatformReadiness[] {
  return PLATFORM_CATALOG.map((meta) => {
    const configured = isPlatformConfigured(meta.id);
    const webhook = Boolean(cleanEnv(`SOCIAL_WEBHOOK_${meta.id.toUpperCase()}`));
    const delivery: DeliveryKind = configured
      ? webhook || cleanEnv('SOCIAL_DIRECT_WEBHOOK_URL')
        ? meta.preferredDelivery === 'api' && meta.credentialEnv.some((k) => !k.startsWith('SOCIAL_WEBHOOK_') && cleanEnv(k))
          ? 'api'
          : 'webhook'
        : meta.preferredDelivery
      : 'package';
    return {
      platform: meta.id,
      label: meta.label,
      group: meta.group,
      delivery: configured ? delivery : 'package',
      configured,
      credentialHint: meta.credentialHint,
    };
  });
}

export function countConfiguredPlatforms(): { configured: number; total: number } {
  const readiness = listPlatformReadiness();
  return {
    configured: readiness.filter((r) => r.configured).length,
    total: readiness.length,
  };
}

export function isSocialPlatform(value: string): value is SocialPlatform {
  return PLATFORM_SET.has(value as SocialPlatform);
}

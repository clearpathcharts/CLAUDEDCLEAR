import type { SocialPlatform } from '../types';
import type { PlatformAdapter } from './types';
import {
  alignableAdapter,
  barkAdapter,
  blindAdapter,
  blueskyAdapter,
  discordAdapter,
  facebookAdapter,
  fishbowlAdapter,
  gustAdapter,
  instagramAdapter,
  linkedinAdapter,
  lunchclubAdapter,
  meetupAdapter,
  opportunityAdapter,
  pinterestAdapter,
  polyworkAdapter,
  redditAdapter,
  researchgateAdapter,
  shaprAdapter,
  snapchatAdapter,
  telegramAdapter,
  threadsAdapter,
  tiktokAdapter,
  twitchAdapter,
  viadeoAdapter,
  wellfoundAdapter,
  whatsappAdapter,
  xAdapter,
  xingAdapter,
  youtubeAdapter,
} from './directApis';

const ADAPTERS: Record<SocialPlatform, PlatformAdapter> = {
  facebook: facebookAdapter,
  instagram: instagramAdapter,
  x: xAdapter,
  tiktok: tiktokAdapter,
  youtube: youtubeAdapter,
  linkedin: linkedinAdapter,
  reddit: redditAdapter,
  snapchat: snapchatAdapter,
  pinterest: pinterestAdapter,
  discord: discordAdapter,
  threads: threadsAdapter,
  telegram: telegramAdapter,
  whatsapp: whatsappAdapter,
  twitch: twitchAdapter,
  bluesky: blueskyAdapter,
  xing: xingAdapter,
  viadeo: viadeoAdapter,
  shapr: shaprAdapter,
  lunchclub: lunchclubAdapter,
  polywork: polyworkAdapter,
  wellfound: wellfoundAdapter,
  fishbowl: fishbowlAdapter,
  blind: blindAdapter,
  opportunity: opportunityAdapter,
  meetup: meetupAdapter,
  alignable: alignableAdapter,
  bark: barkAdapter,
  gust: gustAdapter,
  researchgate: researchgateAdapter,
};

export function getAdapter(platform: SocialPlatform): PlatformAdapter {
  const adapter = ADAPTERS[platform];
  if (!adapter) throw new Error(`No ClearPath adapter for platform: ${platform}`);
  return adapter;
}

export { composePostText } from './helpers';
export type { AdapterPublishResult, PlatformAdapter } from './types';

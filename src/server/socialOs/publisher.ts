import type { PublishMode, SocialOsConfig, SocialPost } from './types';
import { createBufferUpdate, isBufferConfigured, resolveBufferProfileId } from './bufferClient';

export function getSocialOsConfig(): SocialOsConfig {
  const dryRunEnv = (process.env.SOCIAL_OS_DRY_RUN || '').toLowerCase();
  const forcedDry = dryRunEnv === '1' || dryRunEnv === 'true' || dryRunEnv === 'yes';
  const bufferConfigured = isBufferConfigured();

  return {
    siteUrl: 'https://clearpathtrader.com',
    brandName: 'ClearPath Trader',
    defaultLinkUrl: 'https://clearpathtrader.com',
    utmCampaign: 'clearpath_social_os',
    dryRun: forcedDry || !bufferConfigured,
    bufferConfigured,
    schedulerIntervalMs: Number(process.env.SOCIAL_OS_TICK_MS) || 60_000,
  };
}

function composeText(post: SocialPost): string {
  const tags = (post.hashtags || []).map((h) => (h.startsWith('#') ? h : `#${h}`));
  const parts = [post.body];
  if (post.linkUrl && !post.body.includes(post.linkUrl)) {
    parts.push(post.linkUrl);
  }
  if (tags.length) parts.push(tags.join(' '));
  return parts.join('\n\n').trim();
}

function resolveMode(post: SocialPost, config: SocialOsConfig): PublishMode {
  if (config.dryRun) return 'dry_run';
  if (post.publishMode === 'dry_run') return 'dry_run';
  return config.bufferConfigured ? 'buffer' : 'dry_run';
}

export type PublishResult = {
  postId: string;
  mode: PublishMode;
  dryRun: boolean;
  bufferUpdateIds?: string[];
  message: string;
};

export async function publishPost(post: SocialPost): Promise<PublishResult> {
  const config = getSocialOsConfig();
  const mode = resolveMode(post, config);
  const text = composeText(post);

  if (mode === 'dry_run') {
    return {
      postId: post.id,
      mode,
      dryRun: true,
      message: `Dry run — would publish to ${post.platform}: ${text.slice(0, 140)}`,
    };
  }

  const profileId = await resolveBufferProfileId(post.platform, post.bufferProfileId);
  const result = await createBufferUpdate({
    profileId,
    text,
    mediaUrls: post.mediaUrls,
    linkUrl: post.linkUrl,
  });

  if (!result.success && result.updateIds.length === 0) {
    throw new Error(`Buffer did not accept update: ${JSON.stringify(result.raw).slice(0, 200)}`);
  }

  return {
    postId: post.id,
    mode: 'buffer',
    dryRun: false,
    bufferUpdateIds: result.updateIds,
    message: `Published to ${post.platform} via Buffer`,
  };
}

import { countConfiguredPlatforms, isPlatformConfigured, listPlatformReadiness } from './platforms';
import { composePostText, getAdapter } from './adapters';
import type { PublishMode, SocialOsConfig, SocialPost } from './types';

export function getSocialOsConfig(): SocialOsConfig {
  const dryRunEnv = (process.env.SOCIAL_OS_DRY_RUN || '').toLowerCase();
  const forcedDry = dryRunEnv === '1' || dryRunEnv === 'true' || dryRunEnv === 'yes';
  const counts = countConfiguredPlatforms();

  return {
    siteUrl: 'https://clearpathtrader.com',
    brandName: 'ClearPath Trader',
    defaultLinkUrl: 'https://clearpathtrader.com',
    utmCampaign: 'clearpath_social_os',
    dryRun: forcedDry,
    platformsConfigured: counts.configured,
    platformsTotal: counts.total,
    schedulerIntervalMs: Number(process.env.SOCIAL_OS_TICK_MS) || 60_000,
    middlemen: 'none',
  };
}

function resolveMode(post: SocialPost, config: SocialOsConfig): PublishMode {
  if (config.dryRun) return 'dry_run';
  if (post.publishMode === 'dry_run') return 'dry_run';
  if (post.publishMode === 'package') return 'package';
  // Direct when this platform has credentials; otherwise package under ClearPath.
  return isPlatformConfigured(post.platform) ? 'direct' : 'package';
}

export type PublishResult = {
  postId: string;
  platform: SocialPost['platform'];
  mode: PublishMode;
  dryRun: boolean;
  delivery?: 'api' | 'webhook' | 'package';
  platformPostId?: string;
  packagePath?: string;
  message: string;
};

export async function publishPost(post: SocialPost): Promise<PublishResult> {
  const config = getSocialOsConfig();
  const mode = resolveMode(post, config);
  const text = composePostText(post);

  if (mode === 'dry_run') {
    return {
      postId: post.id,
      platform: post.platform,
      mode: 'dry_run',
      dryRun: true,
      message: `Dry run — ClearPath would publish to ${post.platform}: ${text.slice(0, 140)}`,
    };
  }

  const adapter = getAdapter(post.platform);
  const result = await adapter.publish({ post, text });

  return {
    postId: post.id,
    platform: post.platform,
    mode: result.mode,
    dryRun: result.dryRun,
    delivery: result.delivery,
    platformPostId: result.platformPostId,
    packagePath: result.packagePath,
    message: result.message,
  };
}

export function defaultPublishMode(): PublishMode {
  const config = getSocialOsConfig();
  if (config.dryRun) return 'dry_run';
  return config.platformsConfigured > 0 ? 'direct' : 'package';
}

export { listPlatformReadiness };

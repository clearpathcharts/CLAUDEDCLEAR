/**
 * Direct platform API adapters — ClearPath → network.
 */
import { isPlatformConfigured } from '../platforms';
import type { SocialPlatform } from '../types';
import type { AdapterPublishInput, AdapterPublishResult, PlatformAdapter } from './types';
import { env, postForm, postJson, tryPlatformWebhook, writePublishPackage } from './helpers';

async function publishOrPackage(
  platform: SocialPlatform,
  input: AdapterPublishInput,
  attempt: () => Promise<AdapterPublishResult>
): Promise<AdapterPublishResult> {
  const webhook = await tryPlatformWebhook(platform, input.post, input.text);
  if (webhook) return webhook;

  if (!isPlatformConfigured(platform)) {
    return writePublishPackage(platform, input.post, input.text);
  }

  return attempt();
}

function adapter(
  platform: SocialPlatform,
  attempt: (input: AdapterPublishInput) => Promise<AdapterPublishResult>
): PlatformAdapter {
  return {
    platform,
    isConfigured: () => isPlatformConfigured(platform),
    publish: (input) => publishOrPackage(platform, input, () => attempt(input)),
  };
}

/** Meta Graph — Facebook Page feed. */
export const facebookAdapter = adapter('facebook', async ({ post, text }) => {
  const token = env('SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN');
  const pageId = env('SOCIAL_FACEBOOK_PAGE_ID');
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`;
  const res = await postForm(url, { message: text, access_token: token, link: post.linkUrl || '' });
  if (!res.ok) throw new Error(`Facebook Graph failed (${res.status}): ${res.text.slice(0, 240)}`);
  const id = String((res.json as { id?: string })?.id || '');
  return {
    platform: 'facebook',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: id || undefined,
    message: 'Published to Facebook Page via Meta Graph',
    raw: res.json,
  };
});

/** Instagram content publishing (image/carousel container → publish). Text-only uses package. */
export const instagramAdapter = adapter('instagram', async ({ post, text }) => {
  const token = env('SOCIAL_INSTAGRAM_ACCESS_TOKEN');
  const igId = env('SOCIAL_INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const imageUrl = post.mediaUrls?.[0];
  if (!imageUrl) {
    return writePublishPackage('instagram', post, text);
  }
  const createUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(igId)}/media`;
  const created = await postForm(createUrl, {
    image_url: imageUrl,
    caption: text,
    access_token: token,
  });
  if (!created.ok) {
    throw new Error(`Instagram media create failed (${created.status}): ${created.text.slice(0, 240)}`);
  }
  const creationId = String((created.json as { id?: string })?.id || '');
  if (!creationId) throw new Error('Instagram media create returned no id');
  const publishUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(igId)}/media_publish`;
  const published = await postForm(publishUrl, {
    creation_id: creationId,
    access_token: token,
  });
  if (!published.ok) {
    throw new Error(`Instagram publish failed (${published.status}): ${published.text.slice(0, 240)}`);
  }
  return {
    platform: 'instagram',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: String((published.json as { id?: string })?.id || creationId),
    message: 'Published to Instagram via Meta Graph',
    raw: published.json,
  };
});

/** X API v2 — tweets. Bearer for app-only won't post; use user access token as bearer when available. */
export const xAdapter = adapter('x', async ({ text }) => {
  const bearer = env('SOCIAL_X_BEARER_TOKEN') || env('SOCIAL_X_ACCESS_TOKEN');
  if (!bearer) throw new Error('SOCIAL_X_BEARER_TOKEN or SOCIAL_X_ACCESS_TOKEN required');
  const res = await postJson(
    'https://api.x.com/2/tweets',
    { text: text.slice(0, 280) },
    { Authorization: `Bearer ${bearer}` }
  );
  if (!res.ok) throw new Error(`X API failed (${res.status}): ${res.text.slice(0, 240)}`);
  const id = String((res.json as { data?: { id?: string } })?.data?.id || '');
  return {
    platform: 'x',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: id || undefined,
    message: 'Published to X via X API v2',
    raw: res.json,
  };
});

/** LinkedIn UGC / Posts API (REST). */
export const linkedinAdapter = adapter('linkedin', async ({ text }) => {
  const token = env('SOCIAL_LINKEDIN_ACCESS_TOKEN');
  const author = env('SOCIAL_LINKEDIN_AUTHOR_URN');
  const res = await postJson(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    },
    {
      Authorization: `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
    }
  );
  if (!res.ok) throw new Error(`LinkedIn API failed (${res.status}): ${res.text.slice(0, 240)}`);
  const id = String((res.json as { id?: string })?.id || '');
  return {
    platform: 'linkedin',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: id || undefined,
    message: 'Published to LinkedIn via LinkedIn API',
    raw: res.json,
  };
});

/** Threads API (Meta). */
export const threadsAdapter = adapter('threads', async ({ text }) => {
  const token = env('SOCIAL_THREADS_ACCESS_TOKEN');
  const userId = env('SOCIAL_THREADS_USER_ID');
  const create = await postForm(
    `https://graph.threads.net/v1.0/${encodeURIComponent(userId)}/threads`,
    { media_type: 'TEXT', text, access_token: token }
  );
  if (!create.ok) throw new Error(`Threads create failed (${create.status}): ${create.text.slice(0, 240)}`);
  const creationId = String((create.json as { id?: string })?.id || '');
  if (!creationId) throw new Error('Threads create returned no id');
  const publish = await postForm(
    `https://graph.threads.net/v1.0/${encodeURIComponent(userId)}/threads_publish`,
    { creation_id: creationId, access_token: token }
  );
  if (!publish.ok) throw new Error(`Threads publish failed (${publish.status}): ${publish.text.slice(0, 240)}`);
  return {
    platform: 'threads',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: String((publish.json as { id?: string })?.id || creationId),
    message: 'Published to Threads via Threads API',
    raw: publish.json,
  };
});

/** Telegram Bot API. */
export const telegramAdapter = adapter('telegram', async ({ text }) => {
  const token = env('SOCIAL_TELEGRAM_BOT_TOKEN');
  const chatId = env('SOCIAL_TELEGRAM_CHAT_ID');
  const res = await postJson(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
  });
  if (!res.ok) throw new Error(`Telegram API failed (${res.status}): ${res.text.slice(0, 240)}`);
  const msgId = String((res.json as { result?: { message_id?: number } })?.result?.message_id || '');
  return {
    platform: 'telegram',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: msgId || undefined,
    message: 'Published to Telegram via Bot API',
    raw: res.json,
  };
});

/** Discord incoming webhook (your channel — not a SaaS scheduler). */
export const discordAdapter = adapter('discord', async ({ text, post }) => {
  const url = env('SOCIAL_DISCORD_WEBHOOK_URL');
  const res = await postJson(url, {
    content: text.slice(0, 2000),
    username: 'ClearPath Trader',
    embeds: post.linkUrl
      ? [{ title: post.title || 'ClearPath Trader', url: post.linkUrl, description: text.slice(0, 400) }]
      : undefined,
  });
  if (!res.ok) throw new Error(`Discord webhook failed (${res.status}): ${res.text.slice(0, 240)}`);
  return {
    platform: 'discord',
    mode: 'direct',
    delivery: 'webhook',
    dryRun: false,
    platformPostId: `discord_${Date.now()}`,
    message: 'Published to Discord via channel webhook',
    raw: res.json,
  };
});

/** Bluesky AT Protocol — createSession + createRecord. */
export const blueskyAdapter = adapter('bluesky', async ({ text }) => {
  const handle = env('SOCIAL_BLUESKY_HANDLE');
  const password = env('SOCIAL_BLUESKY_APP_PASSWORD');
  const session = await postJson('https://bsky.social/xrpc/com.atproto.server.createSession', {
    identifier: handle,
    password,
  });
  if (!session.ok) throw new Error(`Bluesky session failed (${session.status}): ${session.text.slice(0, 240)}`);
  const accessJwt = String((session.json as { accessJwt?: string })?.accessJwt || '');
  const did = String((session.json as { did?: string })?.did || '');
  if (!accessJwt || !did) throw new Error('Bluesky session missing accessJwt/did');

  const record = await postJson(
    'https://bsky.social/xrpc/com.atproto.repo.createRecord',
    {
      repo: did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text: text.slice(0, 300),
        createdAt: new Date().toISOString(),
      },
    },
    { Authorization: `Bearer ${accessJwt}` }
  );
  if (!record.ok) throw new Error(`Bluesky post failed (${record.status}): ${record.text.slice(0, 240)}`);
  const uri = String((record.json as { uri?: string })?.uri || '');
  return {
    platform: 'bluesky',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: uri || undefined,
    message: 'Published to Bluesky via AT Protocol',
    raw: record.json,
  };
});

/** Reddit OAuth password grant + submit. */
export const redditAdapter = adapter('reddit', async ({ post, text }) => {
  const clientId = env('SOCIAL_REDDIT_CLIENT_ID');
  const clientSecret = env('SOCIAL_REDDIT_CLIENT_SECRET');
  const username = env('SOCIAL_REDDIT_USERNAME');
  const password = env('SOCIAL_REDDIT_PASSWORD');
  const subreddit = env('SOCIAL_REDDIT_SUBREDDIT') || 'ClearPathTrader';
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await postForm(
    'https://www.reddit.com/api/v1/access_token',
    {
      grant_type: 'password',
      username,
      password,
    },
    {
      Authorization: `Basic ${basic}`,
      'User-Agent': 'ClearPathSocialOS/1.0 by ClearPathTrader',
    }
  );
  if (!tokenRes.ok) throw new Error(`Reddit auth failed (${tokenRes.status}): ${tokenRes.text.slice(0, 240)}`);
  const accessToken = String((tokenRes.json as { access_token?: string })?.access_token || '');
  if (!accessToken) throw new Error('Reddit auth returned no access_token');

  const title = (post.title || text.slice(0, 100)).slice(0, 300);
  const submit = await postForm(
    'https://oauth.reddit.com/api/submit',
    {
      kind: post.linkUrl ? 'link' : 'self',
      sr: subreddit,
      title,
      text: post.linkUrl ? '' : text,
      url: post.linkUrl || '',
      api_type: 'json',
    },
    {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'ClearPathSocialOS/1.0 by ClearPathTrader',
    }
  );
  if (!submit.ok) throw new Error(`Reddit submit failed (${submit.status}): ${submit.text.slice(0, 240)}`);
  return {
    platform: 'reddit',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: `reddit_${subreddit}_${Date.now()}`,
    message: `Published to Reddit r/${subreddit}`,
    raw: submit.json,
  };
});

/** WhatsApp Cloud API text message. */
export const whatsappAdapter = adapter('whatsapp', async ({ post, text }) => {
  const token = env('SOCIAL_WHATSAPP_TOKEN');
  const phoneId = env('SOCIAL_WHATSAPP_PHONE_NUMBER_ID');
  const to = env('SOCIAL_WHATSAPP_TO');
  if (!to) return writePublishPackage('whatsapp', post, text);
  const res = await postJson(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneId)}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text.slice(0, 4096) },
    },
    { Authorization: `Bearer ${token}` }
  );
  if (!res.ok) throw new Error(`WhatsApp Cloud API failed (${res.status}): ${res.text.slice(0, 240)}`);
  const id = String((res.json as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id || '');
  return {
    platform: 'whatsapp',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: id || undefined,
    message: 'Sent via WhatsApp Cloud API',
    raw: res.json,
  };
});

/** Pinterest pins (image required). */
export const pinterestAdapter = adapter('pinterest', async ({ post, text }) => {
  const token = env('SOCIAL_PINTEREST_ACCESS_TOKEN');
  const boardId = env('SOCIAL_PINTEREST_BOARD_ID');
  const imageUrl = post.mediaUrls?.[0];
  if (!imageUrl) return writePublishPackage('pinterest', post, text);
  const res = await postJson(
    'https://api.pinterest.com/v5/pins',
    {
      board_id: boardId,
      title: (post.title || 'ClearPath Trader').slice(0, 100),
      description: text.slice(0, 800),
      link: post.linkUrl || 'https://clearpathtrader.com',
      media_source: { source_type: 'image_url', url: imageUrl },
    },
    { Authorization: `Bearer ${token}` }
  );
  if (!res.ok) throw new Error(`Pinterest API failed (${res.status}): ${res.text.slice(0, 240)}`);
  return {
    platform: 'pinterest',
    mode: 'direct',
    delivery: 'api',
    dryRun: false,
    platformPostId: String((res.json as { id?: string })?.id || ''),
    message: 'Published to Pinterest',
    raw: res.json,
  };
});

/** YouTube: description/community-style package unless upload credentials + media exist. */
export const youtubeAdapter = adapter('youtube', async ({ post, text }) => {
  // Full resumable upload needs multipart + video file; keep direct webhook path preferred.
  const token = env('SOCIAL_YOUTUBE_ACCESS_TOKEN');
  if (!post.mediaUrls?.[0]) {
    return writePublishPackage('youtube', post, text);
  }
  // Without a local video blob we cannot finish resumable upload — package for ClearPath pipeline.
  void token;
  return writePublishPackage('youtube', post, text);
});

/** TikTok Content Posting — inbox/direct post requires video upload session; package until media pipeline wired. */
export const tiktokAdapter = adapter('tiktok', async ({ post, text }) => {
  const token = env('SOCIAL_TIKTOK_ACCESS_TOKEN');
  void token;
  if (!post.mediaUrls?.[0]) return writePublishPackage('tiktok', post, text);
  return writePublishPackage('tiktok', post, text);
});

function webhookOrPackageAdapter(platform: SocialPlatform): PlatformAdapter {
  return {
    platform,
    isConfigured: () => isPlatformConfigured(platform),
    async publish(input) {
      const webhook = await tryPlatformWebhook(platform, input.post, input.text);
      if (webhook) return webhook;
      // Token-only platforms without a public post endpoint still package under ClearPath.
      if (isPlatformConfigured(platform) && env(`SOCIAL_${platform.toUpperCase()}_ACCESS_TOKEN`)) {
        // Attempt generic bearer POST if SOCIAL_<P>_POST_URL is set (founder-owned endpoint).
        const postUrl = env(`SOCIAL_${platform.toUpperCase()}_POST_URL`);
        if (postUrl) {
          const res = await postJson(
            postUrl,
            { text: input.text, title: input.post.title, linkUrl: input.post.linkUrl, mediaUrls: input.post.mediaUrls },
            { Authorization: `Bearer ${env(`SOCIAL_${platform.toUpperCase()}_ACCESS_TOKEN`)}` }
          );
          if (!res.ok) throw new Error(`${platform} POST_URL failed (${res.status}): ${res.text.slice(0, 240)}`);
          return {
            platform,
            mode: 'direct',
            delivery: 'api',
            dryRun: false,
            platformPostId: String((res.json as { id?: string })?.id || `${platform}_${Date.now()}`),
            message: `Published to ${platform} via ClearPath direct POST_URL`,
            raw: res.json,
          };
        }
      }
      return writePublishPackage(platform, input.post, input.text);
    },
  };
}

export const snapchatAdapter = webhookOrPackageAdapter('snapchat');
export const twitchAdapter = webhookOrPackageAdapter('twitch');
export const xingAdapter = webhookOrPackageAdapter('xing');
export const viadeoAdapter = webhookOrPackageAdapter('viadeo');
export const shaprAdapter = webhookOrPackageAdapter('shapr');
export const lunchclubAdapter = webhookOrPackageAdapter('lunchclub');
export const polyworkAdapter = webhookOrPackageAdapter('polywork');
export const wellfoundAdapter = webhookOrPackageAdapter('wellfound');
export const fishbowlAdapter = webhookOrPackageAdapter('fishbowl');
export const blindAdapter = webhookOrPackageAdapter('blind');
export const opportunityAdapter = webhookOrPackageAdapter('opportunity');
export const meetupAdapter = webhookOrPackageAdapter('meetup');
export const alignableAdapter = webhookOrPackageAdapter('alignable');
export const barkAdapter = webhookOrPackageAdapter('bark');
export const gustAdapter = webhookOrPackageAdapter('gust');
export const researchgateAdapter = webhookOrPackageAdapter('researchgate');

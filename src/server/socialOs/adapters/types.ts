import type { DeliveryKind, PublishMode, SocialPlatform, SocialPost } from '../types';

export type AdapterPublishInput = {
  post: SocialPost;
  text: string;
};

export type AdapterPublishResult = {
  platform: SocialPlatform;
  mode: PublishMode;
  delivery: DeliveryKind;
  dryRun: boolean;
  platformPostId?: string;
  packagePath?: string;
  message: string;
  raw?: unknown;
};

export type PlatformAdapter = {
  platform: SocialPlatform;
  isConfigured(): boolean;
  publish(input: AdapterPublishInput): Promise<AdapterPublishResult>;
};

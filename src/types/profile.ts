export interface SocialLinks {
  youtube: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  twitter: string;
  discord: string;
  telegram: string;
  linkedin: string;
  twitch: string;
  pinterest: string;
  website: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl: string;
  bio: string;

  socials: SocialLinks;
}

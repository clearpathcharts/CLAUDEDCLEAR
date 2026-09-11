/** Pass-through broker OAuth — ClearPath is the interface; the licensed broker effects trades. */

export const BROKER_IDS = ['alpaca'] as const;
export type BrokerId = (typeof BROKER_IDS)[number];

export type BrokerEnvironment = 'paper' | 'live';

export type BrokerConnectionRecord = {
  uid: string;
  brokerId: BrokerId;
  environment: BrokerEnvironment;
  /** Encrypted at rest — never returned to clients. */
  accessTokenEnc: string;
  refreshTokenEnc: string;
  tokenExpiresAt: string | null;
  accountId: string | null;
  scopes: string | null;
  connectedAt: string;
  updatedAt: string;
};

export type BrokerPublicStatus = {
  brokerId: BrokerId;
  label: string;
  configured: boolean;
  connected: boolean;
  environment: BrokerEnvironment | null;
  accountId: string | null;
  connectedAt: string | null;
  mode: 'live' | 'stub';
};

export type AlpacaOAuthPendingState = {
  state: string;
  uid: string;
  returnTo: string;
  createdAt: number;
};

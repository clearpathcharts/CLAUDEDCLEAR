import type { BrokerId, BrokerPublicStatus } from './types';
import { alpacaConfiguredSummary } from './alpacaOAuth';
import { loadBrokerConnection } from './brokerConnectionStore';
import { isBrokerPassThroughEnabled } from '../secrets';

export const BROKER_LABELS: Record<BrokerId, string> = {
  alpaca: 'Alpaca',
};

export async function brokerPublicStatus(uid: string | null): Promise<Record<BrokerId, BrokerPublicStatus>> {
  const alpacaCfg = alpacaConfiguredSummary();
  const connectionsEnabled = isBrokerPassThroughEnabled();
  let connected = false;
  let environment: BrokerPublicStatus['environment'] = null;
  let accountId: string | null = null;
  let connectedAt: string | null = null;

  if (connectionsEnabled && uid) {
    const row = await loadBrokerConnection(uid, 'alpaca');
    if (row?.accessTokenEnc) {
      connected = true;
      environment = row.environment;
      accountId = row.accountId;
      connectedAt = row.connectedAt;
    }
  }

  return {
    alpaca: {
      brokerId: 'alpaca',
      label: BROKER_LABELS.alpaca,
      configured: connectionsEnabled && alpacaCfg.configured && alpacaCfg.encryptionConfigured,
      connected,
      environment,
      accountId,
      connectedAt,
      mode: alpacaCfg.mode,
      connectionsEnabled,
    },
  };
}

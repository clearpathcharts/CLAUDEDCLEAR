import { useCallback, useEffect, useState } from 'react';
import {
  fetchAlpacaAccount,
  fetchBrokerStatus,
  type AlpacaAccountSummary,
  type BrokerPublicStatus,
} from '../api/brokerConnect';

export type BrokerConnectionState = {
  loading: boolean;
  model: string;
  note: string;
  alpaca: BrokerPublicStatus | null;
  account: AlpacaAccountSummary | null;
  refresh: () => Promise<void>;
};

export function useBrokerConnection(pollAccount = false): BrokerConnectionState {
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState('');
  const [note, setNote] = useState('');
  const [alpaca, setAlpaca] = useState<BrokerPublicStatus | null>(null);
  const [account, setAccount] = useState<AlpacaAccountSummary | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchBrokerStatus();
      setModel(status.model || '');
      setNote(status.note || '');
      const row = status.brokers?.alpaca ?? null;
      setAlpaca(row);
      if (row?.connected && pollAccount) {
        try {
          const acct = await fetchAlpacaAccount();
          setAccount(acct.account);
        } catch {
          setAccount(null);
        }
      } else {
        setAccount(null);
      }
    } catch {
      setAlpaca(null);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [pollAccount]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loading, model, note, alpaca, account, refresh };
}

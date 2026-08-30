import axios from 'axios';
import {
  getTwelveDataApiKey,
  getFredApiKey,
  getNewsDataApiKey,
  getFinnhubApiKey,
} from './secrets';
import {
  getAdminFirestore,
  getFirebaseAdminStatus,
  probeAdminFirestore,
} from './firebaseAdmin';
import { getPrivateStorageMeta } from './privateAuthService';

// ============================================
// TYPES
// ============================================

type HealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'NOT_CONFIGURED';

interface HealthResult {
  name: string;
  tier: string;
  status: HealthStatus;
  responseTime: number;
  message: string;
}

// In-memory cache of the latest status checks
let latestStatusCache: HealthResult[] = [];
let lastCheckedTimestamp = 0;
const COOLDOWN_MS = 15000;

// ============================================
// HELPERS
// ============================================

/**
 * Times an async probe and normalizes errors into a HealthResult.
 * Every probe function passed in must actually throw on failure —
 * there is no separate "fallback" status here. A service is either
 * ONLINE (responded successfully), DEGRADED (responded, but with an
 * error payload or unexpected shape), OFFLINE (request failed/timed
 * out), or NOT_CONFIGURED (no credentials present, so we never tried).
 */
async function timedProbe(
  name: string,
  tier: string,
  probe: () => Promise<{ degraded?: boolean; detail?: string }>
): Promise<HealthResult> {
  const start = Date.now();
  try {
    const result = await probe();
    const responseTime = Date.now() - start;
    if (result.degraded) {
      return {
        name,
        tier,
        status: 'DEGRADED',
        responseTime,
        message: result.detail || 'Service responded with an unexpected payload.'
      };
    }
    return {
      name,
      tier,
      status: 'ONLINE',
      responseTime,
      message: result.detail || 'Probe succeeded.'
    };
  } catch (err: any) {
    const responseTime = Date.now() - start;
    const isTimeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '');
    const statusCode = err.response?.status;
    return {
      name,
      tier,
      status: 'OFFLINE',
      responseTime,
      message: isTimeout
        ? `Request timed out after ${responseTime}ms.`
        : statusCode
        ? `Request failed with HTTP ${statusCode}: ${err.response?.data?.message || err.message}`
        : `Request failed: ${err.message || 'Unknown error'}`
    };
  }
}

function notConfigured(name: string, tier: string, envHint: string): HealthResult {
  return {
    name,
    tier,
    status: 'NOT_CONFIGURED',
    responseTime: 0,
    message: `No credentials found. Set ${envHint} to enable monitoring.`
  };
}

// ============================================
// MAIN ENTRY POINT
// ============================================

export async function getLiveApiHealth(): Promise<HealthResult[]> {
  if (latestStatusCache.length > 0 && Date.now() - lastCheckedTimestamp < COOLDOWN_MS) {
    return latestStatusCache;
  }

  const checks: Promise<HealthResult>[] = [];

  // ---------- Market Data ----------

  const twelveDataKey = getTwelveDataApiKey();
  checks.push(
    twelveDataKey
      ? timedProbe('TwelveData', 'Market Data', async () => {
          const { data } = await axios.get('https://api.twelvedata.com/price', {
            params: { symbol: 'AAPL' },
            headers: { Authorization: `apikey ${twelveDataKey}` },
            timeout: 2500
          });
          if (data?.status === 'error' || data?.code) {
            return { degraded: true, detail: data.message || 'TwelveData returned an error payload.' };
          }
          if (!data?.price) {
            return { degraded: true, detail: 'TwelveData response missing expected price field.' };
          }
          return { detail: `AAPL last price: ${data.price}` };
        })
      : Promise.resolve(notConfigured('TwelveData', 'Market Data', 'TWELVEDATA_API_KEY'))
  );

  const finnhubKey = getFinnhubApiKey();
  checks.push(
    finnhubKey
      ? timedProbe('Finnhub', 'Market Data', async () => {
          const { data } = await axios.get('https://finnhub.io/api/v1/quote', {
            params: { symbol: 'AAPL', token: finnhubKey },
            timeout: 2500
          });
          if (typeof data?.c !== 'number' || data.c === 0) {
            return { degraded: true, detail: 'Finnhub response missing a valid current price.' };
          }
          return { detail: `AAPL last price: ${data.c}` };
        })
      : Promise.resolve(notConfigured('Finnhub', 'Market Data', 'FINNHUB_API_KEY'))
  );

  const polygonKey = process.env.POLYGON_API_KEY || process.env.POLYGON_KEY || '';
  checks.push(
    polygonKey
      ? timedProbe('Polygon', 'Market Data', async () => {
          const { data } = await axios.get(
            'https://api.polygon.io/v2/aggs/ticker/AAPL/prev',
            { params: { apiKey: polygonKey }, timeout: 2500 }
          );
          if (data?.status === 'ERROR' || data?.status === 'NOT_AUTHORIZED') {
            return { degraded: true, detail: data.error || 'Polygon rejected the request.' };
          }
          return { detail: `Status: ${data?.status || 'unknown'}` };
        })
      : Promise.resolve(notConfigured('Polygon', 'Market Data', 'POLYGON_API_KEY'))
  );

  const alphaVantageKey =
    process.env.ALPHAVANTAGE_API_KEY || process.env.ALPHAVANTAGE_KEY || '';
  checks.push(
    alphaVantageKey
      ? timedProbe('Alpha Vantage', 'Market Data', async () => {
          const { data } = await axios.get('https://www.alphavantage.co/query', {
            params: { function: 'GLOBAL_QUOTE', symbol: 'AAPL', apikey: alphaVantageKey },
            timeout: 2500
          });
          if (data?.Note || data?.Information) {
            return { degraded: true, detail: data.Note || data.Information };
          }
          if (!data?.['Global Quote'] || !data['Global Quote']['05. price']) {
            return { degraded: true, detail: 'Alpha Vantage response missing expected quote data.' };
          }
          return { detail: `AAPL last price: ${data['Global Quote']['05. price']}` };
        })
      : Promise.resolve(notConfigured('Alpha Vantage', 'Market Data', 'ALPHAVANTAGE_API_KEY'))
  );

  // ---------- Economic Data ----------

  const fredKey = getFredApiKey();
  checks.push(
    fredKey
      ? timedProbe('FRED', 'Economic Data', async () => {
          const { data } = await axios.get('https://api.stlouisfed.org/fred/series', {
            params: { series_id: 'GNPCA', api_key: fredKey, file_type: 'json' },
            timeout: 2500
          });
          if (!data?.seriess) {
            return { degraded: true, detail: 'FRED response missing expected series data.' };
          }
          return { detail: 'Series lookup succeeded.' };
        })
      : Promise.resolve(notConfigured('FRED', 'Economic Data', 'FRED_API_KEY'))
  );

  // ---------- News ----------

  const newsDataKey = getNewsDataApiKey();
  checks.push(
    newsDataKey
      ? timedProbe('NewsData', 'News', async () => {
          const { data } = await axios.get('https://newsdata.io/api/1/news', {
            params: { apikey: newsDataKey, q: 'finance', language: 'en' },
            timeout: 2500
          });
          if (data?.status !== 'success') {
            return { degraded: true, detail: data?.results?.message || 'NewsData returned a non-success status.' };
          }
          return { detail: `${data.results?.length ?? 0} articles returned.` };
        })
      : Promise.resolve(notConfigured('NewsData', 'News', 'NEWSDATA_API_KEY'))
  );

  const benzingaKey = process.env.BENZINGA_API_KEY || '';
  checks.push(
    benzingaKey
      ? timedProbe('Benzinga', 'News', async () => {
          const { data } = await axios.get('https://api.benzinga.com/api/v2/news', {
            params: { token: benzingaKey, pagesize: 1 },
            timeout: 2500
          });
          if (!Array.isArray(data)) {
            return { degraded: true, detail: 'Benzinga response was not in the expected array format.' };
          }
          return { detail: `Endpoint reachable, ${data.length} item(s) returned.` };
        })
      : Promise.resolve(notConfigured('Benzinga', 'News', 'BENZINGA_API_KEY'))
  );

  // MarketWatch + Reuters homepage probes removed permanently (always 401 / not used).

  // ---------- Firebase / private accounts ----------
  // IMPORTANT: probe with Admin SDK (server credentials), NOT the browser
  // client SDK. Client rules reject unauthenticated reads of api_health_logs
  // and were falsely painting Firestore / Auth / Storage as OFFLINE while
  // Private Login (Admin + Stripe durable store) was healthy.

  checks.push(
    timedProbe('Firestore', 'Database', async () => {
      const ok = await probeAdminFirestore();
      const status = getFirebaseAdminStatus();
      if (!ok) {
        throw new Error(
          status.reason ||
            'Firestore Admin probe failed (missing ADC / FIREBASE_SERVICE_ACCOUNT or IAM).'
        );
      }
      return {
        detail: `Admin Firestore OK (mode=${status.mode}${status.projectId ? `, project=${status.projectId}` : ''}).`,
      };
    })
  );

  checks.push(
    (async (): Promise<HealthResult> => {
      const start = Date.now();
      const admin = getFirebaseAdminStatus();
      const durable = admin.firestore === true;
      return {
        name: 'Firebase Auth',
        tier: 'Authentication',
        status: durable ? 'ONLINE' : admin.configured ? 'DEGRADED' : 'NOT_CONFIGURED',
        responseTime: Date.now() - start,
        message: durable
          ? 'Admin credentials present — Auth Admin SDK available (same project as Firestore).'
          : admin.reason ||
            'Firebase Admin offline. Private Login may still work via Stripe durable store.',
      };
    })()
  );

  checks.push(
    (async (): Promise<HealthResult> => {
      const start = Date.now();
      const admin = getFirebaseAdminStatus();
      const durable = admin.firestore === true;
      return {
        name: 'Firebase Storage',
        tier: 'Storage',
        status: durable ? 'ONLINE' : admin.configured ? 'DEGRADED' : 'NOT_CONFIGURED',
        responseTime: Date.now() - start,
        message: durable
          ? 'Admin credentials present — Storage Admin available when used (same project as Firestore).'
          : admin.reason ||
            'Firebase Admin offline. Storage client features may be limited; private accounts use Admin/Stripe.',
      };
    })()
  );

  checks.push(
    (async (): Promise<HealthResult> => {
      const start = Date.now();
      const meta = getPrivateStorageMeta();
      const responseTime = Date.now() - start;
      if (meta.productionHardFail) {
        return {
          name: 'Private Login Accounts',
          tier: 'Authentication',
          status: 'OFFLINE',
          responseTime,
          message:
            meta.persistenceWarning ||
            'PRODUCTION BLOCKED: no durable store (Firestore Admin + Stripe unavailable).',
        };
      }
      if (meta.durable && meta.writesAllowed) {
        return {
          name: 'Private Login Accounts',
          tier: 'Authentication',
          status: 'ONLINE',
          responseTime,
          message: `Durable store online (${meta.privateStorage}${meta.stripeDurable ? '+stripe' : ''}). Member logins survive Cloud Run redeploys.`,
        };
      }
      return {
        name: 'Private Login Accounts',
        tier: 'Authentication',
        status: 'DEGRADED',
        responseTime,
        message: meta.persistenceWarning || `storage=${meta.privateStorage}`,
      };
    })()
  );

  // ---------- Calendar Integrations ----------
  // None of these are wired up to real OAuth yet (see server.ts auth routes).
  // Reporting them as NOT_CONFIGURED is the honest status until real
  // provider connections exist to probe.

  for (const name of ['Google Calendar', 'Apple Calendar', 'Outlook']) {
    checks.push(
      Promise.resolve<HealthResult>({
        name,
        tier: 'Calendar',
        status: 'NOT_CONFIGURED',
        responseTime: 0,
        message: 'Calendar OAuth integration not yet implemented.'
      })
    );
  }

  // ---------- Email / SMS / Payments ----------
  // Real auth-check calls against each provider's own API, not just an
  // "env var exists" check. Each uses the lightest-weight authenticated
  // endpoint available so this is safe to call on a 15s cooldown.

  const sendgridKey = process.env.SENDGRID_API_KEY || '';
  checks.push(
    sendgridKey
      ? timedProbe('SendGrid', 'Email', async () => {
          await axios.get('https://api.sendgrid.com/v3/user/account', {
            headers: { Authorization: `Bearer ${sendgridKey}` },
            timeout: 2500
          });
          return { detail: 'Authenticated account lookup succeeded.' };
        })
      : Promise.resolve(notConfigured('SendGrid', 'Email', 'SENDGRID_API_KEY'))
  );

  const twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
  const twilioToken = process.env.TWILIO_AUTH_TOKEN || '';
  checks.push(
    twilioSid && twilioToken
      ? timedProbe('Twilio', 'SMS', async () => {
          await axios.get(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`,
            {
              auth: { username: twilioSid, password: twilioToken },
              timeout: 2500
            }
          );
          return { detail: 'Authenticated account lookup succeeded.' };
        })
      : Promise.resolve(
          notConfigured('Twilio', 'SMS', 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN')
        )
  );

  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  checks.push(
    stripeKey
      ? timedProbe('Stripe', 'Payments', async () => {
          await axios.get('https://api.stripe.com/v1/balance', {
            headers: { Authorization: `Bearer ${stripeKey}` },
            timeout: 2500
          });
          return { detail: 'Authenticated balance lookup succeeded.' };
        })
      : Promise.resolve(notConfigured('Stripe', 'Payments', 'STRIPE_SECRET_KEY'))
  );

  const orderedResults = await Promise.all(checks);

  latestStatusCache = orderedResults;
  lastCheckedTimestamp = Date.now();

  // Commit metrics telemetry via Admin SDK (bypasses client security rules).
  try {
    const db = getAdminFirestore();
    if (db) {
      const batch = db.batch();
      const checkedAt = new Date().toISOString();
      for (const result of orderedResults) {
        const ref = db.collection('api_health_logs').doc();
        batch.set(ref, {
          api_name: result.name,
          status: result.status,
          response_time: result.responseTime,
          message: result.message || '',
          checked_at: checkedAt,
        });
      }
      await batch.commit();
    }
  } catch (firestoreLogErr) {
    console.warn('[apiHealthService] Failed logging telemetry to Firestore:', firestoreLogErr);
  }

  return orderedResults;
}

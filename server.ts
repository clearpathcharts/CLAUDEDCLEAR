import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { setupWebSockets } from './websockets';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import net from 'node:net';
import crypto from 'node:crypto';
import dnsPromises from 'node:dns/promises';
import RSSParser from 'rss-parser';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import { db, schema } from "./src/db";
import { eq, and } from "drizzle-orm";
import { getMarketQuote, getMarketQuotes, getMarketCandles, twelvedataHealth, twelvedataEvents, logHealthEvent } from "./src/server/marketDataGateway";
import { getLiveApiHealth } from "./src/server/apiHealthService";
import { IndicatorRegistry } from "./src/core/registry/IndicatorRegistry";
import { FundamentalRegistry } from "./src/core/registry/FundamentalRegistry";
import { InstitutionalRegistry } from "./src/core/registry/InstitutionalRegistry";
import { RealityValidator } from "./src/core/audit/RealityValidator";
import riverCompilerManifest from "./src/river/compiler/manifest.json";
import { IndicatorEngine } from "./src/core/engine/IndicatorEngine";
import { TruthEnforcementEngine } from "./src/truth/TruthEnforcementEngine";
import { writeTruthAuditRecoveryFile } from "./src/truth/serverAuditBackup";
import { ComplianceAuditEngine } from "./src/truth/ComplianceAuditEngine";
import { 
  SEMANTIC_RECORDS, 
  GENERAL_FAQS, 
  semanticLinkContent, 
  enrichHtmlWithMetadata, 
  ensureSeoAssetsExist 
} from './src/server/semanticDatabase';
import { GUIDE_RECORDS } from './src/server/contentData';
import { renderStaticContentPage, renderStaticHomeForBots, renderStaticAboutForBots, isSearchEngineBot, isUnknownRegionPath, renderUnknownRegionNotFound } from './src/server/contentPages';
import { firebaseWebClientConfigured } from './src/server/firebaseClientConfig';
import {
  resolveIndexNowKey,
  submitIndexNow,
  indexNowKeyLocation,
} from './src/server/indexNow';
import { REGIONAL_MARKETS, regionalHubEntries, regionalIndexNowUrls } from './src/server/regionalSeo';
import {
  grantContractorBadgeByEmail,
  seedIndependentContractorBadges,
  applyPendingContractorBadges,
  hydratePendingGrantsFromDurableStore,
  IC_BADGE_SEED_EMAILS,
} from './src/server/contractorBadges';
import { ROBOTS_TXT } from './src/server/robotsTxt';
import { buildAppUpdateManifest } from './src/server/appUpdate';
import {
  stockEntries,
  cryptoEntries,
  forexEntries,
  commodityEntries,
  economyEntries,
  indicatorEntries,
  educationEntries,
  uiProfileEntries,
  encyclopediaHubEntries,
  catalogCounts,
  sitemapLastmod,
  lookupStock,
} from './src/server/crawlCatalog';
import { registerWaitlist, registerIdentity, RegistrationError } from './src/server/registrationService';
import { getAuth } from 'firebase-admin/auth';
import {
  ensureAdminApp,
  getAdminFirestore,
  getFirebaseAdminStatus,
  probeAdminFirestore,
} from './src/server/firebaseAdmin';
import { FOUNDER_EMAIL, isFounderEmail } from './src/lib/founder';
import { resolveTwelveDataInterval } from './src/services/marketData';
import {
  hydrateProfilesFromDurableStore,
  findProfileByUsername,
  readProfile,
  refreshProfileFromDurable,
  toPublicMemberProfile,
  usernameTakenByOther,
  writeProfile,
} from './src/server/profileStore';
import {
  isReservedProfileUsername,
  isValidProfileUsername,
  normalizeProfileUsername,
} from './src/lib/profileUsername';
import { consumePasswordResetToken, mintPasswordResetToken } from './src/server/passwordResetStore';
import {
  createMembershipCheckoutSession,
  getMembershipStatus,
  getStripeConfigReport,
  handleStripeEvent,
  isBillingInterval,
  isMembershipTier,
  stripeConfigured,
  StripeServiceError,
  verifyStripeWebhook,
} from './src/server/stripeService';
import { tierRankOf, entitlementsFor } from './src/lib/entitlements';
import { CANONICAL_PLANS, PLAN_CATALOG, FEATURE_ACCURACY, jsonSafeLimits } from './src/lib/planCatalog';
import { PAYMENTS_DISABLED_MESSAGE, PAYMENTS_ENABLED } from './src/lib/paymentsEnabled';
import { CPT_SITE_GUIDE, offlineSiteGuideAnswer } from './src/server/cptSiteGuide';
import { CPT_COMPANION_GUIDE } from './src/server/buddyCompanionGuide';
import {
  formatAffectForPrompt,
  formatBondForPrompt,
  normalizeBondProfile,
} from './src/server/buddyAffect';
import {
  classifyBuddyAffect,
  extractBuddyGrowth,
  mergeBondProfile,
  offlineCompanionAnswer,
} from './src/server/buddyMentorService';
import { fallbackConversationBullet, normalizeConversationBullets } from './src/lib/buddyMemory';
import { BUDDY_LIVE_TOOLS_PROMPT, runBuddyWithLiveTools } from './src/server/buddyLiveTools';
import {
  fetchEpisodesFromFeed,
  podcastIndexConfigured,
  searchPodcastsByTerm,
} from './src/server/podcastService';
import {
  forwardIntelligenceToMake,
  getIntelligenceBriefing,
  ingestIntelligenceWebhook,
  listIntelligenceBriefings,
  verifyIntelligenceWebhookSecret,
} from './src/server/intelligenceWebhookService';
import {
  getLatestTimeframeVerifyReport,
  runTimeframeAccuracyVerify,
  startTimeframeAccuracyScheduler,
} from './src/server/timeframeAccuracyVerifier';
import {
  getLatestSiteDoctorReport,
  runSiteDoctorSweep,
  startSiteDoctorScheduler,
} from './src/server/siteDoctor';
import {
  getLatestDailyOpsReport,
  runDailyOpsSweep,
  completeDailyOpsItem,
  recordInvestorAction,
  pinInvestorResearch,
  startDailyOpsScheduler,
} from './src/server/dailyOpsService';
import {
  fireDueSubscriptions,
  getChartPulseDeliveryStatus,
  isPulseInterval,
  listSubscriptionsForOwner,
  removeSubscription,
  startChartPulseScheduler,
  upsertSubscription,
  type ChartPulseChannel,
} from './src/server/chartPulseService';
import { getMagazineRack, translateMagazineStory } from './src/server/magazineRack';
import {
  moderateBodyFields,
  runContentModerationSelfTest,
} from './src/server/contentModeration';
import {
  fetchPageFingerprint,
  runTruthSearch,
  scoreMentorAnswer,
} from './src/server/literacyService';
import {
  PrivateAuthError,
  assertSessionIdentityAllowed,
  buildClientSessionUser,
  buildIdentityConfirmUrl,
  confirmIdentityByToken,
  declineIdentity,
  getPrivateStorageMeta,
  hasDurablePrivateStore,
  listPrivateMembersSafe,
  lookupPrivateUser,
  findPrivateUserByEmail,
  loginPrivateUser,
  migratePrivateAccountsToDurableStore,
  registerPrivateUser,
  remintIdentityChallenge,
  resetPrivateUserPassword,
  resubmitIdentity,
  changeOwnPassword,
} from './src/server/privateAuthService';
import {
  bootRecoverPrivateAccountsFromStripe,
  importPrivateMembers,
  recoverPrivateAccountsFromStripe,
} from './src/server/privateAccountRecoveryService';
import {
  DAWN_HOBSON_EMAIL,
  emergencyResetMemberPassword,
  seedEmergencyKnownMembers,
} from './src/server/emergencyMemberSeed';
import {
  bootPersistFounderBackupSnapshot,
  buildFounderBackupPackage,
  persistFounderBackupSnapshot,
  restorePrivateAccountsFromBackupPackage,
} from './src/server/founderBackupService';
import {
  listWaitlistRegistrationsSafe,
} from './src/server/registrationStore';
import {
  clearWaitlistAlreadyInPrivateLogin,
  convertWaitlistToPrivateAccounts,
  listFounderInvites,
  listWaitlistConversionCandidates,
} from './src/server/waitlistConvertService';
import { sendIdentityConfirmEmail, sendPasswordResetEmail } from './src/server/registrationEmail';
import {
  listInviteMailRows,
  sendInviteMailToEmail,
} from './src/server/inviteMailService';
import {
  bumpPrivateApply,
  bumpPublicApply,
  getPublicEntry,
  listPrivateCatalog,
  listPublicCatalog,
  removePrivateEntry,
  removePublicEntry,
  savePrivateEntry,
  savePublicEntry,
} from './src/server/riverCatalogService';
import { chatRiverGenie } from './src/server/riverGenieService';
import {
  getTwelveDataApiKey,
  getTwelveDataKeyPresence,
  getGeminiApiKey,
  getGroqApiKey,
  getFredApiKey,
  getFmpApiKey,
  getNewsDataApiKey,
  getSecretPresenceReport,
  getSessionSecret,
  getStripeSecretKey,
  getBoardAccessCode,
  FMP_ALLOWED_ENDPOINTS,
  FMP_LOOKUP_KINDS,
  buildFmpStableLookupUrl,
  buildFmpStableSymbolUrl,
} from './src/server/secrets';
import { fetchCftcLegacyHistory } from './src/server/cftcCot';
import { fetchFmpDeskNews, fetchFmpEconomicWire } from './src/server/fmpNewsWire';
import {
  resolveAuthenticatedUid,
  requireCatalogAdmin,
  requireFounderOrCatalogAdmin,
  requireFounderActionHeader,
  requireIntelligenceAdmin,
  requirePrivateSession,
  getPrivateSessionUser,
} from './src/server/authGuards';
import {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE_MS,
  TIER_PRICE_CENTS,
  adminListAffiliates,
  attributeSignup,
  ensureAffiliateMember,
  getAffiliateDashboard,
  activateAffiliate,
  adminListPayouts,
  adminResolvePayout,
  getLeaderboard,
  hydrateAffiliateFromDurableStore,
  markReferredPaid,
  recordClick,
  requestAffiliatePayout,
  resolveCode,
} from './src/server/affiliateService';

const parser = new RSSParser();

TruthEnforcementEngine.registerServerFilesystemBackup(writeTruthAuditRecoveryFile);

function getCleanTwelveDataApiKey(): string {
  const key = getTwelveDataApiKey();
  if (!key) {
    console.warn('[Gateway] No Twelve Data API key found in environment. Live data will be unavailable until one is configured.');
  }
  return key;
}

/** Read a UTF-8 file only when it resolves inside an allowlisted root (blocks path traversal / file inclusion). */
function safeReadTextFile(filePath: string, allowedRoots: string[] = [process.cwd()]): string {
  const resolved = path.resolve(filePath);
  const ok = allowedRoots.some((root) => {
    const base = path.resolve(root);
    return resolved === base || resolved.startsWith(base + path.sep);
  });
  if (!ok) {
    throw new Error(`Blocked path outside allowlist: ${filePath}`);
  }
  // Reject symlink escapes that land outside the allowlist
  const real = fs.realpathSync(resolved);
  const realOk = allowedRoots.some((root) => {
    const base = fs.realpathSync(path.resolve(root));
    return real === base || real.startsWith(base + path.sep);
  });
  if (!realOk) {
    throw new Error(`Blocked symlink path outside allowlist: ${filePath}`);
  }
  return fs.readFileSync(real, 'utf8');
}

// SSRF PROTECTION
// The stream and RSS proxies fetch caller-supplied URLs. Without validation they
// can be abused to reach internal-only targets (cloud metadata at 169.254.169.254,
// loopback services, RFC1918 hosts, etc.). We only allow http(s) and reject any URL
// whose resolved address falls inside a private/reserved range.
function isPrivateIp(ip: string): boolean {
  // Normalise IPv4-mapped IPv6 addresses (e.g. ::ffff:169.254.169.254)
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const addr = mapped ? mapped[1] : ip;

  if (net.isIPv4(addr)) {
    const [a, b] = addr.split('.').map(Number);
    if (a === 10) return true;                       // 10.0.0.0/8
    if (a === 127) return true;                      // loopback
    if (a === 0) return true;                         // "this" network
    if (a === 169 && b === 254) return true;         // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;         // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a >= 224) return true;                        // multicast / reserved
    return false;
  }

  const lower = addr.toLowerCase();
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (lower.startsWith('fe80')) return true;          // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local fc00::/7
  return false;
}

async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are permitted');
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  if (!hostname) {
    throw new Error('Missing host');
  }
  // Block obvious loopback aliases before any DNS work
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('Blocked host');
  }
  // If the host is already a literal IP, validate it directly
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('Blocked private address');
    return parsed;
  }
  // Otherwise resolve every A/AAAA record and reject if any points inside a private range
  const resolved = await dnsPromises.lookup(hostname, { all: true });
  if (!resolved.length) {
    throw new Error('Host did not resolve');
  }
  for (const { address } of resolved) {
    if (isPrivateIp(address)) {
      throw new Error('Blocked private address');
    }
  }
  return parsed;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Enable trust proxy for Cloud Run (real client IP behind the load balancer).
  app.set('trust proxy', 1);

  // 1. SECURITY & PERFORMANCE MIDDLEWARE
  // Dev: CSP off so Vite HMR works. Prod: enforce CSP + HSTS + framing defenses.
  app.use(helmet({
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            fontSrc: ["'self'", 'data:', 'https:', 'https://fonts.gstatic.com'],
            connectSrc: [
              "'self'",
              'https:',
              'wss:',
              'https://*.googleapis.com',
              'https://*.firebaseio.com',
              'https://*.firebasestorage.app',
              'https://*.cloud.appwrite.io',
              'https://fra.cloud.appwrite.io',
            ],
            frameSrc: ["'self'", 'https:'],
            mediaSrc: ["'self'", 'blob:', 'https:'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: isProd ? { policy: 'same-origin-allow-popups' } : false,
    crossOriginResourcePolicy: isProd ? { policy: 'same-site' } : false,
    frameguard: { action: 'sameorigin' },
    referrerPolicy: { policy: 'no-referrer' },
    hidePoweredBy: true,
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  }));
  // Reduce fingerprinting / version leaks
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.removeHeader('Server');
    res.removeHeader('X-Powered-By');
    next();
  });
  // Same-origin by default in production. Set CORS_ALLOWED_ORIGINS=https://a.com,https://b.com for multi-origin.
  const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(cors({
    origin: isProd
      ? (corsAllowedOrigins.length
          ? (origin, callback) => {
              if (!origin || corsAllowedOrigins.includes(origin)) callback(null, true);
              else callback(new Error('Not allowed by CORS'));
            }
          : false)
      : true,
    credentials: true,
  }));
  app.use(compression());
  app.use(cookieParser());

  // Stripe webhook — MUST be mounted before express.json() because signature
  // verification needs the raw, unparsed request body. Auth = Stripe signature.
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.get('stripe-signature') || '';
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header.' });
    }
    try {
      const event = verifyStripeWebhook(req.body as Buffer, signature);
      const result = await handleStripeEvent(event);
      res.json({ received: true, handled: result.handled });
    } catch (err: any) {
      const status = err instanceof StripeServiceError ? err.status : 500;
      if (status >= 500) console.error('[Stripe] webhook processing failed:', err);
      res.status(status).json({ error: err?.message || 'Webhook processing failed.' });
    }
  });

  app.use(express.json({ limit: '1mb' }));

  // 1.5 SCANNER & VULNERABILITY PROBE FILTER
  // Stops malicious probes and scanner bots (e.g., .php, wp-content, .env) before they trigger router fallbacks or session overhead.
  app.use((req, res, next) => {
    const pathLower = req.path.toLowerCase();

    // Fast-track essential files of sitemaps and direct platform assets
    if (
      pathLower === '/sitemap.xml' ||
      pathLower.startsWith('/sitemap-') ||
      pathLower === '/robots.txt' ||
      pathLower === '/favicon.ico' ||
      pathLower === '/manifest.json' ||
      pathLower === '/manifest.webmanifest' ||
      pathLower === '/logo.png' ||
      pathLower === '/og-image.png' ||
      pathLower === '/api/seo/catalog-counts' ||
      pathLower === '/api/seo/indexnow' ||
      pathLower === '/api/seo/indexnow/status' ||
      pathLower === '/api/seo/regional-markets'
    ) {
      return next();
    }

    // IndexNow ownership key file at site root: /{key}.txt
    const indexNowKey = resolveIndexNowKey();
    if (indexNowKey && pathLower === `/${indexNowKey.toLowerCase()}.txt`) {
      return next();
    }

    // Capture standard security scanner targets
    const isProbe =
      pathLower.includes('wp-') ||
      pathLower.includes('xmlrpc') ||
      pathLower.includes('.php') ||
      pathLower.includes('.asp') ||
      pathLower.includes('.jsp') ||
      pathLower.includes('.cgi') ||
      pathLower.includes('/etc/passwd') ||
      pathLower.includes('.env') ||
      pathLower.includes('wlwmanifest') ||
      pathLower.includes('/cms/') ||
      pathLower.includes('/wordpress/') ||
      pathLower.includes('/plugins/');

    if (isProbe) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(404).send('Not Found');
    }

    // Stop missing static assets from falling back to full index.html SPA payloads
    if (pathLower.includes('.') && !pathLower.startsWith('/api/')) {
      if (process.env.NODE_ENV === 'production') {
        const fullFilePath = path.join(process.cwd(), 'dist', req.path);
        const hasIndexHtml = fs.existsSync(path.join(process.cwd(), 'dist', req.path, 'index.html'));
        if (!fs.existsSync(fullFilePath) && !hasIndexHtml) {
          res.setHeader('Content-Type', 'text/plain');
          return res.status(404).send('Not Found');
        }
      }
    }

    next();
  });

  // Vendor credits (Twelve Data / FMP / Groq) are the only budget.
  // Express rate-limit 429s were blanking desks (yellow DATA UNAVAILABLE) while
  // the Venture 610 dashboard still had credits.

  // Initialize WebSockets
  setupWebSockets(server);

  // Passport & Auth Middleware
  // Never use a guessable/hardcoded signing key — forged cookies = account takeover.
  // Prefer SESSION_SECRET (min 32 chars). If missing in production but Stripe is
  // configured, derive a stable secret from STRIPE_SECRET_KEY so sessions survive
  // Cloud Run restarts/redeploys without wiping logins. Last resort: random (warn).
  let sessionSecret = getSessionSecret();
  if (!sessionSecret || sessionSecret.length < 32) {
    const stripeKey = getStripeSecretKey();
    if (stripeKey && stripeKey.length >= 16) {
      sessionSecret = crypto
        .createHmac('sha256', 'clearpath-session-v1')
        .update(stripeKey)
        .digest('hex');
      if (isProd) {
        console.warn(
          '[Security] SESSION_SECRET unset — using stable secret derived from STRIPE_SECRET_KEY so logins survive redeploys. Set SESSION_SECRET explicitly when you can.'
        );
      }
    } else {
      if (sessionSecret && sessionSecret.length < 32) {
        console.warn('[Security] SESSION_SECRET is shorter than 32 characters; generating a stronger ephemeral secret.');
      } else if (isProd) {
        console.warn('[Security] SESSION_SECRET is not set in production. Generating an ephemeral random secret; set SESSION_SECRET to keep sessions valid across restarts.');
      }
      sessionSecret = crypto.randomBytes(48).toString('hex');
    }
  }
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'cpt.sid',
    proxy: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));

  // Custom OAuth stubs — relative returnTo only (no open redirects). Prefer Firebase / private auth in production.
  const customProviders = [
    'discord', 'twitch', 'tiktok', 'linkedin', 'vk', 'reddit', 'telegram', 'tumblr', 'youtube',
    'google', 'facebook', 'instagram', 'twitter', 'snapchat', 'pinterest', 'threads', 'github',
  ];
  const OAUTH_RETURN_ALLOW = new Set([
    '/',
    '/#Biography',
    '/#private-login',
    '/?tab=Yours#Yours',
    '/?tab=Biography#Biography',
  ]);
  function safeOAuthReturnTo(raw: unknown): string {
    if (typeof raw !== 'string') return '/?tab=Yours#Yours';
    const candidate = raw.trim();
    if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('://')) {
      return '/?tab=Yours#Yours';
    }
    if (OAUTH_RETURN_ALLOW.has(candidate)) return candidate;
    // Allow only simple hash/tab deep links under the SPA root
    if (/^\/(?:\?tab=[A-Za-z0-9_-]+)?(?:#[A-Za-z0-9_-]+)?$/.test(candidate)) return candidate;
    return '/?tab=Yours#Yours';
  }

  customProviders.forEach((provider) => {
    app.get(`/auth/${provider}`, (req, res) => {
      const returnTo = safeOAuthReturnTo(req.query.returnTo);
      const safeReturn = returnTo.replace(/[<>"']/g, '');
      const label = provider.replace(/[^a-z0-9_-]/gi, '').toUpperCase() || 'PROVIDER';
      res.type('html').send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${label} Login — ClearPath</title>
  </head>
  <body style="margin:0;background:#030307;color:#e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:24px;text-align:center;">
    <div style="max-width:420px;width:100%;border:1px solid rgba(0,182,255,0.35);border-radius:20px;padding:28px;background:linear-gradient(160deg,#071226,#0A1C3A);box-shadow:0 0 40px rgba(0,182,255,0.15);">
      <p style="color:#00FFD1;letter-spacing:0.2em;font-size:11px;margin:0 0 12px;">OAUTH LOGIN</p>
      <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Connect ${label}</h1>
      <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 24px;">
        Sign in with ${label} to link your ClearPath social node.
        Production deploys with provider API keys redirect to the real ${label} authorize page.
      </p>
      <a href="${safeReturn}" style="display:inline-block;width:100%;box-sizing:border-box;padding:14px 16px;border-radius:12px;background:#00B6FF;color:#071226;font-weight:800;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">
        Continue to ClearPath
      </a>
      <a href="/#private-login" style="display:inline-block;margin-top:12px;color:#00FFD1;font-size:12px;text-decoration:none;letter-spacing:0.06em;">
        Or use Private Login instead →
      </a>
    </div>
  </body>
</html>`);
    });

    app.get(`/auth/${provider}/callback`, (_req, res) => {
      res.redirect('/?tab=Yours#Yours');
    });
  });


  // 3. API ROUTES
  app.get('/api/health', (req, res) => {
    const adminDb = getAdminFirestore();
    const privateMeta = getPrivateStorageMeta();
    const sessionSecretConfigured = Boolean(getSessionSecret() && getSessionSecret().length >= 32);
    res.json({ 
      status: privateMeta.productionHardFail ? 'degraded' : 'healthy', 
      version: '5.0.0-institutional',
      uptime: process.uptime(),
      timestamp: Date.now(),
      cloudRun: {
        service: process.env.K_SERVICE || null,
        revision: process.env.K_REVISION || null,
      },
      waitlist: {
        firestoreAdmin: Boolean(adminDb),
        appwriteConfigured: Boolean(
          process.env.VITE_APPWRITE_PROJECT_ID &&
          process.env.VITE_APPWRITE_PROJECT_ID !== 'YOUR_PROJECT_ID'
        ),
      },
      privateAccounts: {
        durable: privateMeta.durable,
        writesAllowed: privateMeta.writesAllowed,
        productionHardFail: privateMeta.productionHardFail,
        storage: privateMeta.privateStorage,
        stripeDurable: privateMeta.stripeDurable,
        firebaseAdmin: getFirebaseAdminStatus(),
      },
      session: {
        // True when explicit SESSION_SECRET is set OR we can derive a stable one from Stripe.
        secretConfigured: sessionSecretConfigured || Boolean(getStripeSecretKey()),
        // Ephemeral only when neither SESSION_SECRET nor Stripe-derived secret is available.
        ephemeral: !(sessionSecretConfigured || Boolean(getStripeSecretKey())) && isProd,
      },
    });
  });

  /** Consent-first app/APK update manifest (no secrets; APK only when allowlisted + sha256). */
  app.get('/api/app-update', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(buildAppUpdateManifest());
  });

  // Private member accounts (email + password, per-user login desk)
  app.post('/api/auth/private/lookup', async (req, res) => {
    try {
      const result = await lookupPrivateUser(req.body?.email || '');
      res.json(result);
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      res.status(status).json({ error: error.message || 'Lookup failed.' });
    }
  });

  app.post('/api/auth/private/register', async (req, res) => {
    try {
      const result = await registerPrivateUser({
        email: req.body?.email || '',
        password: req.body?.password || '',
        displayName: req.body?.displayName || '',
        meta: {
          ip: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0]?.trim(),
          userAgent: String(req.headers['user-agent'] || ''),
        },
      });

      if (result.kind === 'pending_confirm') {
        const origin =
          (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '') ||
          `${req.protocol}://${req.get('host')}`;
        const confirmUrl = buildIdentityConfirmUrl(origin, result.rawChallengeToken);
        const emailSent = await sendIdentityConfirmEmail({
          to: result.user.email,
          displayName: result.user.displayName,
          confirmUrl,
        });
        // Do NOT grant dashboard session while quarantined.
        return res.status(202).json({
          ok: true,
          quarantined: true,
          identityStatus: 'pending_confirm',
          emailSent,
          reasons: result.reasons,
          user: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            identityStatus: 'pending_confirm',
          },
        });
      }

      const user = result.user;
      // Affiliate: ensure code for new member + attribute from cookie/body
      try {
        ensureAffiliateMember(user.uid);
        const fromBody =
          typeof req.body?.referralCode === 'string' ? req.body.referralCode : '';
        const fromCookie =
          typeof req.cookies?.[AFFILIATE_COOKIE] === 'string' ? req.cookies[AFFILIATE_COOKIE] : '';
        attributeSignup({ newUid: user.uid, referralCode: fromBody || fromCookie });
      } catch (affErr: any) {
        console.warn('[Affiliate] signup attribution skipped:', affErr?.message || affErr);
      }
      const sessionUser = buildClientSessionUser(user);
      (req.session as any).privateUser = sessionUser;
      res.json({ ok: true, user: sessionUser });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      res.status(status).json({
        error: error.message || 'Registration failed.',
        code: error instanceof PrivateAuthError ? error.code : undefined,
      });
    }
  });

  app.post('/api/auth/private/login', async (req, res) => {
    try {
      const result = await loginPrivateUser({
        email: req.body?.email || '',
        password: req.body?.password || '',
      });

      if (result.kind === 'pending_confirm') {
        return res.status(403).json({
          ok: false,
          code: 'IDENTITY_PENDING',
          error: 'Please confirm your identity with real information.',
          identityStatus: 'pending_confirm',
          reasons: result.reasons,
          user: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            identityStatus: 'pending_confirm',
          },
        });
      }

      const sessionUser = buildClientSessionUser(result.user);
      (req.session as any).privateUser = sessionUser;
      res.json({ ok: true, user: sessionUser });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      res.status(status).json({
        error: error.message || 'Login failed.',
        code: error instanceof PrivateAuthError ? error.code : undefined,
        identityStatus: error instanceof PrivateAuthError ? error.details?.identityStatus : undefined,
      });
    }
  });

  app.post('/api/auth/private/identity/resubmit', async (req, res) => {
    try {
      const result = await resubmitIdentity({
        currentEmail: req.body?.currentEmail || req.body?.email || '',
        password: req.body?.password || '',
        newEmail: req.body?.newEmail || req.body?.email || '',
        newDisplayName: req.body?.newDisplayName || req.body?.displayName || '',
        meta: {
          ip: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0]?.trim(),
          userAgent: String(req.headers['user-agent'] || ''),
        },
      });

      if (result.kind === 'unlocked') {
        const sessionUser = buildClientSessionUser(result.user);
        (req.session as any).privateUser = sessionUser;
        try {
          ensureAffiliateMember(result.user.uid);
        } catch {
          /* ignore */
        }
        return res.json({ ok: true, identityStatus: 'ok', user: sessionUser });
      }

      if (result.kind === 'pending_confirm') {
        const origin =
          (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '') ||
          `${req.protocol}://${req.get('host')}`;
        const confirmUrl = buildIdentityConfirmUrl(origin, result.rawChallengeToken);
        const emailSent = await sendIdentityConfirmEmail({
          to: result.user.email,
          displayName: result.user.displayName,
          confirmUrl,
        });
        return res.status(202).json({
          ok: true,
          quarantined: true,
          identityStatus: 'pending_confirm',
          emailSent,
          emailSentRequired: true,
          user: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            identityStatus: 'pending_confirm',
          },
        });
      }

      // still_suspect
      return res.status(202).json({
        ok: true,
        quarantined: true,
        identityStatus: 'pending_confirm',
        reasons: result.reasons,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          identityStatus: 'pending_confirm',
        },
      });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      res.status(status).json({
        error: error.message || 'Could not update identity.',
        code: error instanceof PrivateAuthError ? error.code : undefined,
        identityStatus: error instanceof PrivateAuthError ? error.details?.identityStatus : undefined,
      });
    }
  });

  app.post('/api/auth/private/identity/decline', async (req, res) => {
    try {
      await declineIdentity({
        email: req.body?.email || '',
        password: typeof req.body?.password === 'string' ? req.body.password : undefined,
      });
      try {
        delete (req.session as any).privateUser;
      } catch {
        /* ignore */
      }
      res.json({ ok: true, identityStatus: 'declined', message: 'Have a good one.' });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      res.status(status).json({
        error: error.message || 'Decline failed.',
        code: error instanceof PrivateAuthError ? error.code : undefined,
      });
    }
  });

  app.post('/api/auth/private/identity/resend', async (req, res) => {
    try {
      const reminted = await remintIdentityChallenge({
        email: req.body?.email || '',
        password: req.body?.password || '',
      });
      const origin =
        (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '') ||
        `${req.protocol}://${req.get('host')}`;
      const confirmUrl = buildIdentityConfirmUrl(origin, reminted.rawChallengeToken);
      const emailSent = await sendIdentityConfirmEmail({
        to: reminted.user.email,
        displayName: reminted.user.displayName,
        confirmUrl,
      });
      res.json({ ok: true, emailSent, identityStatus: 'pending_confirm' });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      res.status(status).json({
        error: error.message || 'Resend failed.',
        code: error instanceof PrivateAuthError ? error.code : undefined,
        identityStatus: error instanceof PrivateAuthError ? error.details?.identityStatus : undefined,
      });
    }
  });

  app.get('/api/auth/private/identity/confirm', async (req, res) => {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      await confirmIdentityByToken(token);
      const dest =
        (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://clearpathtrader.com').replace(
          /\/$/,
          ''
        ) + '/activate?identity=confirmed';
      return res.redirect(302, dest);
    } catch (error: any) {
      const declined = error instanceof PrivateAuthError && error.code === 'IDENTITY_DECLINED';
      const dest =
        (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://clearpathtrader.com').replace(
          /\/$/,
          ''
        ) + (declined ? '/activate?identity=declined' : '/activate?identity=invalid');
      return res.redirect(302, dest);
    }
  });

  app.post('/api/auth/private/logout', (req, res) => {
    try {
      delete (req.session as any).privateUser;
      delete (req.session as any).boardAccess;
    } catch {
      /* ignore */
    }
    req.session.destroy((err) => {
      res.clearCookie('cpt.sid', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
      });
      if (err) {
        return res.status(500).json({ error: 'Logout incomplete.' });
      }
      return res.json({ ok: true });
    });
  });

  // Board / Founders code — verified server-side only (timing-safe). No default code.
  app.post('/api/auth/board/verify', (req, res) => {
    const expected = getBoardAccessCode();
    const provided = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!expected || expected.length < 6) {
      return res.status(503).json({ error: 'Board access is not configured on this server.' });
    }
    if (!provided || provided.length > 64) {
      return res.status(401).json({ error: 'Invalid board access code.' });
    }
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    const match =
      a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!match) {
      return res.status(401).json({ error: 'Invalid board access code.' });
    }
    const sessionUser = {
      uid: 'board-operator',
      email: 'operator@clearpathtrader.com',
      displayName: 'Clear Path Markets Science Agent',
      isAnonymous: true,
      emailVerified: true,
      privateAccount: false,
      boardAccess: true,
    };
    (req.session as any).boardAccess = true;
    (req.session as any).privateUser = sessionUser;
    res.json({ ok: true, user: sessionUser });
  });

  // Profile save/load for private sessions (bypasses Firebase client permission errors)
  // UID must come from the signed session — never from query/body (IDOR).
  app.get('/api/profile/me', async (req, res) => {
    const sessionUser = (req.session as any)?.privateUser;
    const uid = sessionUser?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Sign in to load your profile.' });
    }
    try {
      // Pull the durable copy first — another instance may have newer data.
      await refreshProfileFromDurable(uid);
      const profile =
        applyPendingContractorBadges(uid, sessionUser?.email) ||
        readProfile(uid) ||
        { uid, displayName: sessionUser?.displayName || '' };
      res.json({ ok: true, profile });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to load profile' });
    }
  });

  const publicSiteOrigin = (req: express.Request) => {
    const fromEnv = String(process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
    if (fromEnv) return fromEnv;
    const host = String(req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
    if (host && !isProd) {
      const proto = String(req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
      return `${proto}://${host}`;
    }
    return 'https://clearpathtrader.com';
  };

  app.post('/api/profile/me', (req, res) => {
    const sessionUser = (req.session as any)?.privateUser;
    const uid = sessionUser?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Sign in to save your profile.' });
    }
    try {
      const allowed = [
        'displayName', 'username', 'bio', 'avatarUrl', 'coverUrl',
        'photoURL', 'coverURL', 'instagramType', 'publishStatus',
      ];
      const patch: Record<string, unknown> = {};
      for (const key of allowed) {
        if (req.body?.[key] !== undefined) patch[key] = req.body[key];
      }
      if (patch.username !== undefined) {
        const handle = normalizeProfileUsername(String(patch.username || ''));
        if (!handle) {
          patch.username = '';
        } else if (!isValidProfileUsername(handle)) {
          return res.status(400).json({
            error: 'Profile URL must be 3–24 characters: letters, numbers, underscore, or hyphen.',
          });
        } else if (isReservedProfileUsername(handle)) {
          return res.status(400).json({ error: 'That profile URL is reserved.' });
        } else if (usernameTakenByOther(handle, uid)) {
          return res.status(409).json({ error: 'That profile URL is already taken.' });
        } else {
          patch.username = handle;
        }
      }
      const profile = writeProfile(uid, patch);
      res.json({ ok: true, profile });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to save profile' });
    }
  });

  /** Public member card for /u/:username — never email, uid, or billing. */
  app.get('/api/profile/public/:username', (req, res) => {
    const handle = normalizeProfileUsername(String(req.params.username || ''));
    if (!isValidProfileUsername(handle)) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    const publicProfile = toPublicMemberProfile(findProfileByUsername(handle));
    if (!publicProfile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.json({ ok: true, profile: publicProfile });
  });

  app.post('/api/auth/private/change-password', async (req, res) => {
    const sessionUser = (req.session as any)?.privateUser;
    if (!sessionUser?.email || !sessionUser.privateAccount) {
      return res.status(401).json({ error: 'Sign in to change your password.' });
    }
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match.' });
    }
    try {
      await changeOwnPassword({
        email: sessionUser.email,
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 400;
      return res.status(status).json({ error: error.message || 'Could not change password.' });
    }
    try {
      delete (req.session as any).privateUser;
      delete (req.session as any).boardAccess;
    } catch {
      /* ignore */
    }
    req.session.destroy((err) => {
      res.clearCookie('cpt.sid', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
      });
      if (err) {
        return res.status(500).json({ error: 'Password updated, but sign-out did not finish. Close this tab and sign in again.' });
      }
      return res.json({ ok: true, signedOut: true });
    });
  });

  app.post('/api/auth/private/forgot-password', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    try {
      if (email.includes('@')) {
        const user = await findPrivateUserByEmail(email);
        if (user?.uid && user.email) {
          const { rawToken } = mintPasswordResetToken({ uid: user.uid, email: user.email });
          const resetUrl = `${publicSiteOrigin(req)}/reset-password?token=${encodeURIComponent(rawToken)}`;
          await sendPasswordResetEmail({
            to: user.email,
            displayName: user.displayName,
            resetUrl,
          });
        }
      }
    } catch (err) {
      console.warn('[password-reset] forgot-password failed silently:', (err as Error)?.message || err);
    }
    // Always the same answer — never confirm whether the email has an account.
    return res.json({ ok: true });
  });

  app.post('/api/auth/private/reset-password', async (req, res) => {
    const token = String(req.body?.token || '');
    const newPassword = String(req.body?.newPassword || req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match.' });
    }
    const record = consumePasswordResetToken(token);
    if (!record) {
      return res.status(400).json({ error: 'That reset link is invalid or expired. Request a new one from Private Login.' });
    }
    try {
      await resetPrivateUserPassword({ email: record.email, password: newPassword });
      return res.json({ ok: true });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 400;
      return res.status(status).json({ error: error.message || 'Could not reset password.' });
    }
  });

  app.get('/api/auth/private/me', async (req, res) => {
    const user = (req.session as any)?.privateUser;
    if (!user) return res.status(401).json({ error: 'Not signed in.' });
    try {
      // Private accounts only — board operator sessions skip identity gate.
      if (user.privateAccount) {
        const gate = await assertSessionIdentityAllowed({ uid: user.uid, email: user.email });
        if (!gate.allowed) {
          delete (req.session as any).privateUser;
          return res.status(403).json({
            error:
              gate.identityStatus === 'pending_confirm'
                ? 'Please confirm your identity with real information.'
                : 'Have a good one.',
            code:
              gate.identityStatus === 'pending_confirm' ? 'IDENTITY_PENDING' : 'IDENTITY_DECLINED',
            identityStatus: gate.identityStatus,
            reasons: gate.reasons,
            user: gate.user
              ? {
                  uid: gate.user.uid,
                  email: gate.user.email,
                  displayName: gate.user.displayName,
                  identityStatus: gate.identityStatus,
                }
              : undefined,
          });
        }
      }
      if (user.uid) ensureAffiliateMember(user.uid);
    } catch {
      /* ignore */
    }
    res.json({ user });
  });

  const chartPulseOwnerKey = (req: express.Request): string => {
    const user = getPrivateSessionUser(req);
    if (user?.uid) return `uid:${user.uid}`;
    const ip = String(req.ip || req.socket?.remoteAddress || 'unknown');
    return `anon:${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)}`;
  };

  app.get('/api/chart-pulse/status', (req, res) => {
    const user = getPrivateSessionUser(req);
    res.json({
      ...getChartPulseDeliveryStatus(),
      sessionEmail: user?.email || null,
      subscriptions: listSubscriptionsForOwner(chartPulseOwnerKey(req)),
    });
  });

  app.post('/api/chart-pulse/subscribe', (req, res) => {
    const body = req.body || {};
    const channel: ChartPulseChannel = body.channel === 'sms' ? 'sms' : 'email';
    const sessionEmail = getPrivateSessionUser(req)?.email;
    const email = typeof body.email === 'string' && body.email.trim() ? body.email : sessionEmail;
    if (!isPulseInterval(body.intervalMinutes)) {
      return res.status(400).json({ error: 'Interval must be 5, 10, 15, or 30 minutes.' });
    }
    const result = upsertSubscription({
      ownerKey: chartPulseOwnerKey(req),
      slotId: String(body.slotId || ''),
      symbol: String(body.symbol || ''),
      intervalMinutes: body.intervalMinutes,
      channel,
      email,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
    });
    if (result.ok === false) {
      return res.status(400).json({ error: result.error });
    }
    const delivery = getChartPulseDeliveryStatus();
    const transportReady = channel === 'email' ? delivery.emailConfigured : delivery.smsConfigured;
    res.json({
      ok: true,
      subscription: result.subscription,
      delivery,
      message: transportReady
        ? `Armed. You will get a ${channel === 'sms' ? 'text' : 'email'} every ${body.intervalMinutes} minutes while this host is running.`
        : channel === 'sms'
          ? 'Armed on this host, but Twilio SMS is not configured yet (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM). Browser alerts still work while this tab is open.'
          : 'Armed on this host, but SMTP is not configured yet. Browser alerts still work while this tab is open.',
    });
  });

  app.post('/api/chart-pulse/unsubscribe', (req, res) => {
    const body = req.body || {};
    if (!isPulseInterval(body.intervalMinutes)) {
      return res.status(400).json({ error: 'Interval must be 5, 10, 15, or 30 minutes.' });
    }
    const channel: ChartPulseChannel | undefined =
      body.channel === 'sms' || body.channel === 'email' ? body.channel : undefined;
    const result = removeSubscription({
      ownerKey: chartPulseOwnerKey(req),
      slotId: String(body.slotId || ''),
      intervalMinutes: body.intervalMinutes,
      channel,
    });
    res.json({ ok: true, removed: result.removed });
  });

  app.post('/api/chart-pulse/test-fire', requireFounderOrCatalogAdmin, async (_req, res) => {
    const result = await fireDueSubscriptions();
    res.json({ ok: true, ...result });
  });

  // ——— Stripe membership billing ———
  /** Boolean presence only — never key material. */
  app.get('/api/stripe/config', (_req, res) => {
    if (!PAYMENTS_ENABLED) {
      return res.json({
        configured: false,
        paymentsEnabled: false,
        webhookConfigured: false,
        tiers: [],
        message: PAYMENTS_DISABLED_MESSAGE,
      });
    }
    res.json({ ...getStripeConfigReport(), paymentsEnabled: true });
  });

  /** Server-trusted membership status + entitlements for the signed-in member. */
  app.get('/api/membership/me', async (req, res) => {
    const sessionUser = getPrivateSessionUser(req);
    if (!sessionUser?.uid) {
      return res.status(401).json({ error: 'Sign in to view membership status.' });
    }
    // Sync from Firestore first so Stripe webhooks processed on other
    // instances (or before a redeploy) are always reflected here.
    await refreshProfileFromDurable(sessionUser.uid);
    const status = getMembershipStatus(sessionUser.uid);
    const effectiveTier = status.active ? status.tier : 'basic';
    const pack = entitlementsFor(effectiveTier);
    res.json({
      ok: true,
      membership: {
        ...status,
        tierRank: tierRankOf(effectiveTier),
        features: pack.features,
        limits: jsonSafeLimits(pack.limits),
        flags: pack.flags,
        plan: pack.plan.id,
      },
    });
  });

  /** Public founder-sheet catalog (no secrets). */
  app.get('/api/membership/catalog', (_req, res) => {
    res.json({
      ok: true,
      plans: CANONICAL_PLANS.map((id) => {
        const p = PLAN_CATALOG[id];
        return { ...p, limits: jsonSafeLimits(p.limits) };
      }),
      accuracy: FEATURE_ACCURACY,
      note: 'Feature catalog only — no list prices. Historical year claims are vendor-capped at Twelve Data outputsize 5000.',
    });
  });

  /** Create a subscription Checkout Session and return the hosted checkout URL. */
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    if (!PAYMENTS_ENABLED) {
      return res.status(410).json({ error: 'PAYMENTS_DISABLED', message: PAYMENTS_DISABLED_MESSAGE });
    }
    const sessionUser = getPrivateSessionUser(req);
    if (!sessionUser?.uid) {
      return res.status(401).json({ error: 'Sign in to subscribe.' });
    }
    const tier = req.body?.tier;
    if (!isMembershipTier(tier)) {
      return res.status(400).json({ error: 'Invalid membership tier. Use silver, gold, or platinum (legacy: pro, proplus, premium, ultimate).' });
    }
    const interval = isBillingInterval(req.body?.interval) ? req.body.interval : 'month';
    const configuredOrigin = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
    const origin = configuredOrigin || `${req.protocol}://${req.get('host')}`;
    try {
      const { url } = await createMembershipCheckoutSession({
        uid: sessionUser.uid,
        email: sessionUser.email,
        tier,
        interval,
        origin,
      });
      res.json({ ok: true, url });
    } catch (err: any) {
      const status = err instanceof StripeServiceError ? err.status : 500;
      if (status >= 500) console.error('[Stripe] checkout session failed:', err);
      res.status(status).json({ error: err?.message || 'Could not start Stripe checkout.' });
    }
  });

  // ——— Affiliate / referral rewards ———
  const siteOrigin = () =>
    (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://clearpathtrader.com').replace(
      /\/$/,
      ''
    );

  /** Public share link — sets attribution cookie and redirects home. */
  app.get('/r/:code', (req, res) => {
    const code = String(req.params.code || '');
    const hit = recordClick({
      code,
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });
    if (hit.ok && hit.code) {
      res.cookie(AFFILIATE_COOKIE, hit.code, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: AFFILIATE_COOKIE_MAX_AGE_MS,
        path: '/',
      });
    }
    const dest = hit.ok ? `/?ref=${encodeURIComponent(hit.code || code)}` : '/';
    return res.redirect(302, dest);
  });

  app.get('/api/affiliate/me', (req, res) => {
    const sessionUser = getPrivateSessionUser(req);
    if (!sessionUser?.uid) {
      return res.status(401).json({ error: 'Sign in to view your affiliate desk.' });
    }
    try {
      const desk = getAffiliateDashboard(sessionUser.uid, siteOrigin());
      res.json({ ok: true, ...desk });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Affiliate desk failed' });
    }
  });

  app.get('/api/affiliate/leaderboard', (_req, res) => {
    try {
      res.json({ ok: true, ...getLeaderboard(25) });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Leaderboard failed' });
    }
  });

  app.post('/api/affiliate/claim', (req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const member = resolveCode(code);
    if (!member) return res.status(404).json({ error: 'Unknown referral code' });
    recordClick({ code: member.code, ip: req.ip, userAgent: req.get('user-agent') || undefined });
    res.cookie(AFFILIATE_COOKIE, member.code, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: AFFILIATE_COOKIE_MAX_AGE_MS,
      path: '/',
    });
    res.json({ ok: true, code: member.code });
  });

  /** Accept the Affiliate Agreement → referral link goes live. */
  app.post('/api/affiliate/activate', (req, res) => {
    const sessionUser = getPrivateSessionUser(req);
    if (!sessionUser?.uid) {
      return res.status(401).json({ error: 'Sign in to activate your affiliate link.' });
    }
    try {
      const member = activateAffiliate(sessionUser.uid);
      res.json({
        ok: true,
        activated: true,
        activatedAt: member.activatedAt,
        termsVersion: member.termsVersion,
        code: member.code,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Activation failed' });
    }
  });

  /** Member requests a cash payout of accumulated affiliate credit. */
  app.post('/api/affiliate/payout-request', (req, res) => {
    if (!PAYMENTS_ENABLED) {
      return res.status(410).json({ error: 'PAYMENTS_DISABLED', message: PAYMENTS_DISABLED_MESSAGE });
    }
    const sessionUser = getPrivateSessionUser(req);
    if (!sessionUser?.uid) {
      return res.status(401).json({ error: 'Sign in to request a payout.' });
    }
    const result = requestAffiliatePayout({
      uid: sessionUser.uid,
      method: typeof req.body?.method === 'string' ? req.body.method : 'paypal',
      destination: typeof req.body?.destination === 'string' ? req.body.destination : '',
    });
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  });

  app.get('/api/admin/affiliate/payouts', requireCatalogAdmin, (_req, res) => {
    if (!PAYMENTS_ENABLED) {
      return res.status(410).json({ error: 'PAYMENTS_DISABLED', message: PAYMENTS_DISABLED_MESSAGE });
    }
    res.json({ ok: true, payouts: adminListPayouts() });
  });

  app.post('/api/admin/affiliate/payouts/resolve', requireCatalogAdmin, (req, res) => {
    if (!PAYMENTS_ENABLED) {
      return res.status(410).json({ error: 'PAYMENTS_DISABLED', message: PAYMENTS_DISABLED_MESSAGE });
    }
    const payoutId = typeof req.body?.payoutId === 'string' ? req.body.payoutId : '';
    const action = req.body?.action === 'rejected' ? 'rejected' : 'paid';
    if (!payoutId) return res.status(400).json({ error: 'payoutId required' });
    const result = adminResolvePayout({ payoutId, action });
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  });

  app.get('/api/admin/affiliate/members', requireCatalogAdmin, (_req, res) => {
    res.json({ ok: true, members: adminListAffiliates() });
  });

  /**
   * Founder Google unlock: verified founder Firebase token → Express private session.
   * Fixes CEO "Unauthorized" when Private Login password was wiped but Google still works.
   */
  app.post('/api/admin/founder-unlock', async (req, res) => {
    try {
      const header = req.get('authorization') || '';
      const match = header.match(/^Bearer\s+(.+)$/i);
      if (!match?.[1]) {
        return res.status(401).json({
          error: 'Unauthorized',
          code: 'NEED_GOOGLE_FOUNDER',
          message: 'Sign in with the founder Google account on this site, then click Unlock again.',
        });
      }
      if (!ensureAdminApp()) {
        return res.status(503).json({
          error: 'Misconfigured',
          message: 'Firebase Admin cannot verify Google login right now.',
        });
      }
      const decoded = await getAuth().verifyIdToken(match[1].trim());
      if (!isFounderEmail(decoded.email)) {
        return res.status(403).json({
          error: 'Forbidden',
          code: 'WRONG_GOOGLE_ACCOUNT',
          message: 'Wrong Google account. Switch to the founder Google account and try again.',
        });
      }
      const sessionUser = {
        uid: String(decoded.uid || `founder_${Date.now()}`),
        email: FOUNDER_EMAIL,
        displayName: String(decoded.name || 'Founder'),
        isAnonymous: false,
        emailVerified: true,
        privateAccount: true,
      };
      (req.session as any).privateUser = sessionUser;
      res.json({
        ok: true,
        user: sessionUser,
        next: 'Unlocked. Click Restore known 16 + reset passwords, then Show invite passwords.',
      });
    } catch (error: any) {
      console.error('[admin/founder-unlock] Failed:', error);
      res.status(401).json({
        error: 'Unauthorized',
        code: 'BAD_GOOGLE_TOKEN',
        message: 'Google login expired. Sign in again as the founder Google account, then Unlock.',
      });
    }
  });

  /**
   * Founder / catalog-admin only — private login members + waitlist (safe fields).
   * Auth: Bearer Firebase ID token for forexanarchy@gmail.com, private founder session,
   * or x-catalog-admin-secret. Never public.
   */
  app.get('/api/admin/members', requireFounderOrCatalogAdmin, async (_req, res) => {
    try {
      const privateList = await listPrivateMembersSafe();
      const waitlist = await listWaitlistRegistrationsSafe();
      const privateMeta = getPrivateStorageMeta();
      // Anyone already in Private Login should not appear stuck on Waitlist.
      const privateEmails = new Set(
        privateList.members.map((m) => String(m.email || '').trim().toLowerCase()).filter(Boolean)
      );
      const activeWaitlist = waitlist.members.filter(
        (row) => !privateEmails.has(String(row.email || '').trim().toLowerCase())
      );
      res.json({
        ok: true,
        counts: {
          privateMembers: privateList.members.length,
          waitlist: activeWaitlist.length,
        },
        privateMembers: privateList.members,
        waitlist: activeWaitlist,
        meta: {
          privateStorage: privateMeta.privateStorage,
          privatePath: privateMeta.privatePath,
          privateCollection: privateMeta.privateCollection,
          privateSource: privateList.source,
          waitlistSource: waitlist.source,
          durable: privateMeta.durable,
          writesAllowed: privateMeta.writesAllowed,
          productionHardFail: privateMeta.productionHardFail,
          firebaseAdmin: privateMeta.firebaseAdmin,
          stripeConfigured: stripeConfigured(),
          ...(privateMeta.persistenceWarning
            ? { persistenceWarning: privateMeta.persistenceWarning }
            : {}),
        },
      });
    } catch (error) {
      console.error('[admin/members] Failed to list members:', error);
      res.status(500).json({ error: 'Failed to list members' });
    }
  });

  /**
   * Founder-only: convert real waitlist emails → durable Private Login accounts.
   * Body: { dryRun?: boolean }. Never returns temp passwords (use /invites).
   */
  app.post('/api/admin/members/convert-waitlist', requireFounderOrCatalogAdmin, async (req, res) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const result = await convertWaitlistToPrivateAccounts({ dryRun });
      res.json(result);
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      console.error('[admin/members/convert-waitlist] Failed:', error);
      res.status(status).json({ error: error?.message || 'Waitlist conversion failed' });
    }
  });

  /** One-click: hide waitlist rows that already have Private Login (mark converted). */
  app.post('/api/admin/members/waitlist/clear-released', requireFounderOrCatalogAdmin, async (_req, res) => {
    try {
      const result = await clearWaitlistAlreadyInPrivateLogin();
      res.json({
        ...result,
        message: `Waitlist cleared: ${result.markedConverted} marked released (already Private Login). ${result.skippedNoPrivate} left (no private account yet).`,
      });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      console.error('[admin/members/waitlist/clear-released] Failed:', error);
      res.status(status).json({ error: error?.message || 'Failed to clear waitlist' });
    }
  });

  /**
   * Founder-only: bulk-import private members into durable Firestore.
   * Body: { members: [{ email, displayName?, password? }], dryRun?: boolean }
   * Omitting password generates a temp password stored in founder invites.
   */
  app.post('/api/admin/members/import', requireFounderOrCatalogAdmin, async (req, res) => {
    try {
      const members = Array.isArray(req.body?.members) ? req.body.members : [];
      if (!members.length) {
        return res.status(400).json({ error: 'members array required' });
      }
      const result = await importPrivateMembers({
        members,
        dryRun: Boolean(req.body?.dryRun),
      });
      res.json(result);
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      console.error('[admin/members/import] Failed:', error);
      res.status(status).json({ error: error?.message || 'Member import failed' });
    }
  });

  /**
   * Founder-only: rebuild missing private accounts from Stripe customer emails.
   * Body: { dryRun?: boolean }. Temp passwords → /api/admin/members/invites.
   */
  app.post('/api/admin/members/recover-from-stripe', requireFounderOrCatalogAdmin, async (req, res) => {
    if (!PAYMENTS_ENABLED) {
      return res.status(410).json({ error: 'PAYMENTS_DISABLED', message: PAYMENTS_DISABLED_MESSAGE });
    }
    try {
      const result = await recoverPrivateAccountsFromStripe({
        dryRun: Boolean(req.body?.dryRun),
      });
      res.json(result);
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      console.error('[admin/members/recover-from-stripe] Failed:', error);
      res.status(status).json({ error: error?.message || 'Stripe recovery failed' });
    }
  });

  /**
   * Founder-only: re-seed the last known private-login cohort (~16) and issue
   * fresh temp passwords into founder invites. Does not invent the wiped ~4000.
   * Body: { dryRun?: boolean, resetExisting?: boolean } (resetExisting defaults true).
   */
  app.post('/api/admin/members/emergency-seed', requireFounderOrCatalogAdmin, async (req, res) => {
    try {
      const result = await seedEmergencyKnownMembers({
        dryRun: Boolean(req.body?.dryRun),
        resetExisting: req.body?.resetExisting !== false,
      });
      res.json({
        ...result,
        howToSend:
          'Open “Show invite passwords”, copy email + tempPassword for Dawn and the other known members, and send privately. They log in via Private Login.',
      });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      console.error('[admin/members/emergency-seed] Failed:', error);
      res.status(status).json({ error: error?.message || 'Emergency seed failed' });
    }
  });

  /**
   * Founder-only password reset.
   * Body: { email?, newPassword? | password? }
   * - No password → emergency path (defaults email to Dawn); returns tempPassword + invite
   * - With password → set that password on durable store (Stripe/Firestore)
   */
  app.post('/api/admin/members/reset-password', requireFounderOrCatalogAdmin, async (req, res) => {
    try {
      const email = String(req.body?.email || DAWN_HOBSON_EMAIL).trim();
      const explicitPassword = String(req.body?.newPassword || req.body?.password || '').trim();
      if (!explicitPassword) {
        const result = await emergencyResetMemberPassword(email);
        return res.json({
          ok: true,
          email: result.email,
          displayName: result.displayName,
          created: result.created,
          tempPassword: result.tempPassword,
          user: { email: result.email, displayName: result.displayName },
          howToSend:
            'Send this email + tempPassword to the member privately. They log in via Private Login, then should change password after first login. Also available under Show invite passwords.',
        });
      }
      const user = await resetPrivateUserPassword({
        email,
        newPassword: explicitPassword,
        tempPassword: explicitPassword,
      });
      res.json({
        ok: true,
        email: user.email,
        displayName: user.displayName,
        created: false,
        user,
        howToSend:
          'Send the new password to the member privately (never in chat/logs). They log in via Private Login.',
      });
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      console.error('[admin/members/reset-password] Failed:', error);
      res.status(status).json({ error: error?.message || 'Password reset failed' });
    }
  });

  /**
   * Founder-only disaster backup download (JSON).
   * Includes private-account password hashes + invite temp passwords.
   * Keep offline. Agents must never claim backups are unnecessary.
   */
  // POST + founder action header — blocks SameSite=Lax top-level GET CSRF downloads.
  app.get('/api/admin/backup/download', (_req, res) => {
    res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST from the CEO Dashboard.' });
  });
  app.post(
    '/api/admin/backup/download',
    requireFounderOrCatalogAdmin,
    requireFounderActionHeader,
    async (_req, res) => {
      try {
        const backup = await buildFounderBackupPackage();
        const stamp = backup.exportedAt.replace(/[:.]/g, '-');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="clearpath-founder-backup-${stamp}.json"`
        );
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).send(JSON.stringify(backup, null, 2));
      } catch (error: any) {
        console.error('[admin/backup/download] Failed:', error);
        res.status(500).json({ error: error?.message || 'Backup download failed' });
      }
    }
  );

  /** Founder-only: persist a backup snapshot into Firestore founder_backups. */
  app.post('/api/admin/backup/snapshot', requireFounderOrCatalogAdmin, async (_req, res) => {
    try {
      const result = await persistFounderBackupSnapshot();
      if (result.ok === false) {
        return res.status(503).json({ error: 'Could not persist backup', reason: result.reason });
      }
      res.json({
        ok: true,
        id: result.id,
        counts: result.counts,
        howToKeep:
          'Also use Download disaster backup and save the JSON on a drive you control. Firestore snapshots help, but your own file is the real safety net.',
      });
    } catch (error: any) {
      console.error('[admin/backup/snapshot] Failed:', error);
      res.status(500).json({ error: error?.message || 'Backup snapshot failed' });
    }
  });

  /**
   * Founder-only: restore private accounts from a disaster backup JSON.
   * Body: { accounts: [...], dryRun?: boolean } or full backup package { privateAccounts: { accounts } }.
   */
  app.post('/api/admin/backup/restore', requireFounderOrCatalogAdmin, async (req, res) => {
    try {
      const fromPackage = Array.isArray(req.body?.privateAccounts?.accounts)
        ? req.body.privateAccounts.accounts
        : null;
      const accounts = Array.isArray(req.body?.accounts) ? req.body.accounts : fromPackage || [];
      const result = await restorePrivateAccountsFromBackupPackage({
        accounts,
        dryRun: Boolean(req.body?.dryRun),
      });
      res.json(result);
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      console.error('[admin/backup/restore] Failed:', error);
      res.status(status).json({ error: error?.message || 'Backup restore failed' });
    }
  });

  app.get('/api/admin/members/convert-waitlist/candidates', requireFounderOrCatalogAdmin, async (_req, res) => {
    try {
      const candidates = await listWaitlistConversionCandidates();
      res.json({
        ok: true,
        count: candidates.length,
        candidates: candidates.map((c) => ({
          email: c.email,
          firstName: c.firstName,
          sourceDb: c.sourceDb,
          status: c.status,
        })),
      });
    } catch (error) {
      console.error('[admin/members/candidates] Failed:', error);
      res.status(500).json({ error: 'Failed to list conversion candidates' });
    }
  });

  /**
   * Founder-only invite export (email + temp password + activation key).
   * Query ?includeSecrets=1 required to include tempPassword — also needs founder action header.
   */
  app.get(
    '/api/admin/members/invites',
    requireFounderOrCatalogAdmin,
    (req, res, next) => {
      if (String(req.query.includeSecrets || '') === '1') {
        return requireFounderActionHeader(req, res, next);
      }
      next();
    },
    async (req, res) => {
      try {
        const includeSecrets = String(req.query.includeSecrets || '') === '1';
        const listed = await listFounderInvites();
        const invites = listed.invites.map((inv) => {
          const row: Record<string, string> = {
            email: inv.email,
            displayName: inv.displayName,
            uid: inv.uid,
            activationKey: inv.activationKey,
            createdAt: inv.createdAt,
          };
          if (inv.waitlistSource) row.waitlistSource = inv.waitlistSource;
          if (includeSecrets && inv.tempPassword) row.tempPassword = inv.tempPassword;
          return row;
        });
        res.json({
          ok: true,
          source: listed.source,
          count: invites.length,
          includeSecrets,
          invites,
          howToSend:
            'Use CEO Dashboard → Invite emails → SEND EMAIL (one click). Or copy email + tempPassword and send privately.',
        });
      } catch (error) {
        console.error('[admin/members/invites] Failed:', error);
        res.status(500).json({ error: 'Failed to list invites' });
      }
    }
  );

  /** Founder mail-merge — POST only (temps included). */
  app.get('/api/admin/members/invite-mail', (_req, res) => {
    res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST from the CEO Dashboard.' });
  });
  app.post(
    '/api/admin/members/invite-mail',
    requireFounderOrCatalogAdmin,
    requireFounderActionHeader,
    async (_req, res) => {
      try {
        const result = await listInviteMailRows();
        res.json(result);
      } catch (error: any) {
        console.error('[admin/members/invite-mail] Failed:', error);
        res.status(500).json({ error: error?.message || 'Failed to build invite mail list' });
      }
    }
  );

  /**
   * One-click: send Private Login invite email to one person.
   * If no temp password exists, issues a fresh one, then SMTP-sends.
   */
  app.post('/api/admin/members/invite-mail/send', requireFounderOrCatalogAdmin, async (req, res) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email : '';
      if (!email.trim()) {
        return res.status(400).json({ error: 'email required' });
      }
      const result = await sendInviteMailToEmail(email);
      const status = result.ok ? 200 : result.sendStatus === 'skipped_junk' ? 400 : 503;
      res.status(status).json(result);
    } catch (error: any) {
      const status = error instanceof PrivateAuthError ? error.status : 500;
      console.error('[admin/members/invite-mail/send] Failed:', error);
      res.status(status).json({
        ok: false,
        error: error?.message || 'Failed to send invite email',
      });
    }
  });

  app.post('/api/admin/affiliate/mark-paid', requireCatalogAdmin, (req, res) => {
    if (!PAYMENTS_ENABLED) {
      return res.status(410).json({ error: 'PAYMENTS_DISABLED', message: PAYMENTS_DISABLED_MESSAGE });
    }
    const referredUid = typeof req.body?.referredUid === 'string' ? req.body.referredUid : '';
    const tierRaw = String(req.body?.tier || 'plus').toLowerCase();
    if (!referredUid) return res.status(400).json({ error: 'referredUid required' });
    if (!(tierRaw in TIER_PRICE_CENTS)) {
      return res.status(400).json({ error: 'tier must be plus | premium | ultimate' });
    }
    const result = markReferredPaid({
      referredUid,
      tier: tierRaw as keyof typeof TIER_PRICE_CENTS,
    });
    if (!result.ok) return res.status(400).json({ error: result.error || 'Failed' });
    res.json({ ok: true, ...result });
  });

  // The River — compiler manifest (controlled self-update channel)
  app.get('/api/river/compiler/manifest', (_req, res) => {
    try {
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(riverCompilerManifest);
    } catch (error: any) {
      res.status(500).json({ error: 'Compiler manifest unavailable.', message: error.message });
    }
  });

  // The River — public community catalog (raw Pine, interpreter path)
  app.get('/api/river/catalog/public', (_req, res) => {
    res.json({ entries: listPublicCatalog() });
  });

  app.get('/api/river/catalog/public/:id', (req, res) => {
    const entry = getPublicEntry(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found.' });
    res.json({ entry });
  });

  app.post('/api/river/catalog/public', requirePrivateSession, moderateBodyFields('pineSource', 'description'), (req, res) => {
    const { name, author, description, pineSource, pineVersion, tags } = req.body || {};
    if (!pineSource || typeof pineSource !== 'string' || pineSource.trim().length < 8) {
      return res.status(400).json({ error: 'pineSource is required.' });
    }
    try {
      const entry = savePublicEntry({
        name: name || 'Untitled Indicator',
        author: author || 'Community',
        description: description || '',
        pineSource,
        pineVersion: typeof pineVersion === 'number' ? pineVersion : null,
        tags: Array.isArray(tags) ? tags : [],
      });
      res.json({ ok: true, entry });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to save public catalog entry.', message: error.message });
    }
  });

  app.post('/api/river/catalog/public/:id/apply', (req, res) => {
    const entry = getPublicEntry(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found.' });
    bumpPublicApply(entry.id);
    res.json({ ok: true, entry: { id: entry.id, name: entry.name, pineSource: entry.pineSource } });
  });

  app.delete('/api/river/catalog/public/:id', requireCatalogAdmin, (req, res) => {
    const ok = removePublicEntry(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found.' });
    res.json({ ok: true });
  });

  // The River — private per-user vault (session auth)
  app.get('/api/river/catalog/mine', (req, res) => {
    const user = (req.session as any)?.privateUser;
    if (!user?.uid) return res.status(401).json({ error: 'Sign in to access your private vault.' });
    res.json({ entries: listPrivateCatalog(user.uid) });
  });

  app.post('/api/river/catalog/mine', moderateBodyFields('pineSource', 'description'), (req, res) => {
    const user = (req.session as any)?.privateUser;
    if (!user?.uid) return res.status(401).json({ error: 'Sign in to save to your private vault.' });
    const { name, description, pineSource, pineVersion, tags } = req.body || {};
    if (!pineSource || typeof pineSource !== 'string' || pineSource.trim().length < 8) {
      return res.status(400).json({ error: 'pineSource is required.' });
    }
    try {
      const entry = savePrivateEntry(user.uid, {
        name: name || 'My Indicator',
        author: user.displayName || user.email || 'You',
        description: description || '',
        pineSource,
        pineVersion: typeof pineVersion === 'number' ? pineVersion : null,
        tags: Array.isArray(tags) ? tags : [],
      });
      res.json({ ok: true, entry });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to save private vault entry.', message: error.message });
    }
  });

  app.post('/api/river/catalog/mine/:id/apply', (req, res) => {
    const user = (req.session as any)?.privateUser;
    if (!user?.uid) return res.status(401).json({ error: 'Sign in required.' });
    const entries = listPrivateCatalog(user.uid);
    const entry = entries.find((e) => e.id === req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found.' });
    bumpPrivateApply(user.uid, entry.id);
    res.json({ ok: true, entry: { id: entry.id, name: entry.name, pineSource: entry.pineSource } });
  });

  app.delete('/api/river/catalog/mine/:id', (req, res) => {
    const user = (req.session as any)?.privateUser;
    if (!user?.uid) return res.status(401).json({ error: 'Sign in required.' });
    const ok = removePrivateEntry(user.uid, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found.' });
    res.json({ ok: true });
  });

  // River Genie — AI Pine co-pilot (build / fix / recommend indicators)
  app.post('/api/river/genie/chat', requirePrivateSession, moderateBodyFields('question', 'pineSource'), async (req, res) => {
    const { question } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question required' });
    }
    try {
      const result = await chatRiverGenie({
        question,
        userName: req.body?.userName,
        conversationHistory: req.body?.conversationHistory,
        pineSource: req.body?.pineSource,
        compileError: req.body?.compileError,
        errorLine: req.body?.errorLine,
        activeIndicatorName: req.body?.activeIndicatorName,
        compatSummary: req.body?.compatSummary,
        compatIssues: req.body?.compatIssues,
        localHints: req.body?.localHints,
        chartContext: req.body?.chartContext,
        catalogSnippet: req.body?.catalogSnippet,
      });
      res.json(result);
    } catch (error: any) {
      console.error('[River Genie Error]', error);
      res.status(500).json({
        error: 'River Genie failed',
        message: error.message || 'AI connection failure.',
      });
    }
  });

  app.post('/api/registrations/waitlist', async (req, res) => {
    try {
      const result = await registerWaitlist(req.body || {});
      res.json(result);
    } catch (error: any) {
      const status = error instanceof RegistrationError ? error.status : 500;
      res.status(status).json({ error: error.message || 'Waitlist registration failed.' });
    }
  });

  app.post('/api/registrations/identity', async (req, res) => {
    try {
      const result = await registerIdentity(req.body || {});
      res.json(result);
    } catch (error: any) {
      const status = error instanceof RegistrationError ? error.status : 500;
      res.status(status).json({ error: error.message || 'Identity pre-registration failed.' });
    }
  });

  // GOOGLE WORKSPACE CLOUD SQL PERSISTENCE API
  app.get('/api/workspace/assets', async (req, res) => {
    const uid = await resolveAuthenticatedUid(req);
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Sign in with Google or Private Login required.' });
    }
    try {
      const userRecord = await db.query.users.findFirst({
        where: eq(schema.users.uid, uid),
      });
      if (!userRecord) {
        return res.json({ assets: [] });
      }
      const assets = await db.select().from(schema.googleAssets).where(eq(schema.googleAssets.userId, userRecord.id));
      res.json({ assets });
    } catch (error: any) {
      console.error('SQL Assets GET failed:', error);
      res.status(500).json({ error: 'Failed to access SQL database', message: error.message });
    }
  });

  app.post('/api/workspace/assets', async (req, res) => {
    const uid = await resolveAuthenticatedUid(req);
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Sign in with Google or Private Login required.' });
    }
    const { email, assetId, title, type } = req.body;
    if (!assetId || !title || !type) {
      return res.status(400).json({ error: 'Missing required field in request body' });
    }
    try {
      let userRecord = await db.query.users.findFirst({
        where: eq(schema.users.uid, uid),
      });
      if (!userRecord) {
        const [inserted] = await db.insert(schema.users).values({
          uid,
          email: email || 'anonymous@gmail.com',
        }).returning();
        userRecord = inserted;
      }
      
      const exists = await db.select().from(schema.googleAssets).where(
        and(
          eq(schema.googleAssets.userId, userRecord.id),
          eq(schema.googleAssets.assetId, assetId)
        )
      );
      if (exists.length > 0) {
        return res.status(409).json({ error: 'Asset already saved in Cloud SQL' });
      }

      await db.insert(schema.googleAssets).values({
        userId: userRecord.id,
        assetId,
        title,
        type
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error('SQL Assets POST failed:', error);
      res.status(500).json({ error: 'Failed to save asset to SQL', message: error.message });
    }
  });

  app.delete('/api/workspace/assets/:id', async (req, res) => {
    const uid = await resolveAuthenticatedUid(req);
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Sign in required.' });
    }
    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return res.status(400).json({ error: 'Invalid asset id' });
    }
    try {
      const userRecord = await db.query.users.findFirst({
        where: eq(schema.users.uid, uid),
      });
      if (!userRecord) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      const owned = await db.select().from(schema.googleAssets).where(
        and(
          eq(schema.googleAssets.id, numericId),
          eq(schema.googleAssets.userId, userRecord.id)
        )
      );
      if (!owned.length) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      await db.delete(schema.googleAssets).where(
        and(
          eq(schema.googleAssets.id, numericId),
          eq(schema.googleAssets.userId, userRecord.id)
        )
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error('SQL Assets DELETE failed:', error);
      res.status(500).json({ error: 'Failed to delete asset' });
    }
  });

  app.get('/api/workspace/notes', async (req, res) => {
    const uid = await resolveAuthenticatedUid(req);
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Sign in required.' });
    }
    try {
      const userRecord = await db.query.users.findFirst({
        where: eq(schema.users.uid, uid),
      });
      if (!userRecord) {
        return res.json({ notes: [] });
      }
      const notes = await db.select().from(schema.workspaceNotes).where(eq(schema.workspaceNotes.userId, userRecord.id));
      res.json({ notes });
    } catch (error: any) {
      console.error('SQL Notes GET failed:', error);
      res.status(500).json({ error: 'Failed to fetch SQL notes', message: error.message });
    }
  });

  app.post('/api/workspace/notes', moderateBodyFields('content'), async (req, res) => {
    const uid = await resolveAuthenticatedUid(req);
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Sign in required.' });
    }
    const { associatedId, content } = req.body;
    if (!associatedId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    try {
      let userRecord = await db.query.users.findFirst({
        where: eq(schema.users.uid, uid),
      });
      if (!userRecord) {
        const [inserted] = await db.insert(schema.users).values({
          uid,
          email: 'anonymous@gmail.com',
        }).returning();
        userRecord = inserted;
      }

      const existing = await db.select().from(schema.workspaceNotes).where(
        and(
          eq(schema.workspaceNotes.userId, userRecord.id),
          eq(schema.workspaceNotes.associatedId, associatedId)
        )
      );

      if (existing.length > 0) {
        await db.update(schema.workspaceNotes)
          .set({ content })
          .where(
            and(
              eq(schema.workspaceNotes.userId, userRecord.id),
              eq(schema.workspaceNotes.associatedId, associatedId)
            )
          );
      } else {
        await db.insert(schema.workspaceNotes).values({
          userId: userRecord.id,
          associatedId,
          content
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('SQL Notes POST failed:', error);
      res.status(500).json({ error: 'Failed to write note to Postgres', message: error.message });
    }
  });

  app.post('/api/log_error', (req, res) => {
    try {
      const raw = JSON.stringify(req.body ?? {});
      if (raw.length > 4000) {
        return res.status(413).json({ error: 'Payload too large' });
      }
      // Redact anything that looks like a key/token before disk write
      const sanitized = raw
        .replace(/("?(?:api[_-]?key|apikey|secret|token|authorization|password)"?\s*[:=]\s*")([^"]{4,})(")/gi, '$1[REDACTED]$3')
        .replace(/(Bearer\s+)[A-Za-z0-9._\-]{8,}/gi, '$1[REDACTED]');
      fs.appendFileSync('frontend_errors.log', sanitized + '\n');
      console.log('\n[FRONTEND ERROR]', sanitized.slice(0, 500), '\n');
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to record error' });
    }
  });

  app.get('/api/secrets/status', requireFounderOrCatalogAdmin, (req, res) => {
    // Boolean presence only — never returns key material.
    // FIREBASE_SERVICE_ACCOUNT may be false on Cloud Run while Admin still works via ADC.
    const admin = getFirebaseAdminStatus();
    res.json({
      secrets: getSecretPresenceReport(),
      firebaseAdmin: {
        envServiceAccountJson: Boolean(
          String(process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
        ),
        configured: admin.configured,
        firestoreDurable: admin.firestore === true,
        mode: admin.mode,
        projectId: admin.projectId,
        probed: admin.probed === true,
        ...(admin.reason ? { reason: admin.reason } : {}),
      },
    });
  });

  // Social OS is disconnected from this host — runs as social-os/ on its own domain.
  const socialOsPublicUrl = () => (process.env.SOCIAL_OS_PUBLIC_URL || '').replace(/\/$/, '');
  app.use('/api/social-os', (req, res) => {
    const target = socialOsPublicUrl();
    if (target) {
      res.redirect(302, `${target}${req.originalUrl}`);
      return;
    }
    res.status(410).json({
      error: 'gone',
      message:
        'ClearPath Social OS was disconnected from clearpathtrader.com. Deploy social-os/ on its own domain and set SOCIAL_OS_PUBLIC_URL.',
    });
  });
  app.get(['/ops/social', '/social-os'], (req, res) => {
    const target = socialOsPublicUrl();
    if (target) {
      res.redirect(302, target);
      return;
    }
    res.status(410).type('html').send(`<!doctype html><html><body style="background:#07080f;color:#e4e4e7;font-family:system-ui;padding:3rem;text-align:center">
      <p style="letter-spacing:.2em;text-transform:uppercase;color:#22d3ee;font-size:12px">Disconnected</p>
      <h1>Social OS has its own domain</h1>
      <p>This publisher is no longer hosted on clearpathtrader.com. Deploy <code>social-os/</code> and set <code>SOCIAL_OS_PUBLIC_URL</code>.</p>
      <p><a href="/" style="color:#67e8f9">Back to ClearPath Trader</a></p>
    </body></html>`);
  });

  // Founder-only: live probes hit vendor APIs (including TwelveData) and burn quota.
  // Never leave this public — Diagnostics UI was removed from the site for the same reason.
  app.get('/api/status', requireFounderOrCatalogAdmin, async (req, res) => {
    try {
      const data = await getLiveApiHealth();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve live health status metrics', message: error.message });
    }
  });

  // Registries Backend Endpoints
  app.get('/api/indicators', (req, res) => {
    res.json(IndicatorRegistry);
  });

  app.post('/api/indicators', (req, res) => {
    try {
      const { indicator, candles, settings } = req.body;
      if (!indicator || !candles) {
        return res.status(400).json({ error: "Missing required properties: 'indicator' and 'candles' are required." });
      }
      const result = IndicatorEngine.calculate(indicator, candles, settings);
      res.json(result);
    } catch (error: any) {
      console.error(`Error calculating indicator ${req.body?.indicator}:`, error);
      res.status(500).json({ error: "Indicator calculation failed", message: error.message });
    }
  });

  app.get('/api/fundamentals', (req, res) => {
    res.json(FundamentalRegistry);
  });

  app.post('/api/fundamentals', async (req, res) => {
    try {
      const { id, country } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing required property: 'id' is required." });
      }
      const matchId = id.toLowerCase();
      let resultData: any[] = [];
      
      // Fully statically routed for high compilation stability
      if (matchId === "gdp" || matchId === "gdp-growth") {
        const { calculateGDP } = await import("./src/fundamentals/forex/GDP");
        resultData = calculateGDP(country || "US");
      } else if (matchId === "cpi" || matchId === "cpi-inflation") {
        const { calculateCPI } = await import("./src/fundamentals/forex/CPI");
        resultData = calculateCPI();
      } else if (matchId === "rates" || matchId === "interest-rates") {
        const { calculateInterestRates } = await import("./src/fundamentals/forex/InterestRates");
        resultData = calculateInterestRates();
      } else if (matchId === "pe") {
        const { calculatePE } = await import("./src/fundamentals/stocks/PE");
        resultData = calculatePE();
      } else if (matchId === "eps") {
        const { calculateEPS } = await import("./src/fundamentals/stocks/EPS");
        resultData = calculateEPS();
      } else if (matchId === "mcap") {
        const { calculateMarketCap } = await import("./src/fundamentals/stocks/MarketCap");
        resultData = calculateMarketCap();
      } else if (matchId === "oi") {
        const { calculateOpenInterest } = await import("./src/fundamentals/crypto/OpenInterest");
        resultData = calculateOpenInterest();
      } else if (matchId === "funding") {
        const { calculateFundingRate } = await import("./src/fundamentals/crypto/FundingRate");
        resultData = calculateFundingRate();
      } else if (matchId === "hashrate") {
        const { calculateHashRate } = await import("./src/fundamentals/crypto/HashRate");
        resultData = calculateHashRate();
      } else if (matchId === "dxy") {
        const { calculateDollarIndex } = await import("./src/fundamentals/macro/DollarIndex");
        resultData = calculateDollarIndex();
      } else {
        return res.status(404).json({ error: `Fundamental metric ${id} not found or implemented.` });
      }
      
      res.json(resultData);
    } catch (error: any) {
      console.error(`Error calculating fundamental ${req.body?.id}:`, error);
      res.status(500).json({ error: "Fundamental calculation failed", message: error.message });
    }
  });

  app.get('/api/institutional', (req, res) => {
    res.json(InstitutionalRegistry);
  });

  app.post('/api/institutional', async (req, res) => {
    try {
      const { id, candles, params } = req.body;
      if (!id || !candles) {
        return res.status(400).json({ error: "Missing required properties: 'id' and 'candles' are required." });
      }
      const matchId = id.toLowerCase();
      let resultData: any = null;

      if (matchId === "bos") {
        const { calculateBOS } = await import("./src/institutional/marketstructure/BOS");
        resultData = calculateBOS(candles, ...(params || []));
      } else if (matchId === "choch") {
        const { calculateCHOCH } = await import("./src/institutional/marketstructure/CHOCH");
        resultData = calculateCHOCH(candles, ...(params || []));
      } else if (matchId === "fvg") {
        const { calculateFVG } = await import("./src/institutional/smartmoney/FairValueGap");
        resultData = calculateFVG(candles);
      } else if (matchId === "ob") {
        const { calculateOrderBlock } = await import("./src/institutional/smartmoney/OrderBlock");
        resultData = calculateOrderBlock(candles, ...(params || []));
      } else if (matchId === "sweeps") {
        const { calculateLiquiditySweep } = await import("./src/institutional/liquidity/LiquiditySweep");
        resultData = calculateLiquiditySweep(candles, ...(params || []));
      } else if (matchId === "vol_profile" || matchId === "vp") {
        const { calculateVolumeProfile } = await import("./src/institutional/profile/VolumeProfile");
        resultData = calculateVolumeProfile(candles, ...(params || []));
      } else if (matchId === "cum_delta" || matchId === "cvd") {
        const { calculateCumulativeDelta } = await import("./src/institutional/orderflow/CumulativeDelta");
        resultData = calculateCumulativeDelta(candles);
      } else {
        return res.status(404).json({ error: `Institutional metric ${id} not found or implemented.` });
      }

      res.json(resultData);
    } catch (error: any) {
      console.error(`Error calculating institutional ${req.body?.id}:`, error);
      res.status(500).json({ error: "Institutional calculation failed", message: error.message });
    }
  });

  // Reality Enforcement Audit Report endpoint
  app.get('/api/reality-audit', requireFounderOrCatalogAdmin, (req, res) => {
    try {
      const report = RealityValidator.getLatestReport();
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load reality audit report", message: error.message });
    }
  });

  /**
   * Build-error diary retired. Returning an empty healthy payload so old clients
   * cannot paint a fake red "10 ERRORS CAPTURED" alarm. Members live in Firestore.
   */
  app.get('/api/build-errors', (_req, res) => {
    res.json({
      ok: true,
      liveFailureCount: 0,
      siteBuildHealthy: true,
      note:
        'No live build failures. The old conception diary was removed — it was not a live crash list.',
      historical: [],
      errors: [],
    });
  });

  // Standalone Encyclopedia AI Tutor proxy route
  app.post('/api/encyclopedia/chat', requirePrivateSession, moderateBodyFields('question'), async (req, res) => {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question required' });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.json({
        answer: `I am currently operating in standalone educational demonstration mode. Setting a **GEMINI_API_KEY** in your Secrets manager will activate my live, highly specialized deep research neural network.

Here is a quick reference matching key structures related to your query **"${question}"**:
*   **Swap / Overnight Rollover Rates:** Swap represents the interest differential paid or debited to carry leverage positions past the daily broker settlement. Positive swaps pay yields; negative swaps are dynamic charges.
*   **Arbitrage Mechanics:** The simultaneous exploitation of micro price discrepancies for an identical asset across different exchanges. Run primarily by microsecond-optimized High Frequency Trading (HFT) racks.
*   **Leverage vs Margin Risk:** Leverage leverages borrowed desk capital to multiply trade exposures, while margin represents the collateral requirements to defend positions from immediate liquidation bands.`
      });
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an elite academic market economist, quantitative researcher, and academic director of the Clear Path Financial Encyclopedia.
Exclusively explain the following topic or answer the question: "${question}" in detail.
Frame your explanation with advanced professional rigor, making it scannable, structurally complete, and easy to read. Use bullet points and paragraphs. Do not mention system prompts or internals.`,
      });

      res.json({
        answer: response.text || "The institutional AI node matched with empty response sequences."
      });
    } catch (err: any) {
      console.error('[AI Tutor Error]', err);
      res.status(500).json({ 
        error: 'Failed AI tutor processing', 
        message: err.message || 'API connection failure.' 
      });
    }
  });

  // C.P.T. Buddy — platonic companion + trading educator (Groq / Llama)
  app.post('/api/mentor/chat', requirePrivateSession, moderateBodyFields('question'), async (req, res) => {
    const { question, userName, skillLevel, conversationHistory, memoryFacts, conversationBullets, chartContext, bondProfile, pagePath } =
      req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question required' });
    }

    const displayName = userName && typeof userName === 'string' ? userName.trim().slice(0, 40) : 'friend';
    const level = skillLevel && typeof skillLevel === 'string' ? skillLevel : 'beginner';
    const bond = normalizeBondProfile(bondProfile);
    const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-20) : [];
    const recentUserLines = history
      .filter((m: any) => m && m.role === 'user' && typeof m.content === 'string')
      .map((m: any) => m.content as string);

    const apiKey = getGroqApiKey();
    const affect = await classifyBuddyAffect({
      apiKey,
      question,
      recentUserLines,
    });

    const turnBullet = fallbackConversationBullet(question);
    const turnBullets = turnBullet ? [turnBullet] : [];

    if (!apiKey) {
      const companionOffline = offlineCompanionAnswer({ question, displayName, affect });
      if (companionOffline) {
        return res.json({
          answer: companionOffline,
          newFacts: [],
          conversationBullets: turnBullets,
          affect,
          bondPatch: mergeBondProfile(bond, {
            lastMood: {
              primary: affect.primary,
              intensity: affect.intensity,
              at: Date.now(),
            },
          }),
        });
      }
      const localChart = chartContext && typeof chartContext === 'string' ? chartContext.trim() : '';
      const chartish = /chart|pattern|wedge|triangle|forming|retrace|setup|structure/i.test(question);
      if (localChart && chartish) {
        return res.json({
          answer: `Here's what I see on the live chart structure (all possibilities — not confirmed):\n\n${localChart.replace(/===.*?===/g, '').trim()}\n\nAsk me to explain any line, or open a chart first if this looks empty.`,
          newFacts: [],
          conversationBullets: turnBullets,
          affect,
        });
      }
      const siteHelp = offlineSiteGuideAnswer(question);
      if (siteHelp) {
        return res.json({ answer: siteHelp, newFacts: [], conversationBullets: turnBullets, affect });
      }
      return res.json({
        answer: `Hey ${displayName} — I'm still here with you. Live full conversation needs a GROQ_API_KEY in Secrets. Meanwhile I can help with navigating ClearPath, INDACREATOR, Charts, neuro profiles, Education, or the Encyclopedias. How's your day going?`,
        newFacts: [],
        conversationBullets: turnBullets,
        affect,
      });
    }

    const systemPrompt = `You are C.P.T., ClearPath Trader's personal platonic buddy and calm trading educator.
You are speaking with ${displayName}, whose self-identified skill level is: ${level}.
Adjust teaching depth to that skill level. Always use plain, calm English. Never use hype, urgency, or casino pressure.

${CPT_COMPANION_GUIDE}

You also teach ClearPath Trader's proprietary methodology, "Four Up, Three Down" (also "4 Patterns on a Trend, 3 on a Retrace"), described below. When asked about entries, setups, or "how do I trade this," teach from this methodology — but if emotional intensity is high or crisis is flagged, pause trading lessons and care first.

=== FOUR UP, THREE DOWN METHODOLOGY ===

CORE CONCEPT:
Ride the trend using 4 high-probability continuation patterns. When the market retraces against the trend, use 3 high-probability reversal patterns. The target is always a precision retrace back to the FIRST WICK of the previous FIRST MOVE (the origin).

KEY DEFINITIONS:
- FIRST MOVE (FM): The initial directional impulse that breaks market structure and sets the trend.
- FIRST WICK (ORIGIN): The starting wick of the first move - the low of the wick in an uptrend, the high of the wick in a downtrend. This is the ultimate target for retraces.
- TREND: The direction the first move continues in.
- RETRACE: A pullback against the trend.
- ANARCHY PATTERNS: High-probability setups aligned with structure and liquidity.

GOLDEN RULE: On a trend, nothing ever crosses or gets further than the first wick.

THE FOUR PATTERNS ON A TREND (CONTINUATION - "Four Up"):
1. Anarchy Breaker (Market Structure Break + Retest) - Price breaks structure, then retests the broken level, which now acts as support (uptrend) or resistance (downtrend). Continue in the trend direction from the retest.
2. Anarchy Pullback (Healthy Pullback) - Price pulls back to a key demand zone (uptrend) or supply zone (downtrend) within the trend. Buyers/sellers step in at each higher low / lower high. Enter on continuation.
3. Anarchy Liq Sweep (Liquidity Grab + Reversal) - Price sweeps equal lows (uptrend) or equal highs (downtrend), grabbing resting liquidity, then reverses and holds the trend direction. Each sweep is followed by continuation.
4. Anarchy Consolidation (Compression Breakout) - Price consolidates inside a wedge within the trend (four pushes form inside the wedge), then breaks out in the direction of the trend on expansion.

Across all four patterns: price makes 4 pushes in the trend direction, each pullback or pause holds without crossing beyond the original first wick, and the 4th push continues the trend.

THE THREE PATTERNS ON A RETRACE (REVERSAL - "Three Down"):
1. Anarchy Rally Base (Rally to Supply) - Price rallies into a supply zone (uptrend retrace) or drops into a demand zone (downtrend retrace). Look for reversal confirmation before acting.
2. Anarchy Liq Return (Equal Highs/Lows Sweep) - Price sweeps equal highs (or equal lows), grabbing liquidity above/below, then reverses back toward the first wick target.
3. Anarchy Rejection (Hard Rejection) - Strong rejection from supply/demand, confirming continuation of the retrace back toward the first wick.

RULES OF ENGAGEMENT:
1. Identify the FIRST MOVE.
2. Mark the FIRST WICK (ORIGIN).
3. Take the 4 continuation patterns in the direction of the trend.
4. On the retrace, take the 3 reversal patterns.
5. Target the FIRST WICK of the first move.
6. Let price reach the level, wait for confirmation, then act.
7. Risk small. Follow the plan. Stay disciplined.

IDEAL RETRACE DEPTH: Use Fibonacci retracement levels of 0.382, 0.500, 0.618, and 0.786. The optimal entry zone on a retrace is between 0.618 and 0.786 back toward the origin (the first wick).

PHILOSOPHY: This is not chaos - it is calculated freedom. Structure gives the trader the edge. "Anarchy is discipline without permission."

=== END METHODOLOGY ===

You also represent ClearPath's Encyclopedia of Finance and Encyclopedia of Indicators. When they ask what a term or indicator means, call search_encyclopedia and teach from those hits. If the tool finds nothing, say so and use careful general knowledge — do not pretend you quoted a specific encyclopedia page you were not given.

Never claim you have access to a user's account data, balances, or positions. You do not have that.

${CPT_SITE_GUIDE}

${BUDDY_LIVE_TOOLS_PROMPT}`;

    const rememberedFacts = Array.isArray(memoryFacts)
      ? memoryFacts.filter((f: any) => typeof f === 'string' && f.trim()).slice(0, 60)
      : [];
    const rememberedBullets = normalizeConversationBullets(conversationBullets, 40);
    const memoryBlock = rememberedFacts.length
      ? `\n\n=== THINGS YOU REMEMBER ABOUT ${displayName.toUpperCase()} FROM PAST CONVERSATIONS ===\n- ${rememberedFacts.join('\n- ')}\nUse these memories naturally, the way a good friend would. Do not recite the list. Never ask ${displayName} to introduce themselves again.\n=== END MEMORY ===`
      : '';
    const conversationBlock = rememberedBullets.length
      ? `\n\n=== CONVERSATION BULLETS (thread recap) ===\n- ${rememberedBullets.join('\n- ')}\nContinue these threads when useful. Do not read the list aloud.\n=== END CONVERSATION BULLETS ===`
      : '';

    const bondBlock = `\n\n${formatBondForPrompt(displayName, bond)}`;
    const affectBlock = `\n\n${formatAffectForPrompt(affect)}`;

    const chartHint =
      chartContext && typeof chartContext === 'string' && chartContext.trim()
        ? `\n\nOpen-chart vision is available this turn. Call read_open_charts before talking about patterns on their screen.`
        : `\n\nNo chart is open in this session. If they ask about the chart, tell them to open CHARTS or a trader desk first.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt + memoryBlock + conversationBlock + bondBlock + affectBlock + chartHint },
      ...history.map((m: any) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: String(m.content || '').slice(0, 4000),
      })),
      { role: 'user' as const, content: question },
    ];

    try {
      const warmTemp = affect.crisis || affect.intensity >= 4 ? 0.35 : 0.55;
      const livePath = typeof pagePath === 'string' ? pagePath.slice(0, 180) : '/';
      const liveChart = chartContext && typeof chartContext === 'string' ? chartContext : '';
      const { answer, toolsUsed } = await runBuddyWithLiveTools({
        apiKey,
        messages,
        temperature: warmTemp,
        maxTokens: 1800,
        chartContext: liveChart,
        pagePath: livePath,
      });

      let newFacts: string[] = [];
      let conversationBulletsOut: string[] = [];
      let bondPatch = mergeBondProfile(bond, {
        lastMood: {
          primary: affect.primary,
          intensity: affect.intensity,
          at: Date.now(),
          ...(affect.evidence[0] ? { note: affect.evidence[0] } : {}),
        },
      });

      try {
        const growth = await extractBuddyGrowth({
          apiKey,
          displayName,
          question,
          affect,
        });
        newFacts = growth.newFacts;
        conversationBulletsOut = growth.conversationBullets.length ? growth.conversationBullets : turnBullets;
        bondPatch = mergeBondProfile(bondPatch, growth.bondPatch);
      } catch (memErr) {
        console.error('[AI Mentor] Growth extraction skipped:', memErr);
        conversationBulletsOut = turnBullets;
      }

      res.json({ answer, newFacts, conversationBullets: conversationBulletsOut, affect, bondPatch, toolsUsed });
    } catch (err: any) {
      console.error('[AI Mentor Error]', err);
      res.status(500).json({
        error: 'Failed AI mentor processing',
        message: err.message || 'Groq API connection failure.',
      });
    }
  });

  app.get('/api/test-market', (req, res) => {
    try {
      res.json({
        success: true,
        timestamp: Date.now(),
      });
    } catch {
      res.status(500).json({
        success: false,
      });
    }
  });

  // Twelve Data Integration Bridge (SECURE SERVER-SIDE)
  app.get('/api/twelvedata/config', (req, res) => {
    const presence = getTwelveDataKeyPresence();
    const hasKeys = Boolean(getCleanTwelveDataApiKey());
    res.json({
      ready: hasKeys,
      isApiExhaustedThisMonth: false,
      keyInfo: hasKeys
        ? `Server-side Twelve Data key configured (${presence.activeSource}, len=${presence.keyLength}${presence.bothSetAndDiffer ? ', dual env names differ' : ''}).`
        : 'None detected. Set TWELVEDATA_API_KEY or TWELVE_DATA_API_KEY on Cloud Run, then Deploy.',
      sources: {
        TWELVEDATA_API_KEY: presence.TWELVEDATA_API_KEY,
        TWELVE_DATA_API_KEY: presence.TWELVE_DATA_API_KEY,
      },
      bothSetAndDiffer: presence.bothSetAndDiffer,
      activeSource: presence.activeSource,
      candidateCount: presence.candidateCount,
      // Never expose key material — length only helps spot truncated pastes.
      keyLength: presence.keyLength,
    });
  });

  app.get('/api/twelvedata/toggle-exhaustion', (req, res) => {
    res.json({ success: true, isApiExhaustedThisMonth: false });
  });

  // Twelve Data Health status endpoint for Visual Diagnostic Panel
  app.get('/api/twelvedata/health', (req, res) => {
    const cleanKey = getCleanTwelveDataApiKey();
    const hasKeys = !!cleanKey;
    const presence = getTwelveDataKeyPresence();
    res.json({
      ...twelvedataHealth,
      apiKeyPresent: hasKeys,
      activeSource: presence.activeSource,
      keyLength: presence.keyLength,
      bothSetAndDiffer: presence.bothSetAndDiffer,
      sources: {
        TWELVEDATA_API_KEY: presence.TWELVEDATA_API_KEY,
        TWELVE_DATA_API_KEY: presence.TWELVE_DATA_API_KEY,
      },
      isApiExhaustedThisMonth: false,
      fallbackMode: !hasKeys,
      events: twelvedataEvents,
    });
  });

  // Latest daily swap-hour timeframe accuracy report (read-only)
  app.get('/api/diagnostics/timeframe-verify', requireFounderOrCatalogAdmin, (_req, res) => {
    const report = getLatestTimeframeVerifyReport();
    if (!report) {
      return res.status(404).json({
        error: 'NO_REPORT',
        message:
          'No timeframe verify report yet. Wait for the daily 02:00–02:59 window or POST /api/diagnostics/timeframe-verify/run.',
      });
    }
    res.json(report);
  });

  // Manual trigger (rate-limited) — same suite the swap-hour scheduler runs
  app.post('/api/diagnostics/timeframe-verify/run', requireFounderOrCatalogAdmin, async (_req, res) => {
    try {
      const report = await runTimeframeAccuracyVerify({ force: true });
      res.json(report);
    } catch (e: any) {
      res.status(500).json({
        error: 'VERIFY_FAILED',
        message: e?.message || 'Timeframe verify failed',
      });
    }
  });

  // Hourly Site Doctor report for CEO Dashboard
  app.get('/api/admin/site-doctor', requireFounderOrCatalogAdmin, (_req, res) => {
    const report = getLatestSiteDoctorReport();
    if (!report) {
      return res.status(404).json({
        error: 'NO_REPORT',
        message: 'No Site Doctor report yet — first sweep runs ~20s after boot, then hourly.',
      });
    }
    res.json(report);
  });

  app.post('/api/admin/site-doctor/run', requireFounderOrCatalogAdmin, async (_req, res) => {
    try {
      const report = await runSiteDoctorSweep();
      res.json(report);
    } catch (e: any) {
      res.status(500).json({
        error: 'SITE_DOCTOR_FAILED',
        message: e?.message || 'Site Doctor sweep failed',
      });
    }
  });

  app.get('/api/admin/daily-ops', requireFounderOrCatalogAdmin, (_req, res) => {
    const report = getLatestDailyOpsReport();
    if (!report) {
      return res.status(404).json({
        error: 'NO_REPORT',
        message: 'No Daily Ops report yet — first sweep runs ~45s after boot, then once per Pacific day.',
      });
    }
    res.json(report);
  });

  app.post('/api/admin/daily-ops/run', requireFounderOrCatalogAdmin, async (req, res) => {
    try {
      const investorId =
        typeof req.body?.investorId === 'string' ? req.body.investorId.trim() : '';
      const report = await runDailyOpsSweep(true, investorId || undefined);
      res.json(report);
    } catch (e: any) {
      res.status(500).json({
        error: 'DAILY_OPS_FAILED',
        message: e?.message || 'Daily Ops sweep failed',
      });
    }
  });

  app.post(
    '/api/admin/daily-ops/complete',
    requireFounderOrCatalogAdmin,
    requireFounderActionHeader,
    (req, res) => {
      try {
        const itemId = String(req.body?.itemId || '');
        const done = Boolean(req.body?.done);
        const note = typeof req.body?.note === 'string' ? req.body.note : undefined;
        const report = completeDailyOpsItem(itemId, done, note);
        res.json(report);
      } catch (e: any) {
        res.status(400).json({
          error: 'DAILY_OPS_COMPLETE_FAILED',
          message: e?.message || 'Could not save checklist item',
        });
      }
    }
  );

  app.post(
    '/api/admin/daily-ops/investor/research',
    requireFounderOrCatalogAdmin,
    requireFounderActionHeader,
    async (req, res) => {
      try {
        const query = String(req.body?.investorId || req.body?.query || '').trim();
        if (!query) {
          return res.status(400).json({
            error: 'BAD_INVESTOR',
            message: 'investorId or query required (name or catalog id).',
          });
        }
        const report = await pinInvestorResearch(query);
        res.json(report);
      } catch (e: any) {
        res.status(400).json({
          error: 'DAILY_OPS_INVESTOR_RESEARCH_FAILED',
          message: e?.message || 'Could not research that investor',
        });
      }
    }
  );

  app.post(
    '/api/admin/daily-ops/investor',
    requireFounderOrCatalogAdmin,
    requireFounderActionHeader,
    (req, res) => {
      try {
        const investorId = String(req.body?.investorId || '');
        const status = String(req.body?.status || '');
        if (!investorId || !['contacted', 'skipped', 'followup', 'queued'].includes(status)) {
          return res.status(400).json({ error: 'BAD_PIPELINE', message: 'investorId and status required.' });
        }
        const report = recordInvestorAction({
          investorId,
          status: status as 'contacted' | 'skipped' | 'followup' | 'queued',
          notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
          followUpDate: typeof req.body?.followUpDate === 'string' ? req.body.followUpDate : undefined,
        });
        res.json(report);
      } catch (e: any) {
        res.status(400).json({
          error: 'DAILY_OPS_INVESTOR_FAILED',
          message: e?.message || 'Could not update investor pipeline',
        });
      }
    }
  );

  // Defense in depth: upstream error messages can embed request URLs, which
  // carry the Twelve Data API key. Strip any key before a message leaves the
  // server so it can never surface in the browser UI.
  const scrubApiKey = (message: unknown): string =>
    String(message ?? '').replace(/apikey=[^&\s"']*/gi, 'apikey=REDACTED');

  const twelveUpstreamMessage = (error: unknown): { status: number; body: Record<string, string> } => {
    const raw = scrubApiKey((error as Error)?.message) || 'Twelve Data API Failure';
    if (/rate limited|429/i.test(raw)) {
      return { status: 429, body: { error: 'RATE_LIMITED', message: raw } };
    }
    if (/COMPLIANCE_VIOLATION/i.test(raw)) {
      return { status: 403, body: { error: 'COMPLIANCE_VIOLATION', message: raw } };
    }
    if (/\b401\b|unauthorized|invalid.*(api)?\s*key/i.test(raw)) {
      return {
        status: 502,
        body: {
          error: 'UPSTREAM_AUTH',
          message:
            'Twelve Data rejected the API key (401). The paid key works locally because .env has the real token; Cloud Run still has a stale/truncated duplicate. Reveal the full key at twelvedata.com/account, paste it into TWELVEDATA_API_KEY, delete TWELVE_DATA_API_KEY if it differs, Deploy, keep traffic on LATEST.',
        },
      };
    }
    return { status: 502, body: { error: 'UPSTREAM_ERROR', message: raw } };
  };

  // Twelve Data Proxy for Quotes
  app.get('/api/quote', async (req, res) => {
    const { symbol } = req.query;
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'symbol required' });
    }
    const apiKey = getCleanTwelveDataApiKey();
    if (!apiKey && !getFmpApiKey()) {
      return res.status(503).json({ error: 'Data Unavailable', message: 'Twelve Data API Key not configured.' });
    }

    try {
      const data = await getMarketQuote(symbol, apiKey);
      if (data && (data.status === 'error' || data.code === 401 || !data.close)) {
        throw new Error(data.message || 'Twelve Data Quote failed or returned error');
      }

      // Gateway already runs LiveDataEnforcementEngine — do not double-count ticks
      // here (that falsely tripped "duplicate constant quotes" on quiet markets).

      // Normalize so all clients (ticker strip, charts, adapters) share one price field.
      // Twelve Data's /quote payload uses `close`; some UI only read `price`.
      const normalized = {
        ...data,
        price: data.price ?? data.close,
        percent_change: data.percent_change ?? data.change_percent,
      };
      res.json(normalized);
    } catch (error: any) {
      console.error('[TwelveData Quote Error]', error);
      const out = twelveUpstreamMessage(error);
      return res.status(out.status).json(out.body);
    }
  });

  // Batch quotes — Twelve Data then FMP. Cap 80 covers the Venture registry + typed tickers.
  app.get('/api/quotes', async (req, res) => {
    const raw = req.query.symbols;
    if (!raw || typeof raw !== 'string') {
      return res.status(400).json({ error: 'symbols required', message: 'Pass comma-separated symbols, max 80.' });
    }
    const symbols = raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 80);
    if (symbols.length === 0) {
      return res.status(400).json({ error: 'symbols required' });
    }
    const apiKey = getCleanTwelveDataApiKey();
    if (!apiKey && !getFmpApiKey()) {
      return res.status(503).json({ error: 'Data Unavailable', message: 'Twelve Data API Key not configured.' });
    }

    try {
      const quotes = await getMarketQuotes(symbols, apiKey);
      res.json({ quotes, count: Object.keys(quotes).length });
    } catch (error: any) {
      console.error('[TwelveData Quotes Batch Error]', error);
      const out = twelveUpstreamMessage(error);
      return res.status(out.status).json(out.body);
    }
  });

  // Twelve Data Proxy for Candles
  app.get('/api/candles', async (req, res) => {
    const { symbol, interval } = req.query;
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'symbol required' });
    }
    const apiKey = getCleanTwelveDataApiKey();
    const resolvedInterval = resolveTwelveDataInterval(
      typeof interval === 'string' ? interval : '5min'
    );
    if (!apiKey && !getFmpApiKey()) {
      return res.status(503).json({ error: 'Data Unavailable', message: 'Twelve Data API Key not configured.' });
    }

    try {
      const data = await getMarketCandles(symbol, resolvedInterval, 100, apiKey);
      if (data && (data.status === 'error' || data.code === 401 || data.code === 429 || !data.values)) {
        logHealthEvent('WARNING', `Twelve Data Candles upstream error/warning: ${data.message || 'Error occurred'}.`, data.code || 502);
        throw new Error(data.message || 'Twelve Data Candles failed or returned error');
      }

      // Gateway already validates candles — skip a second validateTick here.

      res.json(data);
    } catch (error: any) {
      console.error('[TwelveData Candles Error]', error);
      const out = twelveUpstreamMessage(error);
      return res.status(out.status).json(out.body);
    }
  });

  // Twelve Data Proxy transforming to [timestamp, open, high, low, close] array for high-performance chart
  app.get('/api/market/history', async (req, res) => {
    const { symbol, interval, limit } = req.query;
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'symbol required' });
    }

    const selectedInterval = resolveTwelveDataInterval(
      typeof interval === 'string' ? interval : '1h'
    );

    const apiKey = getCleanTwelveDataApiKey();
    if (!apiKey && !getFmpApiKey()) {
      return res.status(503).json({ error: 'Data Unavailable', message: 'Twelve Data API Key not configured.' });
    }

    try {
      // Twelve Data rejects outputsize outside [1, 5000] with HTTP 400, which
      // used to blank every chart for tiers whose candle limit exceeds 5000.
      const requested = limit ? Number(limit) : 100;
      const outputsize = Math.min(Math.max(Number.isFinite(requested) ? requested : 100, 100), 5000);
      const data = await getMarketCandles(symbol, selectedInterval, outputsize, apiKey);
      
      if (!data.values || !Array.isArray(data.values)) {
        logHealthEvent('WARNING', `Twelve Data Ingestion error/warning: ${data.message || 'Error occurred'}.`, data.code || 502);
        throw new Error(`Twelve Data Error: ${data.message || 'API quota limit / rate exceeded'}`);
      }

      // Gateway already validates — skip a second validateTick on history.

                      const formatted = data.values.map((v: any) => [
        new Date(v.datetime).getTime(),
        parseFloat(v.open),
        parseFloat(v.high),
        parseFloat(v.low),
        parseFloat(v.close),
        v.volume != null && v.volume !== "" ? parseFloat(v.volume) : undefined,
      ]);
      
      res.json(formatted);
    } catch (error: any) {
      console.error('[TwelveData History Error]', error);
      const out = twelveUpstreamMessage(error);
      return res.status(out.status).json(out.body);
    }
  });

  // News API
  app.get('/api/news', (req, res) => {
    try {
      const newsPath = path.join(process.cwd(), 'news_data.json');
      if (fs.existsSync(newsPath)) {
        const data = safeReadTextFile(newsPath);
        res.json(JSON.parse(data));
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('[API Error] News fetch failed:', error);
      res.status(500).json({ error: 'Failed to synchronize news data' });
    }
  });

  // NewsData Live Ingress API with fallback
  app.get('/api/newsdata/latest', async (req, res) => {
    try {
      const apiKey = getNewsDataApiKey();
      const isKeyValid = apiKey && apiKey.trim() !== '' && apiKey.length > 8 && !apiKey.toLowerCase().includes('placeholder') && !apiKey.toLowerCase().includes('your_');
      if (isKeyValid) {
        // Try multiple endpoints: /api/1/news (standard compatibility) and /api/1/latest
        const endpoints = [
          `https://newsdata.io/api/1/news?apikey=${apiKey}&q=finance&language=en`,
          `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=finance&language=en`,
          `https://newsdata.io/api/1/news?apikey=${apiKey}&q=market&language=en`
        ];

        for (const url of endpoints) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
              const data = await response.json();
              if (data && data.status === 'success' && Array.isArray(data.results)) {
                const mapped = data.results.map((art: any) => ({
                  title: art.title,
                  source: art.source_id ? art.source_id.toUpperCase() : 'NEWSDATA',
                  category: (Array.isArray(art.category) && art.category[0]) ? art.category[0].toUpperCase() : 'MARKET',
                  pubDate: art.pubDate || new Date().toISOString()
                }));
                if (mapped.length > 0) {
                  return res.json(mapped);
                }
              } else if (data && data.status === 'error') {
                console.info(`[NewsData Info] Status: ${data.status}. API details unreachable.`);
              }
            } else {
              console.info(`[NewsData Info] Status code: ${response.status}. API offline.`);
            }
          } catch (e) {
            console.info(`[NewsData Info] Target URL unreachable: ${url.split('?')[0]}`);
          }
        }
        console.info('[NewsData Info] Utilizing local news fallbacks.');
      }

      const fmpNews = await fetchFmpDeskNews();
      if (fmpNews.length) return res.json(fmpNews);

      // Fallback: Union of news_data.json and master_news.json
      const newsList: any[] = [];
      const newsPath = path.join(process.cwd(), 'news_data.json');
      if (fs.existsSync(newsPath)) {
        try {
          const local = JSON.parse(safeReadTextFile(newsPath));
          local.forEach((item: any) => {
            newsList.push({
              title: item.title,
              source: 'LOCAL',
              category: (item.category || 'GENERAL').toUpperCase(),
              pubDate: new Date().toISOString()
            });
          });
        } catch (e) {
          console.info('[NewsData Info] local parsing offset:', e);
        }
      }

      const masterPath = path.join(process.cwd(), 'master_news.json');
      if (fs.existsSync(masterPath)) {
        try {
          const master = JSON.parse(safeReadTextFile(masterPath));
          master.forEach((item: any) => {
            newsList.push({
              title: item.title,
              source: (item.source || 'MASTER').toUpperCase(),
              category: 'MARKET',
              pubDate: new Date().toISOString()
            });
          });
        } catch (e) {
          console.info('[NewsData Info] master parsing offset:', e);
        }
      }

      res.json(newsList);
    } catch (error) {
      console.error('[NewsData Route Error]', error);
      // Honest empty — never invent INTERNAL marketing headlines
      res.json([]);
    }
  });

  // Economic wire — FMP timed calendar first, then NewsData headlines. No fabricated CPI/NFP rows.
  app.get('/api/economic/news', async (req, res) => {
    try {
      const calendar = await fetchFmpEconomicWire();
      if (calendar.length) return res.json(calendar);

      const apiKey = getNewsDataApiKey();
      const isKeyValid =
        apiKey &&
        apiKey.trim() !== '' &&
        apiKey.length > 8 &&
        !apiKey.toLowerCase().includes('placeholder') &&
        !apiKey.toLowerCase().includes('your_');

      if (isKeyValid) {
        const endpoints = [
          `https://newsdata.io/api/1/news?apikey=${apiKey}&q=economy%20OR%20federal%20reserve%20OR%20inflation%20OR%20CPI%20OR%20GDP&language=en`,
          `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=economy&language=en`,
          `https://newsdata.io/api/1/news?apikey=${apiKey}&q=central%20bank&language=en`,
        ];

        for (const url of endpoints) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) continue;
            const data = await response.json();
            if (data && data.status === 'success' && Array.isArray(data.results) && data.results.length > 0) {
              const mapped = data.results.map((art: any) => ({
                title: art.title,
                source: art.source_id ? String(art.source_id).toUpperCase() : 'NEWSDATA',
                category: Array.isArray(art.category) && art.category[0]
                  ? String(art.category[0]).toUpperCase()
                  : 'ECONOMY',
                pubDate: art.pubDate || undefined,
                link: art.link || art.url || undefined,
                description: art.description || undefined,
              })).filter((n: { title?: string }) => n.title && String(n.title).trim().length > 0);
              if (mapped.length > 0) {
                return res.json(mapped);
              }
            }
          } catch {
            // try next endpoint
          }
        }
      }

      const fmpHeadlines = await fetchFmpDeskNews();
      if (fmpHeadlines.length) return res.json(fmpHeadlines);

      // Fallback: filter local curated news files for economy-related titles (if present)
      const newsList: any[] = [];
      const pushEconomic = (item: any, source: string) => {
        const title = String(item.title || '');
        const hay = `${title} ${item.category || ''} ${item.description || ''}`.toLowerCase();
        const isEconomic =
          /econom|fed|fomc|cpi|inflation|gdp|payroll|unemployment|ecb|boj|rate decision|treasury|macro/.test(
            hay
          );
        if (!isEconomic || !title.trim()) return;
        newsList.push({
          title,
          source: source.toUpperCase(),
          category: (item.category || 'ECONOMY').toString().toUpperCase(),
          pubDate: item.pubDate || undefined,
          link: item.link || item.url || undefined,
          description: item.description || undefined,
        });
      };

      const newsPath = path.join(process.cwd(), 'news_data.json');
      if (fs.existsSync(newsPath)) {
        try {
          const local = JSON.parse(safeReadTextFile(newsPath));
          if (Array.isArray(local)) local.forEach((item: any) => pushEconomic(item, 'LOCAL'));
        } catch (e) {
          console.info('[Economic News] local parse skip:', e);
        }
      }

      const masterPath = path.join(process.cwd(), 'master_news.json');
      if (fs.existsSync(masterPath)) {
        try {
          const master = JSON.parse(safeReadTextFile(masterPath));
          if (Array.isArray(master)) master.forEach((item: any) => pushEconomic(item, item.source || 'MASTER'));
        } catch (e) {
          console.info('[Economic News] master parse skip:', e);
        }
      }

      res.json(newsList);
    } catch (error) {
      console.error('[Economic News Route Error]', error);
      res.json([]);
    }
  });

  // Stream proxy — SSRF-guarded, timed, size-capped
  app.get('/api/stream-proxy', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url required' });
    }
    try {
      await assertSafePublicUrl(url);
    } catch (guardErr: any) {
      console.warn('[Stream Proxy] Rejected unsafe URL:', url, '-', guardErr.message);
      return res.status(400).json({ error: 'Requested URL is not permitted' });
    }
    const STREAM_PROXY_TIMEOUT_MS = 15_000;
    const STREAM_PROXY_MAX_BYTES = 8 * 1024 * 1024;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STREAM_PROXY_TIMEOUT_MS);
    try {
      const response = await fetch(url, { redirect: 'error', signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch target URL: ${response.status}`);
      }

      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > STREAM_PROXY_MAX_BYTES) {
        return res.status(413).json({ error: 'Upstream payload too large' });
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

      const contentType = response.headers.get('content-type') || '';
      const isM3u8 = url.includes('.m3u8') || url.includes('.m3u') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

      if (isM3u8) {
        const text = await response.text();
        if (text.length > STREAM_PROXY_MAX_BYTES) {
          return res.status(413).json({ error: 'Upstream playlist too large' });
        }
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        const parentUrlObj = new URL(url);
        const originUrl = parentUrlObj.origin;

        // Convert any relative URLs into absolute URLs so browser player loads them flawlessly
        const lines = text.split(/\r?\n/);
        const rewrittenLines = lines.map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) {
            return line;
          }
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            if (trimmed.includes('.m3u8')) {
              return `/api/stream-proxy?url=${encodeURIComponent(trimmed)}`;
            }
            return trimmed;
          }
          if (trimmed.startsWith('/')) {
            const absolute = originUrl + trimmed;
            if (trimmed.includes('.m3u8')) {
              return `/api/stream-proxy?url=${encodeURIComponent(absolute)}`;
            }
            return absolute;
          }
          const absolute = baseUrl + trimmed;
          if (trimmed.includes('.m3u8')) {
            return `/api/stream-proxy?url=${encodeURIComponent(absolute)}`;
          }
          return absolute;
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(rewrittenLines.join('\n'));
      } else {
        // Transparent binary segment forwarding for TS chunks loaded through the proxy
        res.setHeader('Content-Type', contentType || 'video/MP2T');
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > STREAM_PROXY_MAX_BYTES) {
          return res.status(413).json({ error: 'Upstream segment too large' });
        }
        return res.send(buffer);
      }
    } catch (error: any) {
      console.error('[Stream Proxy Error]', error);
      const status = error?.name === 'AbortError' ? 504 : 502;
      res.status(status).json({ error: 'Failed to proxy stream details', message: error.message });
    } finally {
      clearTimeout(timeout);
    }
  });

  // RSS Proxy API with timeout handling
  // Literacy OS — page watch / truth search / mentor trust (education only)
  app.post('/api/literacy/watch-check', moderateBodyFields('url'), async (req, res) => {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!url) {
      return res.status(400).json({ error: 'url required' });
    }
    try {
      await assertSafePublicUrl(url);
    } catch (guardErr: any) {
      console.warn('[Literacy Watch] Rejected unsafe URL:', url, '-', guardErr.message);
      return res.status(400).json({ error: 'Requested URL is not permitted' });
    }
    try {
      const fingerprint = await fetchPageFingerprint(url);
      res.json(fingerprint);
    } catch (error: any) {
      console.error('[Literacy Watch Error]', error);
      res.status(502).json({ error: error?.message || 'Failed to fetch page' });
    }
  });

  app.post('/api/literacy/truth-search', requirePrivateSession, moderateBodyFields('query'), async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    if (!query) {
      return res.status(400).json({ error: 'query required' });
    }
    const vault = Array.isArray(req.body?.vault) ? req.body.vault : [];
    const wiki = Array.isArray(req.body?.wiki) ? req.body.wiki : [];
    const symbol = typeof req.body?.symbol === 'string' ? req.body.symbol.trim().toUpperCase() : '';

    let marketNote: string | undefined;
    if (symbol) {
      const apiKey = getCleanTwelveDataApiKey();
      if (apiKey) {
        try {
          const data = await getMarketQuote(symbol, apiKey);
          const price = data?.price || data?.close;
          if (price) {
            marketNote = `Live verified quote for ${symbol}: ${price}` +
              (data?.percent_change != null ? ` (${data.percent_change}%)` : '') +
              '. Context for study only — not advice.';
          }
        } catch (e: any) {
          marketNote = `Live quote for ${symbol} unavailable (${e?.message || 'upstream error'}). Searching vault/wiki only.`;
        }
      } else {
        marketNote = `Live market data key not configured; searching vault/wiki only for ${symbol}.`;
      }
    }

    try {
      const result = runTruthSearch({ query, vault, wiki, marketNote });
      res.json(result);
    } catch (error: any) {
      console.error('[Literacy Truth Search Error]', error);
      res.status(500).json({ error: error?.message || 'Truth search failed' });
    }
  });

  app.post('/api/literacy/mentor-trust', moderateBodyFields('question', 'answer'), async (req, res) => {
    const question = typeof req.body?.question === 'string' ? req.body.question : '';
    const answer = typeof req.body?.answer === 'string' ? req.body.answer : '';
    if (!question.trim() || !answer.trim()) {
      return res.status(400).json({ error: 'question and answer required' });
    }
    const vaultNotes = Array.isArray(req.body?.vaultNotes)
      ? req.body.vaultNotes.filter((n: unknown) => typeof n === 'string')
      : [];
    const marketContext = typeof req.body?.marketContext === 'string' ? req.body.marketContext : undefined;
    try {
      const result = scoreMentorAnswer({ question, answer, vaultNotes, marketContext });
      res.json(result);
    } catch (error: any) {
      console.error('[Literacy Mentor Trust Error]', error);
      res.status(500).json({ error: error?.message || 'Trust scoring failed' });
    }
  });

  app.get('/api/ywc/magazines', async (_req, res) => {
    try {
      const rack = await getMagazineRack();
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json(rack);
    } catch (error) {
      console.error('[YWC magazine rack]', error);
      res.status(502).json({ error: 'Magazine wires are quiet right now' });
    }
  });

  app.post(
    '/api/ywc/translate',
    moderateBodyFields('storyId', 'lang'),
    async (req, res) => {
      const storyId = String(req.body?.storyId || '').slice(0, 200);
      const lang = String(req.body?.lang || '').slice(0, 8);
      try {
        const out = await translateMagazineStory(storyId, lang);
        res.json(out);
      } catch (error: any) {
        const message = error?.message || 'Translate failed';
        const status = message === 'Story not on the rack' ? 404 : 400;
        res.status(status).json({ error: message });
      }
    },
  );

  app.get('/api/rss', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL target required' });
    }

    try {
      await assertSafePublicUrl(url);
    } catch (guardErr: any) {
      console.warn('[RSS Proxy] Rejected unsafe URL:', url, '-', guardErr.message);
      return res.status(400).json({ error: 'Requested URL is not permitted' });
    }

    let timeoutId: NodeJS.Timeout | undefined;
    try {
      // Add timeout to RSS fetches to prevent server hanging
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('RSS Fetch Timeout')), 8000);
      });

      const feed = await Promise.race([
        parser.parseURL(url),
        timeoutPromise
      ]) as any;

      if (timeoutId) clearTimeout(timeoutId);

      const items = feed.items.map((item: any, index: number) => ({
        id: item.guid || index.toString(),
        text: item.title,
        link: item.link,
        description: item.contentSnippet,
        timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        image: null
      }));
      res.json(items);
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('[RSS Proxy Error]', error);
      res.status(502).json({ error: 'Institutional RSS node timed out' });
    }
  });

  // Podcast Index + RSS episode bridge (keys stay server-side)
  app.get('/api/podcast/status', (_req, res) => {
    const podcastIndex = podcastIndexConfigured();
    res.json({
      podcastIndex,
      searchAvailable: true,
      searchSource: podcastIndex ? 'podcastindex' : 'itunes',
    });
  });

  app.get('/api/podcast/episodes', async (req, res) => {
    const { feedUrl, limit } = req.query;
    if (!feedUrl || typeof feedUrl !== 'string') {
      return res.status(400).json({ error: 'feedUrl required' });
    }

    try {
      await assertSafePublicUrl(feedUrl);
    } catch (guardErr: any) {
      console.warn('[Podcast Episodes] Rejected unsafe URL:', feedUrl, '-', guardErr.message);
      return res.status(400).json({ error: 'Requested URL is not permitted' });
    }

    const parsedLimit = typeof limit === 'string' ? Number.parseInt(limit, 10) : 12;
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 30) : 12;

    try {
      const episodes = await fetchEpisodesFromFeed(feedUrl, safeLimit);
      res.json({ episodes });
    } catch (error: any) {
      console.error('[Podcast Episodes Error]', error);
      res.status(502).json({ error: 'Failed to load podcast feed' });
    }
  });

  app.get('/api/podcast/search', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ error: 'q required' });
    }

    try {
      const { results, source } = await searchPodcastsByTerm(q.trim());
      res.json({
        results,
        source,
        note: source === 'itunes'
          ? 'Searching Apple podcast directory (no API key). Optional: add Podcast Index keys with a domain email for the open directory.'
          : undefined,
      });
    } catch (error: any) {
      console.error('[Podcast Search Error]', error);
      res.status(502).json({ error: 'Podcast search failed' });
    }
  });

  // CFTC.gov → ClearPath COT Data Engine (raw archive + normalized cache + analytics)
  app.get('/api/cot/history', async (req, res) => {
    const symbol = String(req.query.symbol || '');
    if (!/^[A-Za-z0-9.^\-]{1,32}$/.test(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol' });
    }
    const force = String(req.query.force || '') === '1';
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
    try {
      const pack = await fetchCftcLegacyHistory(symbol, { limit, force });
      if ('error' in pack) {
        return res.status(pack.status).json({ error: pack.error, message: pack.message });
      }
      res.json(pack);
    } catch (error: any) {
      console.error('[CFTC COT]', error?.message || error);
      res.status(502).json({ error: 'CFTC UNAVAILABLE', message: 'CFTC.gov request failed.' });
    }
  });

  // FRED API Proxy Bridge — server-side FRED_API_KEY only (never accept client keys)
  app.get('/api/fred/observations', async (req, res) => {
    const { series_id, limit } = req.query;
    if (!series_id || typeof series_id !== 'string') {
      return res.status(400).json({ error: 'series_id required' });
    }
    if (!/^[A-Za-z0-9._-]{1,64}$/.test(series_id)) {
      return res.status(400).json({ error: 'Invalid series_id' });
    }
    const apiKey = getFredApiKey();
    if (!apiKey) {
      return res.status(503).json({ error: 'FRED unavailable', message: 'Configure FRED_API_KEY on the server.' });
    }
    const safeLimit = Math.min(Math.max(parseInt(String(limit || '1'), 10) || 1, 1), 100);

    try {
      const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(series_id)}&api_key=${encodeURIComponent(apiKey)}&file_type=json&limit=${safeLimit}&sort_order=desc`;
      const fredRes = await fetch(fredUrl, { redirect: 'error' });
      if (!fredRes.ok) {
         throw new Error(`FRED returned ${fredRes.status}`);
      }
      const data = await fredRes.json();
      res.json(data);
    } catch (error: any) {
      console.error('[FRED Proxy Error]', error?.message || error);
      res.status(502).json({ error: 'FRED API node timed out or failed' });
    }
  });

  // FMP lookup (search / news / insider / peers) — register before /:endpoint/:symbol
  app.get('/api/fmp/lookup', async (req, res) => {
    const kind = String(req.query.kind || '');
    if (!FMP_LOOKUP_KINDS.has(kind)) {
      return res.status(400).json({ error: 'Lookup kind not allowed' });
    }
    const apiKey = getFmpApiKey();
    if (!apiKey) {
      return res.status(503).json({ error: 'FMP unavailable', message: 'Configure FMP_API_KEY on the server.' });
    }
    const symbol = String(req.query.symbol || '');
    const q = String(req.query.q || '');
    const fromDaysRaw = Number(req.query.fromDays);
    const fromDays = Number.isFinite(fromDaysRaw) && fromDaysRaw > 0 ? fromDaysRaw : undefined;
    if (kind !== 'search' && !/^[A-Za-z0-9.^\-]{1,32}$/.test(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol' });
    }
    if (kind === 'search' && (!q || q.length > 64)) {
      return res.status(400).json({ error: 'query required' });
    }
    const url = buildFmpStableLookupUrl(kind, apiKey, { symbol, q, fromDays });
    if (!url) {
      return res.status(400).json({ error: 'Lookup kind not allowed' });
    }
    try {
      const fmpRes = await fetch(url, { redirect: 'error' });
      if (!fmpRes.ok) throw new Error(`FMP returned ${fmpRes.status}`);
      res.json(await fmpRes.json());
    } catch (error: any) {
      console.error('[FMP Lookup Error]', error?.message || error);
      res.status(502).json({ error: 'FMP API node timed out or failed' });
    }
  });

  // FMP API Proxy Bridge — server-side FMP_API_KEY only; allowlisted endpoints
  app.get('/api/fmp/:endpoint/:symbol', async (req, res) => {
    const { endpoint, symbol } = req.params;
    const { limit, period } = req.query;
    if (!symbol || !endpoint) {
      return res.status(400).json({ error: 'symbol and endpoint required' });
    }
    if (!FMP_ALLOWED_ENDPOINTS.has(endpoint)) {
      return res.status(400).json({ error: 'Endpoint not allowed' });
    }
    if (!/^[A-Za-z0-9.^\-]{1,32}$/.test(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol' });
    }
    if (period != null && period !== 'annual' && period !== 'quarter') {
      return res.status(400).json({ error: 'Invalid period' });
    }
    const apiKey = getFmpApiKey();
    if (!apiKey) {
      return res.status(503).json({ error: 'FMP unavailable', message: 'Configure FMP_API_KEY on the server.' });
    }
    const safeLimit = limit ? Math.min(Math.max(parseInt(String(limit), 10) || 1, 1), 40) : undefined;

    try {
      const url = buildFmpStableSymbolUrl(endpoint, symbol, apiKey, {
        limit: safeLimit,
        period: typeof period === 'string' ? period : undefined,
      });
      if (!url) {
        return res.status(400).json({ error: 'Endpoint not allowed' });
      }
      const fmpRes = await fetch(url, { redirect: 'error' });
      if (!fmpRes.ok) {
         throw new Error(`FMP returned ${fmpRes.status}`);
      }
      const data = await fmpRes.json();
      res.json(data);
    } catch (error: any) {
      console.error('[FMP Proxy Error]', error?.message || error);
      res.status(502).json({ error: 'FMP API node timed out or failed' });
    }
  });

  // Master Updates API
  app.get('/api/master-updates', (req, res) => {
    try {
      const masterNewsPath = path.join(process.cwd(), 'master_news.json');
      if (fs.existsSync(masterNewsPath)) {
        const data = safeReadTextFile(masterNewsPath);
        res.json(JSON.parse(data));
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: 'Master synchronization failed' });
    }
  });

  // Google Grounded Search News & Sentiment API Route
  app.get('/api/news/search', requirePrivateSession, async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.json({ 
        error: 'API key missing', 
        message: 'The GEMINI_API_KEY environment variable is not defined. Please configure it in your Settings > Secrets panel.',
        demo: true,
        summary: `Simulated results for "${q}": The platform's GEMINI_API_KEY is not defined. Set it in Secrets to turn on live Google Search.`,
        overallSentiment: "Bullish",
        sentimentScore: 78,
        headlines: [
          {
            id: "demo-1",
            title: `Federal Reserve Signals Growth Alignment for ${q}`,
            description: "Institutional desks report a substantial surge in interest rate stabilization and volume parameters.",
            sentiment: "Bullish",
            sentimentScore: 82,
            date: "1 hour ago",
            sourceName: "Institutional Research (Demo)"
          },
          {
            id: "demo-2",
            title: `Global Capital Flow Drift Anchored on ${q}`,
            description: "Secondary market makers increased liquid inventory indices by 13.5% over the weekend.",
            sentiment: "Neutral",
            sentimentScore: 50,
            date: "3 hours ago",
            sourceName: "System Wire (Demo)"
          }
        ],
        citations: [
          { title: "Clear Path Markets Reference Desk", uri: "https://ai.studio/build" }
        ]
      });
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an elite institutional financial analyst. Perform a live Google Search query to pull recent news headlines, sentiment, and market discussions for: "${q}".
Analyze the latest news, blogs, and public discussions. Return a structured briefing.
The output MUST be a valid JSON object matching the following structure exactly:
{
  "summary": "A 2-3 sentence overview of the current sentiment, institutional backing, and recent developments regarding this topic.",
  "overallSentiment": "Bullish" | "Bearish" | "Neutral",
  "sentimentScore": 75,
  "headlines": [
    {
      "id": "search-item-1",
      "title": "Clear concise 1-line news headline",
      "description": "A 1-2 sentence detailed summary of what occurred, why it matters, and the market impact.",
      "sentiment": "Bullish" | "Bearish" | "Neutral",
      "sentimentScore": 85,
      "date": "e.g., 2 hours ago or Today",
      "sourceName": "e.g., Bloomberg, AP, or Yahoo Finance"
    }
  ]
}
Return ONLY raw text. Do not wrap code in markdown formatting block syntax. Do not output anything other than the exact JSON structure.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let text = response.text || '';
      // Clean up markdown block wraps if model ignores instructions
      if (text.startsWith('```')) {
        text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      }

      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (e) {
        console.warn('[Gemini News Search Parse Failure]', text, e);
        // Fallback placeholder structure if JSON parsing failed
        parsedData = {
          summary: "Live news pulled successfully, but could not structure all news into JSON. Raw parsing overview: " + text.slice(0, 300),
          overallSentiment: "Neutral",
          sentimentScore: 50,
          headlines: [
            {
              id: "fallback-1",
              title: `Live news updates for ${q}`,
              description: text.slice(0, 500) || "Recent news analysis completed with active search grounding.",
              sentiment: "Neutral",
              sentimentScore: 50,
              date: "Recent",
              sourceName: "Google Search Grounding"
            }
          ]
        };
      }

      // Extract real grounding citations to display to the user
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const citations = chunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web.title || 'Web Resource',
          uri: chunk.web.uri
        }));

      res.json({
        ...parsedData,
        citations: citations.length > 0 ? citations : [
          { title: "Grounded Google Search Reference", uri: "https://www.google.com" }
        ]
      });

    } catch (err: any) {
      console.error('[Gemini Grounded Search News Error]', err);
      res.status(500).json({ 
        error: 'Failed search grounding', 
        message: err.message || 'The Google Search Grounding query failed or is currently ratelimited.' 
      });
    }
  });

  // Programmatic local binaries initialization for SEO branding
  ensureSeoAssetsExist();

  // 13. CANONICAL ENFORCEMENT MIDDLEWARE
  app.use((req, res, next) => {
    // Completely bypass APIs, Auth, and code/static assets/Vite HMR files
    const isDevOrAsset = 
      req.path.includes('.') || 
      req.path.startsWith('/src/') || 
      req.path.startsWith('/@') || 
      req.path.startsWith('/node_modules/') || 
      req.path.startsWith('/api/') || 
      req.path.startsWith('/auth/');

    if (isDevOrAsset) {
      return next();
    }

    const host = req.headers.host || '';
    const isWww = host.startsWith('www.');
    const hasTrailingSlash = req.path !== '/' && req.path.endsWith('/');
    const isCapitalized = /[A-Z]/.test(req.path);

    // Normalizes paths: forces lowercase, removes www, strips trailing slashes
    if (isWww || hasTrailingSlash || isCapitalized) {
      const canonicalHost = isWww ? host.slice(4) : host;
      let cleanPath = req.path;
      if (hasTrailingSlash) {
        cleanPath = cleanPath.slice(0, -1);
      }
      if (isCapitalized) {
        cleanPath = cleanPath.toLowerCase();
      }
      
      const protocol = req.secure || (req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
      const redirectUrl = `${protocol}://${canonicalHost}${cleanPath}${req.url.slice(req.path.length)}`;
      return res.redirect(301, redirectUrl);
    }
    next();
  });

  // 3. COMPREHENSIVE ROBOTS.TXT
  app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.send(ROBOTS_TXT);
  });

  // 4. DYNAMIC XML SITEMAP SYSTEM
  // Only URLs that serve real content to logged-out visitors (and crawlers)
  // belong here — sitemap URLs that render a login wall get dropped by
  // Google and drag down crawl trust for the rest of the site.
  const SITEMAP_BASE = 'https://clearpathtrader.com';

  interface SitemapEntry { path: string; lastmod: string; changefreq: string; priority: string; }

  const buildUrlset = (entries: SitemapEntry[]) =>
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${SITEMAP_BASE}${e.path}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Cache generated urlsets — procedural catalogs are large (~30k URLs).
  type CrawlEntryLike = { path: string; lastmod: string; changefreq: string; priority: string };
  const sitemapCache = new Map<string, string>();
  const cachedUrlset = (key: string, factory: () => CrawlEntryLike[]) => {
    let xml = sitemapCache.get(key);
    if (!xml) {
      xml = buildUrlset(factory());
      sitemapCache.set(key, xml);
    }
    return xml;
  };

  const SITEMAP_CHILDREN = [
    'sitemap-pages.xml',
    'sitemap-learn.xml',
    'sitemap-guides.xml',
    'sitemap-stocks.xml',
    'sitemap-crypto.xml',
    'sitemap-forex.xml',
    'sitemap-commodities.xml',
    'sitemap-economy.xml',
    'sitemap-indicators.xml',
    'sitemap-education.xml',
    'sitemap-ui.xml',
  ];

  app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_CHILDREN.map((name) => `  <sitemap>
    <loc>${SITEMAP_BASE}/${name}</loc>
  </sitemap>`).join('\n')}
</sitemapindex>`);
  });

  app.get('/api/seo/catalog-counts', (_req, res) => {
    res.json(catalogCounts());
  });

  // IndexNow key file (Bing / Yandex / Naver ecosystem ownership proof)
  app.get(/^\/([a-zA-Z0-9_-]{8,128})\.txt$/i, (req, res, next) => {
    const key = resolveIndexNowKey();
    const requested = req.params[0];
    if (!key || !requested || requested.toLowerCase() !== key.toLowerCase()) return next();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(key);
  });

  app.get('/api/seo/indexnow/status', (_req, res) => {
    const key = resolveIndexNowKey();
    res.json({
      configured: Boolean(key),
      keyLocation: key ? indexNowKeyLocation(key) : null,
      markets: REGIONAL_MARKETS.map((m) => ({ id: m.id, label: m.label, engines: m.engines })),
      note: 'Google does not consume IndexNow — use Search Console + sitemaps.',
    });
  });

  app.get('/api/seo/regional-markets', (_req, res) => {
    res.json({ markets: REGIONAL_MARKETS });
  });

  app.post('/api/seo/indexnow', requireCatalogAdmin, async (req, res) => {
    const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
    try {
      const result = await submitIndexNow(urls);
      res.status(result.ok ? 200 : 502).json(result);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'IndexNow submit failed' });
    }
  });

  app.post('/api/admin/profiles/contractor-badge', requireCatalogAdmin, async (req, res) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email : '';
      const result = await grantContractorBadgeByEmail(email, { grantedBy: 'admin-api' });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message || 'Grant failed' });
    }
  });

  app.post('/api/admin/profiles/contractor-badge/seed', requireCatalogAdmin, async (_req, res) => {
    try {
      const result = await seedIndependentContractorBadges();
      res.json({ ok: true, seedEmails: IC_BADGE_SEED_EMAILS, ...result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Seed failed' });
    }
  });

  app.get('/sitemap-pages.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const lastmod = sitemapLastmod();
    res.send(buildUrlset([
      { path: '/', lastmod, changefreq: 'daily', priority: '1.0' },
      // NOTE: /trading-ai is a canonical alias — omit from sitemaps.
      { path: '/if-trading-and-chatgpt-had-a-baby', lastmod, changefreq: 'weekly', priority: '0.95' },
      { path: '/about', lastmod, changefreq: 'monthly', priority: '0.85' },
      { path: '/encyclopedia', lastmod, changefreq: 'weekly', priority: '0.85' },
      { path: '/indicators', lastmod, changefreq: 'weekly', priority: '0.85' },
      { path: '/education', lastmod, changefreq: 'weekly', priority: '0.85' },
      { path: '/literacy', lastmod, changefreq: 'weekly', priority: '0.8' },
      { path: '/learn', lastmod, changefreq: 'weekly', priority: '0.8' },
      { path: '/guides', lastmod, changefreq: 'weekly', priority: '0.8' },
      { path: '/glossary', lastmod, changefreq: 'weekly', priority: '0.75' },
      { path: '/faq', lastmod, changefreq: 'monthly', priority: '0.7' },
      { path: '/tools', lastmod, changefreq: 'monthly', priority: '0.8' },
      { path: '/tools/position-size', lastmod, changefreq: 'monthly', priority: '0.85' },
      { path: '/accessibility', lastmod, changefreq: 'yearly', priority: '0.55' },
      { path: '/desk', lastmod, changefreq: 'weekly', priority: '0.85' },
      { path: '/desk/institutional', lastmod, changefreq: 'weekly', priority: '0.9' },
      { path: '/desk/fundamental', lastmod, changefreq: 'weekly', priority: '0.8' },
      { path: '/desk/retail', lastmod, changefreq: 'weekly', priority: '0.8' },
      { path: '/desk/neurodivergent', lastmod, changefreq: 'weekly', priority: '0.8' },
      ...encyclopediaHubEntries(),
      ...regionalHubEntries(),
    ]));
  });

  app.get('/sitemap-learn.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(buildUrlset(
      Object.values(SEMANTIC_RECORDS).map(record => ({
        path: `/learn/${record.id}`,
        lastmod: record.updatedDate,
        changefreq: 'weekly',
        priority: '0.9',
      }))
    ));
  });

  app.get('/sitemap-guides.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(buildUrlset(
      Object.values(GUIDE_RECORDS).map(guide => ({
        path: `/guides/${guide.id}`,
        lastmod: guide.updatedDate,
        changefreq: 'weekly',
        priority: '0.85',
      }))
    ));
  });

  app.get('/sitemap-stocks.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(cachedUrlset('stocks', stockEntries));
  });
  app.get('/sitemap-crypto.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(cachedUrlset('crypto', cryptoEntries));
  });
  app.get('/sitemap-forex.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(cachedUrlset('forex', forexEntries));
  });
  app.get('/sitemap-commodities.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(cachedUrlset('commodities', commodityEntries));
  });
  app.get('/sitemap-economy.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(cachedUrlset('economy', economyEntries));
  });
  app.get('/sitemap-indicators.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(cachedUrlset('indicators', indicatorEntries));
  });
  app.get('/sitemap-education.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(cachedUrlset('education', educationEntries));
  });
  app.get('/sitemap-ui.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(cachedUrlset('ui', uiProfileEntries));
  });

  // 5. AI-READABLE CONTENT ENDPOINTS
  app.get('/api/semantic/content', (req, res) => {
    res.json(SEMANTIC_RECORDS);
  });

  app.post('/api/semantic/link', (req, res) => {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required and must be a string' });
    }
    res.json({ linkedText: semanticLinkContent(text) });
  });

  app.get('/api/semantic/faqs', (req, res) => {
    res.json(GENERAL_FAQS);
  });

  // CrewAI / Make.com intelligence briefing webhook receiver
  app.post('/api/intelligence/webhook', async (req, res) => {
    const secretHeader = req.get('x-intelligence-webhook-secret') || undefined;
    if (!verifyIntelligenceWebhookSecret(secretHeader)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid webhook secret.' });
    }

    try {
      const record = await ingestIntelligenceWebhook(req.body);
      const shouldForward =
        req.query.forward === 'make' || req.query.forward === '1' || req.query.forward === 'true';
      const forwardResult = shouldForward
        ? await forwardIntelligenceToMake(record)
        : { forwarded: false };

      res.status(201).json({
        success: true,
        id: record.id,
        receivedAt: record.receivedAt,
        publishMode: record.publishMode,
        hasBriefing: Boolean(record.briefingMarkdown),
        hasLocalizedBriefing: Boolean(record.localizedBriefingMarkdown),
        makeForward: forwardResult,
      });
    } catch (error: any) {
      console.error('[Intelligence Webhook Error]', error);
      res.status(500).json({
        error: 'INTELLIGENCE_WEBHOOK_FAILED',
        message: error?.message || 'Failed to ingest intelligence briefing.',
      });
    }
  });

  app.get('/api/intelligence/briefings', requireIntelligenceAdmin, (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);
    const briefings = listIntelligenceBriefings(limit).map((record) => ({
      id: record.id,
      receivedAt: record.receivedAt,
      source: record.source,
      runMode: record.runMode,
      activeNeuroProfile: record.activeNeuroProfile,
      publishMode: record.publishMode,
      hasBriefing: Boolean(record.briefingMarkdown),
      hasLocalizedBriefing: Boolean(record.localizedBriefingMarkdown),
    }));
    res.json({ count: briefings.length, briefings });
  });

  app.get('/api/intelligence/briefings/:id', requireIntelligenceAdmin, (req, res) => {
    const record = getIntelligenceBriefing(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Briefing not found' });
    }
    // Never return raw webhook payload to clients
    const { rawPayload, ...safe } = record as any;
    res.json(safe);
  });

  // 1 & 2. DYNAMIC PAGE INTERCEPTOR (SSR METADATA & SCHEMA INJECTION)
  let vite: any = null;
  const isDev = process.env.NODE_ENV !== 'production' || process.argv.some(arg => arg.includes('server.ts'));

  const handlePageServing = async (req: express.Request, res: express.Response) => {
    try {
      // Public content routes are served as crawlable static HTML by default.
      // Pass ?live=1 to load the interactive SPA shell instead (used by hub CTAs
      // for encyclopedia / indicators / education live desks).
      const wantLiveSpa = String(req.query.live || '') === '1';
      const pathClean = (req.path || '/').toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
      // Bing/Google homepage audits need a real in-flow <h1> — serve static HTML to crawlers.
      if (!wantLiveSpa && pathClean === '/' && isSearchEngineBot(req.get('user-agent'))) {
        const enriched = enrichHtmlWithMetadata(renderStaticHomeForBots(), '/');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.send(enriched);
      }
      if (!wantLiveSpa && pathClean === '/about' && isSearchEngineBot(req.get('user-agent'))) {
        const enriched = enrichHtmlWithMetadata(renderStaticAboutForBots(), '/about');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.send(enriched);
      }
      // Unknown /regions/:id must 404 — do not fall through to the SPA shell (was 200).
      if (!wantLiveSpa && isUnknownRegionPath(req.path)) {
        const enriched = enrichHtmlWithMetadata(renderUnknownRegionNotFound(req.path), req.path);
        res.status(404);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.send(enriched);
      }
      const isDeskRoute =
        pathClean === '/desk' ||
        pathClean.startsWith('/desk/') ||
        pathClean === '/fundamental' ||
        pathClean.startsWith('/fundamental/');
      const staticContentHtml =
        wantLiveSpa || (isDeskRoute && !isSearchEngineBot(req.get('user-agent')))
          ? null
          : renderStaticContentPage(req.path);
      if (staticContentHtml !== null) {
        const enriched = enrichHtmlWithMetadata(staticContentHtml, req.path);
        res.setHeader('Content-Type', 'text/html');
        return res.send(enriched);
      }

      if (isDev) {
        const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
        let html = safeReadTextFile(indexHtmlPath);
        
        if (vite) {
          html = await vite.transformIndexHtml(req.url, html);
        }
        
        const enriched = enrichHtmlWithMetadata(html, req.path);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        // Never let browsers/CDNs pin an old SPA shell — hashed JS/CSS can cache long.
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.send(enriched);
      } else {
        const destIndexPath = path.resolve(process.cwd(), 'dist', 'index.html');
        if (fs.existsSync(destIndexPath)) {
          const html = safeReadTextFile(destIndexPath);
          const enriched = enrichHtmlWithMetadata(html, req.path);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.send(enriched);
        } else {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
        }
      }
    } catch (e: any) {
      console.error('[SEO Page Interceptor failure]', e);
      // Never blank the whole terminal for an SSR metadata fault — serve the SPA
      // shell raw so charts/login still load while we inspect logs.
      try {
        const fallbackPath = isDev
          ? path.resolve(process.cwd(), 'index.html')
          : path.resolve(process.cwd(), 'dist', 'index.html');
        if (fs.existsSync(fallbackPath)) {
          res.status(200);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.send(safeReadTextFile(fallbackPath));
        }
      } catch (fallbackErr) {
        console.error('[SEO Page Interceptor fallback failed]', fallbackErr);
      }
      return res.status(500).send('Educational index resolution fault occurred.');
    }
  };

  // Intercept primary crawlable SEO routes at server-side
  const SEO_PAGES = [
    '/',
    '/about',
    '/press',
    '/press-kit',
    '/if-trading-and-chatgpt-had-a-baby',
    '/trading-ai',
    '/macro',
    '/learn',
    '/learn/:topic',
    '/guides',
    '/guides/:slug',
    '/glossary',
    '/faq',
    '/accessibility',
    '/regions',
    '/regions/:id',
    '/research',
    '/encyclopedia',
    '/financial-encyclopedia',
    '/education',
    '/education/:schoolId',
    '/education/:schoolId/:unitId',
    '/education/:schoolId/:unitId/:lessonId',
    '/clearpath-education',
    '/indicators',
    '/indicators/:slug',
    '/encyclopedia-of-indicators',
    '/literacy',
    '/literacy-os',
    '/market-universe',
    '/stocks',
    '/stocks/:symbol',
    '/crypto',
    '/crypto/:coin',
    '/forex',
    '/forex/:pair',
    '/commodities',
    '/commodities/:commodity',
    '/companies',
    // /companies/:slug → 301 to /stocks/:ticker (see redirect below); not a separate thin indexable surface
    '/economy/:topic',
    '/ui',
    '/ui/:profileId',
    '/desk',
    '/desk/:deskId',
    '/desk/:deskId/screen/:pane',
    '/fundamental',
    '/fundamental/:symbol',
    '/tools',
    '/tools/position-size',
    '/u/:username',
    '/reset-password',
  ];

  SEO_PAGES.forEach(pagePath => {
    app.get(pagePath, handlePageServing);
  });

  // Company slugs are not a separate encyclopedia tree — canonical lives under /stocks/:ticker.
  app.get('/companies/:slug', (req, res) => {
    const slug = String(req.params.slug || '').toLowerCase();
    const stock = lookupStock(slug);
    if (stock?.ticker) {
      return res.redirect(301, `/stocks/${String(stock.ticker).toLowerCase()}`);
    }
    return res.redirect(301, '/companies');
  });

  // TikTok for Developers — URL prefix verification (terms.html/ and site root)
  const tiktokSiteVerify =
    'tiktok-developers-site-verification=gACrcTqHKMlqeWU7bjZwYAP6JqjeXg8C';
  const tiktokSiteVerifyFile = 'tiktokgACrcTqHKMlqeWU7bjZwYAP6JqjeXg8C.txt';
  const sendTikTokSiteVerify = (_req: any, res: any) => {
    res.status(200).type('text/plain').send(tiktokSiteVerify);
  };
  app.get(`/${tiktokSiteVerifyFile}`, sendTikTokSiteVerify);
  app.get(`/terms.html/${tiktokSiteVerifyFile}`, sendTikTokSiteVerify);

  // TikTok for Developers URL-prefix verification (Clearpathtrader app)
  const tiktokVerifyName = 'tiktokgACrcTqHKMlqeWU7bjZwYAP6JqjeXg8C.txt';
  const tiktokVerifyBody = 'tiktok-developers-site-verification=gACrcTqHKMlqeWU7bjZwYAP6JqjeXg8C';
  const sendTiktokVerify = (_req: any, res: any) => {
    res.status(200).type('text/plain').send(tiktokVerifyBody);
  };
  app.get(`/${tiktokVerifyName}`, sendTiktokVerify);
  // TikTok modal asks for file under the Terms URL prefix
  app.get(`/terms.html/${tiktokVerifyName}`, sendTiktokVerify);

  // 4. Vite / Static Serving
  if (isDev) {
    vite = await createViteServer({
      server: { 
        middlewareMode: true,
        strictPort: false,
        hmr: { port: 24688 }
      },
      optimizeDeps: { force: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js') || filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          if (filePath.endsWith('sw.js')) {
            res.setHeader('X-Service-Worker-Version', '4.0.0-firmware-val');
          }
          return;
        }
        // Vite emits content-hashed bundles under assets/ — safe to cache hard.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', handlePageServing);
  }

  // 5. GLOBAL ERROR HANDLER
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[CRITICAL] Unhandled Server Error:', err);
    res.status(500).json({ 
      error: 'Institutional Terminal Fault', 
      message: 'System auto-recovery in progress.' 
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[35m%s\x1b[0m`, `[Clear Path Markets Science PRO] Institutional Engine ONLINE`);
    console.log(`\x1b[36m%s\x1b[0m`, `[Clear Path Markets Science PRO] Serving at http://localhost:${PORT}`);

    console.log('[STARTUP] Social OS disconnected from this host (use npm run dev:social-os / Dockerfile.social-os)');

    try {
      startTimeframeAccuracyScheduler();
    } catch (e: any) {
      console.warn('[STARTUP] Timeframe accuracy scheduler failed to start:', e?.message || e);
    }

    try {
      startSiteDoctorScheduler();
    } catch (e: any) {
      console.warn('[STARTUP] Site Doctor scheduler failed to start:', e?.message || e);
    }

    try {
      startDailyOpsScheduler();
    } catch (e: any) {
      console.warn('[STARTUP] Daily Ops scheduler failed to start:', e?.message || e);
    }

    try {
      startChartPulseScheduler();
    } catch (e: any) {
      console.warn('[STARTUP] Chart pulse scheduler failed to start:', e?.message || e);
    }

    try {
      if (firebaseWebClientConfigured()) {
        console.log('[STARTUP] Firebase web client config present — will inject into HTML');
      } else {
        console.warn('[STARTUP] Firebase web client config missing (VITE_FIREBASE_API_KEY) — SPA uses safe offline mocks');
      }
    } catch (e: any) {
      console.warn('[STARTUP] Firebase web config check skipped:', e?.message || e);
    }

    // Probe Firestore (ADC can init then fail on first RPC), migrate local → durable,
    // recover from Stripe when durable, then seed IC badges.
    void (async () => {
      try {
        const ok = await probeAdminFirestore();
        console.log(`[STARTUP] Firebase Admin Firestore probe → ${ok ? 'OK' : 'OFFLINE'}`);
      } catch (e: any) {
        console.warn('[STARTUP] Firestore probe skipped:', e?.message || e);
      }
      try {
        const migrated = await migratePrivateAccountsToDurableStore();
        console.log(
          `[STARTUP] Private accounts durable store → source=${migrated.source} total=${migrated.total} migrated=${migrated.migrated}`
        );
      } catch (e: any) {
        console.warn('[STARTUP] Private accounts migrate skipped:', e?.message || e);
      }
      try {
        const meta = getPrivateStorageMeta();
        if (meta.productionHardFail) {
          console.error(
            '[STARTUP] PRIVATE ACCOUNTS HARD-FAIL: no durable store in production (Firestore Admin offline and Stripe unavailable). Register/login/import blocked until STRIPE_SECRET_KEY and/or FIREBASE_SERVICE_ACCOUNT is available.'
          );
        } else if (hasDurablePrivateStore()) {
          const recovered = PAYMENTS_ENABLED
            ? await bootRecoverPrivateAccountsFromStripe()
            : { ran: false, skippedReason: 'payments_disabled', created: 0, already: 0, candidates: 0 };
          if (recovered.ran) {
            console.log(
              `[STARTUP] Stripe private-account recovery → created=${recovered.created} already=${recovered.already} candidates=${recovered.candidates}`
            );
          } else if (recovered.skippedReason) {
            console.log(`[STARTUP] Stripe private-account recovery skipped (${recovered.skippedReason})`);
          }
          // Create any missing known survivors only — never auto-reset passwords on boot.
          try {
            const seeded = await seedEmergencyKnownMembers({ resetExisting: false });
            console.log(
              `[STARTUP] Emergency known-member seed → created=${seeded.created} already=${seeded.already} errors=${seeded.errors}`
            );
          } catch (seedErr: any) {
            console.warn('[STARTUP] Emergency known-member seed skipped:', seedErr?.message || seedErr);
          }
          try {
            await bootPersistFounderBackupSnapshot();
          } catch (backupErr: any) {
            console.warn('[STARTUP] Founder backup snapshot skipped:', backupErr?.message || backupErr);
          }
        }
      } catch (e: any) {
        console.warn('[STARTUP] Stripe private-account recovery skipped:', e?.message || e);
      }
      // Hydrate redeploy-sensitive stores (profiles/memberships, affiliate, pending badges)
      // from Firestore BEFORE seeding, so a fresh container never starts blank.
      try {
        const profiles = await hydrateProfilesFromDurableStore();
        console.log(
          `[STARTUP] Profiles durable store → source=${profiles.source} pulled=${profiles.pulled} pushed=${profiles.pushed}`
        );
      } catch (e: any) {
        console.warn('[STARTUP] Profiles hydrate skipped:', e?.message || e);
      }
      try {
        const aff = await hydrateAffiliateFromDurableStore();
        console.log(`[STARTUP] Affiliate durable store → source=${aff.source} members=${aff.members}`);
      } catch (e: any) {
        console.warn('[STARTUP] Affiliate hydrate skipped:', e?.message || e);
      }
      try {
        const pending = await hydratePendingGrantsFromDurableStore();
        console.log(
          `[STARTUP] Pending badge grants durable store → source=${pending.source} pending=${pending.pending}`
        );
      } catch (e: any) {
        console.warn('[STARTUP] Pending grants hydrate skipped:', e?.message || e);
      }
      try {
        const seeded = await seedIndependentContractorBadges();
        const summary = seeded.results
          .map((r) => `${r.email}:${r.status}`)
          .join(', ');
        console.log(`[STARTUP] IC badge seed → ${summary || 'none'}`);
      } catch (e: any) {
        console.warn('[STARTUP] IC badge seed skipped:', e?.message || e);
      }
    })();
    
    // Postpone heavy startup integrity audits and self-checks by 10s.
    // This allows the container to start instantly, keeps CPU usage at a minimum during boot,
    // and prevents autoscaling spikes.
    setTimeout(() => {
      console.log("[STARTUP] Running background integrity & compliance audits...");

      // Automatic Startup Validation (Constitution Section 4 & 10)
      try {
        RealityValidator.validate(false);
      } catch (e: any) {
        console.error("[CRITICAL] Reality Enforcement Spec Validation Failure on postponed startup:", e);
      }

      // Notify Bing/Yandex ecosystem (homepage + regional hubs + market pairs).
      void submitIndexNow([
        'https://clearpathtrader.com/',
        'https://clearpathtrader.com/about',
        ...regionalIndexNowUrls(),
      ]).then((r) => {
        if (r.skipped) {
          console.log(`[STARTUP] IndexNow skipped: ${r.skipped}`);
        } else {
          console.log(`[STARTUP] IndexNow submitted=${r.submitted} ok=${r.ok}`);
        }
      }).catch((e) => {
        console.warn('[STARTUP] IndexNow ping failed:', e?.message || e);
      });

      // 1. ComplianceAuditEngine executes automatically on startup
      try {
        console.log("[STARTUP] Executing ComplianceAuditEngine automatic survey...");
        const initialApis = [
          { name: "TwelveData", tier: "PRODUCTION", status: "HEALTHY", responseTime: 95, message: "Direct WebSocket / REST gateway established" },
          { name: "FMP", tier: "ENTERPRISE", status: "HEALTHY", responseTime: 120, message: "Company financial statements online" }
        ];
        const startupCompliance = ComplianceAuditEngine.auditSystemEnvironment(initialApis);
        console.log(`[STARTUP] ComplianceAuditEngine initialized. Score: ${startupCompliance.score}% - Compliant: ${startupCompliance.isCompliant}`);
      } catch (e: any) {
        console.error("[CRITICAL] ComplianceAuditEngine postponed startup failure:", e);
      }

      // 2. TruthEnforcementEngine executes automatically on startup
      try {
        console.log("[STARTUP] Executing TruthEnforcementEngine automatic self-check...");
        const startupTruth = TruthEnforcementEngine.evaluate({
          source: 'STARTUP_SYSTEM',
          message: 'ClearPath server bootstrap runtime validation',
          isMock: false,
          isSynthetic: false
        });
        console.log(`[STARTUP] TruthEnforcementEngine initialized. Compliance score: ${startupTruth.score}%`);
      } catch (e: any) {
        console.error("[CRITICAL] TruthEnforcementEngine postponed startup failure:", e);
      }

      // 3. Content moderation blocklist smoke test
      try {
        const modTest = runContentModerationSelfTest();
        if (modTest.failed.length) {
          console.error(
            `[STARTUP] Content moderation self-test FAILED (${modTest.failed.length}):`,
            modTest.failed
          );
        } else {
          console.log(
            `[STARTUP] Content moderation self-test passed (${modTest.passed} checks).`
          );
        }
      } catch (e: any) {
        console.error("[CRITICAL] Content moderation self-test failure:", e);
      }
    }, 10000); // 10-second delay to guarantee instant, responsive container cold starts
  });
}

startServer();

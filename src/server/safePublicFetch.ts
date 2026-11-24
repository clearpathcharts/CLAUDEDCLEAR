/**
 * SSRF-safe fetch for caller-supplied URLs (stream proxy, RSS, podcasts, literacy watch).
 *
 * - Every address is checked at connect time through the socket `lookup` hook, so a
 *   hostname cannot pass validation and then re-resolve to 169.254.169.254 (DNS rebinding).
 * - Redirects are refused: a public URL could otherwise 302 to an internal target.
 * - The body is capped while streaming; a missing Content-Length cannot exhaust memory.
 */
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

const blocked = new net.BlockList();
for (const [subnet, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(subnet, prefix, 'ipv4');
}
for (const [subnet, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['::', 96], // IPv4-compatible
  ['64:ff9b::', 96], // NAT64
  ['64:ff9b:1::', 48],
  ['100::', 64], // discard
  ['2001::', 32], // Teredo
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link local
  ['ff00::', 8], // multicast
] as const) {
  blocked.addSubnet(subnet, prefix, 'ipv6');
}

const ALLOWED_PORTS = new Set(['', '80', '443', '8080', '8443']);

/** IPv4 embedded in an IPv4-mapped IPv6 address (dotted or hex form), else null. */
function mappedIpv4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const dotted = lower.match(/^(?:0{0,4}:){0,5}:?ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];
  const hex = lower.match(/^(?:0{0,4}:){0,5}:?ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return null;
}

export function isPrivateIp(ip: string): boolean {
  const v4 = net.isIPv4(ip) ? ip : mappedIpv4(ip);
  if (v4) return blocked.check(v4, 'ipv4');
  if (net.isIPv6(ip)) return blocked.check(ip, 'ipv6');
  return true;
}

export class UnsafeUrlError extends Error {}

/** Syntax + literal-IP checks. Hostnames are re-checked per connection in safePublicFetch. */
export function parsePublicUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError('Invalid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new UnsafeUrlError('Only http(s) URLs are permitted');
  if (parsed.username || parsed.password) throw new UnsafeUrlError('Credentials in URL are not permitted');
  if (!ALLOWED_PORTS.has(parsed.port)) throw new UnsafeUrlError('Port not permitted');
  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host) throw new UnsafeUrlError('Missing host');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new UnsafeUrlError('Blocked host');
  }
  if (net.isIP(host) && isPrivateIp(host)) throw new UnsafeUrlError('Blocked private address');
  return parsed;
}

/** Pre-flight check used by routes for an early 400; the real guard runs at connect time. */
export async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  const parsed = parsePublicUrl(rawUrl);
  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) return parsed;
  const resolved = await dns.promises.lookup(host, { all: true });
  if (!resolved.length) throw new UnsafeUrlError('Host did not resolve');
  if (resolved.some(({ address }) => isPrivateIp(address))) throw new UnsafeUrlError('Blocked private address');
  return parsed;
}

const guardedLookup = ((hostname: string, options: dns.LookupOptions, callback: (...args: any[]) => void) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = addresses as dns.LookupAddress[];
    if (!list.length) return callback(new UnsafeUrlError('Host did not resolve'));
    if (list.some(({ address }) => isPrivateIp(address))) return callback(new UnsafeUrlError('Blocked private address'));
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}) as unknown as net.LookupFunction;

/** Exposed for the self-test: proves the connect-time hook rejects private resolutions. */
export const guardedLookupForTests = guardedLookup;

export type SafeFetchResult = {
  status: number;
  contentType: string;
  body: Buffer;
};

export class PayloadTooLargeError extends Error {}

export function safePublicFetch(
  rawUrl: string,
  { timeoutMs = 8000, maxBytes = 4 * 1024 * 1024, headers = {} as Record<string, string> } = {},
): Promise<SafeFetchResult> {
  let parsed: URL;
  try {
    parsed = parsePublicUrl(rawUrl);
  } catch (err) {
    return Promise.reject(err);
  }
  const client = parsed.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
      parsed,
      {
        method: 'GET',
        lookup: guardedLookup,
        headers: { 'User-Agent': 'ClearPathTrader/1.0 (+https://clearpathtrader.com)', ...headers },
      },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400) {
          res.resume();
          req.destroy();
          return reject(new UnsafeUrlError('Redirects are not followed'));
        }
        const declared = Number(res.headers['content-length'] || 0);
        if (declared > maxBytes) {
          req.destroy();
          return reject(new PayloadTooLargeError('Upstream payload too large'));
        }
        const chunks: Buffer[] = [];
        let total = 0;
        res.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxBytes) {
            req.destroy();
            reject(new PayloadTooLargeError('Upstream payload too large'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () =>
          resolve({ status, contentType: String(res.headers['content-type'] || ''), body: Buffer.concat(chunks) }),
        );
        res.on('error', reject);
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error('Upstream timed out'), { name: 'AbortError' })));
    req.on('error', reject);
    req.end();
  });
}

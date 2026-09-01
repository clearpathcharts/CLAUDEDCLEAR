/**
 * C.P.T. Buddy live tools — quote, COT, open charts, where-am-I, encyclopedia.
 * Numbers come only from existing ClearPath feeds. Never invent prices or COT.
 */
import { getMarketQuote } from './marketDataGateway';
import { getTwelveDataApiKey } from './secrets';
import { fetchCftcLegacyHistory } from './cftcCot';
import { parseDeskPath, isDeskPath, TRADER_DESKS } from '../lib/traderDesks';
import { searchEncyclopedia } from './encyclopediaSearch';

export type BuddyToolContext = {
  chartContext: string;
  pagePath: string;
};

export type GroqToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type GroqChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: GroqToolCall[];
  tool_call_id?: string;
};

const SYMBOL_RE = /^[A-Za-z0-9./^\-]{1,32}$/;
const MAX_TOOL_ROUNDS = 3;
const MAX_TOOLS_PER_ROUND = 4;

export const BUDDY_LIVE_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_quote',
      description:
        'Live market quote from ClearPath (Twelve Data). Use for last price and percent change. Never invent a number.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Ticker or pair, e.g. XAUUSD, GC, BTC/USD, AAPL, EURUSD',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_cot',
      description:
        'Official CFTC Commitment of Traders via the ClearPath COT engine (cftc.gov). Gold, silver, oil, index futures. If the symbol has no CFTC map, say so.',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trader symbol e.g. XAUUSD, GC, CL, ES, SI' },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'read_open_charts',
      description:
        'Measured patterns on charts this member currently has open. Geometry only — possible/forming, never confirmed. Call this when they ask what the chart shows.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'where_am_i',
      description:
        'Where this member is in ClearPath right now (desk, home, charts, learn pages) so directions match the screen.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_encyclopedia',
      description:
        'Search ClearPath Encyclopedia of Finance, glossary, and Encyclopedia of Indicators. Use for definitions and teaching — not live prices.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Term or question, e.g. inflation, RSI, COT' },
        },
        required: ['query'],
      },
    },
  },
];

export function sanitizeBuddySymbol(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!SYMBOL_RE.test(s)) return null;
  return s;
}

export function describeClearPathLocation(pathname: string): {
  path: string;
  surface: string;
  directions: string;
} {
  const path = (pathname || '/').split('?')[0] || '/';
  const desk = parseDeskPath(path);
  if (desk) {
    const meta = TRADER_DESKS[desk];
    return {
      path,
      surface: `Trader desk — ${meta.title}`,
      directions: `${meta.tagline} Desk URL ${meta.href}. Charts and intel on this desk; not a brokerage.`,
    };
  }
  if (isDeskPath(path)) {
    return {
      path,
      surface: 'Trader desks',
      directions: 'Choose Institutional, Fundamental, Retail, or Neurodivergent from the desk bar.',
    };
  }
  const p = path.toLowerCase();
  if (p === '/' || p.startsWith('/?')) {
    return { path, surface: 'Home / terminal', directions: 'Main ClearPath hub. Open CHARTS, a trader desk, or C.P.T. from here.' };
  }
  if (p.startsWith('/encyclopedia')) {
    return { path, surface: 'Encyclopedia of Finance', directions: 'Deep finance library. Buddy can search entries with search_encyclopedia.' };
  }
  if (p.startsWith('/indicators')) {
    return { path, surface: 'Encyclopedia of Indicators', directions: 'Indicator directory. Buddy can look up indicator definitions.' };
  }
  if (p.startsWith('/literacy')) {
    return { path, surface: 'Literacy OS', directions: 'Personal learning desk — Thesis Vault, wiki, study tools. Education only.' };
  }
  if (p.startsWith('/education')) {
    return { path, surface: 'ClearPath Education', directions: 'Structured lessons and quizzes.' };
  }
  if (p.startsWith('/ceo')) {
    return { path, surface: 'CEO Dashboard', directions: 'Founder ops only — Daily Ops, budget, members. Chart patterns stay on MARKETS/CHARTS.' };
  }
  return {
    path,
    surface: 'ClearPath',
    directions: 'Use the top nav or mobile command center (WORK / LEARN / TOOLS / ACCOUNT).',
  };
}

function compactQuote(symbol: string, data: Record<string, unknown>): Record<string, unknown> {
  const price = Number(data.price ?? data.close);
  const prev = Number(data.previous_close);
  const pct = Number(data.percent_change ?? data.change_percent);
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'Quote had no usable price', symbol };
  }
  return {
    ok: true,
    source: 'twelvedata',
    symbol,
    price,
    previous_close: Number.isFinite(prev) ? prev : null,
    percent_change: Number.isFinite(pct) ? pct : null,
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : null,
    note: 'Educational last print from ClearPath market gateway. Not a trade signal.',
  };
}

export async function executeBuddyTool(
  name: string,
  argsJson: string,
  ctx: BuddyToolContext,
): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
  } catch {
    return JSON.stringify({ ok: false, error: 'Invalid tool arguments' });
  }

  try {
    if (name === 'get_quote') {
      const symbol = sanitizeBuddySymbol(args.symbol);
      if (!symbol) return JSON.stringify({ ok: false, error: 'Invalid symbol' });
      const apiKey = getTwelveDataApiKey();
      if (!apiKey) {
        return JSON.stringify({ ok: false, error: 'Twelve Data is not configured on this server' });
      }
      const data = (await getMarketQuote(symbol, apiKey)) as Record<string, unknown>;
      if (data && (data.status === 'error' || data.code === 401)) {
        return JSON.stringify({
          ok: false,
          error: String(data.message || 'Quote feed returned an error'),
          symbol,
        });
      }
      return JSON.stringify(compactQuote(symbol, data || {}));
    }

    if (name === 'get_cot') {
      const symbol = sanitizeBuddySymbol(args.symbol);
      if (!symbol) return JSON.stringify({ ok: false, error: 'Invalid symbol' });
      const pack = await fetchCftcLegacyHistory(symbol, { limit: 12 });
      if ('error' in pack) {
        return JSON.stringify({
          ok: false,
          error: pack.error,
          message: pack.message,
          symbol,
        });
      }
      const a = pack.analytics;
      return JSON.stringify({
        ok: true,
        source: pack.source,
        engine: pack.engine,
        contract: pack.contract,
        cftcCode: pack.cftcCode,
        cached: pack.cached,
        reportDate: a.reportDate,
        openInterest: a.openInterest,
        netCommercial: a.netCommercial,
        netLarge: a.netLarge,
        netManagedMoney: a.netManagedMoney,
        cotIndex52: a.cotIndex52,
        institutionalFlow: a.institutionalFlow,
        extremeCommercial: a.extremeCommercial,
        extremeLarge: a.extremeLarge,
        note: 'Official CFTC weekly positioning. Educational. Not a trade signal.',
      });
    }

    if (name === 'read_open_charts') {
      const text = (ctx.chartContext || '').trim();
      if (!text) {
        return JSON.stringify({
          ok: true,
          empty: true,
          hint: 'No live chart vision in this session. Ask them to open a chart on CHARTS or a trader desk.',
        });
      }
      return JSON.stringify({
        ok: true,
        empty: false,
        vision: text.slice(0, 4000),
        note: 'Geometry-measured only. Say possible or forming — never confirmed.',
      });
    }

    if (name === 'where_am_i') {
      return JSON.stringify({ ok: true, ...describeClearPathLocation(ctx.pagePath || '/') });
    }

    if (name === 'search_encyclopedia') {
      const query = typeof args.query === 'string' ? args.query : '';
      const hits = searchEncyclopedia(query);
      if (!hits.length) {
        return JSON.stringify({
          ok: true,
          hits: [],
          hint: 'No encyclopedia hit. Teach from general knowledge and say you could not find a ClearPath entry.',
        });
      }
      return JSON.stringify({ ok: true, hits });
    }

    return JSON.stringify({ ok: false, error: `Unknown tool ${name}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool failed';
    return JSON.stringify({ ok: false, error: message });
  }
}

export const BUDDY_LIVE_TOOLS_PROMPT = `
LIVE TOOLS (use them — do not guess numbers):
- get_quote: live last price
- get_cot: official CFTC positioning (ClearPath COT engine)
- read_open_charts: patterns on charts they have open now
- where_am_i: which ClearPath screen they are on
- search_encyclopedia: Finance encyclopedia, glossary, and indicator encyclopedia

If they ask a price, COT, what the chart shows, where they are, or what a term/indicator means — call the matching tool before you answer.
If a tool returns ok:false, say that feed is unavailable. Never invent prices, COT nets, or encyclopedia quotes.
Educational only. Not a brokerage. Not a signal.
`.trim();

export async function runBuddyWithLiveTools(params: {
  apiKey: string;
  messages: GroqChatMessage[];
  temperature: number;
  maxTokens: number;
  chartContext: string;
  pagePath: string;
}): Promise<{ answer: string; toolsUsed: string[] }> {
  const toolsUsed: string[] = [];
  const ctx: BuddyToolContext = {
    chartContext: params.chartContext || '',
    pagePath: params.pagePath || '/',
  };
  const messages: GroqChatMessage[] = [...params.messages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        tools: BUDDY_LIVE_TOOLS,
        tool_choice: 'auto',
      }),
    });
    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq API returned ${groqRes.status}: ${errText}`);
    }
    const data = await groqRes.json();
    const msg = data?.choices?.[0]?.message || {};
    const toolCalls = Array.isArray(msg.tool_calls) ? (msg.tool_calls as GroqToolCall[]) : [];
    const text = typeof msg.content === 'string' ? msg.content.trim() : '';

    if (!toolCalls.length) {
      return {
        answer: text || 'I want to answer you properly — try saying that again in your own words.',
        toolsUsed,
      };
    }

    messages.push({
      role: 'assistant',
      content: text || null,
      tool_calls: toolCalls.slice(0, MAX_TOOLS_PER_ROUND),
    });

    for (const call of toolCalls.slice(0, MAX_TOOLS_PER_ROUND)) {
      const name = String(call?.function?.name || '');
      if (name) toolsUsed.push(name);
      const result = await executeBuddyTool(name, String(call?.function?.arguments || '{}'), ctx);
      messages.push({
        role: 'tool',
        tool_call_id: String(call.id || ''),
        content: result,
      });
    }
  }

  return {
    answer:
      toolsUsed.length > 0
        ? 'I looked that up on ClearPath live feeds. Ask me again if you want me to read the quote, COT, or chart out loud.'
        : 'I want to answer you properly — try saying that again in your own words.',
    toolsUsed,
  };
}

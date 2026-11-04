// Search-intent guides: answer what traders actually type into Google / Bing / YouTube.
// Every product claim must match planCatalog FEATURE_ACCURACY and membershipPricing;
// scripts/intent-guides.selftest.ts enforces prohibited claims, prices, and length.

import type { GuideRecord } from './contentData';
import { MEMBERSHIP_PLANS } from '../content/membershipPricing';

const price = (id: string) => MEMBERSHIP_PLANS.find((p) => p.id === id)?.priceLabel ?? '';
const SILVER = price('silver');
const GOLD = price('gold');
const PLATINUM = price('platinum');

export const INTENT_DISCLAIMER =
  'Educational content only. Not financial advice. ClearPath Trader is not a brokerage.';

const footer = `### Important

${INTENT_DISCLAIMER} Trading involves risk of loss. Nothing on this page is a recommendation to buy or sell any instrument.`;

const PUBLISHED = '2026-11-01';

export const INTENT_GUIDE_RECORDS: Record<string, GuideRecord> = {
  'adhd-friendly-trading-charts': {
    id: 'adhd-friendly-trading-charts',
    title: 'ADHD-Friendly Trading Charts: Less Noise, Clearer Decisions',
    summary:
      'Why standard trading screens overload ADHD traders, what an ADHD-friendly chart layout looks like, and how ClearPath Trader’s free neurodivergent layouts cut clutter so the candles stay in focus.',
    keywords: [
      'ADHD trading',
      'ADHD friendly trading platform',
      'trading with ADHD',
      'ADHD charting software',
      'neurodivergent trading',
      'focus mode trading charts',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### Why most trading screens fight an ADHD brain

A typical trading terminal shows a chart, six indicator panes, a scrolling news ticker, a chat window, flashing order-book colors, and pop-up alerts — all at once. For a brain that is wired to notice novelty, every one of those elements competes for attention. The result is not more information; it is less decision quality. Traders with ADHD often describe the same pattern: they open a chart to check one level, follow a headline, jump to another ticker, and twenty minutes later have not looked at the level they came for.

That is a design problem, not a personal failing. Screens can be built to protect attention instead of harvesting it.

### What an ADHD-friendly chart layout actually changes

*   **Chart first.** The price chart owns most of the screen. News, alerts, and education panels are parked until you ask for them, instead of stacking on top of the candles.
*   **Fewer simultaneous colors.** Muted palettes and a single accent color make the current price and your key levels stand out without a wall of red and green.
*   **One task per view.** A focused view shows one instrument and the two or three tools you actually use, not every feature the platform owns.
*   **Predictable placement.** Controls stay in the same place every session, so you are not re-learning the screen each time you open it.
*   **Dopamine without chaos.** Clear progress cues and short learning loops reward attention without flashing noise.

### How ClearPath Trader approaches it

ClearPath Trader is a charting and education site with a dedicated [Neurodivergent desk](/desk/neurodivergent). Its sensory profiles are selectable presets, including [ADHD dopamine-balanced](/ui/adhd_dopamine_balanced), [ADHD hyperfocus](/ui/adhd_hyperfocus), [focus mode](/ui/focus_mode), and [calm focus](/ui/calm_focus). Each profile changes the layout and visual intensity of the same live charts rather than hiding them.

**Neurodivergent layouts are included on the free Basic plan.** You do not need a paid tier to use them. The desks open chart-first: secondary panels start parked in a held tray, so the candles are visible on the first visit.

### A simple routine that works with ADHD, not against it

1. Pick one instrument for the session and write down the one question you are trying to answer.
2. Open a focused profile so only the chart and your chosen tools are visible.
3. Mark your levels before you look at news. Headlines are easier to ignore once your plan is on the chart.
4. Set an alert at your level and close the screen. Let the alert bring you back instead of watching every tick.
5. Review in a short, fixed window — ten minutes — then stop.

Use the free [position size calculator](/tools/position-size) before every trade so risk is decided while you are calm, not in the moment.

${footer}`,
    faqs: [
      {
        question: 'Is there a trading platform designed for people with ADHD?',
        answer:
          'Some charting sites now offer neurodivergent layouts. ClearPath Trader has a Neurodivergent desk with selectable sensory profiles, including ADHD dopamine-balanced and ADHD hyperfocus presets, and these layouts are included on the free Basic plan.',
      },
      {
        question: 'Why is trading harder with ADHD?',
        answer:
          'Most terminals show many moving elements at once — tickers, alerts, chat, flashing colors — which competes for attention. Reducing on-screen noise and deciding risk in advance helps many ADHD traders make calmer decisions.',
      },
      {
        question: 'Do I have to pay for ADHD-friendly layouts on ClearPath Trader?',
        answer: 'No. Neuro-divergent layouts are part of the free Basic plan.',
      },
    ],
  },

  'autism-and-sensory-friendly-trading-platform': {
    id: 'autism-and-sensory-friendly-trading-platform',
    title: 'Autism and Sensory-Friendly Trading Charts: Predictable, Low-Stimulation Layouts',
    summary:
      'How sensory overload affects autistic and sensory-sensitive traders, what predictable low-stimulation chart design looks like, and the sensory profiles available free on ClearPath Trader.',
    keywords: [
      'autism trading platform',
      'sensory friendly trading',
      'low stimulation charts',
      'dyslexia friendly trading',
      'accessible trading platform',
      'neurodivergent traders',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### Sensory load is a real trading cost

Bright red and green flashes, auto-playing video, sudden pop-ups, and layouts that rearrange themselves are tiring for many autistic and sensory-sensitive people. When a screen is physically uncomfortable to look at, it is harder to read price structure calmly. Accessibility in trading is not about simplifying the market — it is about removing the friction between you and the information.

### What predictable, low-stimulation design means

*   **Stable layout.** Panels do not jump, resize, or reorder without you asking.
*   **Calm color.** Reduced saturation and fewer simultaneous colors, with an option to avoid the standard red/green pairing entirely.
*   **No surprise motion.** Animation is minimal and never required to understand the data.
*   **Readable text.** Spacing and type choices that help readers with dyslexia, plus options that reduce numeric overload for dyscalculia.
*   **An emergency exit.** A one-step way to drop to the quietest possible view when you are overloaded.

### Sensory profiles on ClearPath Trader

ClearPath Trader’s [Neurodivergent desk](/desk/neurodivergent) offers selectable profiles. Examples include [autism predictable](/ui/autism_predictable), [low-stim emergency](/ui/low_stim_emergency), [dyslexia readable](/ui/dyslexia_readable), [dyscalculia numeric relief](/ui/dyscalculia_numeric_relief), [visual processing safe](/ui/visual_processing_safe), [auditory processing assist](/ui/apd_assist), [executive function support](/ui/executive_function_support), and [motor friendly](/ui/motor_friendly). The full list is on the [UI profiles page](/ui).

These profiles are presentation presets over the same charts and data — you are not using a reduced or separate product. **Neurodivergent layouts are included on the free Basic plan.** Read more about our approach on the [accessibility page](/accessibility).

### Practical tips for a calmer session

1. Choose your profile before market open so you are not adjusting settings under pressure.
2. Keep one chart per window until the layout feels comfortable, then add more.
3. Use alerts instead of constant watching; let the platform notify you at your level.
4. Learn terms at your own pace in the [glossary](/glossary) and [literacy section](/literacy), which are plain text and easy to read with assistive tools.

${footer}`,
    faqs: [
      {
        question: 'What is a sensory-friendly trading platform?',
        answer:
          'One that lets you reduce visual intensity, avoid sudden motion, keep a stable layout, and switch to a quiet view when overloaded, without losing access to the underlying chart data.',
      },
      {
        question: 'Does ClearPath Trader support dyslexia and dyscalculia?',
        answer:
          'ClearPath Trader includes dyslexia-readable and dyscalculia numeric-relief profiles on its Neurodivergent desk, alongside autism-predictable and low-stimulation profiles.',
      },
      {
        question: 'Are the sensory profiles free?',
        answer: 'Yes. Neuro-divergent layouts are included on the free Basic plan.',
      },
    ],
  },

  'tradingview-alternative-for-beginners': {
    id: 'tradingview-alternative-for-beginners',
    title: 'Looking for a TradingView Alternative? An Honest Comparison for Beginners',
    summary:
      'When a large, feature-dense charting platform is the right choice, when a simpler chart-first tool fits better, and an honest look at where ClearPath Trader differs — including price and what it does not do.',
    keywords: [
      'TradingView alternative',
      'TradingView alternative free',
      'simple charting platform',
      'charting software for beginners',
      'cheap TradingView alternative',
      'trading charts for beginners',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### Start with the honest answer

TradingView is a large, mature charting platform with a huge community, a scripting language (Pine Script), and a very wide range of markets and tools. If you rely on community scripts, publish ideas, or need a specific broker integration, it is a strong choice and switching may not make sense.

People usually search for an alternative for one of three reasons: the screen feels overwhelming, the price of the tier they want is more than they want to spend while learning, or they want more structured education alongside the chart. Those are the cases this page is about.

### What to compare when choosing a charting platform

*   **Cognitive load.** How much is on screen by default, and can you turn it down?
*   **Learning support.** Does the platform teach you what you are looking at, or assume you already know?
*   **Pattern help.** Does it mark common chart patterns for you, and does it explain them?
*   **Price at the tier you need.** Compare the specific features you will use, not the headline plan.
*   **Data honesty.** Does the platform show a clear "unavailable" state when a data source is missing, instead of filling the gap?

### Where ClearPath Trader is different

*   **Chart-first desks.** Four desks — Institutional, Fundamental, Retail, and [Neurodivergent](/desk/neurodivergent) — open with the chart taking most of the screen and secondary panels parked until needed.
*   **Free neurodivergent layouts.** Sensory profiles for ADHD, autism, dyslexia, and more are on the free Basic plan.
*   **Automatic pattern overlay.** The Gold plan (${GOLD}/month) marks major chart patterns such as wedges, triangles, double tops and bottoms, and cup-and-handle, plus common candlestick patterns. See [automatic chart pattern recognition](/guides/automatic-chart-pattern-recognition).
*   **Education built in.** An [encyclopedia](/encyclopedia), [glossary](/glossary), [indicator library](/indicators), and [education hub](/education) sit next to the charts.
*   **Plain pricing.** Basic is free, Silver is ${SILVER}/month, Gold is ${GOLD}/month, and Platinum is ${PLATINUM}/month. Full details are on the [plans page](/plans).

### What ClearPath Trader does not do

ClearPath Trader is **not a brokerage**: it does not hold your money or place trades on an exchange for you. It does not have a public scripting language like Pine Script or a social idea feed on the scale of the largest platforms. Where a data source is not connected, it shows the field as unavailable rather than guessing.

### Who should try it

Beginners who want fewer distractions and more explanation, neurodivergent traders who need calmer layouts, and anyone who wants pattern marking at a lower monthly price. Start on the free plan and compare side by side with the tool you use today.

${footer}`,
    faqs: [
      {
        question: 'Is there a free TradingView alternative?',
        answer:
          'ClearPath Trader has a free Basic plan with one chart per window, five basic indicators, basic drawing tools, up to three alerts, and neurodivergent layouts. Whether it replaces another platform depends on which features you rely on.',
      },
      {
        question: 'Is ClearPath Trader better than TradingView?',
        answer:
          'It depends on what you need. TradingView has a far larger community and a scripting language. ClearPath Trader focuses on chart-first, lower-clutter desks, free neurodivergent layouts, built-in education, and automatic pattern overlay on the Gold plan.',
      },
      {
        question: 'Can I place trades on ClearPath Trader?',
        answer:
          'No. ClearPath Trader is an analytics and education platform, not a brokerage. It does not hold funds or execute orders on an exchange.',
      },
    ],
  },

  'automatic-chart-pattern-recognition': {
    id: 'automatic-chart-pattern-recognition',
    title: 'Automatic Chart Pattern Recognition: How Pattern Scanners Work and Their Limits',
    summary:
      'How automatic chart pattern detection finds wedges, triangles, double tops, cup-and-handle, and candlestick patterns from price data, why no scanner predicts the future, and how ClearPath Trader’s pattern overlay works.',
    keywords: [
      'automatic chart pattern recognition',
      'chart pattern scanner',
      'pattern recognition software trading',
      'auto draw chart patterns',
      'candlestick pattern scanner',
      'technical analysis patterns',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### What a pattern scanner actually does

A chart pattern is a repeatable shape in price — highs and lows that line up into a triangle, a wedge, or two matching peaks. A pattern scanner looks at the candles (open, high, low, close), finds the swing highs and swing lows, and tests whether those points fit the geometry of a known pattern. When they fit, it draws the lines on the chart so you can see the structure instead of hunting for it.

This is geometry, not prophecy. A scanner tells you *what shape price has made*. It cannot tell you what price will do next.

### Common patterns a scanner can detect

#### Chart patterns

*   **Rising and falling wedges** — converging trendlines that slope in the same direction.
*   **Ascending, descending, and symmetrical triangles** — a flat or sloping boundary meeting a converging one.
*   **Broadening formations** — diverging trendlines where swings get wider.
*   **Double tops and double bottoms** — two tests of the same level that fail to break it.
*   **Cup and handle** — a rounded base followed by a smaller pullback.

#### Candlestick patterns

*   **Doji, hammer, and hanging man** — single candles that show indecision or rejection.
*   **Bullish and bearish engulfing** — a candle whose body covers the previous one.
*   **Morning star and evening star** — three-candle turning structures.
*   **Three white soldiers and three black crows** — three strong candles in one direction.

### The limits every trader should know

1. **Patterns fail.** A completed triangle can break either way. Treat a pattern as a hypothesis with an invalidation level.
2. **Context matters.** The same double top means something different in a strong uptrend than in a range.
3. **Timeframe changes the answer.** A pattern on a 5-minute chart and a daily chart are different trades.
4. **Detection is not confirmation.** Wait for your own entry criteria and size the position before acting — the [position size calculator](/tools/position-size) helps.

### How it works on ClearPath Trader

ClearPath Trader detects patterns natively from price geometry — it is not imported from another platform’s scripts, and it does not draw harmonic or Fibonacci patterns it cannot measure reliably. The **pattern overlay is part of the Gold plan (${GOLD}/month)**. An AI pattern scanner on the Platinum plan (${PLATINUM}/month) is in progress and not yet complete. Learn each pattern in plain language in the [indicator library](/indicators) and [encyclopedia](/encyclopedia).

${footer}`,
    faqs: [
      {
        question: 'Can software automatically draw chart patterns?',
        answer:
          'Yes. Pattern scanners find swing highs and lows in price data and test whether they fit a known shape such as a triangle, wedge, or double top, then draw the lines on the chart.',
      },
      {
        question: 'Are automatic chart patterns accurate?',
        answer:
          'Detection can be accurate about the shape price has made, but no pattern guarantees the next move. Patterns fail regularly, so traders use them with an invalidation level and defined risk.',
      },
      {
        question: 'Which ClearPath plan includes pattern overlay?',
        answer: `Pattern overlay is included on the Gold plan at ${GOLD} per month and on Platinum.`,
      },
    ],
  },

  'low-cost-charting-software': {
    id: 'low-cost-charting-software',
    title: 'Low-Cost Charting Software: What You Get for Free, $6, $10, and $15 a Month',
    summary:
      'A plain breakdown of what traders actually need from charting software at each price point, which features are worth paying for while you learn, and exactly what each ClearPath Trader plan includes.',
    keywords: [
      'cheap charting software',
      'free charting software',
      'affordable trading platform',
      'low cost stock charts',
      'charting platform pricing',
      'free stock charts with indicators',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### What you actually need while learning

Most new traders pay for features they do not use yet. Before choosing a plan, list what you will touch every week. For most learners that is: one or two clean charts, a handful of indicators, drawing tools for support and resistance, a few alerts, and good explanations. Multi-chart grids, dozens of indicators, and automation matter later.

### What each price point should buy you

*   **Free:** enough to learn the basics on one chart — a few indicators, basic drawing, a handful of alerts.
*   **Around $6/month:** multiple charts, unlimited alerts and watchlists, intraday charts, and no ads.
*   **Around $10/month:** every indicator and help spotting patterns.
*   **Around $15/month:** unlimited charts and experimental automation.

### ClearPath Trader plans, exactly

#### Basic — Free

One chart per window, five basic indicators, basic drawing tools, up to three alerts, up to five watchlists, seven years of historical data where the data provider supplies it, neurodivergent layouts, and paper trading.

#### Silver — ${SILVER}/month

Four charts per window, fifteen indicators, all drawing tools, unlimited alerts and watchlists, intraday charts, market replay, black-out mode, no ads, the education hub, and the [encyclopedia of finance](/encyclopedia).

#### Gold — ${GOLD}/month

Ten charts per window, all indicators, and the automatic [pattern overlay](/guides/automatic-chart-pattern-recognition).

#### Platinum — ${PLATINUM}/month

Unlimited charts. An AI pattern scanner and bot support are in progress on this tier and are not yet complete.

See the live [plans page](/plans) for current details and trial terms.

### Hidden costs to check on any platform

*   **Data fees.** Some platforms charge extra for real-time exchange data on top of the plan price. Check what is delayed and what is live.
*   **Annual-only discounts.** A low monthly figure may require paying a full year up front.
*   **Feature caps.** Indicator limits per chart, alert expiry, and saved-layout limits often push you to upgrade sooner than expected.
*   **Upsells inside the product.** Add-on scripts, signal packs, or premium chat rooms can cost more than the platform itself.
*   **Brokerage tie-ins.** "Free" charts funded by order flow can nudge you toward trading more often. ClearPath Trader is not a brokerage and does not earn from your trades.

### How to decide

1. Start free and use it for two weeks.
2. Upgrade only when you hit a limit you feel every day — usually chart count or alerts.
3. Pay for pattern overlay once you understand the patterns well enough to judge them yourself.

Whatever you use, decide risk before you trade with the free [position size calculator](/tools/position-size).

${footer}`,
    faqs: [
      {
        question: 'What is the cheapest charting software with good indicators?',
        answer: `ClearPath Trader has a free Basic plan with five basic indicators, and Silver at ${SILVER} per month adds fifteen indicators, four charts per window, unlimited alerts, and intraday charts.`,
      },
      {
        question: 'Is free charting software good enough for beginners?',
        answer:
          'Often yes. One clean chart, a few indicators, drawing tools, and alerts cover most of what a beginner uses. Upgrade when a limit gets in your way every day.',
      },
      {
        question: 'How much does ClearPath Trader cost?',
        answer: `Basic is free. Silver is ${SILVER}/month, Gold is ${GOLD}/month, and Platinum is ${PLATINUM}/month.`,
      },
    ],
  },

  'how-to-read-candlestick-charts': {
    id: 'how-to-read-candlestick-charts',
    title: 'How to Read Candlestick Charts: A Beginner’s Step-by-Step Guide',
    summary:
      'Learn what each part of a candlestick means, how to read a sequence of candles, the handful of patterns worth knowing first, and the mistakes beginners make when reading charts.',
    keywords: [
      'how to read candlestick charts',
      'candlestick chart for beginners',
      'reading stock charts',
      'candlestick patterns explained',
      'how to read trading charts',
      'learn technical analysis',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### The four prices in every candle

Each candlestick summarizes trading over one period — one minute, one hour, one day. It shows four prices:

*   **Open:** the first traded price of the period.
*   **Close:** the last traded price of the period.
*   **High:** the highest price reached.
*   **Low:** the lowest price reached.

The thick part is the **body**, drawn between the open and close. The thin lines above and below are the **wicks** (or shadows), reaching to the high and low. If the close is above the open, the candle is usually drawn hollow or green; if below, filled or red. Colors are a setting, not a rule — calmer palettes work just as well.

### Reading one candle

*   **Long body, short wicks:** one side controlled the whole period.
*   **Small body, long wicks:** price traveled far but ended near where it started — indecision.
*   **Long lower wick:** sellers pushed price down and buyers pushed it back up — rejection of lower prices.
*   **Long upper wick:** buyers pushed up and sellers pushed back down — rejection of higher prices.

### Reading a sequence

One candle is a sentence; a sequence is a paragraph. Look for:

1. **Direction:** are highs and lows stepping up, stepping down, or moving sideways?
2. **Momentum:** are bodies getting bigger in the trend direction, or shrinking?
3. **Levels:** where has price turned more than once? Those areas often matter again.

### Five candlestick patterns to learn first

*   **Doji** — open and close nearly equal; indecision.
*   **Hammer** — small body near the top, long lower wick after a decline.
*   **Bullish and bearish engulfing** — a body that fully covers the prior body.
*   **Morning star and evening star** — three-candle reversal shapes.

Detailed definitions are in the [glossary](/glossary) and [indicator library](/indicators).

### Common beginner mistakes

1. Trading a single candle without looking at the trend and nearby levels.
2. Ignoring the timeframe — a daily hammer and a one-minute hammer are not the same signal.
3. Skipping risk. Decide your stop and size first with the [position size calculator](/tools/position-size).

You can practice on live charts with the free Basic plan, and Gold members can turn on automatic [pattern overlay](/guides/automatic-chart-pattern-recognition) to check their reads.

${footer}`,
    faqs: [
      {
        question: 'What do the colors on a candlestick chart mean?',
        answer:
          'By default, a green or hollow candle closed higher than it opened and a red or filled candle closed lower. Colors are a display setting and can be changed to calmer palettes.',
      },
      {
        question: 'What is the wick on a candlestick?',
        answer:
          'The wick, or shadow, is the thin line above or below the body. It shows the highest and lowest prices reached during that period.',
      },
      {
        question: 'Which candlestick patterns should beginners learn first?',
        answer:
          'Start with the doji, hammer, bullish and bearish engulfing, and morning and evening star. Always read them in the context of trend and nearby price levels.',
      },
    ],
  },

  'how-to-calculate-position-size': {
    id: 'how-to-calculate-position-size',
    title: 'How to Calculate Position Size: The 1% Risk Rule With Worked Examples',
    summary:
      'A step-by-step method for sizing any trade from your account balance, risk percentage, and stop distance, with worked stock and forex examples and a free calculator.',
    keywords: [
      'position size calculator',
      'how to calculate position size',
      '1 percent risk rule',
      'risk management trading',
      'forex lot size calculator',
      'stop loss position sizing',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### Why position size matters more than entries

Two traders can take the exact same trade and get very different results because one risked 1% of the account and the other risked 20%. Position sizing is how you make sure no single loss can do serious damage. It is the one part of trading you fully control.

### The formula

$$
Position size = (Account balance × Risk %) ÷ (Entry price − Stop price)
$$

*   **Account balance:** the money in your trading account.
*   **Risk %:** how much of the account you accept losing if the stop is hit. Many educators suggest 1% or less while learning.
*   **Stop distance:** the gap between your entry and your stop-loss.

### Worked example: a stock

Account balance $5,000. Risk 1% = $50. Entry $40.00, stop $38.00, so the stop distance is $2.00 per share.

$$
$50 ÷ $2.00 = 25 shares
$$

If the stop is hit, the loss is about $50 before fees and slippage.

### Worked example: forex

Account balance $2,000. Risk 1% = $20. Stop distance 25 pips. On a standard pair priced in USD, one micro lot is worth roughly $0.10 per pip.

$$
$20 ÷ (25 pips × $0.10) = 8 micro lots
$$

Pip values vary by pair and account currency, so always confirm with your broker’s contract specifications.

### Choosing your risk percentage

There is no single correct number, but the maths of losing streaks is unforgiving. At 1% risk per trade, ten losses in a row leave roughly 90% of the account. At 10% risk, the same streak leaves about 35%, and you would need nearly a 190% gain just to get back to where you started. Smaller risk buys you time to learn.

*   **Learning or testing a new idea:** 0.25%–0.5% per trade.
*   **Following a tested plan:** many educators cite 1% as a ceiling.
*   **Several open trades at once:** count them together. Five trades at 1% each is 5% of the account at risk.

### Why "same number of shares every time" fails

Buying 100 shares on every trade sounds simple, but a stock with a $0.50 stop and a stock with a $5.00 stop carry ten times different risk at the same share count. Sizing from the stop distance keeps the dollar risk constant, so one wide-stop trade cannot wipe out the gains from several tight ones. Some traders set the stop using recent volatility — for example a multiple of the Average True Range — and then size from that distance.

### Rules that keep sizing honest

1. Place the stop where the trade idea is wrong, *then* size — never move the stop to fit a bigger position.
2. Include fees and possible slippage, especially on fast markets.
3. Lower your risk percentage after a losing streak, not higher.
4. Never risk money you cannot afford to lose.

### Use the free calculator

ClearPath Trader’s [position size calculator](/tools/position-size) is free and works without an account. Enter your balance, risk percentage, entry, and stop to get the size instantly. For more on managing exposure, read the [leverage and risk guide](/guides/leverage-risk).

${footer}`,
    faqs: [
      {
        question: 'What is the 1% rule in trading?',
        answer:
          'The 1% rule means sizing each trade so that, if your stop-loss is hit, you lose no more than 1% of your account balance.',
      },
      {
        question: 'How do I calculate position size with a stop-loss?',
        answer:
          'Multiply your account balance by your risk percentage to get the dollar risk, then divide by the distance between your entry price and stop price.',
      },
      {
        question: 'Is the ClearPath position size calculator free?',
        answer: 'Yes. It is free to use and does not require an account.',
      },
    ],
  },

  'how-to-spot-trading-signal-scams': {
    id: 'how-to-spot-trading-signal-scams',
    title: 'How to Spot Trading Signal and Course Scams Before You Pay',
    summary:
      'The warning signs of fake trading signal groups, “guaranteed profit” courses, and recruitment schemes, the questions to ask before paying anyone, and how to learn trading without hype.',
    keywords: [
      'trading signal scam',
      'forex signals scam',
      'trading course scam',
      'how to spot trading scams',
      'trading MLM',
      'learn trading without scams',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### Why trading attracts scams

Trading combines fast money, private results, and a lot of people who want to learn quickly. That makes it easy to sell screenshots, lifestyle videos, and “secret” systems that cannot be checked. Most of these offers make money from new subscribers and recruits, not from trading.

### Ten warning signs

1. **Guaranteed returns.** No legitimate source can guarantee trading profits.
2. **“Risk-free” language.** All trading carries risk of loss.
3. **Screenshots instead of verified records.** A screenshot of a winning trade proves nothing about the losing ones.
4. **Pressure to join now.** Countdown timers and “only 3 spots left” are sales tactics.
5. **Pay to recruit.** If you earn more by signing up friends than by learning, it is a recruitment business.
6. **Requests to send money to a private account** or to a “manager” who trades for you.
7. **Unregistered advice.** In many countries, managing money or giving personalized investment advice requires a license.
8. **Lifestyle marketing.** Cars and travel are not a track record.
9. **No explanation of losses.** Real education spends as much time on risk as on wins.
10. **Copy-only signals with no reasoning.** If you cannot learn why a trade was taken, you are renting someone else’s judgment.

### Questions to ask before paying anyone

*   Can I see a full, independently verified track record, including losing periods?
*   Is this person or company registered with a financial regulator where I live?
*   What happens to my money — does anyone else ever have access to it?
*   Do I earn anything by recruiting others?
*   Will I understand *why* each idea is taken, so I can eventually do it myself?

### Learning without hype

Build skill you can check yourself: learn to read [candlestick charts](/guides/how-to-read-candlestick-charts), size every trade with a [position size calculator](/tools/position-size), and study terms in a neutral [glossary](/glossary) and [encyclopedia](/encyclopedia). ClearPath Trader’s position is simple: education over hype. It is an analytics and education platform, **not a brokerage and not a signal service** — it does not hold your money or tell you what to buy.

If you think you have been targeted by an investment scam, contact your national financial regulator or consumer protection agency.

${footer}`,
    faqs: [
      {
        question: 'Are trading signal groups a scam?',
        answer:
          'Not all of them, but many make money from subscriptions and recruitment rather than trading. Be wary of guaranteed returns, unverifiable screenshots, pressure tactics, and any request to send money to a private account.',
      },
      {
        question: 'How can I tell if a trading course is legitimate?',
        answer:
          'Look for a verified track record that includes losses, clear risk education, no guaranteed returns, no recruitment incentives, and teaching that explains the reasoning behind each idea.',
      },
      {
        question: 'Does ClearPath Trader sell trading signals?',
        answer:
          'No. ClearPath Trader is an analytics and education platform. It is not a brokerage or a signal service and does not tell members what to buy or sell.',
      },
    ],
  },

  'charting-platform-landscape': {
    id: 'charting-platform-landscape',
    title: 'Charting Platform Landscape: Major Tools Traders Compare in 2026',
    summary:
      'A neutral map of the charting terminals, broker workstations, scanners, and research tools traders name when shopping for software — grouped by job-to-be-done, with links and an honest note on where ClearPath Trader fits.',
    keywords: [
      'charting platform comparison',
      'trading software list',
      'best charting platforms',
      'TradingView competitors',
      'NinjaTrader alternative',
      'MetaTrader alternative charting',
      'thinkorswim vs web charts',
      'order flow software comparison',
    ],
    publishDate: PUBLISHED,
    updatedDate: PUBLISHED,
    content: `### Why this list exists

Traders rarely choose software in a vacuum. They compare the terminal they already know against a short list of names friends, forums, and ads repeat. This page is that short list — **33 charting, execution, and research products** ClearPath hears in support and search data — organized by what each tool is trying to do. It is not a ranked scoreboard. We do not have live engagement metrics for other companies inside ClearPath, and we will not invent them.

If you want a focused TradingView comparison, read [Looking for a TradingView Alternative?](/guides/tradingview-alternative-for-beginners). If you want ClearPath pricing and features, see [plans](/plans).

### Web charting, screeners, and trader social

These tools open in a browser (or mobile app) and prioritize fast access to charts and community or scan lists.

*   **[TradingView](https://www.tradingview.com/)** — Large web chart library, Pine Script, ideas feed, and many broker bridges.
*   **[Investing.com charts](https://www.investing.com/charts/)** — Free charts sitting next to macro news and an economic calendar.
*   **[StockCharts](https://stockcharts.com/)** — Long-running web charting with scan lists and commentary culture.
*   **[Finviz](https://finviz.com/)** — Equity heatmaps and screeners with lightweight charts.
*   **[Webull](https://www.webull.com/)** — Brokerage-first experience with integrated mobile charting.
*   **[Stocktwits](https://stocktwits.com/)** — Ticker social stream adjacent to price action (not a full terminal).

### Desktop and professional charting

Installed platforms for multi-monitor traders, often futures or equities focused, with deeper customization and data feeds sold separately.

*   **[NinjaTrader](https://ninjatrader.com/)**, **[Sierra Chart](https://www.sierrachart.com/)**, **[MultiCharts](https://www.multicharts.com/)**, **[TradeStation](https://www.tradestation.com/)**, **[eSignal](https://www.esignal.com/)**, **[TC2000](https://www.worden.com/)**, **[Optuma](https://www.optuma.com/)**, **[AmiBroker](https://www.amibroker.com/)** — Each targets active discretionary or systematic traders who want local performance, vendor-specific indicators, or broker-dealer bundles.

### FX and CFD stacks

Retail foreign exchange often ships inside MetaTrader or proprietary bank platforms.

*   **[cTrader](https://ctrader.com/)**, **[MetaTrader 4](https://www.metatrader4.com/)**, **[MetaTrader 5](https://www.metatrader5.com/)**, **[FXCM](https://www.fxcm.com/)**, **[OANDA](https://www.oanda.com/)** — Charting is bundled with execution and account services from the broker.

### Broker workstations and institutional execution

These are licensed broker or prop interfaces — charts serve order entry, options analytics, or futures routing.

*   **[thinkorswim (Schwab)](https://www.schwab.com/trading/thinkorswim)**, **[Interactive Brokers TWS](https://www.interactivebrokers.com/en/trading/tws.php)**, **[Tradovate](https://www.tradovate.com/)**, **[Trading Technologies (TT)](https://www.tradingtechnologies.com/)** — Depth varies from retail options tools to institutional futures stacks.

### Automation, scanning, and order-flow specialty tools

*   **[TrendSpider](https://trendspider.com/)** and **[Tickeron](https://tickeron.com/)** — Automated trendlines, scanners, and marketed AI pattern ideas (always verify claims against your own rules).
*   **[Quantower](https://www.quantower.com/)**, **[Bookmap](https://bookmap.com/)**, **[ATAS](https://atas.net/)** — DOM, footprint, and liquidity visualization for traders who read microstructure.

### Research terminals and crypto hubs

*   **[Bloomberg Terminal](https://www.bloomberg.com/professional/products/bloomberg-terminal/)**, **[Barchart](https://www.barchart.com/)**, **[Koyfin](https://www.koyfin.com/)** — Macro, futures, and equity research adjacent to charting.
*   **[Coinigy](https://www.coinigy.com/)** and **[Cryptowatch](https://cryptowatch.kraken.com/)** — Multi-exchange crypto charting.

### How ClearPath Trader fits (honestly)

ClearPath Trader is a **chart-first analytics and education site**, not a brokerage. It emphasizes calmer default layouts — including free [neurodivergent desks](/desk/neurodivergent) — built-in [education](/education), and optional [automatic pattern overlay](/guides/automatic-chart-pattern-recognition) on paid tiers. It does **not** replace Pine Script communities, MetaTrader expert advisors, institutional TT stacks, or Bloomberg-grade macro data. Where a vendor feed is missing, fields stay **DATA UNAVAILABLE** instead of being guessed.

Pass-through broker OAuth (Alpaca-first) is designed for the same model chart platforms use with licensed brokers: you maintain the brokerage account; ClearPath remains the interface. The Platform Scope page (site footer) explains the compliance framing.

### Tracking competitors in Metricool (founder ops)

Social analytics tools such as [Metricool](https://metricool.com/) do **not** accept “NinjaTrader” as an abstract competitor. You add each brand’s **public Facebook Page, Instagram professional account, or YouTube channel** under Analytics → Competitors. ClearPath keeps the canonical product list in data/marketing/chart-platform-competitors.json and the CEO Marketing Department exports it for Metricool setup. Engagement numbers from Metricool are **not** shown inside ClearPath until an approved API connection exists — the site lists names and categories only.

### Choosing among them

Match software to the job:

1. **Learning phase** — favor lower clutter and explainers ([neurodivergent layouts](/desk/neurodivergent), [glossary](/glossary)).
2. **Automation phase** — favor platforms with a scripting language or backtest stack you already know (Pine, EasyLanguage, AFL, etc.).
3. **Execution phase** — favor the broker workstation that actually holds your account, not a separate chart that cannot route orders.
4. **Microstructure phase** — order-flow tools only pay off if you have the data feed quality and screen time to use them.

Run trials side by side on the **same symbol and session** before paying annual licenses.

${footer}`,
    faqs: [
      {
        question: 'How many charting platforms are on this list?',
        answer:
          'Thirty-three products across web charting, desktop terminals, FX platforms, broker workstations, scanners, order-flow tools, research terminals, and crypto hubs. The list lives in ClearPath marketing data and updates when the founder adds or removes names.',
      },
      {
        question: 'Does ClearPath Trader replace MetaTrader or thinkorswim?',
        answer:
          'No. MetaTrader and thinkorswim are broker-centric execution stacks with their own ecosystems. ClearPath Trader focuses on chart-first analytics and education and does not hold customer funds.',
      },
      {
        question: 'Where do Metricool competitor metrics appear on ClearPath?',
        answer:
          'They do not appear in the product UI yet. Metricool tracks public social accounts you configure there. ClearPath publishes this landscape page and the JSON catalog for SEO and founder setup; live competitor engagement stays DATA UNAVAILABLE until an approved Metricool API export is connected.',
      },
    ],
  },
};

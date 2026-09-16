/**
 * TradingView-style pass-through broker model — canonical copy.
 * ClearPath is NEVER a broker-dealer; licensed partners execute and custody.
 */

export const PASS_THROUGH_MODEL_ID = 'tradingview-pass-through-oauth' as const;

export const NEVER_BROKER_DEALER =
  'ClearPath Trader is not a broker-dealer, introducing broker, or exchange — now or in the future. We will never hold customer funds or securities.';

export const PASS_THROUGH_SUMMARY =
  'Optional OAuth connects your existing account at a licensed broker (Alpaca first). You authorize the link; orders you submit from the chart are sent to that broker. Same pass-through model as TradingView + Alpaca.';

export const PASS_THROUGH_ORDER_DISCLAIMER =
  'Orders are executed by your connected licensed broker, not by ClearPath. You are responsible for every submission. Not investment advice.';

export const DESK_PASS_THROUGH_FOOTER =
  'Chart interface only — not a broker-dealer. Connected orders pass through to your licensed broker.';

export const BROKER_STATUS_NOTE =
  'ClearPath is not a broker-dealer. When you connect, you authorize your existing licensed broker account; orders route to them.';

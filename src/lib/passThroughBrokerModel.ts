/**
 * TradingView-style pass-through broker model — canonical copy.
 * ClearPath is NEVER a broker-dealer; licensed partners execute and custody.
 */

export const PASS_THROUGH_MODEL_ID = 'tradingview-pass-through-oauth' as const;

export const NEVER_BROKER_DEALER =
  'ClearPath Trader is not a broker-dealer, introducing broker, or exchange — now or in the future. We will never hold customer funds or securities.';

export const PASS_THROUGH_SUMMARY =
  'Optional: link your brokerage account. You authorize the link at your licensed broker. Orders you submit from the chart are sent to that broker. That broker holds the money. ClearPath is only the screen.';

export const PASS_THROUGH_ORDER_DISCLAIMER =
  'Orders are executed by your connected licensed broker, not by ClearPath. You are responsible for every submission. Not investment advice.';

export const DESK_PASS_THROUGH_FOOTER =
  'Chart interface only — not a broker-dealer. Connected orders pass through to your licensed broker.';

/** Alpaca's required OAuth authorization disclosure (OAuth DDQ v3). Shown before every connect. */
export const OAUTH_APP_NAME = 'ClearPath Trader';
export const ALPACA_AUTHORIZE_DISCLOSURE = {
  title: `Authorize ${OAUTH_APP_NAME}`,
  grant: `By allowing ${OAUTH_APP_NAME} to access your Alpaca account, you are granting ${OAUTH_APP_NAME} access to your account information and authorization to place transactions at your direction.`,
  warranty: `Alpaca does not warrant or guarantee that ${OAUTH_APP_NAME} will work as advertised or expected. Before authorizing, learn more about ${OAUTH_APP_NAME}.`,
  learnMoreHref: '/brokers#how-it-works',
} as const;

export const BROKER_STATUS_NOTE =
  'ClearPath is not a broker-dealer. When you connect, you authorize your existing licensed broker account; orders route to them.';

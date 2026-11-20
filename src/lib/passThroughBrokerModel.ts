/**
 * TradingView-style pass-through broker model — canonical copy.
 * ClearPath is NEVER a broker-dealer; licensed partners execute and custody.
 */

export const PASS_THROUGH_MODEL_ID = 'tradingview-pass-through-oauth' as const;

export const NEVER_BROKER_DEALER =
  'ClearPath Trader is not a broker-dealer, introducing broker, or exchange — now or in the future. We will never hold customer funds or securities.';

export const PASS_THROUGH_SUMMARY =
  'Licensed broker pass-throughs are listed for a later connection. No brokerage account is connected, and ClearPath does not send orders.';

export const PASS_THROUGH_ORDER_DISCLAIMER =
  'No order is sent. Broker pass-throughs are not connected. Not investment advice.';

export const DESK_PASS_THROUGH_FOOTER =
  'Chart interface only — not a broker-dealer. Broker pass-throughs are visible and not connected.';

export const BROKER_STATUS_NOTE =
  'Pass-throughs are available to review. No brokerage account is connected, and no orders are sent. ClearPath is not a broker-dealer.';

export const BROKER_PASS_THROUGH_DISABLED_CODE = 'BROKER_PASS_THROUGH_DISABLED' as const;

export const BROKER_PASS_THROUGH_DISABLED_MESSAGE =
  'Broker pass-throughs are not connected. No authorization or order is sent.';

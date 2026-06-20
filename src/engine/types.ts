export type MarketData = {
  symbol: string;
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  time?: number;
  volume?: number;
};

export type ProviderSymbol = {
  providerSymbol: string;
  category: string;
};

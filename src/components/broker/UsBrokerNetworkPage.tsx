import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Landmark,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Unplug,
  WalletCards,
} from 'lucide-react';
import { disconnectAlpaca, startAlpacaConnect } from '../../api/brokerConnect';
import { useAuth } from '../../contexts/FirebaseContext';
import { useBrokerConnection } from '../../hooks/useBrokerConnection';
import {
  BROKER_STATUS_NOTE,
  NEVER_BROKER_DEALER,
  PASS_THROUGH_ORDER_DISCLAIMER,
} from '../../lib/passThroughBrokerModel';
import { US_BROKER_CATALOG, type UsBrokerCard } from '../../content/usBrokerCatalog';
import './usBrokerNetwork.css';

const PAGE_PATH = '/brokers';

function BrokerLogo({ broker }: { broker: UsBrokerCard }) {
  return (
    <div className={`broker-logo-locker broker-logo-locker--${broker.logoSurface}`}>
      <img src={broker.logo} alt={`${broker.name} official logo`} loading="lazy" decoding="async" />
    </div>
  );
}

export default function UsBrokerNetworkPage() {
  const { user } = useAuth();
  const { loading, alpaca, account, refresh } = useBrokerConnection(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('broker');
    if (result === 'alpaca_connected') {
      setMessage('Alpaca authorization complete. Your broker remains the executing and custody firm.');
      void refresh();
    } else if (result === 'denied') {
      setError('Broker authorization was cancelled. No account was connected.');
    } else if (result === 'error') {
      setError('The broker connection could not be completed. Try again or contact support.');
    }
  }, [refresh]);

  const connectedCount = alpaca?.connected ? 1 : 0;
  const availableCount = useMemo(
    () => US_BROKER_CATALOG.filter((broker) => broker.integration === 'available').length,
    [],
  );

  const connectAlpaca = () => {
    setBusy(true);
    setError('');
    startAlpacaConnect(PAGE_PATH);
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Alpaca from ClearPath? This does not close or change your brokerage account.')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await disconnectAlpaca();
      await refresh();
      setMessage('Alpaca disconnected. Your brokerage account was not changed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect Alpaca.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="broker-network">
      <Helmet>
        <title>US Broker Connections | ClearPath Trader</title>
        <meta
          name="description"
          content="Connect an existing United States brokerage account to ClearPath through secure broker-authorized pass-through integrations."
        />
        <link rel="canonical" href="https://clearpathtrader.com/brokers" />
      </Helmet>

      <a href="#broker-network-main" className="cp-skip-link">
        Skip to broker connections
      </a>

      <header className="broker-network__topbar">
        <a href={user ? '/desk/institutional' : '/'} className="broker-network__brand">
          <span className="broker-network__brand-mark">CP</span>
          <span>
            <strong>ClearPath Trader</strong>
            <small>Broker connections</small>
          </span>
        </a>
        <nav aria-label="Broker connection navigation">
          <a href={user ? '/desk/institutional' : '/'} className="broker-quiet-button">
            <ArrowLeft size={16} aria-hidden="true" />
            {user ? 'Institutional desk' : 'Home'}
          </a>
        </nav>
      </header>

      <main id="broker-network-main">
        <section className="broker-hero" aria-labelledby="broker-hero-title">
          <div className="broker-hero__copy">
            <p className="broker-kicker">
              <span aria-hidden="true" />
              United States broker network
            </p>
            <h1 id="broker-hero-title">
              Your broker.
              <br />
              <span>Your account.</span>
              <br />
              One ClearPath interface.
            </h1>
            <p className="broker-hero__lede">
              Link an account you already own at a licensed brokerage. ClearPath provides the chart and order
              interface; your broker authorizes the connection, holds the assets, and executes every order.
            </p>
            <div className="broker-hero__actions">
              <a href="#broker-grid" className="broker-primary-button">
                <WalletCards size={18} aria-hidden="true" />
                Explore brokers
              </a>
              <a href="#how-it-works" className="broker-secondary-button">
                How pass-through works
              </a>
            </div>
          </div>

          <div className="broker-hero__status" aria-label="Connection overview">
            <div className="broker-status-orbit" aria-hidden="true">
              <div className="broker-status-orbit__ring" />
              <div className="broker-status-orbit__core">
                <Landmark size={38} />
              </div>
              <span className="broker-status-orbit__dot broker-status-orbit__dot--one" />
              <span className="broker-status-orbit__dot broker-status-orbit__dot--two" />
              <span className="broker-status-orbit__dot broker-status-orbit__dot--three" />
            </div>
            <div className="broker-hero__metrics">
              <div>
                <strong>{US_BROKER_CATALOG.length}</strong>
                <span>US firms mapped</span>
              </div>
              <div>
                <strong>{availableCount}</strong>
                <span>Connection available</span>
              </div>
              <div>
                <strong>{connectedCount}</strong>
                <span>Connected now</span>
              </div>
            </div>
            <p>
              <ShieldCheck size={16} aria-hidden="true" />
              Broker credentials and tokens stay server-side and encrypted.
            </p>
          </div>
        </section>

        <section className="broker-trust-strip" aria-label="Pass-through safeguards">
          <div>
            <LockKeyhole size={18} aria-hidden="true" />
            <span>
              <strong>OAuth authorization</strong>
              No brokerage password stored
            </span>
          </div>
          <div>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>
              <strong>Licensed execution</strong>
              Orders go to your broker
            </span>
          </div>
          <div>
            <Landmark size={18} aria-hidden="true" />
            <span>
              <strong>Broker custody</strong>
              ClearPath never holds funds
            </span>
          </div>
        </section>

        {(message || error) && (
          <div className={`broker-notice ${error ? 'broker-notice--error' : ''}`} role="status">
            {error || message}
          </div>
        )}

        <section className="broker-directory" aria-labelledby="broker-directory-title">
          <div className="broker-section-heading">
            <div>
              <p className="broker-kicker">
                <span aria-hidden="true" />
                Connection directory
              </p>
              <h2 id="broker-directory-title">Choose your brokerage</h2>
            </div>
            <button
              type="button"
              className="broker-quiet-button"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'broker-spin' : ''} aria-hidden="true" />
              Refresh status
            </button>
          </div>

          <div id="broker-grid" className="broker-grid">
            {US_BROKER_CATALOG.map((broker) => {
              const isAlpaca = broker.id === 'alpaca';
              const connected = isAlpaca && Boolean(alpaca?.connected);
              const configured = isAlpaca && Boolean(alpaca?.configured);
              return (
                <article className={`broker-card ${connected ? 'broker-card--connected' : ''}`} key={broker.id}>
                  <div className="broker-card__top">
                    <BrokerLogo broker={broker} />
                    <span
                      className={`broker-state broker-state--${
                        connected ? 'connected' : configured ? 'ready' : 'planned'
                      }`}
                    >
                      {connected ? 'Connected' : configured ? 'Ready' : isAlpaca ? 'Setup required' : 'Planned'}
                    </span>
                  </div>
                  <div className="broker-card__body">
                    <h3>{broker.name}</h3>
                    <p className="broker-card__legal">{broker.legalName}</p>
                    <div className="broker-card__assets">
                      {broker.assetClasses.map((assetClass) => (
                        <span key={assetClass}>{assetClass}</span>
                      ))}
                    </div>
                    <p className="broker-card__note">
                      {connected && account
                        ? `${account.status || 'Active'} account · ${account.currency || 'USD'} · broker custody`
                        : broker.note}
                    </p>
                  </div>
                  <div className="broker-card__footer">
                    {isAlpaca && connected ? (
                      <button
                        type="button"
                        className="broker-disconnect-button"
                        onClick={() => void disconnect()}
                        disabled={busy}
                      >
                        <Unplug size={15} aria-hidden="true" />
                        Disconnect
                      </button>
                    ) : isAlpaca && configured && user ? (
                      <button
                        type="button"
                        className="broker-connect-button"
                        onClick={connectAlpaca}
                        disabled={busy}
                      >
                        Connect securely
                        <ExternalLink size={15} aria-hidden="true" />
                      </button>
                    ) : isAlpaca && !user ? (
                      <a href="/" className="broker-connect-button">
                        Sign in to connect
                        <ExternalLink size={15} aria-hidden="true" />
                      </a>
                    ) : isAlpaca ? (
                      <span className="broker-planned-label">
                        <LockKeyhole size={14} aria-hidden="true" />
                        Server keys required
                      </span>
                    ) : (
                      <span className="broker-planned-label">
                        <Check size={14} aria-hidden="true" />
                        Provider review
                      </span>
                    )}
                    <a
                      href={broker.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="broker-source-link"
                      aria-label={`${broker.name} official source`}
                    >
                      {broker.sourceLabel}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="broker-how" aria-labelledby="broker-how-title">
          <div className="broker-section-heading">
            <div>
              <p className="broker-kicker">
                <span aria-hidden="true" />
                Controlled handoff
              </p>
              <h2 id="broker-how-title">How pass-through works</h2>
            </div>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Choose a supported broker</h3>
                <p>ClearPath sends you to the brokerage’s authorization screen. We never ask for its password.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Approve the connection</h3>
                <p>The broker issues a revocable token. ClearPath encrypts it and keeps it on the server.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Review before sending</h3>
                <p>You explicitly acknowledge each pass-through order. Nothing is placed silently.</p>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <h3>Your broker executes</h3>
                <p>The licensed brokerage receives the order and remains responsible for execution and custody.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="broker-disclosure" aria-label="Broker connection disclosure">
          <ShieldCheck size={24} aria-hidden="true" />
          <div>
            <strong>{NEVER_BROKER_DEALER}</strong>
            <p>{BROKER_STATUS_NOTE} {PASS_THROUGH_ORDER_DISCLAIMER}</p>
            <p className="broker-disclosure__marks">
              Broker names and logos belong to their respective owners. Appearance in this directory does not imply
              endorsement or an active integration. Every logo shown is an unmodified file from the firm’s official
              website or published brand kit.
            </p>
          </div>
        </section>
      </main>

      <footer className="broker-network__footer">
        <span>ClearPath Trader</span>
        <span>Chart interface · broker-authorized execution · no custody</span>
      </footer>
    </div>
  );
}


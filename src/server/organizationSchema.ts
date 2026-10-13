import {
  ORG_BASE_URL,
  ORG_FOUNDING_DATE,
  ORG_JURISDICTION_LABEL,
  ORG_LEGAL_NAME,
  ORG_SAME_AS,
} from '../content/organizationPublic';
import { PUBLIC_LEADERS, FOUNDER_LEADER } from '../content/leadershipPublic';
import {
  PRODUCT_DISAMBIGUATION,
  PRODUCT_KNOWS_ABOUT,
  PRODUCT_WHAT_IT_IS,
} from '../content/productIdentity';

export function organizationSchema(baseUrl: string = ORG_BASE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'ClearPathTrader',
    legalName: ORG_LEGAL_NAME,
    alternateName: ['Clear Path Markets Science Corp.', 'ClearPath Trader', 'ClearPathTrader.com'],
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: PRODUCT_WHAT_IT_IS,
    disambiguatingDescription: PRODUCT_DISAMBIGUATION,
    knowsAbout: PRODUCT_KNOWS_ABOUT,
    foundingDate: ORG_FOUNDING_DATE,
    foundingLocation: {
      '@type': 'Place',
      name: ORG_JURISDICTION_LABEL,
    },
    sameAs: [...ORG_SAME_AS],
    founder: { '@id': `${baseUrl}/#${FOUNDER_LEADER.schemaKey}` },
  };
}

export function personSchema(leader: (typeof PUBLIC_LEADERS)[number], baseUrl: string = ORG_BASE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${baseUrl}/#${leader.schemaKey}`,
    name: leader.displayName,
    jobTitle: leader.jobTitle,
    image: `${baseUrl}${leader.imageUrl}`,
    url: `${baseUrl}${leader.id === 'richard-floyd' ? '/press' : `/meet-the-board#${leader.id}`}`,
    worksFor: { '@id': `${baseUrl}/#organization` },
    ...(leader.roleLine ? { description: leader.roleLine } : {}),
  };
}

export function leadershipPersonSchemas(baseUrl: string = ORG_BASE_URL) {
  return PUBLIC_LEADERS.map((l) => personSchema(l, baseUrl));
}

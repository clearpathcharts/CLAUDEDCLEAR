/**
 * Publication hub: favorites are https bookmarks; translator URLs stay on Google Translate.
 * Run: npx tsx scripts/publication-hub.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  favoriteFromForm,
  favoriteFromPublication,
  googleTranslatePageUrl,
  matchesHubFilters,
  parseFavoriteHomepage,
  parseStoredFavorites,
  upsertFavorite,
} from '../src/lib/ywc/publicationHub.ts';
import { MAGAZINE_PUBLICATIONS, toPublicationCard } from '../src/server/magazineRack.ts';
import {
  AGE_BANDS,
  EARLY_ADULT_AGENTS,
  GAY_MEN_AGENTS,
  LATER_LIFE_AGENTS,
  QUEER_WOMEN_AGENTS,
  REPUBLICAN_MEN_AGENTS,
  REPUBLICAN_WOMEN_AGENTS,
  DEMOCRAT_MEN_AGENTS,
  DEMOCRAT_WOMEN_AGENTS,
  INTEREST_DESKS,
  agentsFor,
  allCatalogSources,
  isFetchableKind,
  isOptInDesk,
  orientationForDesk,
  politicsForDesk,
} from '../src/lib/ywc/interestCatalog.ts';

assert.equal(parseFavoriteHomepage('https://www.out.com/'), 'https://www.out.com/');
assert.equal(parseFavoriteHomepage('http://www.out.com/'), null);
assert.equal(parseFavoriteHomepage('javascript:alert(1)'), null);
assert.equal(parseFavoriteHomepage('https://127.0.0.1/'), null);
assert.equal(parseFavoriteHomepage('https://localhost/mag'), null);
assert.equal(parseFavoriteHomepage('https://user:pass@evil.example/'), null);

const formOk = favoriteFromForm({
  title: '  My Desk  ',
  homepage: 'https://www.theatlantic.com/politics/',
  audienceAge: 'adult',
  orientation: 'general',
  politics: 'left',
});
assert.ok(formOk);
assert.equal(formOk.title, 'My Desk');
assert.equal(formOk.homepage, 'https://www.theatlantic.com/politics/');

assert.equal(
  favoriteFromForm({
    title: 'Nope',
    homepage: 'http://insecure.example/',
    audienceAge: 'adult',
    orientation: 'general',
    politics: 'center',
  }),
  null,
);

const them = MAGAZINE_PUBLICATIONS.find((p) => p.id === 'them');
assert.ok(them);
assert.equal(them.orientation, 'lgbtq');
assert.equal(them.audienceAge, 'adult');
const starred = favoriteFromPublication(toPublicationCard(them));
assert.equal(starred.homepage, 'https://www.them.us/');

const nr = MAGAZINE_PUBLICATIONS.find((p) => p.id === 'national-review');
assert.ok(nr);
assert.equal(nr.politics, 'right');

const tv = MAGAZINE_PUBLICATIONS.find((p) => p.id === 'teen-vogue');
assert.ok(tv);
assert.equal(tv.audienceAge, 'young-adult');

assert.ok(
  MAGAZINE_PUBLICATIONS.every(
    (p) => p.audienceAge && p.orientation && p.politics && p.homepage.startsWith('https://'),
  ),
);
assert.ok(MAGAZINE_PUBLICATIONS.some((p) => p.orientation === 'lgbtq'));
assert.ok(MAGAZINE_PUBLICATIONS.some((p) => p.politics === 'left'));
assert.ok(MAGAZINE_PUBLICATIONS.some((p) => p.politics === 'right'));
assert.ok(MAGAZINE_PUBLICATIONS.some((p) => p.politics === 'center'));

assert.equal(
  googleTranslatePageUrl('https://www.wired.com/', 'es'),
  'https://translate.google.com/translate?sl=auto&tl=es&u=https%3A%2F%2Fwww.wired.com%2F',
);
assert.equal(googleTranslatePageUrl('https://www.wired.com/', 'en'), 'https://www.wired.com/');
assert.equal(googleTranslatePageUrl('javascript:alert(1)', 'es'), 'javascript:alert(1)');

assert.equal(
  matchesHubFilters(
    { title: 'Out', homepage: 'https://www.out.com/', audienceAge: 'adult', orientation: 'lgbtq', politics: 'nonpartisan' },
    { title: 'out', audienceAge: 'any', orientation: 'lgbtq', politics: 'any' },
  ),
  true,
);
assert.equal(
  matchesHubFilters(
    { title: 'Out', homepage: 'https://www.out.com/', audienceAge: 'adult', orientation: 'lgbtq', politics: 'nonpartisan' },
    { title: '', audienceAge: 'any', orientation: 'general', politics: 'any' },
  ),
  false,
);

const stored = parseStoredFavorites([
  { id: 'x', title: 'Good', homepage: 'https://reason.com/', audienceAge: 'adult', orientation: 'general', politics: 'right' },
  { title: 'Bad', homepage: 'http://reason.com/', audienceAge: 'adult', orientation: 'general', politics: 'right' },
]);
assert.equal(stored.length, 1);
assert.equal(stored[0].title, 'Good');

const merged = upsertFavorite(stored, starred);
assert.equal(merged[0].id, starred.id);
assert.ok(merged.some((f) => f.homepage === 'https://reason.com/'));

assert.equal(AGE_BANDS.length, 6);
assert.equal(EARLY_ADULT_AGENTS.length, 35);
assert.equal(LATER_LIFE_AGENTS.length, 35);
assert.equal(GAY_MEN_AGENTS.length, 15);
assert.equal(QUEER_WOMEN_AGENTS.length, 15);
assert.equal(REPUBLICAN_MEN_AGENTS.length, 15);
assert.equal(REPUBLICAN_WOMEN_AGENTS.length, 15);
assert.equal(DEMOCRAT_MEN_AGENTS.length, 15);
assert.equal(DEMOCRAT_WOMEN_AGENTS.length, 15);
assert.equal(agentsFor('19-22', 'everyone').length, 35);
assert.equal(agentsFor('58-80', 'everyone').length, 35);
assert.equal(agentsFor('19-22', 'gay-men').length, 15);
assert.equal(agentsFor('58-80', 'queer-women').length, 15);
assert.equal(agentsFor('30-38', 'republican-men').length, 15);
assert.equal(agentsFor('58-80', 'republican-women').length, 15);
assert.equal(agentsFor('23-29', 'democrat-men').length, 15);
assert.equal(agentsFor('49-57', 'democrat-women').length, 15);
assert.equal(isOptInDesk('everyone'), false);
assert.equal(isOptInDesk('republican-men'), true);
assert.equal(isOptInDesk('democrat-women'), true);
assert.equal(isOptInDesk('gay-men'), true);
assert.equal(orientationForDesk('republican-men'), 'general');
assert.equal(orientationForDesk('democrat-men'), 'general');
assert.equal(orientationForDesk('queer-women'), 'lgbtq');
assert.equal(politicsForDesk('republican-women'), 'right');
assert.equal(politicsForDesk('democrat-men'), 'left');
assert.equal(politicsForDesk('everyone'), 'nonpartisan');
assert.ok(REPUBLICAN_MEN_AGENTS.some((a) => a.sources.some((s) => s.homepage.includes('foxnews.com'))));
assert.ok(REPUBLICAN_WOMEN_AGENTS.some((a) => a.sources.some((s) => s.homepage.includes('eviemagazine.com'))));
assert.ok(DEMOCRAT_MEN_AGENTS.some((a) => a.sources.some((s) => s.homepage.includes('msnbc.com'))));
assert.ok(DEMOCRAT_WOMEN_AGENTS.some((a) => a.sources.some((s) => s.homepage.includes('thecut.com'))));
assert.deepEqual(
  DEMOCRAT_MEN_AGENTS.map((a) => a.sources[0].homepage),
  [
    'https://www.msnbc.com/',
    'https://www.motherjones.com/',
    'https://www.vox.com/',
    'https://www.propublica.org/',
    'https://aflcio.org/',
    'https://grist.org/',
    'https://www.aclu.org/',
    'https://arstechnica.com/',
    'https://www.bloomberg.com/citylab',
    'https://www.fastcompany.com/',
    'https://www.nerdwallet.com/',
    'https://electrek.co/',
    'https://www.espn.com/',
    'https://pitchfork.com/',
    'https://www.polygon.com/',
  ],
);
assert.deepEqual(
  DEMOCRAT_WOMEN_AGENTS.map((a) => a.sources[0].homepage),
  [
    'https://www.msnbc.com/',
    'https://www.thecut.com/',
    'https://www.plannedparenthood.org/',
    'https://www.jezebel.com/',
    'https://www.romper.com/',
    'https://www.edweek.org/',
    'https://www.apartmenttherapy.com/',
    'https://www.aclu.org/',
    'https://www.self.com/',
    'https://www.bonappetit.com/',
    'https://www.refinery29.com/',
    'https://herfirst100k.com/',
    'https://www.score.org/',
    'https://www.afar.com/',
    'https://bookriot.com/',
  ],
);
assert.equal(DEMOCRAT_WOMEN_AGENTS[2].sources[0].kind, 'organization');
assert.ok(DEMOCRAT_WOMEN_AGENTS[2].watches.includes('not medical advice'));
assert.equal(INTEREST_DESKS[0].id, 'everyone');
assert.equal(politicsForDesk('democrat-women'), 'left');
assert.equal(orientationForDesk('democrat-women'), 'general');

const catalog = allCatalogSources();
assert.ok(catalog.length > 40);
assert.ok(catalog.every((s) => s.homepage.startsWith('https://')));
assert.ok(
  catalog.filter((s) => s.kind === 'app').every((s) => s.id === 'grindr' || s.id === 'her'),
);
assert.ok(
  catalog.filter((s) => s.kind === 'app').every((s) => !isFetchableKind(s.kind)),
  'dating apps are never RSS-fetched',
);

console.log('publication-hub.selftest: ok');

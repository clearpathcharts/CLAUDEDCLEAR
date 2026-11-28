/**
 * One crawlable <h1> per document.
 *
 * index.html ships a static #seo-document-h1 outside #root so non-JS crawlers always
 * see a heading. SPA subpages (/about, /plans, /brokers, ...) render their own <h1>
 * inside #root, which made two <h1>s once React mounted. This guard demotes the static
 * heading to a <p> while the app owns an <h1>, and restores it when the app has none
 * (home, desks, dashboards), so the live DOM always has exactly one.
 */

const HEADING_ID = 'seo-document-h1';
const ROOT_ID = 'root';

function copyAttributes(from: Element, to: Element) {
  for (const attr of Array.from(from.attributes)) {
    to.setAttribute(attr.name, attr.value);
  }
}

function swapTag(doc: Document, el: Element, tag: 'h1' | 'p') {
  const next = doc.createElement(tag);
  copyAttributes(el, next);
  while (el.firstChild) next.appendChild(el.firstChild);
  if (tag === 'p') next.setAttribute('data-seo-h1-demoted', '1');
  else next.removeAttribute('data-seo-h1-demoted');
  el.replaceWith(next);
}

export function reconcileDocumentH1(doc: Document = document): void {
  const heading = doc.getElementById(HEADING_ID);
  const root = doc.getElementById(ROOT_ID);
  if (!heading || !root) return;

  const appOwnsH1 = root.querySelector('h1') !== null;
  const isH1 = heading.tagName === 'H1';

  if (appOwnsH1 && isH1) swapTag(doc, heading, 'p');
  else if (!appOwnsH1 && !isH1) swapTag(doc, heading, 'h1');
}

/** Keeps the document at one <h1> as the SPA renders and navigates. Returns a cleanup. */
export function installDocumentH1Guard(doc: Document = document): () => void {
  const root = doc.getElementById(ROOT_ID);
  const view = doc.defaultView;
  if (!root || !view || typeof view.MutationObserver !== 'function') return () => {};

  let scheduled = false;
  const run = () => {
    scheduled = false;
    reconcileDocumentH1(doc);
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(run);
  };

  const observer = new view.MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  reconcileDocumentH1(doc);
  return () => observer.disconnect();
}

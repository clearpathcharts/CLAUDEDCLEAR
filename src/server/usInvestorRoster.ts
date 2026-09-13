/**
 * Public US investor roster — firms with official websites only.
 * No invented emails. No personal inboxes. Overlay imports can grow this
 * without a new image (Firestore + local overlay).
 *
 * Format per line: id|name|kind|website|linkedin
 * kind = vc | seed | angel | accelerator | ib
 */
import { SEED_ANGEL_CSV } from "./usInvestorRosterSeedAngels";
export type RosterKind = "vc" | "seed" | "angel" | "accelerator" | "ib";

export type InvestorRosterRow = {
  id: string;
  name: string;
  kind: RosterKind;
  website: string;
  linkedin?: string;
  outreachEmail?: string;
};

const ROSTER_CSV = `
500global|500 Global|seed|https://500.co
a16z|Andreessen Horowitz|vc|https://a16z.com
accel|Accel|vc|https://www.accel.com
acorns|Acorns Ventures|vc|https://www.acorns.com
advent|Advent International|vc|https://www.adventinternational.com
allianceofangels|Alliance of Angels|angel|https://www.allianceofangels.com
allencompany|Allen & Company|ib|https://www.allenandcompany.com
altos|Altos Ventures|vc|https://www.altos.vc
amplify|Amplify Partners|seed|https://www.amplifypartners.com
andreessen|Andreessen Horowitz Crypto|vc|https://a16zcrypto.com
angelcapitalassociation|Angel Capital Association|angel|https://www.angelcapitalassociation.org
angellist|AngelList|angel|https://www.angellist.com
anthos|Anthos Capital|vc|https://www.anthoscapital.com
architectcap|Architect Capital|vc|https://www.architectcap.com
atlantaangels|Atlanta Technology Angels|angel|https://www.angelatlanta.com
austinventures|Austin Ventures|vc|https://www.austinventures.com
bairdib|Robert W. Baird|ib|https://www.rwbaird.com
baincapventures|Bain Capital Ventures|vc|https://www.baincapitalventures.com
bancoftamerica|BofA Securities|ib|https://business.bofa.com
bandofangels|Band of Angels|angel|https://www.bandangels.com
barclaysib|Barclays Investment Bank|ib|https://www.ib.barclays
battery|Battery Ventures|vc|https://www.battery.com
bcap|B Capital|vc|https://www.bcapgroup.com
beaconangels|Beacon Angels|angel|https://www.beaconangels.com
benchmark|Benchmark|vc|https://www.benchmark.com
benfranklin|Ben Franklin Technology Partners|seed|https://www.benfranklin.org
bessemer|Bessemer Venture Partners|vc|https://www.bvp.com
bettertomorrow|Better Tomorrow Ventures|vc|https://www.btv.capital
bloombergbeta|Bloomberg Beta|vc|https://www.bloombergbeta.com
bluetree|BlueTree Allied Angels|angel|https://www.bluetreealliedangels.com
bmoib|BMO Capital Markets|ib|https://www.bmocm.com
boldstart|Boldstart Ventures|seed|https://www.boldstart.vc
bondcap|Bond Capital|vc|https://www.bondcap.com
bostonharbor|Boston Harbor Angels|angel|https://www.bostonharborangels.com
bowery|Bowery Capital|seed|https://www.bowerycap.com
boxgroup|BoxGroup|seed|https://www.boxgroup.com
breakthroughenergy|Breakthrough Energy Ventures|vc|https://www.breakthroughenergy.org
briley|B. Riley Securities|ib|https://www.brileyfin.com
canaccord|Canaccord Genuity|ib|https://www.canaccordgenuity.com
canapi|Canapi Ventures|vc|https://www.canapi.com
capitalg|CapitalG|vc|https://capitalg.com
centerview|Centerview Partners|ib|https://www.centerviewpartners.com
centraltexasangel|Central Texas Angel Network|angel|https://www.centraltexasangelnetwork.com
chicagoventures|Chicago Ventures|vc|https://www.chicagoventures.com
citiib|Citi Global Markets|ib|https://www.citigroup.com
coatue|Coatue Management|vc|https://www.coatue.com
cowboy|Cowboy Ventures|seed|https://www.cowboy.vc
craft|Craft Ventures|vc|https://www.craftventures.com
craig-hallum|Craig-Hallum|ib|https://www.craig-hallum.com
crosslink|Crosslink Capital|vc|https://www.crosslinkcapital.com
crv|Charles River Ventures|vc|https://www.crv.com
dadavidson|D.A. Davidson|ib|https://www.dadavidson.com
dcvc|DCVC|vc|https://www.dcvc.com
desertangels|Desert Angels|angel|https://www.desertangels.org
deutscheib|Deutsche Bank|ib|https://www.db.com
draper|Draper Associates|seed|https://www.draper.vc
drivecapital|Drive Capital|vc|https://www.drivecapital.com
emergence|Emergence Capital|vc|https://www.emcap.com
eniac|Eniac Ventures|seed|https://www.eniac.vc
evercore|Evercore|ib|https://www.evercore.com
felicis|Felicis|vc|https://www.felicis.com
fflpartners|F-Prime Capital|vc|https://fprimecapital.com
fifththird|Fifth Third Securities|ib|https://www.53.com
firstcitizens|First Citizens / SVB|ib|https://www.svb.com
floodgate|Floodgate|seed|https://www.floodgate.com
flybridge|Flybridge|seed|https://www.flybridge.com
forerunner|Forerunner Ventures|vc|https://www.forerunnerventures.com
formation8|GGV Capital|vc|https://www.ggvc.com
founderscollective|Founder Collective|seed|https://www.foundercollective.com
foundersfund|Founders Fund|vc|https://foundersfund.com
foundationcap|Foundation Capital|vc|https://foundationcap.com
fprime|F-Prime Capital Partners|vc|https://www.fprimecapital.com
freestyle|Freestyle Capital|seed|https://www.freestyle.vc
freshtracks|FreshTracks Capital|seed|https://www.freshtrackscap.com
ftpartners|FT Partners|ib|https://www.ftpartners.com
fuelcapital|Fuel Capital|seed|https://www.fuelcapital.com
generatalantic|General Atlantic|vc|https://www.generalatlantic.com
generalcatalyst|General Catalyst|vc|https://www.generalcatalyst.com
ggv|GGV|vc|https://www.ggv.com
goldenseeds|Golden Seeds|angel|https://www.goldenseeds.com
goldman|Goldman Sachs|ib|https://www.goldmansachs.com
gradient|Gradient Ventures|vc|https://www.gradient.com
greenoaks|Greenoaks|vc|https://www.greenoaks.com
greycroft|Greycroft|vc|https://www.greycroft.com
greylock|Greylock Partners|vc|https://greylock.com
guggenheim|Guggenheim Securities|ib|https://www.guggenheimpartners.com
gv|GV|vc|https://www.gv.com
harriswilliams|Harris Williams|ib|https://www.harriswilliams.com
headline|Headline|vc|https://headline.com
highland|Highland Capital Partners|vc|https://www.hcp.com
houlihan|Houlihan Lokey|ib|https://www.hl.com
houstonangels|Houston Angel Network|angel|https://www.houstonangelnetwork.org
hubangels|Hub Angels Investment Group|angel|https://www.hubangels.com
humancapital|Human Capital|vc|https://www.human.capital
hydepark|Hyde Park Angels|angel|https://www.hydeparkangels.com
ia_ventures|IA Ventures|vc|https://www.iaventures.com
iconventures|Icon Ventures|vc|https://www.iconventures.com
indexventures|Index Ventures|vc|https://www.indexventures.com
industryventures|Industry Ventures|vc|https://www.industryventures.com
innovationendeavors|Innovation Endeavors|vc|https://www.innovationendeavors.com
inqtel|In-Q-Tel|vc|https://www.iqt.org
insightpartners|Insight Partners|vc|https://www.insightpartners.com
intelcapital|Intel Capital|vc|https://www.intel.com/content/www/us/en/intel-capital/overview.html
ivp|Institutional Venture Partners|vc|https://www.ivp.com
javelin|Javelin Venture Partners|vc|https://www.javelinvp.com
jefferies|Jefferies|ib|https://www.jefferies.com
jpmorganib|J.P. Morgan|ib|https://www.jpmorgan.com
jumpcapital|Jump Capital|vc|https://www.jumpcap.com
keiretsu|Keiretsu Forum|angel|https://www.keiretsuforum.com
keybanc|KeyBanc Capital Markets|ib|https://www.key.com
khosla|Khosla Ventures|vc|https://www.khoslaventures.com
kindred|Kindred Ventures|seed|https://www.kindredventures.com
kleiner|Kleiner Perkins|vc|https://www.kleinerperkins.com
launchpadvg|Launchpad Venture Group|angel|https://www.launchpadventuregroup.com
lazard|Lazard|ib|https://www.lazard.com
leadedge|Lead Edge Capital|vc|https://www.leadedge.com
leftlane|Left Lane Capital|vc|https://www.leftlanecap.com
lerer|Lerer Hippeau|seed|https://www.lererhippeau.com
lightspeed|Lightspeed Venture Partners|vc|https://lsvp.com
lincolnintl|Lincoln International|ib|https://www.lincolninternational.com
liontree|LionTree|ib|https://www.liontree.com
lux|Lux Capital|vc|https://www.luxcapital.com
m12|M12|vc|https://m12.microsoft.com
madrona|Madrona Venture Group|vc|https://www.madrona.com
maineangels|Maine Angels|angel|https://www.maineangels.org
massmedical|Mass Medical Angels|angel|https://www.massmedicalangels.com
matrix|Matrix Partners|vc|https://www.matrix.vc
maveron|Maveron|vc|https://www.maveron.com
mayfield|Mayfield|vc|https://www.mayfield.com
menlo|Menlo Ventures|vc|https://www.menlovc.com
meritech|Meritech Capital|vc|https://www.meritechcapital.com
miamiangels|Miami Angels|angel|https://www.miamiangels.co
mizuhous|Mizuho Americas|ib|https://www.mizuhogroup.com
moelis|Moelis & Company|ib|https://www.moelis.com
morganstanley|Morgan Stanley|ib|https://www.morganstanley.com
nca|New York Angels|angel|https://www.newyorkangels.com
nea|New Enterprise Associates|vc|https://www.nea.com
needham|Needham & Company|ib|https://www.needhamco.com
nextview|NextView Ventures|seed|https://www.nextview.vc
northcoast|North Coast Angel Fund|angel|https://www.northcoastangelfund.com
norwest|Norwest Venture Partners|vc|https://www.norwest.com
ohiotechangels|Ohio TechAngels|angel|https://www.ohiotechangels.com
oppenheimer|Oppenheimer & Co|ib|https://www.opco.com
openview|OpenView|vc|https://openviewpartners.com
owner|Owner|vc|https://www.owner.com
pacific8|Pacific 8 Ventures|vc|https://www.pacific8.com
pantera|Pantera Capital|vc|https://panteracapital.com
paradigm|Paradigm|vc|https://www.paradigm.xyz
pasadenaangels|Pasadena Angels|angel|https://www.pasadenaangels.com
perellaw|Perella Weinberg Partners|ib|https://www.pwpartners.com
pipersandler|Piper Sandler|ib|https://www.pipersandler.com
pjt|PJT Partners|ib|https://www.pjtpartners.com
playground|Playground Global|vc|https://www.playground.global
point72v|Point72 Ventures|vc|https://www.point72.com
polaris|Polaris Partners|vc|https://www.polarispartners.com
portage|Portage|vc|https://www.portage.vc
prelude|Prelude Ventures|vc|https://www.preludeventures.com
primaryvc|Primary Venture Partners|vc|https://www.primary.vc
qatalyst|Qatalyst Partners|ib|https://www.qatalyst.com
queencity|Queen City Angels|angel|https://www.qca.com
raine|The Raine Group|ib|https://www.raine.com
raymondjames|Raymond James|ib|https://www.raymondjames.com
rbccm|RBC Capital Markets|ib|https://www.rbccm.com
redpoint|Redpoint Ventures|vc|https://www.redpoint.com
revolution|Revolution|vc|https://www.revolution.com
ridge|Ridge Ventures|vc|https://www.ridge.vc
riot|Riot Ventures|vc|https://www.riotventures.com
roth|Roth Capital|ib|https://www.roth.com
rothschildus|Rothschild & Co|ib|https://www.rothschildandco.com
rre|RRE Ventures|vc|https://www.rre.com
salesforcev|Salesforce Ventures|vc|https://www.salesforce.com/company/ventures
samsungnext|Samsung Next|vc|https://www.samsungnext.com
sandhillangels|Sand Hill Angels|angel|https://www.sandhillangels.com
sapphire|Sapphire Ventures|vc|https://sapphireventures.com
scalevp|Scale Venture Partners|vc|https://www.scalevp.com
section32|Section 32|vc|https://www.section32.com
sequoia|Sequoia Capital|vc|https://www.sequoiacap.com
shasta|Shasta Ventures|vc|https://www.shastaventures.com
sierraventures|Sierra Ventures|vc|https://www.sierraventures.com
signalfire|SignalFire|vc|https://www.signalfire.com
socialcapital|Social Capital|vc|https://www.socialcapital.com
softbank|SoftBank Investment Advisers|vc|https://www.softbank.jp
solomon|Solomon Partners|ib|https://www.solomonpartners.com
sparkcapital|Spark Capital|vc|https://www.sparkcapital.com
stephensib|Stephens Inc.|ib|https://www.stephens.com
stifel|Stifel|ib|https://www.stifel.com
susaventures|Susa Ventures|seed|https://www.susaventures.com
svangel|SV Angel|angel|https://svangel.com
tdcowen|TD Cowen|ib|https://www.cowen.com
techcoast|Tech Coast Angels|angel|https://www.techcoastangels.com
threshold|Threshold Ventures|vc|https://www.threshold.vc
thrive|Thrive Capital|vc|https://thrivecap.com
tigerglobal|Tiger Global|vc|https://www.tigerglobal.com
tola|Tola Capital|vc|https://www.tolacapital.com
trinity|Trinity Ventures|vc|https://www.trinityventures.com
truistib|Truist Securities|ib|https://www.truist.com
trueventures|True Ventures|vc|https://trueventures.com
ubsib|UBS Investment Bank|ib|https://www.ubs.com
uncork|Uncork Capital|seed|https://uncorkcapital.com
unionsquare|Union Square Ventures|vc|https://www.usv.com
upfront|Upfront Ventures|vc|https://upfront.com
usvp|US Venture Partners|vc|https://www.usvp.com
venrock|Venrock|vc|https://www.venrock.com
versionone|Version One Ventures|seed|https://versionone.vc
visionfund|SoftBank Vision Fund|vc|https://www.visionfund.com
walnut|Walnut Ventures|angel|https://www.walnutventures.com
wedbush|Wedbush Securities|ib|https://www.wedbush.com
wellsfargoib|Wells Fargo Securities|ib|https://www.wellsfargo.com
williamblair|William Blair|ib|https://www.williamblair.com
wing|Wing Venture Capital|vc|https://www.wing.vc
yc_continuity|Y Combinator Continuity|vc|https://www.ycombinator.com
`.trim();

const KINDS = new Set<RosterKind>(["vc", "seed", "angel", "accelerator", "ib"]);

export function parseInvestorRosterCsv(csv: string): InvestorRosterRow[] {
  const rows: InvestorRosterRow[] = [];
  const seen = new Set<string>();
  for (const rawLine of csv.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("|").map((s) => s.trim());
    const [id, name, kind, website, fifth, sixth] = parts;
    if (!id || !name || !kind || !website) continue;
    if (!KINDS.has(kind as RosterKind)) continue;
    if (!website.startsWith("https://")) continue;
    let linkedin: string | undefined;
    let outreachEmail: string | undefined;
    if (fifth?.includes("linkedin.com")) linkedin = fifth;
    else if (fifth?.includes("@")) outreachEmail = fifth;
    else if (fifth?.startsWith("https://")) linkedin = fifth;
    if (sixth?.includes("@")) outreachEmail = sixth;
    else if (sixth?.includes("linkedin.com")) linkedin = sixth;
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      id: key,
      name,
      kind: kind as RosterKind,
      website,
      linkedin,
      outreachEmail,
    });
  }
  return rows;
}

const FIRM_LINKEDIN: Record<string, string> = {
  a16z: "https://www.linkedin.com/company/andreessen-horowitz",
  accel: "https://www.linkedin.com/company/accel-vc",
  sequoia: "https://www.linkedin.com/company/sequoia-capital",
  benchmark: "https://www.linkedin.com/company/benchmark",
  greylock: "https://www.linkedin.com/company/greylock-partners",
  kleiner: "https://www.linkedin.com/company/kleiner-perkins",
  lightspeed: "https://www.linkedin.com/company/lightspeed-venture-partners",
  nea: "https://www.linkedin.com/company/new-enterprise-associates",
  foundersfund: "https://www.linkedin.com/company/founders-fund",
  generalcatalyst: "https://www.linkedin.com/company/general-catalyst",
  insightpartners: "https://www.linkedin.com/company/insight-partners",
  angellist: "https://www.linkedin.com/company/angellist",
  angelcapitalassociation: "https://www.linkedin.com/company/angel-capital-association",
  goldenseeds: "https://www.linkedin.com/company/golden-seeds",
  nca: "https://www.linkedin.com/company/new-york-angels",
  techcoast: "https://www.linkedin.com/company/tech-coast-angels",
  bandofangels: "https://www.linkedin.com/company/band-of-angels",
  svangel: "https://www.linkedin.com/company/sv-angel",
};

function applyKnownLinkedin(rows: InvestorRosterRow[]): InvestorRosterRow[] {
  return rows.map((row) =>
    row.linkedin || !FIRM_LINKEDIN[row.id] ? row : { ...row, linkedin: FIRM_LINKEDIN[row.id] }
  );
}

export const US_INVESTOR_ROSTER: InvestorRosterRow[] = applyKnownLinkedin(
  parseInvestorRosterCsv(`${ROSTER_CSV}\n${SEED_ANGEL_CSV}`)
);

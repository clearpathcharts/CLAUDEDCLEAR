// ClearPath Public Financial Encyclopedia - PWA Engine and Interactive Controller

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Allow only intentional <br> markers from static MODULES_DATA copy. */
function sanitizeLearnHtml(value) {
  return escapeHtml(value).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
}

// Module data structure for local offline search and interactive mode changes
const MODULES_DATA = {
  // --- EDUCATIONAL CATEGORY BLOCKS ---
  stocks_cat: {
    title: "Stocks & Equity Systems",
    tag: "category",
    icon: "📈",
    kids: "🎈 Imagine owning a tiny brick of a giant Lego castle! When the castle does well and gets bigger, your little brick becomes worth lots of candies.",
    beginner: "📊 **What is this?** Stocks are small pieces (shares) of ownership in a real company.<br>💡 **Why does it matter?** It lets everyday people invest in major businesses and share in their success.<br>⚙️ **What affects it?** Business sales, new inventions, customer satisfaction, and general economy health.<br>🔄 **What does it affect?** Company hiring budgets, family savings, pension wealth, and industrial growth.<br>🌍 **How does it connect to the world?** Anyone in society can transition from being just a worker to a partial corporate owner.",
    highSchool: "📊 **What is this?** Financial shares representing fractional legal ownership claims on a corporation's net profits and capital assets.<br>💡 **Why does it matter?** It is the primary tool for capital creation and personal wealth accumulation in modern societies.<br>⚙️ **What affects it?** Quarterly earnings reports (receivables vs payables), market interest rates, and consumer confidence indices.<br>🔄 **What does it affect?** Corporate expansion power (CapEx) and global employment rates.<br>🌍 **How does it connect to the world?** Coordinated global exchanges shift capital rapidly to finance world-scale engineering, logistics, and tech systems.",
    college: "📊 **What is this?** Equity instruments modeled as perpetual residual claims on corporate free cash flows, discounted to present value.<br>💡 **Why does it matter?** Determines the efficient market-based pricing and distribution of societal capital resources.<br>⚙️ **What affects it?** The Equity Risk Premium (ERP), weighted average cost of capital (WACC), and Federal Reserve liquidity streams.<br>🔄 **What does it affect?** Private debt leverage structures and sovereign debt security valuations.<br>🌍 **How does it connect to the world?** Aligns global executive incentives with modern productivity benchmarks and governance criteria.",
    researcher: "🔬 **What is this?** Residual cash claims modeled as perpetual call options on total corporate asset pools, priced via Black-Scholes mechanisms.<br>💡 **Why does it matter?** Acts as the foundational discount rate barometer for all long-duration risk-bearing assets globally.<br>⚙️ **What affects it?** Intertemporal marginal rate of substitution, systematic risk factors, and institutional capital leverage capacity.<br>🔄 **What does it affect?** Corporate capital reinvestment rates and macro credit creation velocity.<br>🌍 **How does it connect to the world?** Determines the sovereign valuation boundary between liquid equity reserves and structural credit markets under global asset regimes."
  },
  forex_cat: {
    title: "Forex & Currency Networks",
    tag: "category",
    icon: "💱",
    kids: "🎈 If you travel to play in another country, you must swap your home coins for shiny local coins. That international coin trade is Forex!",
    beginner: "📊 **What is this?** The global marketplace where different national currencies (like US Dollars vs Euros) are swapped.<br>💡 **Why does it matter?** Without it, countries could not trade food, machinery, or electronics across borders.<br>⚙️ **What affects it?** National job numbers, trade balances, and central bank interest rates.<br>🔄 **What does it affect?** The cost of travel, price of imported clothes and oil, and international corporate revenues.<br>🌍 **How does it connect to the world?** Links every national economy into a single global commerce highway.",
    highSchool: "📊 **What is this?** The global decentralized Over-the-Counter (OTC) market for the trading, exchanging, and pricing of fiat currencies.<br>💡 **Why does it matter?** Establishes relative trading power and stabilizes international supply chains.<br>⚙️ **What affects it?** Geopolitical stability, sovereign balance of payments, and interest rate differentials between countries.<br>🔄 **What does it affect?** Price indices for consumer imports and export-competitive margins of national industries.<br>🌍 **How does it connect to the world?** Facilitates the flow of international capital, backing trillions in physical goods moved on cargo lines daily.",
    college: "📊 **What is this?** A dynamic macro-system governed by Interest Rate Parity (IRP) equations and Purchasing Power Parity (PPP) models.<br>💡 **Why does it matter?** Prevents systemic international arbitrage and determines real effective exchange rates (REER).<br>⚙️ **What affects it?** Capital accounts, trade imbalances, forward-curve swap spreads, and sovereign debt credit ratings.<br>🔄 **What does it affect?** National inflation transmission speeds and global debt denominational risks.<br>🌍 **How does it connect to the world?** Establishes global reserve currency hegemony networks (typically USD petrodollar channels), anchoring sovereign currencies.",
    researcher: "🔬 **What is this?** A continuous bilateral pricing grid modeling marginal liquidity preferences across sovereign fiat balance sheets.<br>💡 **Why does it matter?** Dictates the international transmission of inflation pulses and coordinates global sovereign balance sheets.<br>⚙️ **What affects it?** Current account balances, central bank FX target swaps, and high-frequency macro capital allocations.<br>🔄 **What does it affect?** Eurodollar liquidity pools, domestic lending reserves, and offshore corporate funding costs.<br>🌍 **How does it connect to the world?** Represents the ultimate systemic interface balancing sovereign national monetary models against offshore capital vectors."
  },
  commodities_cat: {
    title: "Commodities & Real Assets",
    tag: "category",
    icon: "🛢️",
    kids: "🎈 Commodities are real things earth gives us: copper for pipes, wheat for bread, and oil for gas. They are the building blocks of physical stuff!",
    beginner: "📊 **What is this?** Raw materials and agricultural goods (like gold, oil, gas, and coffee beans) traded on global markets.<br>💡 **Why does it matter?** They are the essential inputs for producing food, energy, transport, and electronic circuits.<br>⚙️ **What affects it?** Weather events, factory demands, shipping lines, and supply/demand trends.<br>🔄 **What does it affect?** Grocery store receipts, household heating bills, and corporate manufacturing costs.<br>🌍 **How does it connect to the world?** Dictates the cost of living and maps out the path of physical energy across oceans.",
    highSchool: "📊 **What is this?** Standardized raw inputs traded on central exchanges through specialized derivatives (futures and options contract structures).<br>💡 **Why does it matter?** Allows industrial producers to lock in stable input prices months in advance, minimizing sudden price shocks.<br>⚙️ **What affects it?** OPEC policy targets, global supply bottlenecks, geopolitical tariffs, and mining productivity rates.<br>🔄 **What does it affect?** Producer Price Inflation (PPI) and sovereign trade balance dynamics of resource-exporting nations.<br>🌍 **How does it connect to the world?** Visualizes global supply chains, mapping mineral-rich developing economies directly to physical manufacturing cores.",
    college: "📊 **What is this?** Standard real-denominated assets whose pricing curve matches contango (high storage costs) or backwardation (immediate scarcity).<br>💡 **Why does it matter?** Represents the ultimate real-world hedge against fiat currency devaluation and inflation surges.<br>⚙️ **What affects it?** Marginal costs of extraction, supply elasticities, industrial capacity utilization, and global logistics margins.<br>🔄 **What does it affect?** Real terms of trade index bands and sovereign fiscal health of resource-intensive nations.<br>🌍 **How does it connect to the world?** Serves as the bedrock interface mapping physical earth resource geological limits directly onto virtual credit financial systems.",
    researcher: "🔬 **What is this?** A global physical input network pricing matrix governed by spot scarcity and marginal cost of capacity addition.<br>💡 **Why does it matter?** Provides the baseline inflation impulses that disrupt traditional central bank policy calibrations.<br>⚙️ **What affects it?** Geological depletion rates, systemic supply chain bottlenecks, and currency unit debasement vectors.<br>🔄 **What does it affect?** Real GDP extraction margins, domestic price structures, and industrial terms of trade.<br>🌍 **How does it connect to the world?** Reveals the cold reality of physical energy limits underneath the virtual, infinitely expanding layers of global paper debt."
  },
  economy_cat: {
    title: "Economy & Indicators",
    tag: "category",
    icon: "📊",
    kids: "🎈 The economy is how we make, buy, and trade toys, food, and clothes. When people have jobs and trade lots, the economy is happy!",
    beginner: "📊 **What is this?** The total system of human labor, manufacturing, services, and transactions within a country.<br>💡 **Why does it matter?** It directly determines whether jobs are plentiful, wages are growing, and businesses are thriving.<br>⚙️ **What affects it?** Tech breakthroughs, central bank policy sheets, consumer trust, and trade rules.<br>🔄 **What does it affect?** Unemployment statistics, tax collections, national safety nets, and local school budgets.<br>🌍 **How does it connect to the world?** High productivity in one nation fuels commerce, tourist cruises, and export avenues across all other countries.",
    highSchool: "📊 **What is this?** The web of production and consumption metrics, measured by Gross Domestic Product (GDP), inflation, and unemployment.<br>💡 **Why does it matter?** Evaluates the collective quality of life and guides government spending and tax policies.<br>⚙️ **What affects it?** Fiscal stimulus targets, interest rate adjustments, global manufacturing trends, and consumer savings rates.<br>🔄 **What does it affect?** Household income distributions, company stock returns, and nation-to-nation trade alliances.<br>🌍 **How does it connect to the world?** Global economic interconnectivity ensures that recessions or expansions in large nations transmit immediately round the globe.",
    college: "📊 **What is this?** A complex system modeled by aggregate supply (AS) and aggregate demand (AD) equilibriums and macroeconomic cycles.<br>💡 **Why does it matter?** Optimizes resource utility, maps national trends, and informs fiscal policy.<br>⚙️ **What affects it?** Total factor productivity, demographics, money supply velocity, and systemic debt levels.<br>🔄 **What does it affect?** The sovereign borrowing yield spread and long-duration capital planning trends.<br>🌍 **How does it connect to the world?** Orchestrates structural macro balances, routing global investment to nations showing the strongest risk-adjusted output parameters.",
    researcher: "🔬 **What is this?** An endogenously driven, intertemporal consumption and production network subject to complex feedback loops and systemic friction.<br>💡 **Why does it matter?** Directs sovereign macroprudential strategy and models the systemic stress points of national financial networks.<br>⚙️ **What affects it?** Technical progress indices, money supply multiplier dynamics, debt-deflation spirals, and systemic productivity constraints.<br>🔄 **What does it affect?** Global credit risk premium structures, currency stability margins, and reserve assets allocations.<br>🌍 **How does it connect to the world?** Explores how digital platforms, sovereign capital dynamics, and physical resource inputs unite under integrated macro-models."
  },
  banking_cat: {
    title: "Central Banking & Reserves",
    tag: "category",
    icon: "🏛️",
    kids: "🎈 The ultimate bank that looks after all local family banks! It prints the coins and keeps the financial pipes clean so banks don't run dry.",
    beginner: "📊 **What is this?** The government-appointed institution (like the Federal Reserve) that controls a nation's money supply.<br>💡 **Why does it matter?** It sets the cost of borrowing, prevents bank panics, and targets stable price levels.<br>⚙️ **What affects it?** Economic growth data, local price increases, and job market health reports.<br>🔄 **What does it affect?** Mortgage costs for homes, credit card interest rates, and the value of cash savings.<br>🌍 **How does it connect to the world?** Coordinates with other central banks to steady global financial plumbing during panics.",
    highSchool: "📊 **What is this?** The national monetary authority responsible for monetary policy, banking regulation, and acting as lender of last resort.<br>💡 **Why does it matter?** Provides financial stability and adjusts currency velocity to defend price-indices from inflation bubbles.<br>⚙️ **What affects it?** Unemployment indexes, industrial capacity output gaps, and core consumer price parameters.<br>🔄 **What does it affect?** Commerical bank lending capacities and the yields of government treasury bills.<br>🌍 **How does it connect to the world?** Determines international capital flows; higher domestic interest rates attract global investment pools to domestic bonds.",
    college: "📊 **What is this?** The monetary authority regulating commercial bank tier-1 capital reserves and steering systemic aggregate demand.<br>💡 **Why does it matter?** Manages the money multiplier effect and anchors the domestic yield curve.<br>⚙️ **What affects it?** Liquidity metrics, bank capital adequacy limits (Basel III), OIS spreads, and money velocity rates.<br>🔄 **What does it affect?** Structural banking profitability margins, credit liquidity buffers, and macroeconomic interest rates.<br>🌍 **How does it connect to the world?** Drives the pricing of global swap networks, managing offshore Eurodollar availability and national reserve pools.",
    researcher: "🔬 **What is this?** The systemic architect managing commercial bank reserve assets and stabilizing the sovereign debt collateral grid.<br>💡 **Why does it matter?** Sets the underlying risk-free rate floor that anchors all modern financial valuations.<br>⚙️ **What affects it?** Reverse Repo Facility usage, quantitative easing/tightening velocity, and systemic collateral friction.<br>🔄 **What does it affect?** Overnight index swap curves, shadow banking leverage dynamics, and cross-border capital velocity.<br>🌍 **How does it connect to the world?** Operates as the ultimate liquidity gatekeeper, balancing domestic bank balance sheets against global capital flight vectors."
  },
  sectors_cat: {
    title: "Industrial Sectors & Moats",
    tag: "category",
    icon: "🧩",
    kids: "🎈 Industries are like teams in school! One team builds computerized computers, another discovers medicines, and another builds fast cars.",
    beginner: "📊 **What is this?** The division of the economy into specialized target zones (like Technology, Biotech, Energy, and Retail).<br>💡 **Why does it matter?** It helps investors discover sectors showing high demand and competitive edges (moats).<br>⚙️ **What affects it?** Tech breakthroughs, specialized worker availability, and consumer trend directions.<br>🔄 **What does it affect?** Job hiring fields, developer salaries, and stock performance trends.<br>🌍 **How does it connect to the world?** Specialized sectors create concentrated zones of expert hubs (like Silicon Valley or Munich auto engineering clusters).",
    highSchool: "📊 **What is this?** Eleven standard sector groupings (GICS) representing the primary avenues of modern economic activity.<br>💡 **Why does it matter?** Helps analysts pinpoint sector rotation cycles, shifting capital from defensive zones to growth fields.<br>⚙️ **What affects it?** Supply chain inputs, federal subsidies, patent protections, and changing consumer habits.<br>🔄 **What does it affect?** Industry concentration indexes, research investment (R&D) scales, and employment indices.<br>🌍 **How does it connect to the world?** Defines modern supply networks, showing how complex components move between nations before final assembly.",
    college: "📊 **What is this?** Specialized industrial segments modeled by Porter's Five Forces and structural high-barrier-to-entry competitive moats.<br>💡 **Why does it matter?** Evaluates sector-specific margins, return on invested capital (ROIC), and capital expenditure trend directions.<br>⚙️ **What affects it?** Patent pools, technical standards, capital intensity requirements, and corporate mergers/acquisition limits.<br>🔄 **What does it affect?** Market concentration metrics, wage spreads, and industrial aggregate output parameters.<br>🌍 **How does it connect to the world?** Drives national comparative advantages, enabling specialized technological progress and sovereign industrial positioning.",
    researcher: "🔬 **What is this?** Microeconomic competitive networks characterized by non-linear network effects, high fixed scaling footprints, and dynamic patent pools.<br>💡 **Why does it matter?** Explains structural deviations in profit retention margins across global GICS sectors.<br>⚙️ **What affects it?** Technical standard setting, global component shipping pipelines, and industrial CapEx trends.<br>🔄 **What does it affect?** Sector-spread correlation matrices, wage inequality coefficients, and macro industrial productivity trends.<br>🌍 **How does it connect to the world?** Maps sovereign industrial policy (e.g., green tax grids or computing chip subsidy structures), dictating international capital flows."
  },

  // --- COMPANY EXPLORERS ---
  nvda: {
    title: "NVIDIA (NVDA): AI Platform Core",
    tag: "company",
    icon: "📟",
    kids: "🎈 NVIDIA builds super-fast computer brain chips! These chips help computer scientists teach computers to speak, paint, and code like humans.",
    beginner: "📊 **What they do:** Design high-end graphics processing units (GPUs) and specialized programming libraries (CUDA).<br>💡 **Why they matter:** Their chips are the essential engines powering all modern Artificial Intelligence system software.<br>⚙️ **What affects their stock:** Chip sales numbers, tech company spending on data centers, and advanced chip production speeds.<br>🔄 **Industry relationships:** They buy high-end silicon from TSMC and sell AI systems to software giants (Microsoft, Google, Meta).<br>🌍 **Historical growth:** Transitioned from a gamer video-card pioneer directly to the world's most valuable computer-infrastructure node.",
    highSchool: "📊 **What they do:** Design fabless high-performance GPUs, AI supercomputing architecture, and proprietary software framework portfolios like CUDA.<br>💡 **Why they matter:** NVIDIA holds a structural monopoly over the deep learning hardware layer that powers modern AI technology.<br>⚙️ **What affects their stock:** Data center quarterly revenues, capital expenditure budgets of hyperscalers, and AI software monetization rates.<br>🔄 **Industry relationships:** Extremely dependent on TSMC for semiconductor foundry production and ASML for lithography equipment.<br>🌍 **Historical growth:** Capitalized on massive computing pivots: starting with video games, expanding to crypto mining, and dominating deep learning AI grids.",
    college: "📊 **What they do:** Architect high-performance tensor computing cores, software-defined networks, and proprietary developer framework stacks (CUDA).<br>💡 **Why they matter:** Operates as the hardware gatekeeper of the modern AI revolution, boasting massive profit margins due to software-moat locks.<br>⚙️ **What affects their stock:** Total system unit pricing power, HBM silicon supply delays, and government export restrictions on advanced chips.<br>🔄 **Industry relationships:** Interlocks with the entire tech stack, driving capital reinvestment across semiconductor fabrication, packaging, and data center real estate.<br>🌍 **Historical growth:** Transformed its valuation multiples by executing a software-hardware platform lock-in, creating unmatched corporate capital returns.",
    researcher: "🔬 **What they do:** Architect advanced fabless ASIC microarchitectures, parallel computing systems, and proprietary software-defined hardware environments.<br>💡 **Why they matter:** Serves as the primary physical compute infrastructure engine fueling global productivity and compute capability expansion.<br>⚙️ **What affects their stock:** Silicon lithography wafer pricing, packaging yields (CoWoS), and hyperscaler CapEx sustainability metrics.<br>🔄 **Industry relationships:** Central link in the global silicon stack, dictating equipment schedules at semiconductor foundries, assembly hubs, and software labs.<br>🌍 **Historical growth:** Exemplifies platform-monopoly scaling, shifting corporate returns from hardware manufacturing cycles to software ecosystem rents."
  },
  aapl: {
    title: "Apple (AAPL): Device Ecosystem Core",
    tag: "company",
    icon: "📱",
    kids: "🎈 Apple builds iPhones, iPads, and slick computers! People love them so much they buy apps and storage, creating a huge family circle of devices.",
    beginner: "📊 **What they do:** Design premium consumer consumer electronics (iPhones, Macs, Watches) and operate proprietary app stores.<br>💡 **Why they matter:** They run the most successful digital ecosystem on Earth, holding immense pricing power over hardware and media.<br>⚙️ **What affects their stock:** Global iPhone sales, App Store service fee revenues, and hardware component costs.<br>🔄 **Industry relationships:** They buy titanium and glass from worldwide suppliers, contract Foxconn for assembly, and host services on server farms.<br>🌍 **Historical growth:** Grew from a garage computer club into a consumer luxury giant with billions of loyal product users.",
    highSchool: "📊 **What they do:** Design premium integrated hardware device lineups, mobile operating systems, and host proprietary app and subscription services.<br>💡 **Why they matter:** Dictates global mobile software standards and app developer economics through their ecosystem moat.<br>⚙️ **What affects their stock:** Consumer device upgrade frequency, services growth metrics, and sovereign antitrust court hearings.<br>🔄 **Industry relationships:** Anchor client for global electronics component makers and key partner to global assembly firms (Foxconn).<br>🌍 **Historical growth:** Redefined personal technology with the launch of the iPhone in 2007, creating the world's most lucrative hardware-software fly-wheel.",
    college: "📊 **What they do:** Control unified hardware-software consumer architectures, custom-designed Apple Silicon chips, and vertical service ecosystems.<br>💡 **Why they matter:** Generates unmatched consumer retention rates, giving them a fortress balance sheet with massive recurring service cash flows.<br>⚙️ **What affects their stock:** Margins of hardware supply components, antitrust litigation regarding App Store commission fees, and global consumer spending limits.<br>🔄 **Industry relationships:** Commands the supply chains of component manufacturers globally, securing chip manufacturing capacity priority (TSMC).<br>🌍 **Historical growth:** Executed a historic shift from cyclical hardware seller to high-margin digital platform landlord, maintaining immense pricing power.",
    researcher: "🔬 **What they do:** Design fabless custom ARM SoC silicon, premium integrated operating environments, and global digital gateway applications.<br>💡 **Why they matter:** Controls the primary mobile identity gateway, commanding premium pricing power over consumer hardware and software margins.<br>⚙️ **What affects their stock:** Dynamic consumer credit limits, sovereign antitrust litigation, and supply chain assembly geographic shifts.<br>🔄 **Industry relationships:** Anchors the global electronics supply chain, controlling major components of semiconductor, panel, and camera assembly margins.<br>🌍 **Historical growth:** Represents the ultimate implementation of vertical integration, converting standard electronics fabrication cycles into high-margin luxury rents."
  },
  msft: {
    title: "Microsoft (MSFT): Enterprise & Cloud Core",
    tag: "company",
    icon: "💻",
    kids: "🎈 Microsoft designs software that helps businesses operate! Excel and Word are like pencil cases for businesses, and Azure is their giant server storage room.",
    beginner: "📊 **What they do:** Build office software (Office 365), cloud server systems (Azure), and invest heavily in AI tools (OpenAI partnership).<br>💡 **Why they matter:** Almost every business, hospital, and school in the world relies on their software to function daily.<br>⚙️ **What affects their stock:** Cloud software subscription numbers, tech sales, and enterprise IT IT spending budgets.<br>🔄 **Industry relationships:** Partners with chip makers for server rooms, and leases software access to millions of businesses globally.<br>🌍 **Historical growth:** Started as a Windows PC developer, shifted to cloud systems under Satya Nadella, and now co-pilots AI systems.",
    highSchool: "📊 **What they do:** Develop enterprise software platforms, cloud servers (Azure), search engines, and artificial intelligence developer assistants.<br>💡 **Why they matter:** Serves as the back-office backbone for global enterprise computing, giving them highly predictable subscription cash.<br>⚙️ **What affects their stock:** Commercial Cloud segment growth rates, cybersecurity challenges, and corporate IT spending budgets.<br>🔄 **Industry relationships:** Large purchaser of NVIDIA computing systems, partner with OpenAI, and key infrastructure provider to global corporations.<br>🌍 **Historical growth:** Grew from personal computer software hegemony in the 1990s, successfully re-inventing itself as an enterprise cloud leader.",
    college: "📊 **What they do:** Architect enterprise cloud structures (Azure PaaS/IaaS), commercial SaaS tools (Office 365), and generative AI developer toolkits.<br>💡 **Why they matter:** Commands a multi-decade enterprise contract moat, giving them strong recurring revenues and immense scaling leverage.<br>⚙️ **What affects their stock:** Azure operating profit margins, commercial cloud subscriber counts, and capital expenditure scales on data centers.<br>🔄 **Industry relationships:** Integrates OpenAI models directly into global consumer software, driving hyperscale data center construction demand globally.<br>🌍 **Historical growth:** Leveraged its dominant desktop operating software monopoly into a highly diversified enterprise computing cloud and AI giant.",
    researcher: "🔬 **What they do:** Develop enterprise distributed cloud infrastructure, sovereign database environments, and generative AI foundational systems.<br>💡 **Why they matter:** Serves as the primary operational operating system for global business, controlling critical cloud and security systems.<br>⚙️ **What affects their stock:** Cloud margin expansion rates, capital allocations for AI data storage facilities, and corporate IT security challenges.<br>🔄 **Industry relationships:** Major customer for advanced energy grids and custom chip designs; holds major equity in pioneer AI research labs (OpenAI).<br>🌍 **Historical growth:** Reflects classic enterprise network-effect persistence, translating early operating system leads into dominant enterprise rent streams."
  },
  tsla: {
    title: "Tesla (TSLA): Autonomy & Energy Core",
    tag: "company",
    icon: "⚡",
    kids: "🎈 Tesla builds fast, electric cars that drive themselves! They also build giant battery packs to store electricity from the sun.",
    beginner: "📊 **What they do:** Manufacture electric vehicles (EVs), solar tiles, giant battery grids, and design autonomous driving software.<br>💡 **Why they matter:** They sparked the global car shift away from gasoline and are scaling up automated robotics and energy grids.<br>⚙️ **What affects their stock:** Car delivery numbers, battery pack costs, and progress on self-driving tech approvals.<br>🔄 **Industry relationships:** They buy lithium and nickel from global mining sites and partner with battery cell makers (Panasonic).<br>🌍 **Historical growth:** Pioneered electric vehicles from a niche sports car maker to a mass-production auto and clean energy giant.",
    highSchool: "📊 **What they do:** Manufacture electric cars, home and industrial battery packs, solar arrays, and write artificial intelligence autopilot software.<br>💡 **Why they matter:** Operates as the leading catalyst for global transport electrification and automated driving research.<br>⚙️ **What affects their stock:** Quarterly auto deliveries, vehicle profit margins, battery factory expansions, and self-driving software uptake rate.<br>🔄 **Industry relationships:** Large customer for automotive microchips and lithium mining firms; competes directly with traditional car makers.<br>🌍 **Historical growth:** Famously scaled from high-risk EV startup to a high-volume manufacturer, achieving a trillion-dollar valuation band.",
    college: "📊 **What they do:** Design integrated electric architectures, custom neural net FSD computing chips, and mass-scale energy storage battery packs.<br>💡 **Why they matter:** They combine automotive manufacturing, tech-software pricing multiples, and real asset hardware scale under one roof.<br>⚙️ **What affects their stock:** Lithium battery cell pack costs, average selling price margin squeezes, and regulatory approvals for self-driving fleets.<br>🔄 **Industry relationships:** Anchors battery raw mineral supply chains, competing with traditional car firms and tech companies for AI computer hardware.<br>🌍 **Historical growth:** Valued by investors as an AI-software machine network rather than a traditional car assembler, leading to high valuation spikes.",
    researcher: "🔬 **What they do:** Design integrated automotive battery systems, custom neural computing ASICs, FSD code pipelines, and grid storage control systems.<br>💡 **Why they matter:** Operates at the intersection of energy transition dynamics, automated computing, and high-volume industrial scaling.<br>⚙️ **What affects their stock:** Auto operating margins, FSD subscription ratios, lithium processing capacity, and autonomous taxi regulatory frameworks.<br>🔄 **Industry relationships:** Major buyer of raw minerals (nickel, lithium, cobalt) and microchips; drives grid-scale battery contracts with utility firms.<br>🌍 **Historical growth:** Exemplifies the conversion of traditional manufacturing lines into software platforms, scaling automated networks.",
  },
  amzn: {
    title: "Amazon (AMZN): E-Commerce & AWS Cloud",
    tag: "company",
    icon: "📦",
    kids: "🎈 Amazon is a school bus for shipping! You click a button, and their massive delivery trucks bring cool toys to your doorstep. They also run web servers.",
    beginner: "📊 **What they do:** Operate the world's largest online store, a global parcel delivery network, and host cloud servers (AWS).<br>💡 **Why they matter:** They reorganized how humans shop and run the digital server infrastructure behind most internet sites.<br>⚙️ **What affects their stock:** Consumer retail package spending, AWS cloud service growth, and delivery warehouse labor costs.<br>🔄 **Industry relationships:** Host servers for apps (Netflix, Airbnb, etc.) and coordinate shipping pipelines with airlines and truckers.<br>🌍 **Historical growth:** Started as an online bookstore, expanded to retail items, and built AWS to run the digital backend of the globe.",
    highSchool: "📊 **What they do:** Manage international e-commerce platforms, third-party logistics networks, and provide Cloud computing services (AWS).<br>💡 **Why they matter:** Commands a combined physical delivery and digital cloud infrastructure monopoly across major Western economies.<br>⚙️ **What affects their stock:** AWS quarterly operating margin trends, retail shipping efficiencies, and warehouse labor wage trends.<br>🔄 **Industry relationships:** Largest cloud provider globally, main client for parcel transit companies, and wholesale retail buyer for consumer product makers.<br>🌍 **Historical growth:** Perfected the 'fly-wheel' strategy where low retail margins funded massive scale, driving AWS back-ends to high profitability.",
    college: "📊 **What they do:** Manage high-efficiency logistics networks, cloud architecture (AWS), digital ad hubs, and primary subscription services (Prime).<br>💡 **Why they matter:** AWS subsidizes low retail margins, creating a fortress ecosystem that dominates both digital and physical supply lines.<br>⚙️ **What affects their stock:** Hyper-scaler price competition, parcel shipping costs per unit, and capital allocations for global delivery pipelines.<br>🔄 **Industry relationships:** Principal driver of industrial warehouse development and major buyer of server silicon, cargo aircraft, and shipping delivery systems.<br>🌍 **Historical growth:** Transformed online retail from a low-margin delivery cycle into a high-margin data landlord service ecosystem.",
    researcher: "🔬 **What they do:** Design distributed logistics control systems, high-density server computing fabrics (AWS Nitro), and retail pricing algorithms.<br>💡 **Why they matter:** Controls the primary retail and digital hosting gateways across major economies, managing essential supply lines.<br>⚙️ **What affects their stock:** AWS margin compression, global delivery worker availability, shipping fuels, and antitrust litigation loops.<br>🔄 **Industry relationships:** Major customer of packaging, robotics tech, green energy grids, and high-performance server semiconductor components.<br>🌍 **Historical growth:** Represents the optimization of operational scaling, utilizing physical scale to capture high-margin software data rents."
  },

  // --- MARKET RELATIONSHIP EXPLORERS ---
  oil_airlines: {
    title: "How Oil Prices Affect Airlines",
    tag: "relationship",
    icon: "✈️",
    kids: "🎈 Imagine a big yellow bus! Oil is the heavy food the bus drinks to drive. If the food prices double, the bus ticket has to cost more candies too.",
    beginner: "📊 **What is this?** The direct link between crude oil prices and airline ticket costs.<br>💡 **Why does it matter?** Fuel constitutes up to 40% of an airline's operating expenses.<br>⚙️ **What affects it?** OPEC supply limits, flight demands, oil drilling speeds, and weather issues.<br>🔄 **What does it affect?** Ticket prices for travelers, airline profits, tourism spending, and global travel rates.<br>🌍 **How does it connect to the world?** Shows how a oil pump in the Middle East directly changes package flight costs in Chicago.",
    highSchool: "📊 **What is this?** Macro-correlation between jet fuel overheads (refined from crude oil) and airline balance sheets.<br>💡 **Why does it matter?** Energy price spikes can instantly wipe out narrow airline profit margins, leading to bankruptcies or airline mergers.<br>⚙️ **What affects it?** Refining capacity constraints, crude oil futures indices, global travel demand, and dollar exchange rates (since oil is priced in USD).<br>🔄 **What does it affect?** Cost-per-available-seat-mile (CASM) margins, flight route cancellations, and tourism volumes.<br>🌍 **How does it connect to the world?** Interlocks global commodity supply stability directly with the business models of international travel.",
    college: "📊 **What is this?** The input-price elasticity connection between refined kerosene pricing and airline operating margin projections.<br>💡 **Why does it matter?** Dictates corporate treasury hedging targets (buying fuel futures to offset exposure) and capacity forecasting.<br>⚙️ **What affects it?** Crude futures contango and backwardation spreads, oil cracks, and fuel surcharges applied to cargo shipping.<br>🔄 **What does it affect?** Cargo yields, airline return on equity (ROE), and fleet acquisition cycles (demanding newer, highly fuel-efficient jets).<br>🌍 **How does it connect to the world?** Connects physical resource pricing with global passenger transport and supply chain economics.",
    researcher: "🔬 **What is this?** The structural transmission of raw input energy shocks onto aviation corporate cash flows and transport costs.<br>💡 **Why does it matter?** Models cyclical default probability curves across transport debt capital markets.<br>⚙️ **What affects it?** Brent/WTI crack spreads, fuel options delta hedging strategies, and currency exchange rates.<br>🔄 **What does it affect?** Flight capacity pricing models, municipal airport bond ratings, and cargo logistics rates.<br>🌍 **How does it connect to the world?** Maps physical energy constraints directly onto global travel systems, indicating how raw resource cost structures govern trade."
  },
  inflation_housing: {
    title: "How Inflation Affects Housing",
    tag: "relationship",
    icon: "🏠",
    kids: "🎈 If logs, bricks, and paint cost more, building home sweet homes gets pricer. Then renting a bedroom costs more piggy bank coins!",
    beginner: "📊 **What is this?** The link between general inflation (rising prices) and the cost of owning or renting homes.<br>💡 **Why does it matter?** Housing is usually the single largest expense in a family's monthly budget.<br>⚙️ **What affects it?** Lumber and steel costs, land availability, home builder wages, and interest rate spikes.<br>🔄 **What does it affect?** Monthly rent prices, home ownership rates, family savings, and eviction statistics.<br>🌍 **How does it connect to the world?** Demonstrates how general dollar inflation directly affects neighborhood rent values and local family stability.",
    highSchool: "📊 **What is this?** The transmission of general consumer price inflation onto residential real estate values and construction material costs.<br>💡 **Why does it matter?** When construction materials rise, builders build fewer homes, driving up existing home prices and monthly rents.<br>⚙️ **What affects it?** Building code rules, construction labor supply indicators, supply chain transport rates, and mortgage interest rates.<br>🔄 **What does it affect?** Apartment rent-to-income ratios, construction job hiring, and local property tax valuations.<br>🌍 **How does it connect to the world?** Traces how financial dollar debasement shifts real asset values, pricing younger families out of home ownership.",
    college: "📊 **What is this?** The relationship between real asset inflation indexing, rental yields, and structural capital replacement costs.<br>💡 **Why does it matter?** Housing acts as a premium real hedge; core land values rise when money supply scales, but home construction costs spike.<br>⚙️ **What affects it?** Capital capitalization rates, mortgage interest rates, zoning regulatory barriers, and material input producer prices.<br>🔄 **What does it affect?** Rent capitalization yield ratios, commercial property debt defaults, and consumer spending power parameters.<br>🌍 **How does it connect to the world?** Connects central bank asset inflation dynamics directly to local housing, showing how monetary policy shapes urban environments.",
    researcher: "🔬 **What is this?** The pass-through coefficient of core monetary inflation onto consumer shelter indices and real asset replacement costs.<br>💡 **Why does it matter?** Explains systemic wealth transfers from renters to leveraged real asset owners during inflation jumps.<br>⚙️ **What affects it?** Replacement-cost price elasticities, bank mortgage lending rules, and sovereign real estate tax incentives.<br>🔄 **What does it affect?** Core CPI basket indexes, wage demands, and institutional mortgage-backed security default rates.<br>🌍 **How does it connect to the world?** Models how physical land limits and materials pricing interact with infinite paper debt expansions in macro ecosystems."
  },
  rates_stocks: {
    title: "How Interest Rates Affect Stocks",
    tag: "relationship",
    icon: "⚖️",
    kids: "🎈 Interest is the cost to borrow! If the bank makes borrowing expensive, people buy fewer things, and companies make fewer sales, so stocks drop.",
    beginner: "📊 **What is this?** The inverse link between central bank interest rates and corporate stock market valuations.<br>💡 **Why does it matter?** High rates make borrowing expensive, slowing corporate profits and pushing investors to safe bank accounts instead.<br>⚙️ **What affects it?** Central bank inflation targets, economic activity growth, and job market reports.<br>🔄 **What does it affect?** Corporate expansion budgets, investor trading patterns, housing loans, and stock pricing indexes.<br>🌍 **How does it connect to the world?** Explores how a simple interest rate meeting in Washington D.C. changes stock portfolios globally.",
    highSchool: "📊 **What is this?** The direct valuation impact that interest rates have on corporate valuations and risk asset capital costs.<br>💡 **Why does it matter?** Higher rates increase borrowing interest bills, reduce corporate income margins, and drop stock multiples.<br>⚙️ **What affects it?** Federal Reserve interest targets, inflation curves, and international capital flows.<br>🔄 **What does it affect?** Capital discount rates (discounting future cash), corporate share repurchase volumes, and startup funding availability.<br>🌍 **How does it connect to the world?** Interlocks sovereign state borrowing yields with the pricing valuations of global stock markets.",
    college: "📊 **What is this?** The discount factor transmission of risk-free yields onto the net present value (NPV) of corporate discounted cash flows.<br>💡 **Why does it matter?** Higher interest rates increase the hurdle rate, lowering the valuation multiples of long-duration growth tech stocks.<br>⚙️ **What affects it?** Treasury yield curves, credit risk spreads, inflation expectations, and systemic capital supply density.<br>🔄 **What does it affect?** Price-to-earnings (P/E) market expansion, corporate capital investment metrics, and corporate debt restructuring schedules.<br>🌍 **How does it connect to the world?** Coordinates global asset allocation, shifting capital between safe government debt and risky stock portfolios.",
    researcher: "🔬 **What is this?** The fundamental transmission of sovereign risk-free interest rates on corporate equity risk premiums and equity valuations.<br>💡 **Why does it matter?** Models equity pricing changes, asset multiple compressions, and macroeconomic debt risk variables.<br>⚙️ **What affects it?** Term premiums, policy rate schedules, overnight funding rates, and systemic cross-border capital velocity.<br>🔄 **What does it affect?** High-duration equity multiples, junk bond yield spreads, corporate bankruptcy rates, and asset allocations.<br>🌍 **How does it connect to the world?** Shows how sovereign monetary policy rates govern the pricing and velocity of global corporate risk assets."
  },

  // --- GLOSSARIES ---
  market_cap: {
    title: "What is Market Cap?",
    tag: "glossary",
    icon: "🏷️",
    kids: "🎈 Market cap is the total candy price of a whole company! Multiply all its toy ownership blocks by the price of one single block.",
    beginner: "📊 **What is this?** The total dollar market value of a public company's outstanding shares of stock.<br>💡 **Why does it matter?** It represents the total sticker price of a company, letting you classify them as mega, large, mid, or small cap.<br>⚙️ **What affects it?** Current share market price and the total number of shares issued by the company founders.<br>🔄 **What does it affect?** Stock market index weightings (like S&P 500 weights) and institutional fund buying limits.<br>🌍 **How does it connect to the world?** Helps you compare corporate size, comparing Apple's value to entire national economic outputs.",
    highSchool: "📊 **What is this?** Market Capitalization, calculated by multiplying outstanding share volume by current share trading prices.<br>💡 **Why does it matter?** It is the standard reference to define corporate scale, guiding asset index inclusions and mutual fund purchasing thresholds.<br>⚙️ **What affects it?** Share price market trends, share issuance events, and corporate share-buyback initiatives.<br>🔄 **What does it affect?** Passive index-tracker asset flows and institutional investment mandates.<br>🌍 **How does it connect to the world?** Visualizes global corporate consolidation, comparing enterprise value structures with sovereign GDP levels.",
    college: "📊 **What is this?** Enterprise equity valuation metric, framing the nominal cost of acquisition of residual claims on assets before net debt is added.<br>💡 **Why does it matter?** Serves as the base denominator to evaluate price-to-earnings or price-to-book ratios.<br>⚙️ **What affects it?** Public equity discounting rates, corporate share repurchases, and systematic market betas.<br>🔄 **What does it affect?** Industry concentration indexes, acquisition limits, and cost of capital parameters.<br>🌍 **How does it connect to the world?** Ranks corporate entities across unified metrics, directing global asset allocations based on aggregate value parameters.",
    researcher: "🔬 **What is this?** The nominal aggregate asset value capitalization of outstanding residual equity claims in public markets.<br>💡 **Why does it matter?** Anchors portfolio sizing weights and measures financial market depth compared to sovereign debt metrics.<br>⚙️ **What affects it?** Equities discount factor shifts, share count fluctuations, and systemic liquidity cycles.<br>🔄 **What does it affect?** Index volatility betas, liquidity execution dynamics, and capital market concentration ratios.<br>🌍 **How does it connect to the world?** Benchmarks corporate enterprise scale against sovereign capital pools, tracking long-term shifts in global capital weight."
  },
  liquidity: {
    title: "What is Liquidity?",
    tag: "glossary",
    icon: "🌊",
    kids: "🎈 Liquidity is how fast you can trade a toy for cash! Cash is highly liquid. A giant house is slow to sell, so it has very low liquidity.",
    beginner: "📊 **What is this?** How quickly and easily you can convert an asset (like stocks or gold) into spending cash without losing value.<br>💡 **Why does it matter?** Cash is perfectly liquid. Houses and complex art are illiquid. Hard assets trap your money when you need it fast.<br>⚙️ **What affects it?** The number of active buyers and sellers, market trust, and currency exchange plumbing.<br>🔄 **What does it affect?** Transaction fees, market trading speed, and financial panic vulnerability rates.<br>🌍 **How does it connect to the world?** Connects financial systems; highly liquid markets allow global trade to happen instantly without delays.",
    highSchool: "📊 **What is this?** The density of buyers and sellers in a market, enabling transaction executions with minimal pricing impact.<br>💡 **Why does it matter?** Low liquidity results in wide bid-ask pricing spreads, costing investors more to trade assets during panics.<br>⚙️ **What affects it?** Central bank reserve injections, trading rule structures, and market volatility indicators.<br>🔄 **What does it affect?** Collateral value haircuts and bankruptcy rates of financial institutions during panics.<br>🌍 **How does it connect to the world?** Dictates world cash availability; liquid markets prevent trade blockages, keeping supply pipelines open worldwide.",
    college: "📊 **What is this?** The microstructural market capacity to convert asset balances into legal tender reserves with minimal bid-ask spread friction.<br>💡 **Why does it matter?** Avoids forced asset liquidations and controls systemic risk during sudden leverage squeezes.<br>⚙️ **What affects it?** Bank reserve balances, collateral velocity rates, institutional leverage rules, and counterparty trust networks.<br>🔄 **What does it affect?** Funding spreads, borrowing haircuts, overnight repo rates, and systemic volatility metrics.<br>🌍 **How does it connect to the world?** Regulates system flow; abundant global liquidity feeds economic bubbles, while illiquidity leads to systemic defaults.",
    researcher: "🔬 **What is this?** The multi-dimensional capacity of corporate and sovereign balance sheets to meet nominal liabilities under stress parameters.<br>💡 **Why does it matter?** Serves as the ultimate catalyst for systemic market defaults during deleveraging cycles.<br>⚙️ **What affects it?** Central bank balance sheet expansion vectors, interbank counterparty trust parameters, and prime dealer inventory capacities.<br>🔄 **What does it affect?** Cross-asset correlation coefficients, systemic asset valuation margins, and option implied volatility indexes.<br>🌍 **How does it connect to the world?** Represents the essential medium for modern credit markets, determining when leveraged networks expand or contract."
  },
  recession_glossary: {
    title: "What is a Recession?",
    tag: "glossary",
    icon: "📉",
    kids: "🎈 A recession is like a nap time for shops and factories. They produce less, people buy less, and everyone rests for a few months.",
    beginner: "📊 **What is this?** A significant decline in physical economic activity across a country, lasting several months.<br>💡 **Why does it matter?** It means businesses report worse profits, job hiring drops, and households must spend more carefully.<br>⚙️ **What affects it?** Sudden fuel price jumps, financial bubbles popping, or high interest rates cutting borrowing capacity.<br>🔄 **What does it affect?** Wage growth rates, national unemployment levels, tax collections, and local safety budgets.<br>🌍 **How does it connect to the world?** Recessions in large target markets (like China or Europe) drop shipping demands and hurt businesses globally.",
    highSchool: "📊 **What is this?** A period of general economic contraction, commonly defined as two consecutive quarters of negative real GDP growth.<br>💡 **Why does it matter?** Causes broad unemployment spikes, drops retail sales indices, and causes credit availability to dry up.<br>⚙️ **What affects it?** Severe price shocks, sudden monetary tightening cycles, credit crunches, and declining consumer sentiment index trends.<br>🔄 **What does it affect?** Corporate default rates, central bank interest rate cuts, and federal safety program expenses.<br>🌍 **How does it connect to the world?** Transmits negative trade shifts across borders, proving that consumer spending declines instantly hurt manufacturers globally.",
    college: "📊 **What is this?** A macroeconomic cycle phase marked by aggregate demand contraction, negative output gaps, and cyclical unemloyment jumps.<br>💡 **Why does it matter?** Drives major shifts in microeconomic resource usage and forces structural credit restructuring.<br>⚙️ **What affects it?** Systemic debt deleveraging cycles, inventory cycle adjustments, and consumer aggregate savings rate trends.<br>🔄 **What does it affect?** Equity pricing multiples, corporate bankruptcy filings, and long-duration treasury bond yields.<br>🌍 **How does it connect to the world?** Triggers capital flight to safe-haven sovereign assets (like USD bonds), shifting international capital flows.",
    researcher: "🔬 **What is this?** An endogenous contraction of the domestic credit network, with structural margin improvements and labor resource adjustments.<br>💡 **Why does it matter?** Corrects previous misallocations of capital but inflicts high structural costs on labor.<br>⚙️ **What affects it?** Yield curve inversions (such as 10Y-2Y treasury spreads), corporate default rates, and banking lending constraints.<br>🔄 **What does it affect?** Credit risk spreads, corporate cash preservation targets, and political fiscal cycles.<br>🌍 **How does it connect to the world?** Drives structural shifts in the global terms of trade, testing banking reserves under stress."
  },
  fed_funds: {
    title: "What is the Fed Funds Rate?",
    tag: "glossary",
    icon: "🚦",
    kids: "🎈 It is the master speed limit set for money! High rate means save coins, slow rate means spend, and banks borrow expensive coins.",
    beginner: "📊 **What is this?** The foundational interest rate that commercial banks charge each other for overnight loans of reserved cash.<br>💡 **Why does it matter?** It acts as the master lever. All other interest rates (for credit cards, autoloans, and mortgages) are built on top of this rate.<br>⚙️ **What affects it?** The Federal Reserve open market committee votes, looking at inflation levels and job numbers.<br>🔄 **What does it affect?** The cost to borrow money across the world, stock valuations, and the interest on your savings account.<br>🌍 **How does it connect to the world?** When the US Fed Funds rate rises, global investors pull their cash out of international markets and route it to US bonds.",
    highSchool: "📊 **What is this?** The target overnight lending reserve interest target rate set by the Federal Open Market Committee (FOMC).<br>💡 **Why does it matter?** Operates as the central bank's primary tool to either cool down a hot, inflationary economy or stimulate a slow recessionary one.<br>⚙️ **What affects it?** Domestic inflation curves, core unemployment rates, credit growth trends, and commercial banking system health.<br>🔄 **What does it affect?** Treasury bill yields, commercial prime loan interest rates, and global stock market multiples.<br>🌍 **How does it connect to the world?** Guides international capital allocations; higher rates strengthen the US Dollar DXY index against floating fiat currencies.",
    college: "📊 **What is this?** The nominal interbank funding cost targeting tier-1 reserves, set by the central bank via open market operations.<br>💡 **Why does it matter?** Dictates money multiplier capacities and sets the absolute base premium of the national risk-free discount rate.<br>⚙️ **What affects it?** The Taylor Rule equation (inflation vs output gaps), repo collateral levels, and interbank funding market metrics.<br>🔄 **What does it affect?** Nominal discount rate hurdle baselines, currency forward valuations, and structural commercial banking profitability.<br>🌍 **How does it connect to the world?** Represents the cornerstone global funding cost, dictating liquidity parameters in Eurodollar markets.",
    researcher: "🔬 **What is this?** The policy target rate anchoring overnight credit spreads, set via interest on reserve balances (IORB) and reverse repo bounds.<br>💡 **Why does it matter?** Operates as the ultimate control valve over commercial bank balance sheet expansion capacity.<br>⚙️ **What affects it?** Systemic quantitative easing balance sheet scales, interbank liquidity buffers, and macroeconomic inflation spreads.<br>🔄 **What does it affect?** SOFR funding rates, offshore Eurodollar leverage parameters, and multi-asset default probability models.<br>🌍 **How does it connect to the world?** Directs the global risk-free asset rate floor, governing the velocity of international credit creation corridors."
  },
  yield_curve: {
    title: "What is the Yield Curve?",
    tag: "glossary",
    icon: "📉",
    kids: "🎈 Imagine a graph showing bank interest rates! Usually, borrowing for a long time costs more. When short-term gets expensive, it warns of upcoming economic winter.",
    beginner: "📊 **What is this?** A line graph comparing the interest rates of government bonds ranging from short-term (1 month) to long-term (30 years).<br>💡 **Why does it matter?** Usually, long-term bonds pay higher interest, but when short-term yields spike above long-term (an inverted curve), it reliably screams: 'Recession is coming!'<br>⚙️ **What affects it?** Central bank interest hikes, long-term economic growth expectations, and investor investment time horizons.<br>🔄 **What does it affect?** Bank loan margins, stock market confidence, corporate funding schedules, and mortgage rates.<br>🌍 **How does it connect to the world?** Serves as the global economic radar, helping savers and nations allocate cash years in advance.",
    highSchool: "📊 **What is this?** A curve plotting the yields of similar-quality US government treasury bonds across successive maturity dates.<br>💡 **Why does it matter?** A normal upward sloping curve signals expansion. An inverted curve (short yields above long yields) has preceded every recession for 50 years.<br>⚙️ **What affects it?** Short-term central bank target adjustments and long-term macro inflation expectations of institutional investors.<br>🔄 **What does it affect?** Net interest margin (NIM) profitability margins of commercial savings bands and capital investment allocations.<br>🌍 **How does it connect to the world?** Forms the credit backbone of international markets, guiding multi-billion dollar debt fund structures globally.",
    college: "📊 **What is this?** The graphical representation of intertemporal sovereign debt yield-to-maturities across continuous durations.<br>💡 **Why does it matter?** Reveals market-wide expectations regarding future short-term rate policy shifts and inflation directions.<br>⚙️ **What affects it?** Inflation risk premiums, monetary term premiums, asset supply schedules, and foreign sovereign central bank reserve buying.<br>🔄 **What does it affect?** Pension fund asset allocations, mortgage derivative valuations, and institutional credit default swap spreads.<br>🌍 **How does it connect to the world?** Controls the pricing of sovereign risk globally, forming the baseline term-structure of international capital.",
    researcher: "🔬 **What is this?** The term-structure of sovereign risk-free interest rates modeling the expected path of intertemporal policy rates and term premiums.<br>💡 **Why does it matter?** Yield inversions represent structural restrictions in banking sector maturity transformation margins.<br>⚙️ **What affects it?** Structural demographics, monetary policy paths, global capital flows, and pension fund asset-liability duration match needs.<br>🔄 **What does it affect?** Term duration risk allocations, swap rate metrics, bank credit creation, and systemic risk premiums.<br>🌍 **How does it connect to the world?** Operates as the baseline credit benchmark, integrating sovereign financial strength with international capital flows."
  }
};

let deferredPrompt = null;
let currentMode = 'beginner'; // Default mode

document.addEventListener('DOMContentLoaded', () => {
  // 0. GENERATE THE INTUITIVE ENVIRONMENTAL ATMOSPHERE
  const envContainer = document.createElement('div');
  envContainer.className = 'cinematic-environment';
  envContainer.innerHTML = `
    <div class="cinematic-grid-3d"></div>
    <div class="glowing-world-map"></div>
    <div class="cinematic-vignette"></div>
    <div class="cinematic-fog-glow"></div>
    <div class="cinematic-fog-glow-2"></div>
    <div class="animated-economy-line line-1"></div>
    <div class="animated-economy-line line-2"></div>
    <div class="animated-economy-line line-3"></div>
    <div class="floating-market-particles">
      <div class="floating-particle part-1"></div>
      <div class="floating-particle part-2"></div>
      <div class="floating-particle part-3"></div>
      <div class="floating-particle part-4"></div>
      <div class="floating-particle part-5"></div>
    </div>
    <!-- Integrated Environmental Watermark Logo Overlay -->
    <div class="environmental-logo-container">
      <svg class="holographic-neural-logo" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M400 150 C250 150, 150 250, 150 400 C150 550, 250 650, 400 650 C550 650, 650 550, 650 400 C650 280, 560 180, 440 155" stroke="rgba(0, 217, 255, 0.45)" stroke-width="1.5" stroke-dasharray="6 6"></path>
        <path d="M400 200 C320 200, 200 300, 200 400 C200 500, 320 600, 400 600 C480 600, 600 500, 600 400" stroke="rgba(255, 0, 200, 0.3)" stroke-width="1.5"></path>
        <line x1="100" y1="400" x2="700" y2="400" stroke="rgba(0, 217, 255, 0.35)" stroke-width="2" />
        <line x1="200" y1="300" x2="600" y2="500" stroke="rgba(122, 59, 255, 0.2)" stroke-width="1.5" />
        <line x1="200" y1="500" x2="600" y2="300" stroke="rgba(122, 59, 255, 0.2)" stroke-width="1.5" />
        <circle cx="400" cy="400" r="10" fill="rgba(0, 217, 255, 0.8)" />
        <circle cx="200" cy="400" r="6" fill="rgba(255, 0, 200, 0.6)" />
        <circle cx="600" cy="400" r="6" fill="rgba(255, 0, 200, 0.6)" />
        <circle cx="300" cy="300" r="5" fill="rgba(0, 217, 255, 0.4)" />
        <circle cx="500" cy="500" r="5" fill="rgba(0, 217, 255, 0.4)" />
        <circle cx="300" cy="500" r="5" fill="rgba(122, 59, 255, 0.4)" />
        <circle cx="500" cy="300" r="5" fill="rgba(122, 59, 255, 0.4)" />
        <circle cx="400" cy="400" r="280" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        <circle cx="400" cy="400" r="180" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        <text x="400" y="425" text-anchor="middle" font-family="'Orbitron', sans-serif" font-weight="950" font-size="28" fill="rgba(0, 217, 255, 0.16)" letter-spacing="20">CLEARPATH</text>
        <text x="400" y="445" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10" fill="rgba(255, 255, 255, 0.08)" letter-spacing="4">FINANCIAL ENCYCLOPEDIA</text>
      </svg>
    </div>
  `;
  document.body.prepend(envContainer);

  // Do not register a service worker. /learn/service-worker.js is a kill-switch
  // for browsers that still have the old cache-first worker.

  // 2. DETECT NETWORK ONLINE/OFFLINE EVENT LOGIC
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();

  // 3. LISTEN FOR INSTALL HUD PROMPTS
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallToast();
  });

  // 4. HAMBURGER SLIDE EVENT
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // 5. CLIENT-SIDE REACTIVE SEARCH WITH SYSTEM VOICE INGESTION (WEB SPEECH API)
  const searchBar = document.getElementById('searchBar');
  const micBtn = document.getElementById('micBtn');
  const clearBtn = document.getElementById('clearBtn');

  // Trigger search on typing input
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.card');
      
      cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const desc = card.querySelector('.card-desc').textContent.toLowerCase();
        const tag = card.querySelector('.card-tag').textContent.toLowerCase();
        
        if (title.includes(term) || desc.includes(term) || tag.includes(term)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      // Show clear button if search term is active
      if (clearBtn) {
        if (term.trim() !== '') {
          clearBtn.classList.add('visible');
        } else if (!micBtn || !micBtn.classList.contains('listening')) {
          clearBtn.classList.remove('visible');
        }
      }
    });
  }

  // Web Speech API Integration
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      if (micBtn) {
        micBtn.classList.add('listening');
        micBtn.title = 'Capturing Voice... Click to stop';
      }
      if (clearBtn) {
        clearBtn.classList.add('visible');
      }
    };

    recognition.onend = () => {
      isListening = false;
      if (micBtn) {
        micBtn.classList.remove('listening');
        micBtn.title = 'Voice Search';
      }
      // Re-evaluate clear button visibility
      if (clearBtn && (!searchBar || searchBar.value.trim() === '')) {
        clearBtn.classList.remove('visible');
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition interface warn/error:', event.error);
      isListening = false;
      if (micBtn) {
        micBtn.classList.remove('listening');
      }
      if (clearBtn && (!searchBar || searchBar.value.trim() === '')) {
        clearBtn.classList.remove('visible');
      }
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      if (searchBar) {
        searchBar.value = speechToText;
        // Trigger responsive catalog card filtrates instantly
        searchBar.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    if (micBtn) {
      micBtn.addEventListener('click', () => {
        if (isListening) {
          recognition.stop();
        } else {
          try {
            recognition.start();
          } catch (err) {
            console.error('Failed to boot voice acquisition:', err);
          }
        }
      });
    }
  } else {
    // Hide the microphone button if the user's host browser does not support the SpeechRecognition interface
    if (micBtn) {
      micBtn.style.display = 'none';
    }
  }

  // Bind red thick cancellation command button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (isListening && recognition) {
        recognition.abort(); // Immediately shut down any active microphone processing
      }
      if (searchBar) {
        searchBar.value = '';
        searchBar.dispatchEvent(new Event('input', { bubbles: true }));
        searchBar.focus();
      }
      clearBtn.classList.remove('visible');
    });
  }

  // 6. MODE TOGGLES (KIDS, BEGINNER, HIGH SCHOOL, COLLEGE, RESEARCHER)
  const modeButtons = document.querySelectorAll('.btn-mode');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      currentMode = mode;
      
      // Update body theme wrapper for visual changes
      if (mode === 'kids') {
        document.body.classList.add('kids-theme');
        document.body.classList.remove('accessible-theme');
      } else if (mode === 'accessible') {
        document.body.classList.add('accessible-theme');
        document.body.classList.remove('kids-theme');
      } else {
        document.body.classList.remove('kids-theme', 'accessible-theme');
      }

      // Live update main cards preview descriptions on-the-fly
      updateAllCardsForMode(mode);
      updateTemplatePage(mode);
    });
  });

  // 7. DRAWER DRAWER TRIGGER
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // If client clicked the action a button specifically or card
      const key = card.dataset.module;
      if (key && MODULES_DATA[key]) {
        openModuleDrawer(key);
      }
    });
  });

  const drawerCloseBtn = document.getElementById('drawerClose');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  if (drawerCloseBtn && drawerBackdrop) {
    drawerCloseBtn.addEventListener('click', () => {
      drawerBackdrop.style.display = 'none';
    });
    drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === drawerBackdrop) {
        drawerBackdrop.style.display = 'none';
      }
    });
  }

  // Initialize card previews and dynamic templates
  updateAllCardsForMode('beginner');
  updateTemplatePage('beginner');
});

// Update display card content on-the-fly depending on user selection
function updateAllCardsForMode(mode) {
  Object.keys(MODULES_DATA).forEach(key => {
    const card = document.querySelector(`.card[data-module="${key}"]`);
    if (card) {
      const descElement = card.querySelector('.card-desc');
      if (descElement) {
        descElement.textContent = MODULES_DATA[key][mode] || MODULES_DATA[key]['beginner'];
      }
    }
  });
}

// Dynamically populates topic page templates (e.g. education-template.html?topic=stocks_cat)
function updateTemplatePage(mode) {
  const urlParams = new URLSearchParams(window.location.search);
  let topic = urlParams.get('topic');
  
  // Default to 'stocks_cat' if on education template but no topic parameter is given
  if (!topic && window.location.pathname.includes('education-template.html')) {
    topic = 'stocks_cat';
  }
  
  if (topic && MODULES_DATA[topic]) {
    const data = MODULES_DATA[topic];
    
    const titleElem = document.getElementById('moduleTitle');
    const descElem = document.getElementById('moduleDesc');
    const displayArea = document.getElementById('cognitiveDisplayArea');
    
    const formulas = {
      stocks_cat: 'E(Ri) = Rf + β(Rm - Rf)',
      forex_cat: 'F = S * (1 + rd) / (1 + rf)',
      commodities_cat: 'F = S * e^((r+u-y)t)',
      economy_cat: 'Y = C + I + G + (X - M)',
      banking_cat: 'Reserves = Deposits * Reserve_Ratio',
      sectors_cat: 'HHI = Σ (si²)',
      nvda: 'FLOPS / Watt Efficiency',
      aapl: 'LTV / CAC ratio > 3x',
      msft: 'ARR / Churn Coefficient',
      tsla: 'kWh / Wh Mile Cost Rate',
      amzn: 'FCF / Warehouse CapEx SqFt',
      oil_airlines: 'delta(Fuel) vs delta(Yield)',
      inflation_housing: 'Shelter_CPI vs Core_PCE',
      rates_stocks: 'P/E = 1 / (r + ERP)',
      market_cap: 'Cap = Shares * Price_Share',
      liquidity: 'Slippage = dP / dV volume',
      recession_glossary: 'delta(Real_GDP) < 0 (2 Qs)',
      fed_funds: 'IORB <= overnight rate <= Repo_Bound',
      yield_curve: 'Yield_Diff = 10Y - 2Y'
    };
    
    const benchmarks = {
      stocks_cat: 'S&P 500 Equity Benchmark',
      forex_cat: 'USD Dollar Index (DXY)',
      commodities_cat: 'S&P GSCI Commodity Index',
      economy_cat: 'Real GDP growth rate',
      banking_cat: 'Federal Reserve balance sheet',
      sectors_cat: 'GICS Sector Concentration',
      nvda: 'AI parallel compute density',
      aapl: 'App Store margin rents',
      msft: 'SaaS recurring subscriptions',
      tsla: 'FSD neural miles driven',
      amzn: 'Logistics delivery volumes',
      oil_airlines: 'Kerosene crack spreads',
      inflation_housing: 'US shelter cost indices',
      rates_stocks: 'Equity Risk Premium model',
      market_cap: 'Vanguard Index weights',
      liquidity: 'Bid-Ask market spread',
      recession_glossary: 'NBER contraction cycle',
      fed_funds: 'SOFR average index',
      yield_curve: 'Treasury 10Y-2Y spread inversion'
    };

    if (titleElem) {
      titleElem.textContent = data.title;
    }
    if (descElem) {
      descElem.textContent = `Analyzing ${data.title.toLowerCase()} inside our clear global financial spectrum under cognitive mode: ${mode.toUpperCase()}.`;
    }
    if (displayArea) {
      let explanation = data[mode] || data['beginner'];
      let extraHtml = `
        <div style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 24px; color: #fff;">
          ${explanation}
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 10px;">
            <span style="font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; color: var(--color-neon-pink); display: block; margin-bottom: 4px;">Target Core Formula</span>
            <span style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: bold; color: #fff;">
              ${escapeHtml(formulas[topic] || 'T = f(I, R, G, S)')}
            </span>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 10px;">
            <span style="font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; color: var(--color-neon-cyan); display: block; margin-bottom: 4px;">Primary Volatility Benchmark</span>
            <span style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: bold; color: #fff;">
              ${escapeHtml(benchmarks[topic] || 'Market Volatility Index')}
            </span>
          </div>
        </div>
        
        <div style="margin-top: 2.5rem; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 1.5rem;">
          <h4 style="font-family: 'Orbitron', sans-serif; font-size: 0.8rem; color: var(--color-neon-cyan); letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase;">Spectrum Comparison</h4>
          <p style="font-size: 0.8rem; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 8px;"><strong style="color: #FF66B2;">Kids View:</strong> ${sanitizeLearnHtml(data.kids)}</p>
          <p style="font-size: 0.8rem; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 8px;"><strong style="color: var(--color-neon-cyan);">High School View:</strong> ${sanitizeLearnHtml(data.highSchool)}</p>
          <p style="font-size: 0.8rem; color: rgba(255,255,255,0.6); line-height: 1.6;"><strong style="color: var(--color-neon-purple);">Researcher View:</strong> ${sanitizeLearnHtml(data.researcher)}</p>
        </div>
      `;
      displayArea.innerHTML = extraHtml;
    }
  }
}

// Display the interactive learning drawer
function openModuleDrawer(key) {
  const data = MODULES_DATA[key];
  const backdrop = document.getElementById('drawerBackdrop');
  const dTitle = document.getElementById('drawerTitle');
  const dSubtitle = document.getElementById('drawerSubtitle');
  const dContent = document.getElementById('drawerContentText');
  const dIcon = document.getElementById('drawerIcon');
  
  if (backdrop && data) {
    dTitle.textContent = data.title;
    dSubtitle.textContent = `MODE LEVEL: ${currentMode.toUpperCase()}`;
    dIcon.textContent = data.icon;
    
    // Construct rich visual comparisons
    let rHtml = `
      <p class="text-white/80 style-body mb-6 text-base" style="margin-bottom: 24px; line-height: 1.8;">
        ${sanitizeLearnHtml(data[currentMode] || data['beginner'])}
      </p>
      
      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.5rem; border-radius: 12px;" class="mb-4">
        <h4 style="font-family: 'JetBrains Mono', monospace; font-size: 0.725rem; color: #00D9FF; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">Comparative Intelligence Spectrums</h4>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 4px;">
            <span style="color: #FF66B2;">🎈 Kids mode:</span>
            <span style="color: rgba(255,255,255,0.5);">${sanitizeLearnHtml(data.kids)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 4px;">
            <span style="color: #00D9FF;">🎓 High School:</span>
            <span style="color: rgba(255,255,255,0.5);">${sanitizeLearnHtml(data.highSchool)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #7A3BFF;">🔬 Researcher:</span>
            <span style="color: rgba(255,255,255,0.5);">${sanitizeLearnHtml(data.researcher)}</span>
          </div>
        </div>
      </div>
    `;
    
    dContent.innerHTML = rHtml;
    backdrop.style.display = 'flex';
  }
}

// Display/Hide install banner toast
function showInstallToast() {
  const toast = document.getElementById('installToast');
  const acceptBtn = document.getElementById('btnInstallAccept');
  const declineBtn = document.getElementById('btnInstallDecline');
  
  if (toast && acceptBtn && declineBtn) {
    toast.style.display = 'block';
    
    acceptBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            console.log('[PWA] User accepted standard desktop install');
          }
          deferredPrompt = null;
          toast.style.display = 'none';
        });
      }
    });

    declineBtn.addEventListener('click', () => {
      toast.style.display = 'none';
    });
  }
}

// Online/Offline detection bar banner
function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const offlineBanner = document.getElementById('offlineBanner');
  if (offlineBanner) {
    if (isOnline) {
      offlineBanner.style.display = 'none';
    } else {
      offlineBanner.style.display = 'flex';
    }
  }
}

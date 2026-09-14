/**
 * Public U.S. investment banks — official firm websites only.
 * Emails stay blank unless the firm's own site publishes an inbox (or a
 * later Advisory List CSV import attaches one). We do not invent addresses
 * or scrape LinkedIn.
 *
 * Source of this sheet: widely published U.S. bulge / boutique / MM /
 * regional / bank-owned IB franchises. Advisory List state scrape is
 * blocked from this VM (Vercel 429); run scripts/build-us-investment-banks.py
 * locally, then scripts/import-us-investment-banks-csv.py.
 *
 * Format: id|name|kind|website|linkedin|outreachEmail
 */
export const IB_CSV = `
ib_academy|Academy Securities|ib|https://www.academysecurities.com
ib_aegis|Aegis Capital|ib|https://www.aegiscapcorp.com||info@aegiscap.com
ib_agp|Alliance Global Partners|ib|https://www.allianceg.com
ib_alvarez|Alvarez & Marsal|ib|https://www.alvarezandmarsal.com
ib_ardea|Ardea Partners|ib|https://www.ardeapartners.com
ib_associatedbank|Associated Bank Capital Markets|ib|https://www.associatedbank.com
ib_bbh|Brown Brothers Harriman|ib|https://www.bbh.com
ib_blaylock|Blaylock Van|ib|https://www.blaylockvan.com
ib_bnp|BNP Paribas CIB|ib|https://www.bnpparibas.com
ib_bny|BNY|ib|https://www.bny.com
ib_boenning|Boenning & Scattergood|ib|https://www.boenninginc.com
ib_bok|BOK Financial|ib|https://www.bokf.com
ib_boustead|Boustead Securities|ib|https://www.boustead1828.com
ib_brean|Brean Capital|ib|https://www.breancapital.com
ib_btig|BTIG|ib|https://www.btig.com
ib_cabrera|Cabrera Capital Markets|ib|https://www.cabreracapital.com
ib_cacib|Credit Agricole CIB|ib|https://www.ca-cib.com
ib_cantor|Cantor Fitzgerald|ib|https://www.cantor.com
ib_capstone|Capstone Partners|ib|https://www.capstonepartners.com
ib_cascadia|Cascadia Capital|ib|https://www.cascadiacapital.com
ib_castleoak|CastleOak Securities|ib|https://www.castleoaklp.com||info@castleoaklp.com
ib_chardan|Chardan|ib|https://www.chardan.com
ib_cibc|CIBC Capital Markets|ib|https://www.cibccm.com
ib_citizens|Citizens Capital Markets|ib|https://www.citizensbank.com
ib_comerica|Comerica Securities|ib|https://www.comerica.com
ib_commerz|Commerzbank|ib|https://www.commerzbank.com
ib_commercestreet|Commerce Street Capital|ib|https://commercestreetholdings.com
ib_daiwa|Daiwa Capital Markets|ib|https://www.daiwa.com
ib_dawsonjames|Dawson James|ib|https://www.dawsonjames.com
ib_dcadvisory|DC Advisory|ib|https://www.dcadvisory.com
ib_donnellypenman|Donnelly Penman & Partners|ib|https://www.donnellypenman.com
ib_dougherty|Dougherty & Company|ib|https://www.doughertymarkets.com
ib_ducera|Ducera Partners|ib|https://www.ducerapartners.com
ib_eastdil|Eastdil Secured|ib|https://www.eastdilsecured.com
ib_efhutton|EF Hutton|ib|https://www.efhutton.com
ib_feltl|Feltl and Company|ib|https://www.feltl.com
ib_fhn|FHN Financial|ib|https://www.fhnfinancial.com
ib_firstanalysis|First Analysis|ib|https://www.firstanalysis.com
ib_focalpoint|FocalPoint Partners|ib|https://www.focalpointllc.com
ib_foros|Foros|ib|https://www.forosgroup.com
ib_frazerlanier|The Frazer Lanier Company|ib|https://www.frazerlanier.com
ib_frost|Frost Bank|ib|https://www.frostbank.com
ib_fti|FTI Capital Advisors|ib|https://www.fticonsulting.com
ib_gpbullhound|GP Bullhound|ib|https://www.gpbullhound.com
ib_hcw|H.C. Wainwright|ib|https://www.hcwco.com
ib_hilltop|Hilltop Securities|ib|https://www.hilltopsecurities.com
ib_hovde|Hovde Group|ib|https://www.hovdegroup.com
ib_hsbc|HSBC Global Banking|ib|https://www.business.hsbc.com
ib_huntington|Huntington Capital Markets|ib|https://www.huntington.com
ib_imperial|Imperial Capital|ib|https://www.imperialcapital.com
ib_ing|ING|ib|https://www.ing.com
ib_intrepid|Intrepid Partners|ib|https://www.intrepidfp.com
ib_janney|Janney Montgomery Scott|ib|https://www.janney.com
ib_jgunnar|Joseph Gunnar & Co.|ib|https://www.josephgunnar.com
ib_jmp|JMP Securities|ib|https://www.jmpsecurities.com
ib_johnsonrice|Johnson Rice & Company|ib|https://www.jrco.com
ib_kbw|Keefe Bruyette & Woods|ib|https://www.kbw.com
ib_kroll|Kroll|ib|https://www.kroll.com
ib_ladenburg|Ladenburg Thalmann|ib|https://www.ladenburg.com
ib_lakestreet|Lake Street Capital Markets|ib|https://www.lakestreetcapitalmarkets.com||info@lakestreetcm.com
ib_leerink|Leerink Partners|ib|https://www.leerink.com
ib_livingstone|Livingstone Partners|ib|https://www.livingstonepartners.com
ib_loop|Loop Capital|ib|https://www.loopcapital.com
ib_macquarie|Macquarie Capital|ib|https://www.macquarie.com
ib_maxim|Maxim Group|ib|https://www.maximgrp.com
ib_mesirow|Mesirow|ib|https://www.mesirow.com
ib_mischler|Mischler Financial Group|ib|https://www.mischlerfinancial.com
ib_mtb|M&T Securities|ib|https://www.mtb.com
ib_mufg|MUFG|ib|https://www.mufgamericas.com
ib_natixis|Natixis CIB|ib|https://cib.natixis.com
ib_nomura|Nomura|ib|https://www.nomura.com
ib_northerntrust|Northern Trust|ib|https://www.northerntrust.com
ib_northland|Northland Capital Markets|ib|https://www.northlandsecurities.com
ib_peacock|Peacock Hislop Staley & Given|ib|https://www.phsg.com
ib_penserra|Penserra|ib|https://www.penserra.com
ib_performancetrust|Performance Trust Capital Partners|ib|https://www.performancetrust.com
ib_pnc|PNC Capital Markets|ib|https://www.pnc.com
ib_rabobank|Rabobank|ib|https://www.rabobank.com
ib_ramirez|Samuel A. Ramirez & Co.|ib|https://www.ramirezco.com
ib_regions|Regions Securities|ib|https://www.regions.com
ib_rblt|Rosenblatt Securities|ib|https://www.rblt.com
ib_rockco|Rockefeller Capital Management|ib|https://www.rockco.com
ib_rseelaus|R. Seelaus & Co.|ib|https://www.rseelaus.com
ib_santander|Santander CIB|ib|https://www.santander.com
ib_sc|Standard Chartered|ib|https://www.sc.com
ib_scotiabank|Scotiabank GBM|ib|https://www.gbm.scotiabank.com
ib_seaport|Seaport Global|ib|https://www.seaportglobal.com
ib_sgcib|Societe Generale|ib|https://www.societegenerale.com
ib_siebertws|Siebert Williams Shank|ib|https://www.siebertwilliams.com
ib_smbc|SMBC|ib|https://www.smbcgroup.com
ib_southstate|SouthState DuncanWilliams|ib|https://southstateduncanwilliams.com
ib_spartan|Spartan Capital|ib|https://www.spartancapital.com
ib_stonex|StoneX Capital Markets|ib|https://www.stonex.com
ib_stout|Stout|ib|https://www.stout.com
ib_synovus|Synovus|ib|https://www.synovus.com
ib_tdsec|TD Securities|ib|https://www.tdsecurities.com
ib_texascapital|Texas Capital Securities|ib|https://www.texascapitalbank.com
ib_thinkequity|ThinkEquity|ib|https://www.think-equity.com||info@think-equity.com
ib_tph|Tudor Pickering Holt & Co|ib|https://www.tphco.com
ib_tripletree|TripleTree|ib|https://www.tripletree.com
ib_umb|UMB Capital Markets|ib|https://www.umb.com
ib_unicredit|UniCredit|ib|https://www.unicreditgroup.eu
ib_usbank|U.S. Bank|ib|https://www.usbank.com
ib_vistapoint|Vista Point Advisors|ib|https://www.vistapointadvisors.com
ib_walkerdunlop|Walker & Dunlop|ib|https://www.walkerdunlop.com
ib_westpark|WestPark Capital|ib|https://www.wpcapital.com
ib_wintrust|Wintrust|ib|https://www.wintrust.com
ib_woodside|Woodside Capital Partners|ib|https://www.woodsidecap.com
`.trim();

/**
 * Filled by scripts/import-us-investment-banks-csv.py after a local
 * Advisory List run. Empty on purpose until that CSV exists.
 */
export const ADVISORY_IB_CSV = `
`.trim();

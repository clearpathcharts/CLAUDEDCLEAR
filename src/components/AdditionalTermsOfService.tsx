import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ChevronLeft, 
  Scale, 
  ShieldCheck, 
  FileText, 
  Clock, 
  HelpCircle, 
  DollarSign, 
  Cpu, 
  MapPin, 
  Bot, 
  UserPlus, 
  AlertTriangle, 
  ClipboardCheck, 
  Lock, 
  BellRing, 
  Hourglass, 
  Gavel 
} from 'lucide-react';
import { motion } from 'motion/react';
import { SurfBackground } from './SurfBackground';

interface AdditionalTermsOfServiceProps {
  onBack: () => void;
  profile?: any;
}

export default function AdditionalTermsOfService({ onBack, profile }: AdditionalTermsOfServiceProps) {
  const [activeSection, setActiveSection] = useState<string>('intro');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const menuSections = [
    { id: 'intro', label: '1. Introduction', icon: FileText },
    { id: 'age', label: '2. Age Requirements', icon: UserPlus },
    { id: 'restrictions', label: '3. Use Restrictions', icon: ShieldAlert },
    { id: 'generation', label: '4. Generated Content', icon: Cpu },
    { id: 'unpaid', label: '5. Unpaid Services', icon: HelpCircle },
    { id: 'paid', label: '6. Paid Services', icon: DollarSign },
    { id: 'agentic', label: '7. Agentic Services', icon: Bot },
    { id: 'search', label: '8. Clear Path Search', icon: ShieldCheck },
    { id: 'maps', label: '9. Clear Path Maps', icon: MapPin },
    { id: 'hardware', label: '10. Hardware Safety', icon: AlertTriangle },
    { id: 'regulatory', label: '11. Regulatory Disclaimer', icon: Scale },
    { id: 'dpa-compliance', label: '12. Regulatory Assistance', icon: ClipboardCheck },
    { id: 'dpa-confidentiality', label: '13. Confidentiality', icon: Lock },
    { id: 'dpa-breach', label: '14. Breach Notification', icon: BellRing },
    { id: 'dpa-duration', label: '15. Duration', icon: Hourglass },
    { id: 'dpa-law', label: '16. Governing Law', icon: Gavel },
  ];

  return (
    <div className="min-h-screen relative bg-[#050314] text-white flex flex-col font-sans overflow-x-hidden">
      <SurfBackground />
      {/* 35% Translucent Watermark background */}
      <div 
        className="fixed inset-0 pointer-events-none mix-blend-overlay opacity-[0.05] z-0 bg-gradient-to-tr from-[#FF00C8]/10 via-[#00D9FF]/5 to-transparent"
      />
      <div className="fixed inset-0 bg-[#060317]/95 -z-10" />

      {/* Persistent Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#050314]/80 border-b border-[#FF00C8]/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="group flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF00C8]/50 hover:bg-[#FF00C8]/10 text-white transition-all duration-300 text-xs font-mono uppercase tracking-wider"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Return</span>
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono text-[#FF00C8] animate-pulse">SYSTEM COMPLIANCE NODE</span>
            <h1 className="text-sm md:text-base font-black uppercase tracking-wider text-[#00D9FF] font-mono leading-none mt-1">Additional Terms of Service</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[10px] bg-black/60 px-4 py-2 border border-white/5 rounded-full text-zinc-400 font-mono">
          <Clock size={12} className="text-[#00D9FF]" />
          <span>EFFECTIVE: MAY 28, 2026</span>
        </div>
      </header>

      {/* Core Split-Layout Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* Left column: Floating Section Menu index */}
        <aside className="lg:w-80 shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="p-5 rounded-2xl bg-black/70 border border-[#00D9FF]/20 backdrop-blur-xl">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] font-mono text-zinc-300 mb-4 border-b border-white/10 pb-2">
                INDEX GUIDELINES
              </h2>
              <div className="space-y-1">
                {menuSections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs font-mono transition-all duration-200 border ${
                        activeSection === sec.id 
                          ? 'bg-[#FF00C8]/10 border-[#FF00C8]/50 text-white shadow-[0_0_15px_rgba(255,0,200,0.25)]' 
                          : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                      }`}
                    >
                      <Icon size={14} className={activeSection === sec.id ? 'text-[#FF00C8]' : 'text-zinc-500'} />
                      <span className="truncate">{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Warning Stamp */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/20">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-black font-mono mb-2 uppercase tracking-wide">
                <AlertTriangle size={14} />
                <span>Regulatory Mandate</span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 leading-normal uppercase">
                ALL PRODUCTS DEPLOYED WITHIN THIS TERMINAL DEMAND COMPLIANCE CHECKS. UNAUTHORIZED USE WILL SEVER ACCOUNT INTEGRATIONS IMMEDIATELY.
              </p>
            </div>
          </div>
        </aside>

        {/* Right column: Beautifully styled terms of service body */}
        <main className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-xl shadow-2xl space-y-12 overflow-y-auto">
          
          <section id="intro" className="space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-wider text-[#00D9FF] border-b border-[#00D9FF]/20 pb-2 family-mono flex items-center gap-3">
              <FileText className="text-[#00D9FF]" />
              Clear Path API Additional Terms of Service
            </h2>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] font-mono text-xs text-zinc-400 space-y-4 leading-relaxed">
              <p className="text-zinc-200 font-bold uppercase tracking-wide">Effective May 28, 2026</p>
              <p>
                To use Clear Path API, Clear Path Market Science, and the other ClearPathTrader.com developer services that reference these terms (collectively, the <strong className="text-white">"APIs"</strong> or <strong className="text-white">"Services"</strong>), you must accept (1) the Clear Path APIs Terms of Service (the <strong className="text-white">"API Terms"</strong>), and (2) these Clear Path API Additional Terms of Service (the <strong className="text-white">"Additional Terms"</strong>). Terms that are not defined in these Additional Terms have the meanings given in the API Terms.
              </p>
            </div>
          </section>

          <section id="age" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <UserPlus className="text-[#FF00C8]" size={18} />
              Age Requirements
            </h3>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              You must be 18 years of age or older to use the APIs. You also will not use the Services as part of a website, application, or other service (collectively, <strong className="text-white">"API Clients"</strong>) that is directed towards or is likely to be accessed by individuals under the age of 18.
            </p>
          </section>

          <section id="restrictions" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <ShieldAlert className="text-[#FF00C8]" size={18} />
              Use Restrictions
            </h3>
            <div className="space-y-4 text-sm text-zinc-300 font-mono leading-relaxed">
              <p>
                Use of Clear Path Market Science and Clear Path API is for developers building with Clear Path Market Science AI models for professional or business purposes, not for consumer use.
              </p>
              <p className="border-l-2 border-[#00D9FF] pl-4 italic text-zinc-200 bg-[#00D9FF]/5 p-3 rounded-r-xl">
                You may only access the Services (or make API Clients available to users) within an available region. <strong>You may use only Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom.</strong>
              </p>
              <p>
                You may not use the Services to develop models that compete with the Services (e.g., Clear Path API or Clear Path Market Science). You also may not attempt to reverse engineer, extract or replicate any component of the Services, including the underlying data or models (e.g., parameter weights).
              </p>
              <p>
                In addition to the "API Prohibitions" section in the API Terms, you must comply with our Prohibited Use Policy, which provides additional details about appropriate conduct when using the Services.
              </p>
              <p>
                The Services include safety features to block harmful content, such as content that violates our Prohibited Use Policy. You may not attempt to bypass these protective measures or use content that violates the API Terms or these Additional Terms. You are responsible for determining the necessary and appropriate safety settings and factuality tools for your use case. Applications with less restrictive safety settings may be subject to ClearPathTrader.com's review and approval.
              </p>
              <p className="text-[#FF4500] font-bold">
                You may not use the Services in clinical practice, to provide medical advice, or in any manner that is overseen by or requires clearance or approval from a medical device regulatory agency.
              </p>
            </div>
          </section>

          <section id="generation" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <Cpu className="text-[#FF00C8]" size={18} />
              Use of Generated Content
            </h3>
            <div className="space-y-4 text-sm text-zinc-300 font-mono leading-relaxed">
              <p>
                Some of our Services allow you to generate original content. ClearPathTrader.com won't claim ownership over that content. You acknowledge that ClearPathTrader.com may generate the same or similar content for others and that we reserve all rights to do so.
              </p>
              <p>
                As required by the API Terms, you'll comply with applicable law in using generated content, which may require the provision of attribution to your users when returned as part of an API call. Use discretion before relying on generated content, including code. You're responsible for your use of generated content, and for the use of that content by anyone you share it with.
              </p>
            </div>
          </section>

          <section id="unpaid" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <HelpCircle className="text-[#FF00C8]" size={18} />
              Unpaid Services
            </h3>
            <div className="space-y-4 text-sm text-zinc-300 font-mono leading-relaxed bg-zinc-950/40 p-5 rounded-2xl border border-white/5">
              <p>
                Any Services that are offered free of charge like direct interactions with Clear Path Market Science or unpaid quota in Clear Path API are unpaid Services (the <strong className="text-white">"Unpaid Services"</strong>).
              </p>
              
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#00D9FF] pt-2">How ClearPathTrader.com Uses Your Data</h4>
              <p>
                When you use Unpaid Services, including, for example, Clear Path Market Science and the unpaid quota on Clear Path API, ClearPathTrader.com uses the content you submit to the Services and any generated responses to provide, improve, and develop ClearPathTrader.com products and services and machine learning technologies, including ClearPathTrader.com's enterprise features, products, and services, consistent with our Privacy Policy.
              </p>
              <p className="border-l-2 border-red-500 pl-4 bg-red-950/20 p-3 rounded-r-xl text-zinc-200">
                To help with quality and improve our products, human reviewers may read, annotate, and process your API input and output. ClearPathTrader.com takes steps to protect your privacy as part of this process. This includes disconnecting this data from your Clear Path Account, API key, and Cloud project before reviewers see or annotate it. <strong>Do not submit sensitive, confidential, or personal information to the Unpaid Services.</strong>
              </p>
              <p>
                The license you grant to ClearPathTrader.com under the "Submission of Content" section in the API Terms also extends, to the extent required under applicable law for our use, to any content (e.g., prompts, including associated system instructions, cached content, and files such as images, videos, or documents) you submit to the Services and to any generated responses.
              </p>
              <p>
                ClearPathTrader.com only uses content that you import or upload to our model tuning feature for that express purpose. Tuning content may be retained in connection with your tuned models for purposes of re-tuning when supported models change. When you delete a tuned model, the related tuning content is also deleted.
              </p>
              <p>
                If you're in the European Economic Area, Switzerland, or the United Kingdom, the terms under "How ClearPathTrader.com uses Your Data" in "Paid Services" apply to all Services, including Clear Path Market Science and unpaid quota in the Clear Path API, even though they are offered free of charge.
              </p>
            </div>
          </section>

          <section id="paid" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <DollarSign className="text-[#FF00C8]" size={18} />
              Paid Services
            </h3>
            <div className="space-y-4 text-sm text-zinc-300 font-mono leading-relaxed bg-[#00D9FF]/5 p-5 rounded-2xl border border-[#00D9FF]/10">
              <p>
                When a Service is being offered for a fee, it is considered to be a paid Service (the <strong className="text-white">"Paid Services"</strong>). Your access to Clear Path Market Science is a "Paid Service" even when it is offered free of charge, as long as the account you are using to access Clear Path Market Science has access to a Cloud Project with an associated and active Cloud Billing account or is a Workspace enterprise account. Your access to Clear Path API is a "Paid Service" only when accessing the API through a Cloud Project associated with an active billing account.
              </p>
              <p>
                For Paid Services, "ClearPathTrader.com" as used in these Terms has the meaning given in our entity documentation.
              </p>

              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#00D9FF] pt-2">How ClearPathTrader.com Uses Your Data</h4>
              <p>
                When you use Paid Services, including, for example, the paid quota of the Clear Path API, ClearPathTrader.com doesn't use your prompts (including associated system instructions, cached content, and files such as images, videos, or documents) or responses to improve our products, and will process your prompts and responses in accordance with the Data Processing Addendum for Products Where ClearPathTrader.com is a Data Processor. For Paid Services, ClearPathTrader.com logs prompts and responses for a limited period of time, solely for detecting and preventing violations of the Prohibited Use Policy to maintain the safety and security of the Services, and any required legal or regulatory disclosures. This data may be stored transiently or cached in any country in which ClearPathTrader.com or its agents maintain facilities.
              </p>
              <p>
                Other data we collect while providing the Paid Services to you, such as account information and settings, billing history, direct communications and feedback, and usage details (e.g., information about usage including token count per prompt and response, operational status, safety filter triggers, software errors and crash reports, authentication details, quality and performance metrics, and other technical details necessary for ClearPathTrader.com to operate and maintain Services, which may include device identifiers, identifiers from cookies or tokens, and IP addresses) remains subject to the ClearPathTrader.com Controller-Controller Data Protection Terms and ClearPathTrader.com Privacy Policy referenced in the API Terms.
              </p>
              <p>
                When using Grounding with Clear Path Search, additional data is collected and used, as detailed in the "Grounding with Clear Path Search" section below.
              </p>

              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#00D9FF] pt-2">Payment Terms</h4>
              <p>
                Billing and payments for Paid Services are handled by Cloud Billing in the Clear Path Cloud Platform.
              </p>
              <p>
                As such, while these Terms govern your use of the Paid Services, the following sections of the Clear Path Cloud Terms of Service as applicable to the Clear Path Cloud Platform (or "CPMS Services" as defined in the Clear Path Cloud Terms of Service), will govern payments, invoicing, billing, payment disputes, and related issues pertaining to the Paid Services, as if the Paid Services were CPMS Services for purposes of those sections:
              </p>
              <ul className="list-disc list-inside pl-4 text-xs space-y-1 text-zinc-400">
                <li>Section 2 (Payment Terms);</li>
                <li>Section 14 (Miscellaneous);</li>
                <li>Section 15 (Regional Modifications), as applicable to:</li>
                <li className="pl-6 font-semibold">Governing Law and Dispute Resolution;</li>
                <li className="pl-6 font-semibold">Payment, Taxes, and Invoice Disputes;</li>
                <li className="pl-6 font-semibold">Currency Conversion; and</li>
                <li className="pl-6 font-semibold">Other Regional Modifications; and</li>
                <li>the Pricing and Billing Terms of the Service Specific Terms, including the Supplemental Paid Credit Terms.</li>
              </ul>
              <p>
                <strong>"Fees"</strong> (as used in the Clear Path Cloud Terms of Service) for Paid Services are as specified on our pricing page. ClearPathTrader.com may make changes to this pricing from time to time, effective 30 days after they are posted unless otherwise specified (or in the case of new Paid Services, where pricing takes effect immediately unless otherwise specified). Your continued use of the Paid Services constitutes your consent to those changes.
              </p>
              <p className="text-xs text-zinc-500 font-semibold italic">
                For clarity, these Terms do not govern your direct use of any Clear Path Cloud Platform service.
              </p>
            </div>
          </section>

          <section id="agentic" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <Bot className="text-[#FF00C8]" size={18} />
              Agentic Services
            </h3>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              When using agentic services, including the Computer Use API, you are solely responsible for the actions and tasks performed by the service, such as determining whether the service is appropriate for your use case, authorizing the service's access and connection to data, applications, and systems, and exercising judgment and supervision when and if the service is used in production environments. You will not automatically bypass any requests for human confirmation.
            </p>
          </section>

          <section id="search" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <ShieldCheck className="text-[#FF00C8]" size={18} />
              Grounding with Clear Path Search
            </h3>
            <div className="space-y-4 text-sm text-zinc-300 font-mono leading-relaxed">
              <p>
                "Grounding with Clear Path Search" is a Service that provides Grounded Results and Search Suggestions and can be used through Clear Path Market Science (as an Unpaid Service), and via Clear Path API as a (Paid Service). "Grounded Results" mean responses that ClearPathTrader.com generates using the prompt from the end user (or from you, when using function calling), contextual information that you may provide (as applicable), and results from ClearPathTrader.com's search engine. "Search Suggestions" mean search suggestions that ClearPathTrader.com provides with the Grounded Results. If a Grounded Result is clicked on, separate terms (not these terms) govern the destination page. If a Search Suggestion is clicked on, the ClearPathTrader.com Terms of Service govern the destination page. "Links" are any other means to fetch web pages (including hyperlinks and URLs), which may be contained in a Grounded Result or Search Suggestion. Links also include titles or labels provided with those means to fetch web pages. Excluding your web domain(s), you will not assert ownership rights in any intellectual property in Search Suggestions or Links in Grounded Results.
              </p>

              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#00D9FF]">Use Restrictions</h4>
              <ul className="space-y-3 list-none pl-1 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9FF] shrink-0">•</span>
                  <span>You will only use Grounding with Clear Path Search in an application that is owned and operated by you and will only display the Grounded Results with the associated Search Suggestion(s) to the end user who submitted the prompt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9FF] shrink-0">•</span>
                  <span>You will not, and will not allow your end user or any third party to, cache, frame, syndicate, resell, analyze, train on, or otherwise learn from Grounded Results or Search Suggestions. For clarity, Grounded Results, Search Suggestions, and Links are intended to be used in combination to respond to a given end user prompt and it is a violation of these terms to use Grounding with Clear Path Search to extract or collect one or more of these components for another purpose (for example, using programmatic or automated means to collect Links, using Links to build an index, or using Links to identify destination pages for crawling or scraping).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9FF] shrink-0">•</span>
                  <span>You will not, and will not allow your end user or any third party to, copy, store, or implement any click tracking, Link-tracking or other monitoring of Grounded Results or Search Suggestions, except that:</span>
                </li>
                <li className="pl-6 space-y-2">
                  <p>1. You may copy and store, for up to two (2) years, the text of the Grounded Result(s): (1) that were displayed by you only to evaluate and optimize the display of the Grounded Results in your application; (2) in chat history of an end user of your application only for the purpose of allowing that end user to view their chat history; and (3) temporarily for the purpose of resubmitting the text of the Grounded Result in a subsequent prompt that you submit to ClearPathTrader.com via a function call to obtain a refined or improved Grounded Result to display to the end user, as long as the developer: (i) does not use the interim Grounded Results for any other purpose; (ii) deletes any Grounded Result that is not displayed to the end user once the final Grounded Result is generated; and (iii) displays any associated Search Suggestions or other Links (as applicable) with the final Grounded Result (up to a maximum of 5 Search Suggestions) to the end user.</p>
                  <p>2. You may copy and store the Grounded Result and Search Suggestions solely for the purpose of and for the minimum time necessary to comply with applicable law or regulations.</p>
                  <p>3. You may allow end user(s) to copy and store individual Grounded Results that were displayed to them through your application as long as you do not allow Grounded Results to be accessed or collected by automated or programmatic means or to be used to create a database.</p>
                  <p>5. You may monitor end user interactions with your application interface; however, you will not track whether those interactions were specifically with a given Search Suggestion or Grounded Result (in each case, in whole or in part, including any specific Link).</p>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D9FF] shrink-0">•</span>
                  <span>Unless permitted by ClearPathTrader.com in writing, you: (1) will not modify, or intersperse any other content with, the Grounded Results or Search Suggestions; and (2) will not place any interstitial content between any Link or Search Suggestions and the associated destination page, redirect end users away from the destination pages, or minimize, remove, or otherwise inhibit the full and complete display of any destination page.</span>
                </li>
              </ul>

              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#00D9FF]">Data Collection and How ClearPathTrader.com Uses Your Data</h4>
              <p className="text-xs text-zinc-400">
                In addition to the general terms above ("How ClearPathTrader.com Uses Your Data" under "Unpaid Services" and "Paid Services"), when using Grounding with Clear Path Search, ClearPathTrader.com will store prompts, contextual information that you may provide, and output for thirty (30) days for the purposes of creating Grounded Results and Search Suggestions and the stored information can be used for debugging and testing of systems that support Grounding with Clear Path Search. When using Grounding with Clear Path Search via paid quota of Clear Path API, this processing for debugging and testing of systems is in accordance with the Data Processing Addendum for Products Where ClearPathTrader.com is a Data Processor.
              </p>
            </div>
          </section>

          <section id="maps" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <MapPin className="text-[#FF00C8]" size={18} />
              Grounding with Clear Path Maps
            </h3>
            <div className="space-y-4 text-sm text-zinc-300 font-mono leading-relaxed">
              <p>
                "Grounding with Clear Path Maps" is a Service that provides Clear Path Maps Grounded Results as a feature of Clear Path API. "Clear Path Maps Grounded Results" mean responses that ClearPathTrader.com generates using Clear Path Maps Data in response to an end user initiated prompt. "Clear Path Maps Data" means the content originating from Clear Path Maps in the Clear Path Maps Grounded Results, including in the output text, in the metadata of the Clear Path Maps Grounded Results, in the Clear Path Maps Links, and content accessed through Clear Path Maps Links. "Clear Path Maps Links" mean the URLs that ClearPathTrader.com provides in a Clear Path Maps Grounded Result and any titles or labels provided with those URLs. If Clear Path Maps Links are clicked on, these separate Clear Path Maps End User Terms and the ClearPathTrader.com Privacy Policy govern the destination page. Clear Path Maps Data in the text of a Clear Path Maps Grounded Result will be identified via the Clear Path Maps Links. Notwithstanding anything to the contrary in the Agreement, ClearPathTrader.com and its content providers retain all rights to Clear Path Maps Data.
              </p>

              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#00D9FF]">Use Restrictions</h4>
              <ol className="list-decimal list-inside pl-2 text-xs text-zinc-400 space-y-2">
                <li>You will only use Grounding with Clear Path Maps in an application that is owned and operated by you and will only use Grounding with Clear Path Maps to display the Clear Path Maps Grounded Results with the associated Clear Path Maps Links to the end user who initiated the prompt. An end user is an individual you permit to use your application.</li>
                <li>You will not modify the Clear Path Maps Grounded Result or intersperse any other content with the Clear Path Maps Grounded Result, place any interstitial content between the text of the Clear Path Maps Grounded Result and the Clear Path Maps Links or the Clear Path Maps Links and the associated destination page, or redirect end users away from the destination pages or minimize, remove, or otherwise inhibit the full and complete display of any destination page.</li>
                <li>You will comply with the Documentation for Grounding with Clear Path Maps.</li>
                <li>You will not, and will not allow your end users or any third party to:
                  <ul className="list-disc list-inside pl-4 pt-1 space-y-1">
                    <li>cache or store Clear Path Maps Grounded Results except that you may cache or store Clear Path Maps Grounded Results for up to ninety (90) days solely to evaluate display, or in chat history for up to six (6) months;</li>
                    <li>scrape or export any Clear Path Maps Data;</li>
                    <li>train on any Clear Path Maps Data; or</li>
                    <li>distribute or market any Customer Applications in any Prohibited Territory as defined in the Documentation.</li>
                  </ul>
                </li>
              </ol>

              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#00D9FF]">Data Collection and How ClearPathTrader.com Uses Your Data</h4>
              <p className="text-xs text-zinc-400">
                You acknowledge that it is reasonably necessary for ClearPathTrader.com to store prompts, contextual information that you may provide, and generated content for thirty (30) days for the purposes of creating Clear Path Maps Grounded Results, and since such information is being stored, you instruct ClearPathTrader.com that the stored information can be used for debugging and testing of systems that support Grounding with Clear Path Maps. When using Grounding with Clear Path Maps via paid quota of Clear Path API, this processing for debugging and testing of systems is in accordance with the Data Processing Addendum for Products Where ClearPathTrader.com is a Data Processor.
              </p>
            </div>
          </section>

          <section id="hardware" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <AlertTriangle className="text-[#FF00C8]" size={18} />
              Hardware Safety
            </h3>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              The following additional terms apply to models that can be used to control robots or other robotic hardware (<strong className="text-white">"Robotics Models"</strong>).
              <br/><br/>
              You acknowledge and agree that the Robotics Models have not been tested with all makes and models of robotics hardware, and therefore, that the performance and safety of the Robotics Models in connection with your hardware is not guaranteed or provided with a warranty of any kind. You therefore agree to operate any hardware or other products that you may use in connection with the Robotics Models in a safe manner, and completely at your own risk. The Robotics Models may act in an unpredictable or unexpected manner when used in connection with robotics hardware. You therefore agree to use discretion before using the Robotics Models in a production, commercial, or public environment, and to not use the Robotics Models for safety-critical applications or work, such as in the following settings: (i) healthcare, (ii) transportation, or (iii) other areas where safety protocols are vital, and a malfunction could reasonably foreseeably lead to death, personal injury, or property damage.
            </p>
          </section>

          <section id="regulatory" className="space-y-6 scroll-mt-24 border-t border-white/10 pt-8">
            <h3 className="text-xl font-black uppercase tracking-widest text-[#00D9FF] flex items-center gap-3">
              <Scale className="text-[#00D9FF]" />
              Regulatory & Financial Services Disclaimer
            </h3>
            
            <div className="space-y-4 text-xs font-mono text-zinc-300 leading-relaxed bg-[#FF00C8]/5 p-6 rounded-2xl border border-[#FF00C8]/25 shadow-[0_0_20px_rgba(255,0,200,0.1)]">
              
              <div className="border-[#FF00C8] border p-4 bg-black/60 rounded-xl space-y-2 mb-4 text-center">
                <p className="text-[#FF4500] font-black tracking-widest text-sm uppercase">WARNING: EXPERIMENTAL TECHNOLOGY & DIRECT INVESTMENT RISK DISCLAIMER</p>
                <p className="text-[10px] text-zinc-400">
                  The Services include experimental technology and may sometimes provide inaccurate or offensive content that doesn't represent ClearPathTrader.com's views. Use discretion before relying on, publishing, or otherwise using content provided by the Services.
                </p>
                <p className="text-[10px] text-zinc-400 font-semibold text-amber-500">
                  Don't rely on the Services for medical, mental health, legal, financial, or other professional advice. Any content regarding those topics is provided for informational purposes only, does not constitute medical diagnosis or treatment, and is not a substitute for advice from a qualified professional.
                </p>
              </div>

              <p>
                ClearPathTrader.com and Clear Path Market Science are software and technology platforms that provide advanced quantitative analytics, research tools, educational content, automation tools, market intelligence, and developer services.
              </p>

              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="bg-black/40 p-4 border border-white/5 rounded-xl">
                  <h4 className="text-[#FF00C8] text-[10px] font-black uppercase tracking-widest mb-2">ClearPathTrader.com is NOT:</h4>
                  <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                    <li>a broker-dealer;</li>
                    <li>a futures commission merchant;</li>
                    <li>a registered investment adviser;</li>
                    <li>a securities exchange;</li>
                    <li>a prop trading firm;</li>
                    <li>a signal provider;</li>
                    <li>a financial planner;</li>
                    <li>a fiduciary;</li>
                    <li>a money services business;</li>
                    <li>a bank.</li>
                  </ul>
                </div>

                <div className="bg-black/40 p-4 border border-white/5 rounded-xl">
                  <h4 className="text-[#00D9FF] text-[10px] font-black uppercase tracking-widest mb-2">ClearPathTrader.com does NOT:</h4>
                  <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                    <li>execute trades;</li>
                    <li>custody funds or assets;</li>
                    <li>accept customer deposits;</li>
                    <li>manage investment accounts;</li>
                    <li>place orders on behalf of users;</li>
                    <li>provide personalized investment advice;</li>
                    <li>provide individualized trading recommendations;</li>
                    <li>provide “buy,” “sell,” or “hold” directives.</li>
                  </ul>
                </div>
              </div>

              <p className="font-bold text-white pt-2">
                Any analytics, AI-generated content, market commentary, probabilities, research outputs, educational material, alerts, automation tools, scanners, rankings, indicators, or insights are provided solely for informational, research, and educational purposes.
              </p>

              <p className="border-l-2 border-[#00D9FF] pl-3 italic text-zinc-300">
                ClearPathTrader.com may display, advertise, integrate with, or link to third-party financial platforms, brokers, exchanges, trading tools, or financial service providers. Such references do not constitute endorsements, recommendations, guarantees, solicitations, investment advice, or partnerships creating agency relationships.
              </p>

              <h4 className="text-[#00D9FF] text-[10px] font-black uppercase tracking-widest pt-2">User Responsibility</h4>
              <p>
                Users acknowledge and agree that all trading, investing, and financial decisions are made independently and at their own discretion. The Services do not replace independent financial judgment, professional advice, or due diligence.
              </p>
              <p className="font-semibold text-white">
                Users are solely responsible for evaluating risks, verifying information, complying with laws and regulations, and determining suitability of any strategy or market activity. ClearPathTrader.com does not direct, control, supervise, or influence specific trades or investment activity.
              </p>

              <h4 className="text-[#FF00C8] text-[10px] font-black uppercase tracking-widest pt-2">Third-Party Services & Affiliate Disclosure</h4>
              <p>
                The Services may contain links, integrations, advertisements, sponsored content, referral relationships, or affiliate relationships involving third-party companies. ClearPathTrader.com may receive compensation, referral fees, advertising revenue, or other financial benefits from third-party providers. Third-party services are operated independently and are governed by their own terms, policies, and practices.
              </p>
              <p className="font-bold text-red-400">
                ClearPathTrader.com is not responsible for third-party services, trading losses, account issues, platform outages, regulatory compliance of third parties, actions or omissions of third-party providers. Users engage with third-party providers entirely at their own risk.
              </p>
            </div>
          </section>

          <div className="space-y-2 border-t border-white/10 pt-8">
            <h2 className="text-2xl font-black uppercase tracking-wider text-[#00D9FF] border-b border-[#00D9FF]/20 pb-2 family-mono flex items-center gap-3">
              <ShieldCheck className="text-[#00D9FF]" />
              Data Processing Addendum
            </h2>
            <p className="text-xs text-zinc-500 font-mono leading-relaxed">
              The following provisions supplement these Additional Terms with respect to Personal Data processed by ClearPathTrader.com (the "Processor") on behalf of you or your organization (the "Controller") under applicable Data Protection Laws.
            </p>
          </div>

          <section id="dpa-compliance" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <ClipboardCheck className="text-[#FF00C8]" size={18} />
              12. Assistance with Regulatory Compliance
            </h3>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              Processor will provide reasonable assistance to the Controller to ensure compliance with obligations regarding the security of Processing, data breach notifications, data protection impact assessments (DPIAs), and prior consultations with supervisory authorities, as reasonably required by applicable Data Protection Laws.
            </p>
          </section>

          <section id="dpa-confidentiality" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <Lock className="text-[#FF00C8]" size={18} />
              13. Confidentiality of Processing
            </h3>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              Processor will ensure that all persons authorized to process Personal Data are bound by appropriate confidentiality obligations, whether statutory or contractual.
            </p>
          </section>

          <section id="dpa-breach" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <BellRing className="text-[#FF00C8]" size={18} />
              14. Data Breach Notification
            </h3>
            <div className="space-y-3 text-sm text-zinc-300 font-mono leading-relaxed">
              <p>
                In the event of a Personal Data Breach affecting Controller's data, Processor will:
              </p>
              <ul className="list-disc list-inside pl-4 text-xs space-y-2 text-zinc-400">
                <li>Notify Controller without undue delay upon becoming aware of the breach;</li>
                <li>Provide information about the nature of the breach, the likely consequences, and any measures taken or proposed to address it;</li>
                <li>Assist Controller in complying with applicable breach notification requirements.</li>
              </ul>
            </div>
          </section>

          <section id="dpa-duration" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <Hourglass className="text-[#FF00C8]" size={18} />
              15. Duration
            </h3>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              The terms of this Addendum are effective for as long as Processor maintains or processes Personal Data on behalf of the Controller.
            </p>
          </section>

          <section id="dpa-law" className="space-y-4 scroll-mt-24">
            <h3 className="text-lg font-black uppercase tracking-wider text-[#FF00C8] flex items-center gap-2">
              <Gavel className="text-[#FF00C8]" size={18} />
              16. Governing Law
            </h3>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              This Addendum is governed by the laws that govern the primary service agreement (typically those of Delaware, unless otherwise specified in the Terms of Service).
            </p>
          </section>

          <div className="flex justify-center pt-6 border-t border-white/10">
            <button
              onClick={onBack}
              className="px-10 py-3.5 bg-gradient-to-r from-[#FF00C8] to-[#00D9FF] hover:opacity-95 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(255,0,200,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Acknowledge and Close Node
            </button>
          </div>

        </main>
      </div>

      {/* Mini-Disclaimer Footer of Legal Page */}
      <footer className="mt-auto py-6 border-t border-white/5 bg-black/40 text-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
        <span>© {new Date().getFullYear()} Clear Path Markets Science Compliance Matrix</span>
      </footer>
    </div>
  );
}

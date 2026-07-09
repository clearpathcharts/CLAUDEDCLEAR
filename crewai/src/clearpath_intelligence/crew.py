"""
ClearPath Market Intelligence & Competitive Intelligence Engine

Hierarchical 11-agent crew:
  Phase 1 (parallel): competitor harvest + social listen
  Phase 2 (parallel): macro, pattern, order flow, sentiment, correlation, backtest
  Phase 3: risk guardrail
  Phase 4: devil's advocate
  Phase 5: crew manager synthesis
  Phase 6: neurodivergent translator
"""

from __future__ import annotations

import os
from typing import List

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from clearpath_intelligence.tools.clearpath_api import (
    ClearPathGetCandlesTool,
    ClearPathGetQuoteTool,
    ClearPathGroundedNewsTool,
    ClearPathMacroFredTool,
)

# Optional CrewAI tool integrations — install crewai[tools] and set API keys.
try:
    from crewai_tools import (
        FileReadTool,
        FileWriteTool,
        ScrapeWebsiteTool,
        SerperDevTool,
        TavilySearchTool,
    )
except ImportError:  # pragma: no cover
    FileReadTool = FileWriteTool = ScrapeWebsiteTool = None  # type: ignore
    SerperDevTool = TavilySearchTool = None  # type: ignore

try:
    from crewai_tools import FirecrawlScrapeWebsiteTool
except ImportError:  # pragma: no cover
    FirecrawlScrapeWebsiteTool = None  # type: ignore


def _research_tools() -> list:
    tools = []
    if SerperDevTool and os.getenv("SERPER_API_KEY"):
        tools.append(SerperDevTool())
    if TavilySearchTool and os.getenv("TAVILY_API_KEY"):
        tools.append(TavilySearchTool())
    if ScrapeWebsiteTool:
        tools.append(ScrapeWebsiteTool())
    if FirecrawlScrapeWebsiteTool and os.getenv("FIRECRAWL_API_KEY"):
        tools.append(FirecrawlScrapeWebsiteTool())
    return tools


def _file_tools(read: bool = True, write: bool = False) -> list:
    tools = []
    if read and FileReadTool:
        tools.append(FileReadTool())
    if write and FileWriteTool:
        tools.append(FileWriteTool())
    return tools


@CrewBase
class ClearpathIntelligenceCrew:
    """ClearPath Trader intelligence crew for CrewAI Enterprise / AMP."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    # --- Agents 0A / 0B: competitive + social harvest ---

    @agent
    def competitor_harvester(self) -> Agent:
        return Agent(
            config=self.agents_config["competitor_harvester"],
            tools=_research_tools(),
            verbose=True,
        )

    @agent
    def social_listener(self) -> Agent:
        return Agent(
            config=self.agents_config["social_listener"],
            tools=_research_tools(),
            verbose=True,
        )

    # --- Agents 1–7: market intelligence specialists ---

    @agent
    def macro_intelligence(self) -> Agent:
        return Agent(
            config=self.agents_config["macro_intelligence"],
            tools=_research_tools() + [ClearPathMacroFredTool()],
            verbose=True,
        )

    @agent
    def pattern_scanner(self) -> Agent:
        return Agent(
            config=self.agents_config["pattern_scanner"],
            tools=[ClearPathGetCandlesTool(), ClearPathGetQuoteTool()],
            verbose=True,
        )

    @agent
    def order_flow_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["order_flow_agent"],
            tools=_research_tools() + [ClearPathGetQuoteTool()],
            verbose=True,
        )

    @agent
    def sentiment_divergence(self) -> Agent:
        return Agent(
            config=self.agents_config["sentiment_divergence"],
            tools=_research_tools()
            + [ClearPathGroundedNewsTool(), ClearPathGetQuoteTool()],
            verbose=True,
        )

    @agent
    def correlation_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["correlation_agent"],
            tools=[ClearPathGetCandlesTool(), ClearPathGetQuoteTool()],
            verbose=True,
        )

    @agent
    def devils_advocate(self) -> Agent:
        return Agent(
            config=self.agents_config["devils_advocate"],
            tools=_file_tools(read=True),
            verbose=True,
        )

    @agent
    def backtest_validator(self) -> Agent:
        return Agent(
            config=self.agents_config["backtest_validator"],
            tools=[ClearPathGetCandlesTool(), *_file_tools(read=True)],
            verbose=True,
        )

    # --- Agents 8–10: guardrail, synthesis, translation ---

    @agent
    def risk_guardrail(self) -> Agent:
        return Agent(
            config=self.agents_config["risk_guardrail"],
            tools=_file_tools(read=True),
            verbose=True,
        )

    @agent
    def neuro_translator(self) -> Agent:
        return Agent(
            config=self.agents_config["neuro_translator"],
            tools=_file_tools(read=True, write=True),
            verbose=True,
        )

    @agent
    def crew_manager(self) -> Agent:
        return Agent(
            config=self.agents_config["crew_manager"],
            tools=_file_tools(read=True, write=True),
            verbose=True,
        )

    # --- Tasks ---

    @task
    def task_competitor_harvest(self) -> Task:
        return Task(
            config=self.tasks_config["task_competitor_harvest"],
            output_file="output/competitor_pain_matrix.md",
        )

    @task
    def task_social_listen(self) -> Task:
        return Task(
            config=self.tasks_config["task_social_listen"],
            output_file="output/social_pulse_report.md",
        )

    @task
    def task_macro_brief(self) -> Task:
        return Task(config=self.tasks_config["task_macro_brief"])

    @task
    def task_pattern_scan(self) -> Task:
        return Task(config=self.tasks_config["task_pattern_scan"])

    @task
    def task_order_flow(self) -> Task:
        return Task(config=self.tasks_config["task_order_flow"])

    @task
    def task_sentiment_divergence(self) -> Task:
        return Task(config=self.tasks_config["task_sentiment_divergence"])

    @task
    def task_correlation_breakdown(self) -> Task:
        return Task(config=self.tasks_config["task_correlation_breakdown"])

    @task
    def task_backtest_validation(self) -> Task:
        return Task(
            config=self.tasks_config["task_backtest_validation"],
            context=[self.task_pattern_scan()],
        )

    @task
    def task_risk_guardrail(self) -> Task:
        return Task(
            config=self.tasks_config["task_risk_guardrail"],
            context=[
                self.task_competitor_harvest(),
                self.task_social_listen(),
                self.task_macro_brief(),
                self.task_pattern_scan(),
                self.task_order_flow(),
                self.task_sentiment_divergence(),
                self.task_correlation_breakdown(),
                self.task_backtest_validation(),
            ],
        )

    @task
    def task_devils_advocate(self) -> Task:
        return Task(
            config=self.tasks_config["task_devils_advocate"],
            context=[
                self.task_macro_brief(),
                self.task_pattern_scan(),
                self.task_order_flow(),
                self.task_sentiment_divergence(),
                self.task_correlation_breakdown(),
                self.task_backtest_validation(),
            ],
        )

    @task
    def task_manager_synthesis(self) -> Task:
        return Task(
            config=self.tasks_config["task_manager_synthesis"],
            output_file="output/clearpath_daily_briefing.md",
            context=[
                self.task_competitor_harvest(),
                self.task_social_listen(),
                self.task_macro_brief(),
                self.task_pattern_scan(),
                self.task_order_flow(),
                self.task_sentiment_divergence(),
                self.task_correlation_breakdown(),
                self.task_backtest_validation(),
                self.task_risk_guardrail(),
                self.task_devils_advocate(),
            ],
        )

    @task
    def task_neuro_translation(self) -> Task:
        return Task(
            config=self.tasks_config["task_neuro_translation"],
            output_file="output/clearpath_daily_briefing_localized.md",
            context=[self.task_manager_synthesis()],
        )

    @crew
    def crew(self) -> Crew:
        """Hierarchical crew — Crew Manager synthesizes all specialist outputs."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.hierarchical,
            manager_agent=self.crew_manager(),
            verbose=True,
        )

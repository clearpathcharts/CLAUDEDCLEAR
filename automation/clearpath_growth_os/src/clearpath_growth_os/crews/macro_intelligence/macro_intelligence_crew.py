"""Macro Intelligence crew — the daily research swarm."""

from __future__ import annotations

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from ...tools import RESEARCH_TOOLS


@CrewBase
class MacroIntelligenceCrew:
    """Researches markets and produces a grounded brief + teachable moments."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def macro_sentinel(self) -> Agent:
        return Agent(config=self.agents_config["macro_sentinel"], tools=RESEARCH_TOOLS, verbose=True)

    @agent
    def education_translator(self) -> Agent:
        return Agent(config=self.agents_config["education_translator"], tools=RESEARCH_TOOLS, verbose=True)

    @task
    def scan_markets_task(self) -> Task:
        return Task(config=self.tasks_config["scan_markets_task"])

    @task
    def teachable_moments_task(self) -> Task:
        return Task(config=self.tasks_config["teachable_moments_task"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

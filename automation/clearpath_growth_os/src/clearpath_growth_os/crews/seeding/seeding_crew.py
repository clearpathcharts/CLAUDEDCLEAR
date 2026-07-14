"""Seeding crew — founding-distribution Reddit/Quora value answers."""

from __future__ import annotations

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from ...llm import default_llm
from ...tools import SEEDING_TOOLS


@CrewBase
class SeedingCrew:
    """Drafts value-first community answers with optional soft links."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def community_advocate(self) -> Agent:
        return Agent(config=self.agents_config["community_advocate"], tools=SEEDING_TOOLS, verbose=True, llm=default_llm())

    @task
    def seeding_task(self) -> Task:
        return Task(config=self.tasks_config["seeding_task"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

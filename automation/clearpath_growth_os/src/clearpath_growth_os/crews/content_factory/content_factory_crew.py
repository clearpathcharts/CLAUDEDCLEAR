"""Content Factory crew — turns research into platform-native assets."""

from __future__ import annotations

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from ...tools import CONTENT_TOOLS


@CrewBase
class ContentFactoryCrew:
    """Drafts and SEO-enriches a daily multi-platform content batch."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def hook_engineer(self) -> Agent:
        return Agent(config=self.agents_config["hook_engineer"], tools=CONTENT_TOOLS, verbose=True)

    @agent
    def thread_architect(self) -> Agent:
        return Agent(config=self.agents_config["thread_architect"], tools=CONTENT_TOOLS, verbose=True)

    @agent
    def cta_router(self) -> Agent:
        return Agent(config=self.agents_config["cta_router"], tools=CONTENT_TOOLS, verbose=True)

    @task
    def draft_social_task(self) -> Task:
        return Task(config=self.tasks_config["draft_social_task"])

    @task
    def enrich_task(self) -> Task:
        return Task(config=self.tasks_config["enrich_task"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

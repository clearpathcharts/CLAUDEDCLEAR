"""SEO Farm crew — pillar article + supporting cluster."""

from __future__ import annotations

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from ...llm import default_llm
from ...tools import SEO_TOOLS


@CrewBase
class SeoFarmCrew:
    """Produces one pillar article and its 8-10 supporting post briefs."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def pillar_writer(self) -> Agent:
        return Agent(config=self.agents_config["pillar_writer"], tools=SEO_TOOLS, verbose=True, llm=default_llm())

    @agent
    def cluster_architect(self) -> Agent:
        return Agent(config=self.agents_config["cluster_architect"], tools=SEO_TOOLS, verbose=True, llm=default_llm())

    @task
    def pillar_article_task(self) -> Task:
        return Task(config=self.tasks_config["pillar_article_task"])

    @task
    def cluster_task(self) -> Task:
        return Task(config=self.tasks_config["cluster_task"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

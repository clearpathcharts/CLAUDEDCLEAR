"""Content Atomizer crew — turns one submitted article into platform posts."""

from __future__ import annotations

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from ...llm import default_llm
from ...tools import CONTENT_TOOLS


@CrewBase
class ContentAtomizerCrew:
    """Repackages a human-submitted article into an X pack, LinkedIn, short-form."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def article_atomizer(self) -> Agent:
        return Agent(config=self.agents_config["article_atomizer"], tools=CONTENT_TOOLS, verbose=True, llm=default_llm())

    @agent
    def shortform_director(self) -> Agent:
        return Agent(config=self.agents_config["shortform_director"], tools=CONTENT_TOOLS, verbose=True, llm=default_llm())

    @task
    def atomize_task(self) -> Task:
        return Task(config=self.tasks_config["atomize_task"])

    @task
    def atomize_shortform_task(self) -> Task:
        return Task(config=self.tasks_config["atomize_shortform_task"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

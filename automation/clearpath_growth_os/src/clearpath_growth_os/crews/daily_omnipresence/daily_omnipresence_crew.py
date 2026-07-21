"""Daily Omnipresence crew — X pack + LinkedIn post + short-form scripts."""

from __future__ import annotations

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from ...tools import CONTENT_TOOLS, RESEARCH_TOOLS


class _Tools:
    channel = list({id(t): t for t in (CONTENT_TOOLS + RESEARCH_TOOLS)}.values())


@CrewBase
class DailyOmnipresenceCrew:
    """Produces the daily 3-channel content pack (X, LinkedIn, short-form)."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def x_strategist(self) -> Agent:
        return Agent(config=self.agents_config["x_strategist"], tools=_Tools.channel, verbose=True)

    @agent
    def linkedin_strategist(self) -> Agent:
        return Agent(config=self.agents_config["linkedin_strategist"], tools=CONTENT_TOOLS, verbose=True)

    @agent
    def shortform_director(self) -> Agent:
        return Agent(config=self.agents_config["shortform_director"], tools=CONTENT_TOOLS, verbose=True)

    @task
    def x_pack_task(self) -> Task:
        return Task(config=self.tasks_config["x_pack_task"])

    @task
    def linkedin_task(self) -> Task:
        return Task(config=self.tasks_config["linkedin_task"])

    @task
    def shortform_task(self) -> Task:
        return Task(config=self.tasks_config["shortform_task"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

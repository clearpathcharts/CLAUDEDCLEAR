"""Compliance Guardian crew — the truth gate before anything ships."""

from __future__ import annotations

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from ...tools import COMPLIANCE_TOOLS


@CrewBase
class ComplianceGuardianCrew:
    """Audits the content batch against ClearPath's truth/compliance rules."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def compliance_auditor(self) -> Agent:
        return Agent(config=self.agents_config["compliance_auditor"], tools=COMPLIANCE_TOOLS, verbose=True)

    @task
    def audit_task(self) -> Task:
        return Task(config=self.tasks_config["audit_task"])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

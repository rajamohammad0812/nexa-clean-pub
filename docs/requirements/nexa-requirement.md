NexaBuilder LLC
8 The Green, Suite B, Dover, DE 19901, USA
investors@nexabuilder.net | nexabuilder.net
NexaBuilder 99% Automation Review Report
CONFIDENTIALITY NOTICE:
This document and its contents are proprietary and confidential to NexaBuilder LLC. Any disclosure,
reproduction, distribution, or use without explicit written permission from NexaBuilder LLC is strictly
prohibited.
Page 1
Date: July 26, 2025
Prepared by: Sam Zbair
Current Progress Overview
Component Current Status Automation Impact Status
Frontend
(React)
Dark UI, reusable components,
WebSocket, Tailwind Already automatable Complete
Backend
(FastAPI)
JWT auth, modular routing, pluginready, CORS, etc. Already automatable Complete
Docker & CI/CD GitHub Actions in place, Docker
Compose configured
Automatable with
templating
Partial
Database SQLite still in use, PostgreSQL planned Needs PostgreSQL +
migrations

Incomplete
Testing Very limited test suite (manual only) Not automatable until
≥80% tests

Incomplete
CLI Tool Not yet developed Core engine for
automation
Missing
Deployment Manual, in-progress
Needs full CI + hosting
flow
Partial
Docs Missing API/docs/deploy guide Required for dev-level
automation
Missing
NexaBuilder LLC
8 The Green, Suite B, Dover, DE 19901, USA
investors@nexabuilder.net | nexabuilder.net
NexaBuilder 99% Automation Review Report
CONFIDENTIALITY NOTICE:
This document and its contents are proprietary and confidential to NexaBuilder LLC. Any disclosure,
reproduction, distribution, or use without explicit written permission from NexaBuilder LLC is strictly
prohibited.
Page 2
Are We on Track for 99% Automation?
Answer:
Not yet — but we’re close.
You're approximately 60% complete, and have built a strong foundation. However, to reach true 99%
automation, four key components must be fully completed.
What Must Be Done to Reach 99% Automation?

1.  Build the CLI Tool (Core Enabler)
    • Auto-generates project scaffold (React + FastAPI)
    • Auto-injects Docker + GitHub Actions + env config
    • Enables one-command project generation
    • Will account for 40% of automation alone
2.  Migrate to PostgreSQL
    • Replace SQLite with PostgreSQL
    • Add Alembic migrations
    • Allow dynamic setup per environment (dev/prod)
    • Enables scalable backend generation
3.  Reach 80%+ Test Coverage
    • Backend: Pytest (FastAPI), coverage reports
    • Frontend: Jest, React Testing Library
    • Integrate tests into CI pipeline
    • Ensures generated projects are reliable
    NexaBuilder LLC
    8 The Green, Suite B, Dover, DE 19901, USA
    investors@nexabuilder.net | nexabuilder.net
    NexaBuilder 99% Automation Review Report
    CONFIDENTIALITY NOTICE:
    This document and its contents are proprietary and confidential to NexaBuilder LLC. Any disclosure,
    reproduction, distribution, or use without explicit written permission from NexaBuilder LLC is strictly
    prohibited.
    Page 3
4.  Automate Deployment + Docs
    • Production-ready CI/CD to AWS or equivalent
    • Route 53 / DNS configuration + hosting
    • API & Deployment docs so any dev can use NexaBuilder independently
    • Enables true self-service builds
    Final Checklist Summary
    Task Required for 99% Status
    CLI Tool Not Started
    PostgreSQL Integration Not Complete
    80%+ Test Coverage Not Complete
    Deployment Automation + Docs Partial
    Suggested Timeline to Reach 99%
    Week Milestone
    Week 1 (Now – July 27) CLI Tool implementation started
    Week 2 (July 28 – Aug 3) PostgreSQL integration completed
    Week 3 (Aug 4 – Aug 10) Testing coverage + CI reports added
    Week 4 (Aug 11 – Aug 17) Deployment + full documentation finalized
    Conclusion
    NexaBuilder LLC
    8 The Green, Suite B, Dover, DE 19901, USA
    investors@nexabuilder.net | nexabuilder.net
    NexaBuilder 99% Automation Review Report
    CONFIDENTIALITY NOTICE:
    This document and its contents are proprietary and confidential to NexaBuilder LLC. Any disclosure,
    reproduction, distribution, or use without explicit written permission from NexaBuilder LLC is strictly
    prohibited.
    Page 4
    NexaBuilder is well-positioned to achieve its goal of 99% automation — but only once these remaining
    tasks are completed. Once done, you will be able to:
    • Launch fully scaffolded, tested, deploy-ready apps with a single command.
    • Spin up new projects without manual Docker, DB, or CI/CD setup.
    • Offer true plug-and-play scaffolding for other developers.

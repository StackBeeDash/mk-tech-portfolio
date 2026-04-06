# mk-tech-portfolio

Technical portfolio by **Masato Kikukawa** — showcasing AI-driven development, cloud architecture, and engineering leadership capabilities.

## About

This repository demonstrates technical expertise extracted from real-world private projects, covering full-stack engineering, AI-driven development, and CTO-level architectural decision-making.

> **Architecture Decisions**: Each theme is backed by documented decision-making processes. See the [Discussions](https://github.com/StackBeeDash/mk-tech-portfolio/discussions/categories/ideas) section for detailed ADRs (Architecture Decision Records) explaining *why* each technology and pattern was chosen.

## Portfolio

| # | Theme | Directory | Key Decisions |
|---|-------|-----------|---------------|
| 01 | AI-Driven Development | [`01-ai-driven-dev/`](01-ai-driven-dev/) | [Multi-agent phase strategy](../../discussions/38) / [MCP transport choice](../../discussions/46) |
| 02 | Cloud Architecture | [`02-cloud-architecture/`](02-cloud-architecture/) | [Cloud Run Jobs vs Service](../../discussions/39) |
| 03 | Training Content | [`03-training-content/`](03-training-content/) | Hands-on labs & AI-powered course generation |
| 04 | Claude for Non-Engineers | [`04-claude-for-non-engineers/`](04-claude-for-non-engineers/) | [Org-wide AI adoption strategy](../../discussions/49) |
| 05 | Domain-Driven Design | [`05-ddd/`](05-ddd/) | [When to apply DDD](../../discussions/41) |
| 06 | E2E Testing | [`06-e2e-testing/`](06-e2e-testing/) | [Playwright + Page Object pattern](../../discussions/43) |
| 07 | Figma to Code | [`07-figma-to-code/`](07-figma-to-code/) | [CSS Custom Properties vs CSS-in-JS](../../discussions/44) |
| 08 | CI/CD Pipeline | [`08-ci-cd-pipeline/`](08-ci-cd-pipeline/) | [Workload Identity Federation](../../discussions/45) |
| 09 | Monorepo Design | [`09-monorepo-design/`](09-monorepo-design/) | [Monorepo vs multi-repo](../../discussions/42) |
| 10 | DB Migration | [`10-db-migration/`](10-db-migration/) | [RLS vs app-layer tenant isolation](../../discussions/40) |
| 11 | Security | [`11-security/`](11-security/) | [Supabase Auth selection](../../discussions/48) / [RLS strategy](../../discussions/40) |
| 12 | API Design | [`12-api-design/`](12-api-design/) | [FastAPI vs Hono vs Express](../../discussions/47) |

## Architecture Decisions

This portfolio emphasizes not just *what* was built, but *why* each decision was made. All ADRs follow a consistent structure: **Context → Options → Decision → Trade-offs**.

| ADR | Decision | Theme |
|-----|----------|-------|
| [ADR-001](../../discussions/38) | Multi-agent execution: Phase-based parallelism | 01 AI |
| [ADR-002](../../discussions/39) | Cloud Run Jobs over Service + Scheduler | 02 Cloud |
| [ADR-003](../../discussions/40) | RLS over app-layer tenant isolation | 10 DB / 11 Security |
| [ADR-004](../../discussions/41) | When (and when not) to apply DDD | 05 DDD |
| [ADR-005](../../discussions/42) | Turborepo + pnpm over Nx / multi-repo | 09 Monorepo |
| [ADR-006](../../discussions/43) | Playwright + Page Object over Cypress | 06 E2E |
| [ADR-007](../../discussions/44) | CSS Custom Properties over CSS-in-JS | 07 Figma |
| [ADR-008](../../discussions/45) | Workload Identity Federation over SA keys | 08 CI/CD |
| [ADR-009](../../discussions/46) | MCP stdio transport over HTTP | 01 AI |
| [ADR-010](../../discussions/47) | Framework selection per context (FastAPI / Hono) | 12 API |
| [ADR-011](../../discussions/48) | Supabase Auth over Auth0 / self-hosted | 11 Security |
| [ADR-012](../../discussions/49) | Phased AI rollout for non-engineers | 04 Claude |

## Tech Stack

| Category | Technologies |
|----------|-------------|
| AI / LLM | Claude API, Claude Code, MCP (Model Context Protocol) |
| Frontend | Next.js, React, Nuxt 3, TypeScript |
| Backend | FastAPI, Python, Node.js |
| Cloud | GCP (Cloud Run Jobs, Cloud Storage), Supabase |
| Desktop | Tauri (Rust) |
| Testing | Playwright, Vitest |
| Design | Figma, Figma MCP |
| DevOps | GitHub Actions, Docker, Turborepo |

## Author

**Masato Kikukawa**
- MS in Computer Science, Waseda University
- 20+ years in IT — cloud architecture, AI-driven development, technical training
- Former Microsoft Certified Trainer (2021-2025)
- Azure & GCP certified (AZ-104, AZ-305, DP-203, etc.)

## License

MIT

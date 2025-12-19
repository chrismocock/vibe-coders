# Idea Due Diligence

Internal reference guide for reviewing ideas before they are moved into build mode. Use this to keep the conversation grounded in facts and to communicate tradeoffs crisply.

## 1. Intake Snapshot

- **Idea statement**: 1–2 sentences that communicate the outcome we expect for the user.
- **Primary persona**: Who benefits first; note their motivation, environment, and blockers.
- **Business objective**: What KPI this idea influences; include baseline.
- **Constraints**: Budget, legal, brand, or technical restrictions that cannot move.
- **Evidence so far**: Links to interviews, metrics, or artifacts validating the idea.

## 2. Problem & Market Validation

| Check | What good looks like | Notes |
| --- | --- | --- |
| User pain | Pain is frequent, high-intent, and monetizable. | |
| Market sizing | TAM/SAM/SOM exists with cited data or analog benchmarks. | |
| Competitive scan | We know direct alternatives, their pricing, and differentiators. | |
| Timing | A forcing function (reg change, platform shift, new tech) creates urgency. | |

Prefer primary evidence (interviews, user telemetry) over secondary sources. Capture citations so the next reviewer can audit the numbers.

## 3. Feasibility & Execution Risk

- **Data and integrations**: Enumerate systems we depend on and their access model (public API, partner agreement, internal service).
- **Complexity hotspots**: Identify any bespoke AI models, infra migrations, or compliance reviews that require specialist time.
- **Experiment plan**: Define the smallest shippable artifact (prototype, concierge test, landing page) and required staffing.
- **Operational needs**: Support load, moderation, SLAs, or manual review steps the team must absorb.

## 4. Economic & Strategic Fit

- **Acquisition**: How will users discover the feature? Include channel cost or growth loops we plug into.
- **Retention**: Why will users repeat the action? Tie to habit loops or workflow embedding.
- **Monetization**: Pricing hypothesis, willingness to pay evidence, and unit economics (gross margin, payback).
- **Strategic leverage**: Does this idea unlock new data, distribution, or moat-building assets?

## 5. Decision Rubric

| Dimension | Weight | Score (1-5) | Notes |
| --- | --- | --- | --- |
| User pain clarity | 25% | | |
| Market pull | 20% | | |
| Technical feasibility | 20% | | |
| Economic upside | 20% | | |
| Strategic leverage | 15% | | |

Multiply each score by its weight to get a weighted total. Use the outcome to argue for **build now**, **hold for signal**, or **reject**. Document the decision owner and next review date.

## 6. Final Checklist

- [ ] Evidence for each assumption linked or attached.
- [ ] Risks labeled with owners and mitigation plans.
- [ ] Success metrics include baseline, target, and time horizon.
- [ ] Experiment/launch budget approved by finance or leadership partner.
- [ ] Communication brief drafted (press release, FAQ, or product note).

Store completed diligence docs alongside product specs for auditability.

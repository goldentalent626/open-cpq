<p align="center">
  <img src="./docs/readme/hero.svg" alt="OpenCPQ — turn complexity into confident quotes" width="100%">
</p>

<p align="center">
  A modern Configure, Price, Quote workspace for turning reusable costs, products, and services into consistent commercial proposals.
</p>

<p align="center">
  <a href="https://react.dev/"><img alt="React 18" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white"></a>
  <a href="https://firebase.google.com/"><img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black"></a>
  <a href="https://vite.dev/"><img alt="Vite 8" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white"></a>
</p>

## Quoting should be a system, not a spreadsheet ritual

OpenCPQ brings the moving parts of a commercial proposal into one focused workspace. Teams can define reusable resources and price-list items, compose them into offers, inspect margin and recurring revenue, and preserve a searchable history of quote versions.

The project explores how a lightweight CPQ product can make pricing logic visible instead of burying it inside copied files and manual formulas.

### Core capabilities

- **Resource catalog** for materials, labor, software assets, and reusable cost inputs.
- **Price-list management** with categories and optional customer-specific pricing.
- **Composite components** for packaging multiple resources into reusable kits.
- **Guided quote builder** with quantities, unit costs, markup, fixed prices, and billing frequency.
- **Commercial metrics** including total cost, price, recurring value, and margin percentage.
- **Quote lifecycle** with status, origin, validity, delivery date, payment terms, and version history.
- **Dashboard and archive** for finding offers and understanding commercial activity.
- **Print-ready proposal preview** for turning structured data into a client-facing document.

## Product model

```mermaid
flowchart LR
    RES["Resources + software"] --> KIT["Reusable kits"]
    RES --> PRICE["Price list"]
    KIT --> PRICE
    PRICE --> QUOTE["Quote builder"]
    QUOTE --> METRICS["Cost, margin, recurring value"]
    METRICS --> PREVIEW["Proposal preview"]
    QUOTE --> ARCHIVE["Versioned quote archive"]
```

## Why the architecture stays approachable

| Concern | Approach |
|---|---|
| UI and workflow | React components organized around quoting tasks |
| Domain safety | Shared TypeScript models for resources, items, and quotes |
| Authentication | Firebase Authentication |
| Persistence | Cloud Firestore |
| Visualization | Recharts dashboards |
| Deployment | Static Vite build with environment-based configuration |

## Quick start

Requirements:

- Node.js 18 or newer
- A Firebase project with Authentication and Firestore enabled

```bash
git clone https://github.com/ChronoSLM/open-cpq.git
cd open-cpq
npm install
cp .env.example .env.local
npm run dev
```

Populate `.env.local` with your own Firebase web application configuration.

## Secure by default

> [!IMPORTANT]
> The included Firestore rules deny all access. Define and test an authorization model for your organization before enabling persistence.

No production credentials, backend identifiers, customer records, or database exports are included in this repository.

Never commit:

- `.env.local` or environment-specific configuration;
- Firebase service-account keys;
- customer names, pricing, or quote exports;
- production database snapshots;
- API secrets of any kind.

Firebase web configuration is visible to browser clients by design. Real authorization must be enforced through Authentication, Security Rules, and App Check.

## Project map

```text
src/components/       quoting workflows and reusable UI
src/contexts/         application settings
src/services/         Firebase configuration and data access
src/types.ts          shared CPQ domain models
firebase-blueprint.json
firestore.rules       deny-all public template
```

## Verification

```bash
npm run lint
npm run build
```

## Project status

OpenCPQ is a sanitized public portfolio project and a foundation for further CPQ experiments. Before production use, add an organization-aware authorization model, validation rules, audit logging, automated tests, and deployment-specific compliance controls.

If structured pricing systems are your kind of problem, star the repository and explore the domain model.

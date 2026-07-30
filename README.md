# OpenCPQ

OpenCPQ is a React and Firebase application for configuring products and services,
building quotes, calculating margins, and managing reusable pricing resources.

## Requirements

- Node.js 18 or newer
- A Firebase project with Authentication and Firestore enabled

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and provide your own Firebase web app
   configuration.

3. Start the development server:

   ```bash
   npm run dev
   ```

## Security

No production credentials or backend identifiers are included in this repository.
The included Firestore rules deny all access by default. Define and test an
authorization model suitable for your deployment before enabling access.

Never commit `.env.local`, service-account keys, API secrets, customer data, or
exports from a production database.

## Checks

```bash
npm run lint
npm run build
```

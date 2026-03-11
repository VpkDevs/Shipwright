# Shipwright

Turn dormant repos into live products in minutes.

## Overview

Shipwright is a web application that analyzes your GitHub repositories and generates everything you need to deploy them:

- Production-ready deployment configurations for Vercel
- Professional README files
- Landing pages
- Environment variable templates
- Automated pull requests with generated files

Goal: from repository to live URL in under 15 minutes.

## Tech Stack

- Frontend: Next.js 15 with TypeScript and Tailwind CSS
- Authentication: NextAuth.js with GitHub OAuth
- Backend: Next.js API routes
- GitHub Integration: Octokit REST API
- Validation: Zod
- Package Manager: Bun
- Code Quality: Biome

## Getting Started

### Prerequisites

- Node.js 18+
- Bun
- GitHub account and OAuth app credentials

### Installation

1. Clone the repository.

```bash
git clone <repo-url>
cd shipwright
```

1. Install dependencies with Bun.

```bash
bun install
```

1. Set up GitHub OAuth.

   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Create a new OAuth App
   - Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
   - Copy the Client ID and Client Secret

1. Configure environment variables.

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
GITHUB_ID=your_client_id
GITHUB_SECRET=your_client_secret
NEXTAUTH_SECRET=run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

### Development

Start the development server:

```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Build

```bash
bun run build
```

### Production

```bash
bun start
```

## Code Quality

### Formatting

```bash
bun run format
```

Biome formats code according to the project style guide.

### Linting

```bash
bun run lint
```

Biome checks for issues and applies automatic fixes where possible.

### Type Checking

```bash
bun run type-check
```

## Project Structure

```text
app/
├── api/
│   ├── agent/
│   ├── analyze/
│   ├── auth/
│   ├── credits/
│   ├── generate/
│   ├── repos/
│   └── stripe/
├── pricing/
├── repos/
├── globals.css
├── layout.tsx
└── page.tsx

lib/
├── agents/
├── generators/
├── analyzer.ts
├── auth.ts
├── github.ts
└── stripe.ts

types/
└── index.ts
```

## Features

### Current

- GitHub OAuth authentication
- Repository listing and selection
- Framework detection
- Package manager detection from lockfiles and metadata
- Environment variable detection
- Deployment risk scoring
- Free template generation
- AI-assisted README and landing page generation
- PR creation with generated artifacts

### Latest Enhancements

- Repository analysis caching to avoid repeated GitHub API calls
- Orchestrator caching to avoid duplicate AI runs
- TypeScript project detection via `tsconfig.json`
- JSON-aware OpenAI response parsing with stronger fallbacks
- Expanded automated test coverage for analysis and generators
- Improved repo browser with search, filters, sorting, and repo metadata
- Better artifact ergonomics on the repo detail page with preview, copy, and download actions

### Next Up

- Environment variable documentation improvements
- Deploy integration
- Additional UI polish
- Beta user testing

## How It Works

1. Sign in with GitHub.
1. Select a repository to analyze.
1. Shipwright inspects framework, package manager, environment variables, and deployment risk.
1. Generate deployment configs, README content, and landing page assets.
1. Review the generated output.
1. Create a pull request with the generated files.
1. Merge and deploy.

## API Routes

### `GET /api/repos`

Returns the authenticated user's repositories.

Response:

```json
[
  {
    "id": 123,
    "name": "my-project",
    "full_name": "username/my-project",
    "description": "My awesome project",
    "htmlUrl": "https://github.com/username/my-project",
    "language": "TypeScript",
    "stargazers_count": 42,
    "private": false,
    "fork": false,
    "archived": false,
    "updatedAt": "2026-03-10T00:00:00.000Z"
  }
]
```

### `POST /api/analyze`

Analyzes a repository.

Request:

```json
{
  "owner": "username",
  "repo": "my-project"
}
```

Response:

```json
{
  "framework": "Next.js",
  "packageManager": "npm",
  "backendType": "Next.js API Routes",
  "hasDocker": false,
  "envVarsDetected": ["DATABASE_URL", "API_KEY"],
  "buildScript": "next build",
  "missingConfigs": [],
  "deploymentRiskScore": 15,
  "description": "Next.js project using npm"
}
```

### `POST /api/generate`

Generates template deployment assets and content.

Request:

```json
{
  "owner": "username",
  "repo": "my-project",
  "description": "Optional repo description"
}
```

Response:

```json
{
  "vercelJson": "{ ... }",
  "packageJsonScripts": { ... },
  "envTemplate": "# Environment variables\n...",
  "readme": "# my-project\n...",
  "landingPage": "<html>...</html>"
}
```

## Security

- All API routes require GitHub authentication
- No secrets are stored beyond the session
- Repository access is scoped to the authenticated user token
- Generated changes go through a visible pull request flow
- Environment variables are documented, not committed with secret values

## Roadmap

### V1

- Vercel deployment only
- Single template per generator
- Manual PR creation fallback

### V2

- Multiple cloud providers
- Better content generation quality
- Project portfolio dashboard
- Automated PR merging for trusted users

### V3

- Launch marketing automation
- Analytics auto-wiring
- Monetization integration with Stripe
- Repo health scoring

## Contributing

Contributions are welcome. Open a pull request if you want to improve the project.

## License

MIT.

## Support

Questions or issues can be filed on GitHub.

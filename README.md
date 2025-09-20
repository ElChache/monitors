# MonitorHub - AI-Powered Combination Intelligence Platform

MonitorHub is an innovative AI-powered monitoring platform that enables users to track multiple real-world facts simultaneously through **Combination Intelligence** - discovering unique opportunities that single-condition monitoring cannot detect.

## 🎯 Product Vision

Instead of simple monitors like "Tesla stock drops to $200", MonitorHub enables complex combinations:

> "Tesla stock drops to $200 AND Elon Musk tweets about innovation AND EV tax credits get renewed AND lithium prices stabilize"

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database

### Installation

```bash
# Clone and install dependencies
git clone [repository-url]
cd project
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
pnpm run dev
```

### Development Commands

```bash
# Development
pnpm run dev              # Start development server
pnpm run dev -- --open    # Start and open in browser

# Code Quality
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Fix ESLint issues
pnpm run format           # Format with Prettier
pnpm run format:check     # Check formatting
pnpm run check            # TypeScript check

# Testing
pnpm run test             # Run unit tests
pnpm run test:unit        # Run unit tests once
pnpm run test:watch       # Watch mode for unit tests
pnpm run test:e2e         # Run E2E tests
pnpm run test:e2e:ui      # Run E2E tests with UI

# Build
pnpm run build            # Build for production
pnpm run preview          # Preview production build
```

## 🏗️ Tech Stack

- **Frontend**: SvelteKit + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js with JWT + Google OAuth2
- **AI Integration**: Anthropic Claude API
- **Testing**: Vitest + Playwright + Testing Library
- **Code Quality**: ESLint + Prettier + Husky
- **Deployment**: Vercel

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/           # Reusable UI components
│   │   ├── auth/            # Authentication components
│   │   ├── monitors/        # Monitor-related components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── admin/           # Admin components
│   │   └── shared/          # Shared UI components
│   ├── services/            # Business logic and API clients
│   ├── stores/              # Svelte stores for state management
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript type definitions
├── routes/
│   ├── api/                 # API endpoints
│   │   ├── auth/           # Authentication endpoints
│   │   ├── monitors/       # Monitor management endpoints
│   │   ├── actions/        # Action execution endpoints
│   │   └── admin/          # Admin endpoints
│   ├── app/                # Protected application routes
│   │   ├── monitors/       # Monitor management pages
│   │   ├── settings/       # User settings
│   │   └── templates/      # Monitor templates
│   └── auth/               # Authentication pages
└── test/                   # Test setup and utilities
```

## 🔧 Development Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Linting**: ESLint with TypeScript and Svelte rules
- **Formatting**: Prettier with 120-character line length
- **Pre-commit**: Husky hooks run linting and formatting on commit

### Testing Requirements

- **Unit Tests**: Minimum 80% coverage for utilities and services
- **Component Tests**: Critical UI components must have tests
- **E2E Tests**: Core user workflows must have Playwright tests
- **API Tests**: All endpoints must have integration tests

### File Naming Conventions

- **Components**: PascalCase (`MonitorCard.svelte`)
- **Pages/Routes**: kebab-case (`+page.svelte`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`MonitorTypes.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.ts`)

## 🚨 Critical Features (Release 1.0)

### Backend APIs (Week 1 Priority)

- **Monitor Creation**: `POST /api/monitors` - Accept natural language input
- **Monitor Retrieval**: `GET /api/monitors` - Fetch user's monitors with pagination
- **Monitor Management**: `PATCH /api/monitors/:id` - Update monitor status and settings

### Frontend Interfaces (Week 2)

- **Monitor Creation**: `/app/monitors/create` - Natural language textarea interface
- **Dashboard Enhancement**: Real-time monitor status with Current State vs Historical Change

### AI Integration (Week 3)

- **Anthropic Claude**: Natural language processing and fact extraction
- **Monitor Classification**: Automatic categorization of monitor types

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Authentication
AUTH_SECRET="your-auth-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Services
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

## 📚 Documentation

- **Technical Standards**: `/docs/technical-standards.md`
- **Team Onboarding**: `/docs/development-team-onboarding.md`
- **Product Specification**: `/docs/release-1-product-specification.md`
- **Database Schema**: `/project/prisma/schema.prisma`

## 🤝 Team Coordination

- **Product Manager**: Specification clarification and requirement validation
- **Lead Developer**: Technical guidance and code review standards
- **System Architect**: Architecture compliance and advanced feature guidance
- **UX Expert**: Interface validation and accessibility compliance

## 📈 Performance Targets

- **Dashboard Load**: < 2 seconds initial load
- **Monitor Evaluation**: < 30 seconds per monitor
- **API Response**: < 500ms for standard operations
- **Database Queries**: < 100ms for indexed queries

## 🎯 Current Status

✅ **Phase 1 Foundation**: Complete - Production-ready infrastructure  
🔄 **Phase 2 Core Features**: Ready for implementation  
📋 **Team Composition**: 2 FE + 2 BE + 1 QA + 2 AI engineers approved

**CRITICAL PATH**: Implement monitor creation endpoints to resolve dashboard 404 errors

## 📞 Support

For questions about:

- **Technical Issues**: Check technical standards documentation
- **Requirements**: Refer to product specification
- **Setup Issues**: Review development environment setup guide

---

**MonitorHub**: Transforming monitoring through Combination Intelligence  
**Created**: 2025-09-20 | **Lead Developer**: Lourdes

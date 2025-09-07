# Monitors! 📊

AI-powered monitoring platform that lets you create intelligent monitors using natural language.

## Quick Start ⚡

```bash
git clone https://github.com/ElChache/monitors.git
cd monitors
docker-compose up --build
```

Visit: http://localhost:5173

## What's This?

Monitors! is an AI-powered platform where you can create smart monitoring systems using natural language. Just describe what you want to monitor, and our AI will:

- Understand your intent (stock prices, weather, website changes, etc.)
- Extract relevant entities and conditions  
- Set up automated monitoring with notifications
- Learn from patterns to improve accuracy over time

## Architecture

- **Frontend**: SvelteKit + TypeScript + Tailwind CSS
- **Backend**: Node.js + PostgreSQL + Redis + BullMQ
- **AI**: Claude (Anthropic) + OpenAI with intelligent failover
- **Infrastructure**: Docker Compose for development

## Features

### Current (Week 1)
- ✅ User authentication (JWT + Google OAuth)
- ✅ Monitor CRUD operations with REST API
- ✅ AI-powered prompt classification
- ✅ Dashboard with grid/list views, filtering, search
- ✅ Monitor creation with 4-step AI workflow
- ✅ Rate limiting and user account management
- ✅ Real-time UI updates and responsive design

### Coming Soon (Week 2-4)
- 🔄 Web scraping and data collection
- 🔄 Email notifications and alerts
- 🔄 Historical data tracking and charts
- 🔄 Advanced AI monitoring capabilities
- 🔄 Template suggestions and recommendations

## Development

See [DEVELOPMENT_ENVIRONMENT_SETUP.md](coordination/agent_output/DEVELOPMENT_ENVIRONMENT_SETUP.md) for detailed setup instructions.

### Commands
```bash
# Development
pnpm dev                 # Start dev server
pnpm build              # Build for production
pnpm test               # Run tests
pnpm test:e2e           # Run Playwright E2E tests

# Database
pnpm db:generate        # Generate migrations
pnpm db:migrate         # Run migrations
pnpm db:push            # Push schema changes
pnpm db:studio          # Open Drizzle Studio

# Docker
docker-compose up --build    # Full development environment
docker-compose up -d postgres redis    # Just databases
```

## Team

This project is built by a coordinated team of AI agents specializing in different aspects of development:

- **Backend Development**: Database, APIs, authentication, AI integration
- **Frontend Development**: UI/UX, responsive design, state management  
- **AI Development**: Prompt processing, classification, provider management
- **System Architecture**: Technical oversight, integration, deployment
- **Quality Assurance**: Testing, validation, performance optimization

## License

MIT
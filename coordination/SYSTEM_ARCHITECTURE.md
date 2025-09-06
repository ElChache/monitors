# System Architecture - Monitors! Application

## Architecture Overview

**Monitors!** implements an AI-powered monitoring system with sophisticated temporal logic separation - the core innovation that enables both current state monitoring and complex historical change detection through a clean architectural pattern.

### Core Architectural Innovation: Temporal Logic Separation

The system's breakthrough architecture separates concerns between AI and system capabilities:

- **AI Handles Present**: Current fact extraction and state evaluation only
- **System Handles History**: Persistent storage of all fact values with timestamps
- **AI Handles Comparison**: Given current + previous values, determines if change conditions are met
- **Clean Separation**: No AI memory required, reliable temporal logic, scalable to complex changes

This pattern solves the classic "temporal AI consistency problem" by making AI stateless while keeping the system stateful with comprehensive historical data.

## System Components

### 1. Frontend Application (SvelteKit + TypeScript)

#### Core UI Components
- **Monitor Dashboard**: Card displays for current state monitors, chart displays for historical change monitors
- **Monitor Creation Wizard**: Natural language input with real-time AI validation and suggestions
- **Action Management**: CRUD operations for email actions and trigger configurations
- **Historical Analysis**: Interactive charts and trend visualization
- **User Account Management**: Authentication, settings, and profile management

#### Key Features
- **Responsive Design**: Mobile-first approach with full desktop support
- **Real-time Updates**: WebSocket connections for live monitor status updates
- **Progressive Web App**: Offline capability for viewing monitor status
- **Accessibility**: WCAG 2.1 AA compliance with screen reader support

### 2. Backend API (Node.js + TypeScript)

#### Core Services

##### Authentication Service
- **Email/Password**: Secure hashing with bcrypt, session management
- **Google OAuth2**: Integration for seamless onboarding
- **Session Management**: JWT tokens with proper rotation and expiration
- **Security**: Rate limiting, CSRF protection, input validation

##### Monitor Management Service
- **CRUD Operations**: Create, read, update, delete monitors
- **AI Integration**: Real-time prompt validation and classification
- **State Management**: Monitor activation, deactivation, and status tracking
- **Historical Queries**: Efficient retrieval of evaluation history and trends

##### AI Processing Service
- **Provider Abstraction Layer**: Unified interface for Claude and OpenAI
- **Prompt Classification**: Automatic detection of current state vs historical change monitors
- **Fact Extraction**: AI-powered data gathering and validation
- **Change Detection**: Comparison logic using historical data and current values

##### Evaluation Engine
- **Scheduler**: Queue-based processing for monitor evaluations
- **Historical Storage**: Persistent fact values with timestamp indexing
- **Change Analysis**: Temporal logic evaluation using stored historical data
- **Performance Optimization**: Intelligent caching and batch processing

##### Notification Service
- **Email System**: Rich HTML templates with professional formatting
- **Delivery Management**: Queue-based sending with retry logic
- **User Preferences**: Per-monitor notification settings and frequency controls
- **Template Engine**: Dynamic content generation based on monitor types

### 3. Database Architecture (PostgreSQL)

#### Core Tables

##### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE
);
```

##### monitors
```sql
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  monitor_type VARCHAR(50) NOT NULL, -- 'current_state' or 'historical_change'
  fact_prompt TEXT NOT NULL, -- AI-extracted fact query
  change_condition TEXT, -- For historical_change monitors
  ai_metadata JSONB, -- Classification and extraction metadata
  evaluation_frequency_minutes INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX(user_id, active),
  INDEX(monitor_type),
  INDEX(evaluation_frequency_minutes)
);
```

##### facts
```sql
CREATE TABLE facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_prompt TEXT NOT NULL,
  fact_value JSONB NOT NULL,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  ai_provider VARCHAR(50) NOT NULL,
  confidence_score DECIMAL(3,2),
  ttl_expires_at TIMESTAMPTZ,
  
  UNIQUE(fact_prompt, extracted_at),
  INDEX(fact_prompt),
  INDEX(extracted_at),
  INDEX(ttl_expires_at)
);
```

##### evaluations
```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
  fact_id UUID REFERENCES facts(id),
  previous_fact_id UUID REFERENCES facts(id), -- For historical_change monitors
  evaluation_result BOOLEAN NOT NULL,
  ai_reasoning TEXT,
  confidence_score DECIMAL(3,2),
  evaluation_duration_ms INTEGER,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX(monitor_id, evaluated_at),
  INDEX(evaluation_result),
  INDEX(evaluated_at)
);
```

##### actions
```sql
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'email' for Release 1.0
  action_config JSONB NOT NULL, -- Email addresses, templates, etc.
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX(user_id, active)
);
```

##### triggers
```sql
CREATE TABLE triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  trigger_condition VARCHAR(50) NOT NULL, -- 'state_change', 'becomes_active', 'becomes_inactive'
  trigger_frequency VARCHAR(50) NOT NULL, -- 'once', 'every_time', 'daily_digest'
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(monitor_id, action_id, trigger_condition),
  INDEX(monitor_id),
  INDEX(action_id)
);
```

##### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES triggers(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
  notification_content JSONB NOT NULL,
  delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  delivery_attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX(trigger_id),
  INDEX(delivery_status),
  INDEX(created_at)
);
```

#### Database Optimization Strategy

##### Indexing Strategy
- **Time-series indexes** on `evaluated_at`, `extracted_at` for efficient historical queries
- **Composite indexes** on frequently joined columns (user_id, monitor_id)
- **Partial indexes** on active records to optimize common queries
- **JSONB indexes** on fact_value and metadata for complex queries

##### Partitioning Strategy
- **Time-based partitioning** for evaluations table (monthly partitions)
- **User-based partitioning** for high-volume historical data
- **Archival strategy** for long-term data retention and performance

### 4. AI Integration Architecture

#### Provider Abstraction Layer

```typescript
interface AIProvider {
  classifyPrompt(prompt: string): Promise<MonitorClassification>;
  extractFact(factPrompt: string): Promise<FactExtraction>;
  evaluateChange(currentValue: any, previousValue: any, changeCondition: string): Promise<ChangeEvaluation>;
  improvePrompt(originalPrompt: string): Promise<PromptImprovement>;
}

class ClaudeProvider implements AIProvider {
  // Claude-specific implementations with optimized prompts
}

class OpenAIProvider implements AIProvider {
  // OpenAI-specific implementations with model-specific optimizations
}

class FallbackProvider implements AIProvider {
  // Rule-based fallback for basic monitor types
}
```

#### AI Processing Pipeline

1. **Prompt Classification**: Determine if monitor is current_state or historical_change
2. **Fact Extraction**: AI processes real-world data to extract current values
3. **Historical Comparison**: System retrieves previous values from database
4. **Change Evaluation**: AI determines if change condition is met using current + previous values
5. **Result Storage**: Evaluation results and reasoning stored for audit and improvement

#### Error Handling and Resilience

- **Circuit Breaker Pattern**: Automatic failover between AI providers
- **Graceful Degradation**: Basic rule-based processing when AI is unavailable
- **Retry Logic**: Exponential backoff for transient failures
- **Cost Optimization**: Intelligent caching and request batching

### 5. Background Processing System

#### Monitor Evaluation Queue
- **Redis-based Queue**: Reliable job processing with retry mechanisms
- **Priority Scheduling**: Time-sensitive monitors get higher priority
- **Batch Processing**: Group similar fact extractions for efficiency
- **Load Balancing**: Distribute processing across multiple workers

#### Evaluation Workflow
1. **Schedule Monitor**: Add evaluation job to queue based on frequency
2. **Extract Current Fact**: AI processes real-world data
3. **Retrieve Historical Data**: Query database for previous values
4. **Evaluate Condition**: AI determines if monitor condition is met
5. **Store Results**: Save evaluation, trigger actions if state changed
6. **Schedule Next Evaluation**: Queue next evaluation based on frequency

### 6. Security and Performance

#### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with proper expiration
- **Role-Based Access**: User-specific data isolation
- **Rate Limiting**: Per-user and per-endpoint limits
- **Input Validation**: Comprehensive sanitization and validation

#### Data Security
- **Encryption at Rest**: Database encryption for sensitive data
- **Encryption in Transit**: TLS for all communications
- **Audit Logging**: Comprehensive tracking of user actions
- **GDPR Compliance**: Data privacy and user rights management

#### Performance Optimization
- **Connection Pooling**: Database connection management
- **Caching Strategy**: Redis for frequently accessed data
- **CDN Integration**: Static asset optimization
- **Database Optimization**: Query optimization and indexing

## Deployment Architecture

### Vercel Deployment
- **Serverless Functions**: API endpoints deployed as Edge Functions
- **Static Site Generation**: Frontend optimized for global CDN delivery
- **Environment Variables**: Secure configuration management
- **Domain Configuration**: Portal at root, app at app.domain.com

### External Services Integration
- **Database**: PostgreSQL hosted on Vercel Postgres or similar
- **Email Service**: SendGrid or similar for reliable delivery
- **AI Providers**: Direct integration with Claude and OpenAI APIs
- **Monitoring**: Application performance monitoring and logging

### Scalability Considerations
- **Horizontal Scaling**: Stateless API design for multi-instance deployment
- **Database Scaling**: Read replicas and connection pooling
- **Queue Scaling**: Redis cluster for high-throughput processing
- **CDN Optimization**: Global content delivery for improved performance

## Data Flow Architecture

### Monitor Creation Flow
1. User enters natural language prompt
2. Frontend validates and sends to AI Classification API
3. AI determines monitor type (current_state vs historical_change)
4. AI extracts fact prompt and change conditions
5. Monitor stored with metadata and scheduling information
6. First evaluation queued for immediate execution

### Evaluation Flow
1. Background job scheduler triggers monitor evaluation
2. AI extracts current fact value from real-world data
3. System retrieves historical values from database
4. AI evaluates change condition using current + previous values
5. Results stored with reasoning and confidence scores
6. Triggers evaluated for action execution
7. Notifications queued if state changes detected

### Notification Flow
1. Trigger condition met (monitor state change)
2. Notification content generated using templates
3. Email queued for delivery with retry logic
4. Delivery status tracked and logged
5. Failed deliveries retried with exponential backoff

## Technology Stack Summary

### Frontend
- **Framework**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Charts**: Chart.js or similar for historical data visualization
- **State Management**: Svelte stores with reactive updates
- **Build**: Vite for fast development and optimized builds

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15+ with TypeScript ORM
- **Queue**: Redis for background job processing
- **Email**: SendGrid for reliable email delivery

### AI Integration
- **Primary**: Claude 3.5 Sonnet for advanced reasoning
- **Fallback**: OpenAI GPT-4 for availability resilience
- **Backup**: Rule-based processing for basic monitors

### Deployment
- **Platform**: Vercel for full-stack deployment
- **Database**: Vercel Postgres or PostgreSQL hosting
- **CDN**: Vercel Edge Network for global performance
- **Monitoring**: Vercel Analytics and error tracking

## Development Workflow Integration

### AI Visual Testing Setup
- **Playwright Integration**: Screenshot-based development validation
- **Port Management**: Agent-specific ports (calculated from agent ID)
- **Isolation**: Git worktree + Docker for multi-agent development
- **File Naming**: `/tmp/screenshot_{agent_id}_{timestamp}.png`

### Quality Assurance
- **Unit Testing**: Comprehensive test coverage for core logic
- **Integration Testing**: API and database interaction testing
- **End-to-End Testing**: Full user workflow validation
- **Performance Testing**: Load testing for monitor evaluation scale

This architecture provides a robust, scalable foundation for the Monitors! application with clean separation of concerns, sophisticated temporal logic, and AI-powered intelligence while maintaining security, performance, and maintainability standards.

**DRAFT ARCHITECTURE COMPLETE** - Ready for Product Owner clarification integration and refinement.
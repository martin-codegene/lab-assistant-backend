# Lab Assistant AI Backend

A scalable backend for the Lab Assistant AI application built with Clean Architecture, Domain-Driven Design, and modern TypeScript patterns.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Docker and Docker Compose (recommended for local development)

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd lab-app-backend
bun install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Start development environment
docker-compose up -d
bun prisma:generate
bun prisma:migrate
bun prisma:seed
bun run dev
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── domain/                    # Domain layer (business entities, rules)
│   ├── user.ts               # User entity and value objects
│   ├── protocol.ts           # Protocol entity
│   ├── experiment.ts         # Experiment entity  
│   ├── analysis.ts           # Analysis entity
│   └── repositories.ts       # Repository interfaces
├── application/              # Application layer (use cases)
│   └── use-cases/           # Business use cases
│       ├── user-use-cases.ts
│       ├── protocol-use-cases.ts
│       └── experiment-use-cases.ts
├── infrastructure/          # Infrastructure layer
│   ├── database/           # Database configuration
│   ├── repositories/       # Repository implementations
│   │   ├── prisma-user-repository.ts
│   │   ├── prisma-protocol-repository.ts
│   │   ├── prisma-experiment-repository.ts
│   │   └── prisma-analysis-repository.ts
│   └── factories/         # Object factories
│       └── protocol-factory.ts
├── presentation/           # Presentation layer
│   └── routes/            # API routes
│       ├── user-routes.ts
│       ├── protocol-routes.ts
│       └── experiment-routes.ts
├── shared/                # Shared utilities and types
│   └── types.ts
├── index.ts              # AWS Lambda entry point
└── local.ts             # Local development server
```

## 🏗️ Architecture

This project follows **Clean Architecture** with four layers:

1. **Domain Layer**: Core business entities, rules, and repository interfaces
2. **Application Layer**: Use cases, services, and business logic
3. **Infrastructure Layer**: External implementations (repositories, APIs, etc.)
4. **Presentation Layer**: API routes, controllers, and HTTP handling

### Design Patterns Implemented
- **Clean Architecture**: Separation of concerns with dependency inversion
- **Domain-Driven Design**: Bounded contexts and aggregate roots
- **Repository Pattern**: Abstract data access layer
- **Strategy Pattern**: For AI model selection and analysis strategies
- **Factory Pattern**: For complex object creation (protocols, experiments)
- **CQRS**: Command Query Responsibility Segregation
- **Event-Driven Architecture**: Domain events and handlers

## 🗄️ Database

The project uses **Prisma ORM** with **PostgreSQL**. The complete schema is defined in `prisma/schema.prisma` based on the requirements in `DATABASE_REQUIREMENTS.md`.

### Database Operations
```bash
# Generate Prisma client
bun prisma:generate

# Create and run migrations
bun prisma:migrate

# Seed database with sample data
bun prisma:seed

# Open Prisma Studio (database GUI)
bun prisma:studio
```

## 🔧 Development

### Running the Application
```bash
# Development server
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

### API Endpoints

#### Users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users` - List users with pagination
- `POST /api/users/:id/login` - Record user login

#### Protocols
- `GET /api/protocols` - List protocols
- `POST /api/protocols` - Create protocol
- `GET /api/protocols/:id` - Get protocol by ID
- `PUT /api/protocols/:id` - Update protocol
- `DELETE /api/protocols/:id` - Delete protocol

#### Experiments
- `GET /api/experiments` - List experiments
- `POST /api/experiments` - Create experiment
- `GET /api/experiments/:id` - Get experiment by ID
- `PUT /api/experiments/:id` - Update experiment
- `DELETE /api/experiments/:id` - Delete experiment

## 🚀 Deployment

### AWS Lambda
```bash
# Build for production
bun run build

# Create deployment package
bun run zip

# Deploy to AWS Lambda
bun run update
```

### Environment Variables
See `.env.example` for all required environment variables.

## 📚 Documentation

- **Architecture Patterns**: See `ARCHITECTURE_PATTERNS.md`
- **Database Requirements**: See `DATABASE_REQUIREMENTS.md`
- **Setup Guide**: See `SETUP_GUIDE.md` for detailed setup instructions

## 🧪 Testing

```bash
# Run tests
bun test

# Run example demonstrating Clean Architecture
bun run src/examples/clean-architecture-example.ts
```

## 🤝 Contributing

1. Follow Clean Architecture principles
2. Write domain entities first
3. Implement use cases before infrastructure
4. Use dependency injection
5. Write tests for business logic

## 📄 License

MIT License - see LICENSE file for details
# Lab Assistant AI - Setup and Development Guide

## Prerequisites

- Node.js 18+ or Bun
- Docker and Docker Compose (for local development)
- PostgreSQL (or use Docker for local development)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd lab-app-backend
bun install
```

### 2. Set up Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and other settings.

### 3. Start Development Environment

Using Docker Compose (recommended for development):

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Run database migrations
bun prisma:generate
bun prisma:migrate

# Seed the database with sample data
bun prisma:seed

# Start the development server
bun run dev
```

### 4. Database Setup

#### Option A: Using Docker (Recommended for Development)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Run migrations
bun prisma:generate
bun prisma:migrate
bun prisma:seed
```

#### Option B: Using Local PostgreSQL

1. Install PostgreSQL locally or use a cloud database
2. Update the `DATABASE_URL` in your `.env` file
3. Run migrations and seed:

```bash
bun prisma:generate
bun prisma:migrate
bun prisma:seed
```

### 5. Development

```bash
# Start development server
bun run dev

# Or run with auto-reload
bun run dev:watch
```

### 6. API Documentation

Once the server is running, you can access:

- API: http://localhost:3000
- Prisma Studio (Database GUI): `npx prisma studio`
- API Documentation: See API_DOCS.md

## Project Structure

```
src/
├── domain/           # Domain entities and business logic
├── application/     # Use cases and application logic
├── infrastructure/   # External services, repositories
├── presentation/    # Controllers, routes, DTOs
└── shared/          # Shared utilities and types
```

## Database

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. Key models include:

- **User**: User accounts and authentication
- **Protocol**: Experimental protocols and methods
- **Experiment**: Individual experiments
- **Analysis**: AI analysis results
- **Lab & Equipment**: Lab management
- **Analysis & Results**: Experimental results

### Database Operations

```bash
# Generate Prisma client
bun prisma:generate

# Create and run migrations
bun prisma:migrate

# Open Prisma Studio (database GUI)
bun prisma:studio

# Seed the database
bun prisma:seed
```

## API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `GET /api/users` - List users (with pagination)

### Protocols
- `GET /api/protocols` - List protocols
- `POST /api/protocols` - Create protocol
- `GET /api/protocols/:id` - Get protocol by ID

### Experiments
- `GET /api/experiments` - List experiments
- `POST /api/experiments` - Create experiment
- `GET /api/experiments/:id` - Get experiment with analyses

## Development

### Running Tests

```bash
# Run tests
bun test

# Run tests with coverage
bun test:coverage
```

### Code Quality

```bash
# Lint code
bun lint

# Type checking
bun type-check

# Format code
bun format
```

## Deployment

### Environment Variables

Required environment variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lab_assistant"
JWT_SECRET="your-jwt-secret"
NODE_ENV="production"
```

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun start
```

## Architecture

This project follows Clean Architecture principles:

1. **Domain Layer**: Core business logic and entities
2. **Application Layer**: Use cases and business rules
3. **Infrastructure Layer**: External services, databases
4. **Presentation Layer**: Controllers, routes, DTOs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details
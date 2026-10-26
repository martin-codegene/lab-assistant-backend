# Quick Start Guide - Lab Assistant AI Backend

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ or Bun
- Docker (optional, for database)
- Git

### Step 1: Clone and Install (1 minute)

```bash
git clone <repository-url>
cd lab-app-backend
bun install
```

### Step 2: Setup Environment (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database URL
# Minimum required:
DATABASE_URL="postgresql://user:password@localhost:5432/lab_assistant"
JWT_SECRET="your-secret-key-change-this"
```

### Step 3: Setup Database (2 minutes)

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d

# Run migrations
bun prisma:generate
bun prisma:migrate

# Seed with test data
bun prisma:seed
```

### Step 4: Start Server (30 seconds)

```bash
bun run dev
```

Server running at: http://localhost:3000

### Step 5: Test APIs (30 seconds)

```bash
# In another terminal
node test-protocol-api.js
node test-experiment-api.js
node test-analysis-api.js
```

## ✅ What's Working

After setup, you have:

1. **User Management** ✅
   - Registration, login, JWT authentication
   - User profiles and settings

2. **Protocol Management** ✅
   - Create, read, update, delete protocols
   - Protocol templates and categories
   - Search and filtering

3. **Experiment Management** ✅
   - Full experiment lifecycle (PLANNED → IN_PROGRESS → COMPLETED)
   - Real-time tracking and data collection
   - Results storage

4. **AI Analysis** ✅ (Mock Mode)
   - Gel image analysis
   - Troubleshooting assistance
   - Protocol optimization
   - Ready for Amazon Nova integration

## 📊 API Endpoints Available

### Users (8 endpoints)
- POST /api/users - Register
- POST /api/users/login - Login
- GET /api/users/:id - Get user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user
- GET /api/users - List users
- POST /api/users/:id/change-password
- POST /api/users/:id/login-record

### Protocols (13 endpoints)
- POST /api/protocols - Create
- GET /api/protocols/:id - Get by ID
- PUT /api/protocols/:id - Update
- DELETE /api/protocols/:id - Delete
- GET /api/protocols/user/my-protocols - List mine
- GET /api/protocols/public - List public
- GET /api/protocols/templates - List templates
- GET /api/protocols/category/:category
- GET /api/protocols/search
- POST /api/protocols/:id/duplicate
- POST /api/protocols/:id/use

### Experiments (14 endpoints)
- POST /api/experiments - Create
- GET /api/experiments/:id - Get by ID
- GET /api/experiments/:id/analyses - With analyses
- PUT /api/experiments/:id - Update
- DELETE /api/experiments/:id - Delete
- GET /api/experiments/user/my-experiments
- GET /api/experiments/protocol/:protocolId
- GET /api/experiments/lab/:labId
- GET /api/experiments/search
- POST /api/experiments/:id/start
- POST /api/experiments/:id/complete
- POST /api/experiments/:id/fail
- POST /api/experiments/:id/cancel

### Analyses (11 endpoints)
- POST /api/analyses/gel-image - AI gel analysis
- POST /api/analyses/troubleshoot - AI troubleshooting
- POST /api/analyses/optimize-protocol - AI optimization
- GET /api/analyses/:id - Get by ID
- GET /api/analyses/experiment/:experimentId
- GET /api/analyses/user/my-analyses
- GET /api/analyses/type/:type
- GET /api/analyses/recent
- PUT /api/analyses/:id - Update
- DELETE /api/analyses/:id - Delete

**Total: 46 API endpoints**

## 🧪 Testing

### Run All Tests

```bash
# Start server first
bun run dev

# In separate terminals:
node test-protocol-api.js    # 14 tests
node test-experiment-api.js  # 14 tests
node test-analysis-api.js    # 13 tests
```

### Test Credentials

Default seeded user:
- Email: `researcher@lab.com`
- Password: `password123`

## 📚 Documentation

- **User API**: FRONTEND_API_DOCUMENTATION.md
- **Protocol API**: PROTOCOL_API_DOCUMENTATION.md
- **Experiment API**: EXPERIMENT_API_DOCUMENTATION.md
- **Analysis API**: ANALYSIS_API_DOCUMENTATION.md
- **Frontend Integration**: FRONTEND_INTEGRATION_GUIDE.md
- **Amazon Nova Setup**: AMAZON_NOVA_INTEGRATION_GUIDE.md

## 🔌 Frontend Integration

### Quick Setup

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Add JWT token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### Example Usage

```javascript
// Login
const response = await api.post('/users/login', {
  email: 'researcher@lab.com',
  password: 'password123'
});
localStorage.setItem('authToken', response.data.data.token);

// Create experiment
const experiment = await api.post('/experiments', {
  title: 'My PCR Experiment',
  protocolId: 'protocol-uuid',
  variables: { sampleId: 'A-001', cycles: 35 }
});

// Analyze gel image
const analysis = await api.post('/analyses/gel-image', {
  experimentId: experiment.data.data.id,
  imageUrl: 'https://example.com/gel.jpg',
  metadata: { lanes: 4 }
});
```

## 🤖 AI Integration (Amazon Nova)

Currently using **mock AI responses** for development.

### To Enable Real AI:

1. Get Amazon Nova credentials
2. Add to `.env`:
   ```bash
   AMAZON_NOVA_API_KEY="your-key"
   AMAZON_NOVA_ENDPOINT="https://api.nova.amazonaws.com"
   ```
3. Update `src/infrastructure/services/amazon-nova-service.ts`
4. Follow guide: AMAZON_NOVA_INTEGRATION_GUIDE.md

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     Presentation Layer (Routes)     │
├─────────────────────────────────────┤
│   Application Layer (Use Cases)     │
├─────────────────────────────────────┤
│      Domain Layer (Entities)        │
├─────────────────────────────────────┤
│  Infrastructure Layer (Repositories) │
└─────────────────────────────────────┘
```

**Patterns Used:**
- Clean Architecture
- Repository Pattern
- Adapter Pattern (AI services)
- State Machine (experiments)
- Factory Pattern (entities)

## 📦 Project Structure

```
lab-app-backend/
├── src/
│   ├── domain/              # Business entities
│   ├── application/         # Use cases
│   ├── infrastructure/      # Repositories, services
│   ├── presentation/        # API routes
│   └── shared/             # Utilities
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Test data
├── test-*.js              # API tests
└── *_DOCUMENTATION.md     # API docs
```

## 🔧 Common Commands

```bash
# Development
bun run dev              # Start dev server
bun run dev:hot          # Hot reload
bun run dev:debug        # Debug mode

# Database
bun prisma:generate      # Generate Prisma client
bun prisma:migrate       # Run migrations
bun prisma:seed          # Seed test data
bun prisma:studio        # Open database GUI

# Production
bun run build            # Build for production
bun start               # Start production server
```

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill
```

### JWT Token Expired
```bash
# Login again to get new token
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"researcher@lab.com","password":"password123"}'
```

## 🎯 Next Steps

1. **Frontend Development**
   - Follow FRONTEND_INTEGRATION_GUIDE.md
   - Use provided React hooks and components
   - Test with mock API first

2. **AI Integration**
   - Get Amazon Nova credentials
   - Follow AMAZON_NOVA_INTEGRATION_GUIDE.md
   - Test with real AI analysis

3. **Additional Features**
   - File upload for images
   - Lab and team management
   - Voice interactions
   - Real-time notifications

## 📞 Support

- **Documentation**: Check *_DOCUMENTATION.md files
- **Tests**: Run test-*.js scripts
- **Issues**: Check error logs in console
- **Database**: Use `bun prisma:studio` to inspect data

## 🎉 Success!

If all tests pass, you're ready to:
- ✅ Integrate with frontend
- ✅ Create protocols and experiments
- ✅ Use AI analysis (mock mode)
- ✅ Deploy to production

---

**Happy Coding! 🚀**

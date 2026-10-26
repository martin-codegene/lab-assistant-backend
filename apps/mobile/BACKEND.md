# Backend Architecture for Lab Assistant AI

## Overview

This document outlines the backend architecture for the Lab Assistant AI project using **Hono.js** with **TypeScript**, **Prisma ORM**, and **PostgreSQL**, integrated with **Amazon Nova** AI services.

## Technology Stack

### Core Stack

- **Runtime**: Hono.js (Node.js/Bun/Cloudflare Workers)
- **Database**: PostgreSQL with Prisma ORM
- **API Framework**: Hono.js with TypeScript
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 / Cloudflare R2
- **Caching**: Redis / Upstash
- **Queue**: BullMQ / AWS SQS
- **Monitoring**: Sentry / Datadog

### Amazon Nova Integration

- **Nova 2 Lite**: Experiment analysis and troubleshooting
- **Nova 2 Sonic**: Voice AI interactions
- **Nova Multimodal Embeddings**: Image analysis
- **Nova Act**: Workflow automation

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main application entry
│   ├── config/               # Configuration management
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── nova.ts
│   ├── middleware/           # Hono middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── rate-limit.ts
│   │   └── logging.ts
│   ├── routes/               # API routes
│   │   ├── auth/
│   │   ├── experiments/
│   │   ├── protocols/
│   │   ├── analysis/
│   │   ├── voice/
│   │   ├── labs/
│   │   └── users/
│   ├── services/            # Business logic
│   │   ├── experiment.service.ts
│   │   ├── analysis.service.ts
│   │   ├── voice.service.ts
│   │   ├── nova.service.ts
│   │   └── file.service.ts
│   ├── utils/               # Utilities
│   │   ├── validators.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── helpers.ts
│   ├── types/               # TypeScript types
│   │   ├── request.ts
│   │   ├── response.ts
│   │   └── nova.ts
│   └── workers/             # Background workers
│       ├── analysis.worker.ts
│       ├── voice.worker.ts
│       └── notification.worker.ts
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── tests/                   # Test files
├── .env.example             # Environment variables
├── package.json
├── tsconfig.json
└── Dockerfile
```

## API Design

### RESTful Endpoints

#### Authentication

```
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
POST   /api/auth/refresh      # Refresh token
POST   /api/auth/logout       # User logout
GET    /api/auth/me           # Current user info
```

#### Experiments

```
GET    /api/experiments       # List experiments
POST   /api/experiments       # Create experiment
GET    /api/experiments/:id   # Get experiment details
PUT    /api/experiments/:id   # Update experiment
DELETE /api/experiments/:id   # Delete experiment
POST   /api/experiments/:id/attachments  # Upload attachment
POST   /api/experiments/:id/analyze      # Request analysis
```

#### Protocols

```
GET    /api/protocols         # List protocols
POST   /api/protocols         # Create protocol
GET    /api/protocols/:id     # Get protocol details
PUT    /api/protocols/:id     # Update protocol
DELETE /api/protocols/:id     # Delete protocol
GET    /api/protocols/templates          # List templates
POST   /api/protocols/:id/clone          # Clone protocol
```

#### Analysis

```
POST   /api/analysis/gel      # Analyze gel image
POST   /api/analysis/troubleshoot  # Troubleshoot experiment
POST   /api/analysis/optimize      # Optimize protocol
GET    /api/analysis/:id      # Get analysis results
GET    /api/analysis/experiment/:id  # List experiment analyses
```

#### Voice

```
POST   /api/voice/session     # Start voice session
POST   /api/voice/process     # Process voice input
GET    /api/voice/session/:id # Get session details
DELETE /api/voice/session/:id # End session
POST   /api/voice/transcribe  # Transcribe audio file
```

#### Labs & Teams

```
GET    /api/labs              # List labs
POST   /api/labs              # Create lab
GET    /api/labs/:id          # Get lab details
PUT    /api/labs/:id          # Update lab
DELETE /api/labs/:id          # Delete lab
POST   /api/labs/:id/members  # Add team member
DELETE /api/labs/:id/members/:userId  # Remove member
```

### WebSocket Endpoints

```
/ws/voice        # Real-time voice streaming
/ws/experiments  # Real-time experiment updates
/ws/notifications # Real-time notifications
```

## Service Layer Architecture

### 1. **Experiment Service**

```typescript
class ExperimentService {
  async createExperiment(
    data: CreateExperimentDto,
    userId: string,
  ): Promise<Experiment>;
  async updateExperiment(
    id: string,
    data: UpdateExperimentDto,
    userId: string,
  ): Promise<Experiment>;
  async getExperiment(
    id: string,
    userId: string,
  ): Promise<ExperimentWithDetails>;
  async listExperiments(
    filters: ExperimentFilters,
    userId: string,
  ): Promise<Experiment[]>;
  async addAttachment(
    experimentId: string,
    file: File,
    userId: string,
  ): Promise<Attachment>;
  async requestAnalysis(
    experimentId: string,
    type: AnalysisType,
    userId: string,
  ): Promise<Analysis>;
}
```

### 2. **Analysis Service**

```typescript
class AnalysisService {
  async analyzeGelImage(
    imageUrl: string,
    protocolId?: string,
  ): Promise<GelAnalysis>;
  async troubleshootExperiment(
    experimentId: string,
  ): Promise<TroubleshootingAnalysis>;
  async optimizeProtocol(
    protocolId: string,
    issues: string[],
  ): Promise<ProtocolOptimization>;
  async interpretData(
    data: any,
    context: AnalysisContext,
  ): Promise<DataInterpretation>;

  // Nova Integration
  private async callNova2Lite(prompt: string, context: any): Promise<any>;
  private async callNovaMultimodal(
    imageUrl: string,
    query: string,
  ): Promise<any>;
}
```

### 3. **Voice Service**

```typescript
class VoiceService {
  async startSession(
    userId: string,
    context?: VoiceContext,
  ): Promise<VoiceSession>;
  async processVoiceInput(
    sessionId: string,
    audio: Buffer,
  ): Promise<VoiceResponse>;
  async transcribeAudio(audioUrl: string): Promise<string>;
  async generateVoiceResponse(text: string): Promise<Buffer>;

  // Nova 2 Sonic Integration
  private async callNova2Sonic(
    audio: Buffer,
    context: any,
  ): Promise<VoiceResponse>;
}
```

### 4. **File Service**

```typescript
class FileService {
  async uploadFile(file: File, bucket: string): Promise<FileUploadResult>;
  async generatePresignedUrl(key: string, expiresIn: number): Promise<string>;
  async deleteFile(key: string): Promise<void>;
  async getFileMetadata(key: string): Promise<FileMetadata>;

  // Storage Providers
  private s3Client: AWS.S3;
  private r2Client: R2Bucket;
}
```

### 5. **Nova Service**

```typescript
class NovaService {
  // Model Clients
  private nova2Lite: Nova2LiteClient;
  private nova2Sonic: Nova2SonicClient;
  private novaMultimodal: NovaMultimodalClient;
  private novaAct: NovaActClient;

  // Methods
  async analyzeWithReasoning(
    prompt: string,
    context: any,
  ): Promise<NovaResponse>;
  async processVoiceConversation(
    audio: Buffer,
    sessionContext: any,
  ): Promise<VoiceConversation>;
  async analyzeImage(
    imageUrl: string,
    analysisType: string,
  ): Promise<ImageAnalysis>;
  async automateWorkflow(
    workflowId: string,
    inputs: any,
  ): Promise<WorkflowResult>;

  // Rate limiting and error handling
  private handleRateLimit(): Promise<void>;
  private handleErrors(error: any): never;
}
```

## Database Integration

### Prisma Configuration

```typescript
// src/config/database.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
  errorFormat: "pretty",
});

// Connection pooling
export const db = prisma;

// Transaction helper
export async function transaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
): Promise<T> {
  return await prisma.$transaction(callback);
}
```

### Repository Pattern

```typescript
// Base repository
abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  abstract create(data: any): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: any): Promise<T>;
  abstract delete(id: string): Promise<void>;
}

// Experiment repository
class ExperimentRepository extends BaseRepository<Experiment> {
  async findByUser(userId: string, filters?: any): Promise<Experiment[]> {
    return this.prisma.experiment.findMany({
      where: { createdById: userId, ...filters },
      include: { protocol: true, attachments: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async withAnalysis(id: string): Promise<ExperimentWithAnalysis> {
    return this.prisma.experiment.findUnique({
      where: { id },
      include: {
        analyses: {
          orderBy: { requestedAt: "desc" },
          take: 5,
        },
      },
    });
  }
}
```

## Authentication & Authorization

### JWT Implementation

```typescript
// src/middleware/auth.ts
import { createMiddleware } from "hono";
import { verify } from "hono/jwt";

const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return c.json({ error: "Authentication required" }, 401);
  }

  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set("user", payload);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Role-based authorization
const requireRole = (role: UserRole) =>
  createMiddleware(async (c, next) => {
    const user = c.get("user");
    if (user.role !== role && user.role !== "ADMIN") {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    await next();
  });
```

### Rate Limiting

```typescript
// src/middleware/rate-limit.ts
import { rateLimiter } from "hono-rate-limiter";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const rateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: "draft-6",
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
  store: new RedisStore(redis),
});
```

## File Upload & Storage

### S3/R2 Configuration

```typescript
// src/services/file.service.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class FileService {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      // For Cloudflare R2
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
    });
  }

  async generateUploadUrl(
    fileName: string,
    fileType: string,
    userId: string,
  ): Promise<{ url: string; key: string }> {
    const key = `uploads/${userId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: fileType,
      Metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    return { url, key };
  }
}
```

## Amazon Nova Integration

### Nova Client Factory

```typescript
// src/services/nova.service.ts
import {
  Nova2LiteClient,
  Nova2SonicClient,
  NovaMultimodalClient,
} from "@aws-sdk/client-nova";

class NovaServiceFactory {
  static createNova2LiteClient(): Nova2LiteClient {
    return new Nova2LiteClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  static createNova2SonicClient(): Nova2SonicClient {
    return new Nova2SonicClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  // Usage
  async analyzeExperiment(experimentId: string): Promise<AnalysisResult> {
    const client = NovaServiceFactory.createNova2LiteClient();
    const experiment = await this.experimentRepository.findById(experimentId);

    const prompt = this.buildAnalysisPrompt(experiment);
    const response = await client.invoke({
      model: "nova-2-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return this.parseNovaResponse(response);
  }
}
```

## Background Workers

### Analysis Worker

```typescript
// src/workers/analysis.worker.ts
import { Worker, Queue } from "bullmq";
import { AnalysisService } from "../services/analysis.service";

const analysisQueue = new Queue("analysis", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT!),
  },
});

const analysisWorker = new Worker(
  "analysis",
  async (job) => {
    const { experimentId, analysisType, userId } = job.data;

    const analysisService = new AnalysisService();
    const result = await analysisService.analyzeExperiment(
      experimentId,
      analysisType,
      userId,
    );

    // Update experiment with analysis results
    await db.experiment.update({
      where: { id: experimentId },
      data: {
        analyses: {
          create: {
            type: analysisType,
            observations: result.observations,
            recommendations: result.recommendations,
            confidence: result.confidence,
            requestedById: userId,
          },
        },
      },
    });

    // Send notification
    await notificationService.sendAnalysisComplete(
      userId,
      experimentId,
      result,
    );

    return result;
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT!),
    },
    concurrency: 5, // Process 5 jobs concurrently
  },
);
```

## Error Handling

### Global Error Handler

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: any,
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

// Error handling middleware
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
        code: err.code,
        details: err instanceof ValidationError ? err.details : undefined,
      },
      err.statusCode,
    );
  }

  // Log unexpected errors
  console.error("Unexpected error:", err);

  return c.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    500,
  );
});
```

## Testing Strategy

### Unit Tests

```typescript
// tests/services/experiment.service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { ExperimentService } from "../../src/services/experiment.service";
import { mockDeep } from "vitest-mock-extended";

describe("ExperimentService", () => {
  let experimentService: ExperimentService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = mockDeep();
    experimentService = new ExperimentService(mockPrisma);
  });

  it("should create an experiment", async () => {
    const data = { title: "Test Experiment", protocolId: "123" };
    const userId = "user-123";

    mockPrisma.experiment.create.mockResolvedValue({
      id: "exp-123",
      ...data,
      createdById: userId,
    });

    const result = await experimentService.createExperiment(data, userId);

    expect(result.id).toBe("exp-123");
    expect(mockPrisma.experiment.create).toHaveBeenCalledWith({
      data: { ...data, createdById: userId },
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/experiments.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/index";
import { testClient } from "hono/testing";
import { db } from "../../src/config/database";

const client = testClient(app);

describe("Experiments API", () => {
  beforeAll(async () => {
    // Setup test database
    await db.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await db.$disconnect();
  });

  it("should create and retrieve an experiment", async () => {
    // Create experiment
    const createRes = await client.experiments.$post({
      json: {
        title: "Integration Test Experiment",
        protocolId: "test-protocol",
      },
      header: {
        Authorization: "Bearer test-token",
      },
    });

    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    // Retrieve experiment
    const getRes = await client.experiments[":id"].$get({
      param: { id: created.id },
      header: {
        Authorization: "Bearer test-token",
      },
    });

    expect(getRes.status).toBe(200);
    const retrieved = await getRes.json();
    expect(retrieved.title).toBe("Integration Test Experiment");
  });
});
```

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lab_assistant"
DIRECT_URL="postgresql://user:password@localhost:5432/lab_assistant"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# AWS / Nova
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
NOVA_API_KEY="your-nova-api-key"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# File Storage
S3_BUCKET="lab-assistant-uploads"
S3_ENDPOINT="https://s3.amazonaws.com" # For R2: https://<account-id>.r2.cloudflarestorage.com

# App
PORT="3000"
NODE_ENV="production"
LOG_LEVEL="info"
```

## Monitoring & Observability

### Logging

```typescript
// src/utils/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
```

### Metrics

```typescript
// src/middleware/metrics.ts
import { createMiddleware } from "hono";
import client from "prom-client";

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const metricsMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now();

  try {
    await next();
  } finally {
    const duration = (Date.now() - start) / 1000;
    const route = c.req.routePath || c.req.path;
    const method = c.req.method;
    const status = c.res.status;

    httpRequestDuration.observe(
      { method, route, status_code: status },
      duration,
    );
  }
});

// Metrics endpoint
app.get("/metrics", async (c) => {
  c.header("Content-Type", client.register.contentType);
  return c.text(await client.register.metrics());
});
```

## Security Considerations

### 1. **Input Validation**

- Use Zod for request validation
- Sanitize all user inputs
- Validate file uploads (type, size, content)

### 2. **API Security**

- Rate limiting on all endpoints
- CORS configuration
- HTTPS enforcement
- Security headers (HSTS, CSP)

### 3. **Data Protection**

- Encrypt sensitive data at rest
- Secure file uploads with signed URLs
- Regular security audits

### 4. **Authentication**

- JWT with short expiration
- Refresh token rotation
- Password hashing with bcrypt
- Multi-factor authentication (future)

This backend architecture provides a scalable, maintainable foundation for the Lab Assistant AI project with proper separation of concerns, error handling, and integration with Amazon Nova services.

# Database Requirements for Lab Assistant AI

## Overview

This document outlines the database schema requirements for the Lab Assistant AI project using **Prisma ORM** with **PostgreSQL**. All IDs will use **UUID v4** for better distribution and security.

## Core Entities

### 1. **User Management**

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  role          UserRole  @default(RESEARCHER)
  plan          PlanType  @default(FREE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  // Relations
  experiments   Experiment[]
  protocols     Protocol[]
  teams         TeamMember[]
  settings      UserSettings?
  subscriptions Subscription[]

  @@index([email])
  @@index([createdAt])
}

enum UserRole {
  RESEARCHER
  LAB_MANAGER
  ADMIN
}

enum PlanType {
  FREE
  PRO
  ENTERPRISE
}
```

### 2. **Protocol Management**

```prisma
model Protocol {
  id            String     @id @default(uuid())
  name          String
  description   String?
  category      ProtocolCategory
  version       String     @default("1.0.0")
  isPublic      Boolean    @default(false)
  isTemplate    Boolean    @default(false)

  // Protocol Details
  materials     Json       // JSON array of materials with quantities
  steps         Json       // JSON array of step instructions
  conditions    Json       // JSON object of temperature, time, etc.
  safetyNotes   String?
  references    String?

  // Metadata
  createdById   String
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  lastUsedAt    DateTime?
  usageCount    Int        @default(0)

  // Relations
  createdBy     User       @relation(fields: [createdById], references: [id])
  experiments   Experiment[]
  protocolTags  ProtocolTag[]

  @@index([createdById])
  @@index([category])
  @@index([createdAt])
}

enum ProtocolCategory {
  PCR
  WESTERN_BLOT
  CELL_CULTURE
  PROTEIN_EXPRESSION
  DNA_SEQUENCING
  MICROSCOPY
  FLOW_CYTOMETRY
  ELISA
  OTHER
}

model ProtocolTag {
  id        String   @id @default(uuid())
  name      String
  color     String?  @default("#3b82f6")

  protocols Protocol[] @relation("ProtocolTags")

  @@unique([name])
}
```

### 3. **Experiment Management**

```prisma
model Experiment {
  id          String         @id @default(uuid())
  title       String
  description String?
  status      ExperimentStatus @default(PLANNED)

  // Protocol Reference
  protocolId  String
  protocol    Protocol       @relation(fields: [protocolId], references: [id])

  // Experiment Details
  startDate   DateTime?
  endDate     DateTime?
  notes       String?
  variables   Json           // JSON object of experimental variables

  // Results
  results     Json?          // JSON array of result data
  conclusion  String?
  success     Boolean?

  // Metadata
  createdById String
  labId       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // Relations
  createdBy   User           @relation(fields: [createdById], references: [id])
  lab         Lab?           @relation(fields: [labId], references: [id])
  attachments Attachment[]
  analyses    Analysis[]
  issues      Issue[]

  @@index([createdById])
  @@index([protocolId])
  @@index([status])
  @@index([createdAt])
}

enum ExperimentStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}
```

### 4. **Analysis & AI Results**

```prisma
model Analysis {
  id            String       @id @default(uuid())
  experimentId  String
  type          AnalysisType
  inputData     Json         // JSON of input data (images, text, etc.)

  // AI Results
  modelUsed     String       // e.g., "nova-2-lite", "nova-multimodal"
  observations  Json         // JSON array of observations
  confidence    Float?       // 0.0 to 1.0
  recommendations Json       // JSON array of recommendations
  nextSteps     Json         // JSON array of suggested next steps

  // Metadata
  requestedById String
  requestedAt   DateTime     @default(now())
  completedAt   DateTime?
  processingTime Int?        // milliseconds

  // Relations
  experiment    Experiment   @relation(fields: [experimentId], references: [id])
  requestedBy   User         @relation(fields: [requestedById], references: [id])

  @@index([experimentId])
  @@index([type])
  @@index([requestedAt])
}

enum AnalysisType {
  GEL_IMAGE
  WESTERN_BLOT
  CELL_MORPHOLOGY
  TROUBLESHOOTING
  PROTOCOL_OPTIMIZATION
  DATA_INTERPRETATION
}
```

### 5. **Attachment Management**

```prisma
model Attachment {
  id          String        @id @default(uuid())
  experimentId String
  type        AttachmentType
  fileName    String
  fileSize    Int           // bytes
  mimeType    String
  url         String        // S3/Cloud Storage URL
  thumbnailUrl String?

  // Metadata
  uploadedById String
  uploadedAt   DateTime      @default(now())
  description  String?

  // Relations
  experiment   Experiment    @relation(fields: [experimentId], references: [id])
  uploadedBy   User          @relation(fields: [uploadedById], references: [id])

  @@index([experimentId])
  @@index([type])
  @@index([uploadedAt])
}

enum AttachmentType {
  IMAGE
  VIDEO
  DOCUMENT
  DATA_FILE
  AUDIO
}
```

### 6. **Issue Tracking**

```prisma
model Issue {
  id            String      @id @default(uuid())
  experimentId  String
  type          IssueType
  severity      SeverityLevel @default(MEDIUM)
  description   String
  status        IssueStatus  @default(OPEN)

  // Resolution
  resolvedById  String?
  resolvedAt    DateTime?
  resolution    String?

  // Metadata
  reportedById  String
  reportedAt    DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  experiment    Experiment  @relation(fields: [experimentId], references: [id])
  reportedBy    User        @relation(fields: [reportedById], references: [id])
  resolvedBy    User?       @relation(fields: [resolvedById], references: [id])

  @@index([experimentId])
  @@index([type])
  @@index([status])
  @@index([severity])
}

enum IssueType {
  CONTAMINATION
  EQUIPMENT_FAILURE
  PROTOCOL_ERROR
  REAGENT_ISSUE
  DATA_QUALITY
  SAFETY_CONCERN
  OTHER
}

enum SeverityLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

### 7. **Lab & Team Management**

```prisma
model Lab {
  id          String        @id @default(uuid())
  name        String
  description String?
  location    String?
  contactEmail String?

  // Settings
  settings    Json          // JSON object of lab-specific settings

  // Metadata
  createdById String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations
  createdBy   User          @relation(fields: [createdById], references: [id])
  members     TeamMember[]
  experiments Experiment[]
  equipment   Equipment[]

  @@index([createdById])
}

model TeamMember {
  id        String      @id @default(uuid())
  userId    String
  labId     String
  role      TeamRole    @default(MEMBER)
  joinedAt  DateTime    @default(now())

  // Relations
  user      User        @relation(fields: [userId], references: [id])
  lab       Lab         @relation(fields: [labId], references: [id])

  @@unique([userId, labId])
  @@index([labId])
}

enum TeamRole {
  MEMBER
  LEADER
  ADMIN
}
```

### 8. **Equipment & Inventory**

```prisma
model Equipment {
  id          String        @id @default(uuid())
  labId       String
  name        String
  type        EquipmentType
  model       String?
  serialNumber String?

  // Status
  status      EquipmentStatus @default(OPERATIONAL)
  lastCalibration DateTime?
  nextCalibration DateTime?

  // Metadata
  purchasedAt DateTime?
  notes       String?

  // Relations
  lab         Lab           @relation(fields: [labId], references: [id])

  @@index([labId])
  @@index([type])
  @@index([status])
}

enum EquipmentType {
  THERMOCYCLER
  CENTRIFUGE
  MICROSCOPE
  SPECTROPHOTOMETER
  INCUBATOR
  AUTOCLAVE
  ELECTROPHORESIS
  BLOTTER
  OTHER
}

enum EquipmentStatus {
  OPERATIONAL
  MAINTENANCE
  OUT_OF_SERVICE
  DECOMMISSIONED
}
```

### 9. **Voice Interactions**

```prisma
model VoiceInteraction {
  id            String      @id @default(uuid())
  userId        String
  sessionId     String      @unique
  inputAudioUrl String?     // S3 URL for voice input
  transcript    String?

  // AI Response
  modelUsed     String      // e.g., "nova-2-sonic"
  response      String?
  responseAudioUrl String?  // S3 URL for AI voice response

  // Context
  contextType   VoiceContextType
  experimentId  String?
  protocolId    String?

  // Metadata
  startedAt     DateTime    @default(now())
  endedAt       DateTime?
  processingTime Int?       // milliseconds

  // Relations
  user          User        @relation(fields: [userId], references: [id])
  experiment    Experiment? @relation(fields: [experimentId], references: [id])
  protocol      Protocol?   @relation(fields: [protocolId], references: [id])

  @@index([userId])
  @@index([startedAt])
  @@index([contextType])
}

enum VoiceContextType {
  EXPERIMENT_GUIDANCE
  TROUBLESHOOTING
  PROTOCOL_QUERY
  CALCULATION
  GENERAL_QUESTION
}
```

### 10. **Calculations & Tools**

```prisma
model Calculation {
  id          String        @id @default(uuid())
  userId      String
  type        CalculationType
  input       Json          // JSON object of input parameters
  result      Json          // JSON object of calculation results
  formulaUsed String?

  // Metadata
  performedAt DateTime      @default(now())

  // Relations
  user        User          @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([type])
  @@index([performedAt])
}

enum CalculationType {
  MOLARITY
  DILUTION
  CONCENTRATION
  UNIT_CONVERSION
  REACTION_VOLUME
  SAMPLE_PREPARATION
}
```

### 11. **Subscription & Billing**

```prisma
model Subscription {
  id            String        @id @default(uuid())
  userId        String
  plan          PlanType
  status        SubscriptionStatus @default(ACTIVE)

  // Billing
  stripeCustomerId String?
  stripeSubscriptionId String?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd Boolean @default(false)

  // Usage Limits
  maxExperiments   Int?      // Monthly limit
  maxStorageMB     Int?      // Storage limit
  maxAnalyses      Int?      // AI analysis limit

  // Metadata
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  user            User        @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([currentPeriodEnd])
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
}
```

### 12. **User Settings & Preferences**

```prisma
model UserSettings {
  id                String    @id @default(uuid())
  userId            String    @unique
  theme             ThemeType @default(LIGHT)
  language          String    @default("en")
  measurementSystem MeasurementSystem @default(METRIC)

  // Notification Preferences
  emailNotifications Boolean  @default(true)
  pushNotifications  Boolean  @default(true)
  experimentAlerts   Boolean  @default(true)

  // Lab Preferences
  defaultLabId      String?
  defaultProtocolCategory ProtocolCategory?

  // AI Preferences
  preferredAnalysisModel String? @default("nova-2-lite")
  preferredVoiceModel    String? @default("nova-2-sonic")

  // Relations
  user              User      @relation(fields: [userId], references: [id])
  defaultLab        Lab?      @relation(fields: [defaultLabId], references: [id])

  @@index([userId])
}

enum ThemeType {
  LIGHT
  DARK
  SYSTEM
}

enum MeasurementSystem {
  METRIC
  IMPERIAL
}
```

## Indexing Strategy

### Primary Indexes

- All `@id` fields (UUID)
- All `@unique` constraints

### Performance Indexes

- Foreign key fields (`userId`, `experimentId`, `protocolId`)
- Date fields for time-based queries (`createdAt`, `updatedAt`)
- Status/enum fields for filtering
- Searchable text fields (`name`, `email`)

### Composite Indexes

- User + date combinations for user activity
- Lab + equipment for inventory management
- Protocol + category for browsing

## Data Retention Policies

1. **User Data**: Retain while account active + 30 days after deletion
2. **Experiment Data**: Permanent retention for scientific integrity
3. **Voice Interactions**: 90 days for performance analysis
4. **Analysis Results**: Permanent with experiment
5. **Attachment Files**: 30 days after experiment deletion

## Security Considerations

1. **Row-Level Security**: Implement via application logic
2. **Data Encryption**: Sensitive fields at application level
3. **Audit Logging**: All write operations logged
4. **Backup Strategy**: Daily backups with 30-day retention
5. **GDPR Compliance**: User data deletion workflows

## Migration Strategy

1. **Initial Schema**: Core tables (User, Protocol, Experiment)
2. **Phase 2**: Analysis and AI features
3. **Phase 3**: Team and lab management
4. **Phase 4**: Billing and enterprise features

## Performance Considerations

1. **Partitioning**: Consider time-based partitioning for large tables
2. **Connection Pooling**: Configure for expected concurrent users
3. **Query Optimization**: Regular query analysis and index tuning
4. **Caching Strategy**: Redis for frequently accessed data
5. **Archiving**: Move old data to cold storage after 2 years

This schema provides a solid foundation for the Lab Assistant AI project with room for expansion as features grow.

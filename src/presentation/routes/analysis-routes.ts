import { Hono } from 'hono'
import { AnalysisUseCases } from '@application/use-cases/analysis-use-cases'
import { PrismaAnalysisRepository } from '@infrastructure/repositories/prisma-analysis-repository'
import { PrismaExperimentRepository } from '@infrastructure/repositories/prisma-experiment-repository'
import { AmazonNovaService } from '@infrastructure/services/amazon-nova-service'
import { CreateAnalysisInput, UpdateAnalysisInput, AnalysisType } from '@domain/analysis'
import { authMiddleware, AuthContext } from '@shared/middleware'

const analysisRepository = new PrismaAnalysisRepository()
const experimentRepository = new PrismaExperimentRepository()
const aiService = new AmazonNovaService() // Amazon Nova AI Service
const analysisUseCases = new AnalysisUseCases(analysisRepository, experimentRepository, aiService)

export const analysisRoutes = new Hono()

// Create a protected route group
const protectedRoutes = new Hono()
protectedRoutes.use('*', authMiddleware)

// Protected routes
// Create analysis (manual)
protectedRoutes.post('/', async (c: AuthContext) => {
  try {
    const input = await c.req.json<CreateAnalysisInput>()
    const user = c.get('user')

    const result = await analysisUseCases.createAnalysis({
      ...input,
      requestedById: user.id
    })

    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result, 201)
  } catch (error) {
    console.error('Create analysis error:', error)
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Get analysis by ID
protectedRoutes.get('/:id', async (c: AuthContext) => {
  const id = c.req.param('id')
  const result = await analysisUseCases.getAnalysisById(id)

  if (!result.success) {
    return c.json({ error: result.error }, 404)
  }

  return c.json(result)
})

// Update analysis
protectedRoutes.put('/:id', async (c: AuthContext) => {
  const id = c.req.param('id')
  
  try {
    const input = await c.req.json<UpdateAnalysisInput>()
    const result = await analysisUseCases.updateAnalysis(id, input)

    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Delete analysis
protectedRoutes.delete('/:id', async (c: AuthContext) => {
  const id = c.req.param('id')
  const result = await analysisUseCases.deleteAnalysis(id)

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// List analyses by experiment
protectedRoutes.get('/experiment/:experimentId', async (c: AuthContext) => {
  const experimentId = c.req.param('experimentId')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  const result = await analysisUseCases.listExperimentAnalyses(
    experimentId,
    { page, limit }
  )

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// List user's analyses
protectedRoutes.get('/user/my-analyses', async (c: AuthContext) => {
  const userId = c.get('user').id
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  const result = await analysisUseCases.listUserAnalyses(
    userId,
    { page, limit }
  )

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// List analyses by type
protectedRoutes.get('/type/:type', async (c: AuthContext) => {
  const type = c.req.param('type') as AnalysisType
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  // Validate type
  if (!Object.values(AnalysisType).includes(type)) {
    return c.json({ error: 'Invalid analysis type' }, 400)
  }

  const result = await analysisUseCases.listAnalysesByType(
    type,
    { page, limit }
  )

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// List recent analyses
protectedRoutes.get('/recent', async (c: AuthContext) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  const result = await analysisUseCases.listRecentAnalyses({ page, limit })

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// AI-Powered Analysis Endpoints

// Analyze gel image
protectedRoutes.post('/gel-image', async (c: AuthContext) => {
  try {
    const { experimentId, imageUrl, metadata } = await c.req.json<{
      experimentId: string;
      imageUrl: string;
      metadata?: Record<string, any>;
    }>()
    
    const user = c.get('user')

    if (!experimentId || !imageUrl) {
      return c.json({ error: 'experimentId and imageUrl are required' }, 400)
    }

    const result = await analysisUseCases.requestGelImageAnalysis(
      experimentId,
      user.id,
      imageUrl,
      metadata
    )

    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result, 201)
  } catch (error) {
    console.error('Gel image analysis error:', error)
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Troubleshooting analysis
protectedRoutes.post('/troubleshoot', async (c: AuthContext) => {
  try {
    const { experimentId, problem, context } = await c.req.json<{
      experimentId: string;
      problem: string;
      context?: Record<string, any>;
    }>()
    
    const user = c.get('user')

    if (!experimentId || !problem) {
      return c.json({ error: 'experimentId and problem are required' }, 400)
    }

    const result = await analysisUseCases.requestTroubleshootingAnalysis(
      experimentId,
      user.id,
      problem,
      context
    )

    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result, 201)
  } catch (error) {
    console.error('Troubleshooting analysis error:', error)
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Protocol optimization
protectedRoutes.post('/optimize-protocol', async (c: AuthContext) => {
  try {
    const { experimentId, currentProtocol, issues } = await c.req.json<{
      experimentId: string;
      currentProtocol: Record<string, any>;
      issues?: string[];
    }>()
    
    const user = c.get('user')

    if (!experimentId || !currentProtocol) {
      return c.json({ error: 'experimentId and currentProtocol are required' }, 400)
    }

    const result = await analysisUseCases.requestProtocolOptimization(
      experimentId,
      user.id,
      currentProtocol,
      issues
    )

    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result, 201)
  } catch (error) {
    console.error('Protocol optimization error:', error)
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Mount protected routes under analysisRoutes
analysisRoutes.route('/', protectedRoutes)

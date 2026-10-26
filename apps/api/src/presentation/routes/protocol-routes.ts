import { Hono } from 'hono'
import { ProtocolUseCases } from '@application/use-cases/protocol-use-cases'
import { PrismaProtocolRepository } from '@infrastructure/repositories/prisma-protocol-repository'
import { CreateProtocolInput, UpdateProtocolInput, ProtocolCategory } from '@domain/protocol'
import { authMiddleware, AuthContext } from '@shared/middleware'

const protocolRepository = new PrismaProtocolRepository()
const protocolUseCases = new ProtocolUseCases(protocolRepository)

export const protocolRoutes = new Hono()

// Create a protected route group
const protectedRoutes = new Hono()
protectedRoutes.use('*', authMiddleware)

// Public routes
// List public protocols
protocolRoutes.get('/public', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const search = c.req.query('search')

  const result = await protocolUseCases.listPublicProtocols({ page, limit }, search)

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// List protocol templates
protocolRoutes.get('/templates', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  const result = await protocolUseCases.listTemplates({ page, limit })

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// List protocols by category
protocolRoutes.get('/category/:category', async (c) => {
  const category = c.req.param('category') as ProtocolCategory
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  // Validate category
  if (!Object.values(ProtocolCategory).includes(category)) {
    return c.json({ error: 'Invalid protocol category' }, 400)
  }

  const result = await protocolUseCases.listProtocolsByCategory(category, { page, limit })

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// Get protocol by ID (public)
protocolRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await protocolUseCases.getProtocolById(id)

  if (!result.success) {
    return c.json({ error: result.error }, 404)
  }

  return c.json(result)
})

// Protected routes
// Create protocol
protectedRoutes.post('/', async (c: AuthContext) => {
  try {
    const input = await c.req.json<CreateProtocolInput>()
    console.log(input)
    
    // Set createdById from authenticated user
    const user = c.get('user')

    const result = await protocolUseCases.createProtocol({...input, createdById: user.id })

    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result, 201)
  } catch (error) {
    console.log(error)
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// List user's protocols
protectedRoutes.get('/user/my-protocols', async (c: AuthContext) => {
  const userId = c.get('user').id
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const category = c.req.query('category') as ProtocolCategory | undefined
  const isPublic = c.req.query('isPublic') === 'true' ? true : c.req.query('isPublic') === 'false' ? false : undefined
  const isTemplate = c.req.query('isTemplate') === 'true' ? true : c.req.query('isTemplate') === 'false' ? false : undefined
  const result = await protocolUseCases.listUserProtocols(
    userId,
    { page, limit },
    { category, isPublic, isTemplate }
  )

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// Search protocols
protectedRoutes.get('/search', async (c: AuthContext) => {
  const query = c.req.query('q')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  if (!query) {
    return c.json({ error: 'Search query is required' }, 400)
  }

  const result = await protocolUseCases.searchProtocols(query, { page, limit })

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// Update protocol
protectedRoutes.put('/:id', async (c: AuthContext) => {
  const id = c.req.param('id')
  
  try {
    const input = await c.req.json<UpdateProtocolInput>()
    const result = await protocolUseCases.updateProtocol(id, input)

    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Delete protocol
protectedRoutes.delete('/:id', async (c: AuthContext) => {
  const id = c.req.param('id')
  const result = await protocolUseCases.deleteProtocol(id)

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// Duplicate protocol
protectedRoutes.post('/:id/duplicate', async (c: AuthContext) => {
  const id = c.req.param('id')
  const userId = c.get('user').id

  const result = await protocolUseCases.duplicateProtocol(id, userId)

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result, 201)
})

// Record protocol usage
protectedRoutes.post('/:id/use', async (c: AuthContext) => {
  const id = c.req.param('id')
  const result = await protocolUseCases.recordProtocolUsage(id)

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json(result)
})

// Mount protected routes under protocolRoutes
protocolRoutes.route('/', protectedRoutes)
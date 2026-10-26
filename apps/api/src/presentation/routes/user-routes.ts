import { Hono } from 'hono'
import { UserUseCases } from '@application/use-cases/user-use-cases'
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user-repository'
import { CreateUserInput, UpdateUserInput, UserRole, PlanType, LoginCredentials } from '@domain/user'
import { JwtService, generateAuthResponse } from '@shared/jwt'
import { authMiddleware, requireRole, AuthContext } from '@shared/middleware'

const userRepository = new PrismaUserRepository()
const userUseCases = new UserUseCases(userRepository)

export const userRoutes = new Hono()

// Create a protected route group
const protectedRoutes = new Hono()
protectedRoutes.use('*', authMiddleware)

// Public routes
// Create user
userRoutes.post('/', async (c) => {
  try {
    const input = await c.req.json<CreateUserInput>()
    const result = await userUseCases.createUser(input)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }
    
    // Type guard for success response
    if (result.success) {
      // Generate JWT token for new user
      const token = JwtService.generateToken({
        id: result.data.id,
        email: result.data.email,
        role: result.data.role
      })
      
      return c.json({
        success: true,
        data: generateAuthResponse(result.data, token),
        message: result.message
      }, 201)
    }
    
    // This should never happen, but TypeScript needs it
    return c.json({ error: 'Unexpected error' }, 500)
  } catch (error) {
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Login
userRoutes.post('/login', async (c) => {
  try {
    const credentials = await c.req.json<LoginCredentials>()
    const result = await userUseCases.authenticate(credentials)
    
    if (!result.success) {
      return c.json({ error: result.error }, 401)
    }
    
    // Type guard for success response
    if (result.success) {
      // Generate JWT token
      const token = JwtService.generateToken({
        id: result.data.id,
        email: result.data.email,
        role: result.data.role
      })

      const response = generateAuthResponse(result.data, token)
      
      console.log(response)
      return c.json({
        success: true,
        data: response
      })
    }
    
    // This should never happen, but TypeScript needs it
    return c.json({ error: 'Unexpected error' }, 500)
  } catch (error) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
})

// Protected routes
// Get user by ID
protectedRoutes.get('/:id', async (c: AuthContext) => {
  const id = c.req.param('id')
  const result = await userUseCases.getUserById(id)
  
  if (!result.success) {
    return c.json({ error: result.error }, 404)
  }
  
  return c.json(result)
})

// Get user by email
protectedRoutes.get('/email/:email', async (c: AuthContext) => {
  const email = c.req.param('email')
  const result = await userUseCases.getUserByEmail(email)
  
  if (!result.success) {
    return c.json({ error: result.error }, 404)
  }
  
  return c.json(result)
})

// Update user
protectedRoutes.put('/:id', async (c: AuthContext) => {
  const id = c.req.param('id')
  try {
    const input = await c.req.json<UpdateUserInput>()
    const result = await userUseCases.updateUser(id, input)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Delete user (admin only)
protectedRoutes.delete('/:id', requireRole('ADMIN'), async (c: AuthContext) => {
  const id = c.req.param('id')
  const result = await userUseCases.deleteUser(id)
  
  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }
  
  return c.json(result)
})

// List users
protectedRoutes.get('/', async (c: AuthContext) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const role = c.req.query('role') as UserRole | undefined
  const plan = c.req.query('plan') as PlanType | undefined
  
  const result = await userUseCases.listUsers(
    { page, limit },
    { role, plan }
  )
  
  return c.json(result)
})

// Change password
protectedRoutes.post('/:id/change-password', async (c: AuthContext) => {
  const id = c.req.param('id')
  try {
    const { currentPassword, newPassword } = await c.req.json()
    const result = await userUseCases.changePassword(id, currentPassword, newPassword)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// Record user login
protectedRoutes.post('/:id/login-record', async (c: AuthContext) => {
  const id = c.req.param('id')
  const result = await userUseCases.recordUserLogin(id)
  
  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }
  
  return c.json(result)
})

// Mount protected routes under userRoutes
userRoutes.route('/', protectedRoutes)
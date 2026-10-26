import { describe, it, expect } from 'vitest'
import { UserEntity, UserRole, PlanType } from '../user'

describe('UserEntity',  () => {
  it('should create a user with default values', async () => {
    const user = await UserEntity.create({
      email: 'test@example.com',
      name: 'Test User',
      password:'543027Martin$'
    })

    expect(user.id).toBeDefined()
    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')
    expect(user.role).toBe(UserRole.RESEARCHER)
    expect(user.plan).toBe(PlanType.FREE)
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)
  })

  it('should validate email correctly', async () => {
    const user = await UserEntity.create({
      email: 'invalid-email',
      name: 'Test User',
      password:'543027Martin$'
    })

    const validation = user.validate()
    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Invalid email address')
  })

  it('should update user properties', async () => {
    const user = await UserEntity.create({
      email: 'test@example.com',
      name: 'Test User',
      password: '543027Martin$'
    })

    const originalUpdatedAt = user.updatedAt
    
    user.update({
      name: 'Updated Name',
      role: UserRole.LAB_MANAGER,
      plan: PlanType.PRO
    })

    expect(user.name).toBe('Updated Name')
    expect(user.role).toBe(UserRole.LAB_MANAGER)
    expect(user.plan).toBe(PlanType.PRO)
    expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
  })

  it('should record login time', async () => {
    const user = await UserEntity.create({
      email: 'test@example.com',
      name: 'Test User',
      password: '543027Martin$'
    })

    expect(user.lastLoginAt).toBeUndefined()
    
    user.recordLogin()
    
    expect(user.lastLoginAt).toBeInstanceOf(Date)
    expect(user.lastLoginAt!.getTime()).toBeGreaterThan(Date.now() - 1000)
  })

  it('should validate name length', async () => {
    const longName = 'a'.repeat(101)
    const user = await UserEntity.create({
      email: 'test@example.com',
      name: longName,
      password: '543027Martin$'
    })

    const validation = user.validate()
    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Name must be less than 100 characters')
  })
})
// Example demonstrating Clean Architecture patterns
import { UserEntity, UserRole, PlanType } from '@domain/user'
import { InMemoryUserRepository } from '@infrastructure/repositories/in-memory-user-repository'
import { UserUseCases } from '@application/use-cases/user-use-cases'

async function runExample() {
  console.log('=== Clean Architecture Example ===\n')

  // 1. Create infrastructure (repository)
  const userRepository = new InMemoryUserRepository()
  
  // 2. Create application layer (use cases)
  const userUseCases = new UserUseCases(userRepository)
  
  // 3. Create a user using the domain entity
  console.log('1. Creating a user...')
  const createResult = await userUseCases.createUser({
    email: 'researcher@lab.com',
    name: 'Dr. Jane Smith',
    role: UserRole.RESEARCHER,
    plan: PlanType.PRO
  })
  
  if (createResult.success && createResult.data) {
    console.log(`✅ User created: ${createResult.data.name} (${createResult.data.email})`)
    console.log(`   ID: ${createResult.data.id}`)
    console.log(`   Role: ${createResult.data.role}`)
    console.log(`   Plan: ${createResult.data.plan}\n`)
    
    // 4. Get the user by ID
    console.log('2. Retrieving user by ID...')
    const getResult = await userUseCases.getUserById(createResult.data.id)
    
    if (getResult.success && getResult.data) {
      console.log(`✅ User retrieved: ${getResult.data.name}\n`)
      
      // 5. Update the user
      console.log('3. Updating user...')
      const updateResult = await userUseCases.updateUser(getResult.data.id, {
        name: 'Dr. Jane Smith PhD',
        plan: PlanType.ENTERPRISE
      })
      
      if (updateResult.success && updateResult.data) {
        console.log(`✅ User updated: ${updateResult.data.name}`)
        console.log(`   New plan: ${updateResult.data.plan}\n`)
        
        // 6. Record login
        console.log('4. Recording user login...')
        const loginResult = await userUseCases.recordUserLogin(updateResult.data.id)
        
        if (loginResult.success && loginResult.data) {
          console.log(`✅ Login recorded at: ${loginResult.data.lastLoginAt?.toISOString()}\n`)
        }
        
        // 7. List all users
        console.log('5. Listing all users...')
        const listResult = await userUseCases.listUsers({ page: 1, limit: 10 })
        
        if (listResult.success && listResult.data) {
          console.log(`✅ Found ${listResult.data.total} user(s)`)
          console.log(`   Page ${listResult.data.page} of ${listResult.data.totalPages}`)
          listResult.data.data.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name} (${user.email})`)
          })
        }
      }
    }
  } else {
    console.log(`❌ Error: ${createResult.error}`)
  }
  
  console.log('\n=== Example Complete ===')
}

// Run the example
runExample().catch(console.error)
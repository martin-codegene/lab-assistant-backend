// Example demonstrating Prisma ORM usage
import { prisma } from '@infrastructure/database/prisma-client'
import { UserEntity, UserRole, PlanType } from '@domain/user'
import { ProtocolEntity, ProtocolCategory } from '@domain/protocol'
import { ExperimentEntity, ExperimentStatus } from '@domain/experiment'

async function runPrismaExample() {
  console.log('=== Prisma ORM Example ===\n')

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful\n')

    // 2. Count existing users
    const userCount = await prisma.user.count()
    console.log(`2. Found ${userCount} existing user(s) in database\n`)

    // 3. Create a new user using domain entity
    console.log('3. Creating a new user...')
    const userInput = {
      email: 'test.user@example.com',
      name: 'Test User',
      role: UserRole.RESEARCHER,
      plan: PlanType.FREE,
    }
    
    const userEntity = UserEntity.create(userInput)
    const validation = userEntity.validate()
    
    if (!validation.isValid) {
      console.log(`❌ User validation failed: ${validation.errors.join(', ')}`)
      return
    }

    // Save to database using Prisma
    const savedUser = await prisma.user.create({
      data: {
        id: userEntity.id,
        email: userEntity.email,
        name: userEntity.name,
        role: userEntity.role,
        plan: userEntity.plan,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt,
      },
    })

    console.log(`✅ User created: ${savedUser.name} (${savedUser.email})`)
    console.log(`   ID: ${savedUser.id}`)
    console.log(`   Role: ${savedUser.role}`)
    console.log(`   Plan: ${savedUser.plan}\n`)

    // 4. Create a protocol
    console.log('4. Creating a protocol...')
    const protocolInput = {
      name: 'Test PCR Protocol',
      description: 'A test protocol for demonstration',
      category: ProtocolCategory.PCR,
      materials: [
        { name: 'Template DNA', quantity: '50', unit: 'ng' },
        { name: 'Primers', quantity: '0.5', unit: 'μM' },
        { name: 'Polymerase', quantity: '1', unit: 'U/μL' },
      ],
      steps: [
        { step: 1, action: 'Prepare master mix', duration: '10 min' },
        { step: 2, action: 'Add template', duration: '5 min' },
        { step: 3, action: 'Run PCR cycles', duration: '2 hours' },
      ],
      conditions: {
        temperature: '95°C',
        cycles: '30',
      },
      createdById: savedUser.id,
    }

    const protocolEntity = ProtocolEntity.create(protocolInput)
    const protocolValidation = protocolEntity.validate()
    
    if (!protocolValidation.isValid) {
      console.log(`❌ Protocol validation failed: ${protocolValidation.errors.join(', ')}`)
      return
    }

    const savedProtocol = await prisma.protocol.create({
      data: {
        id: protocolEntity.id,
        name: protocolEntity.name,
        description: protocolEntity.description,
        category: protocolEntity.category,
        version: protocolEntity.version,
        isPublic: protocolEntity.isPublic,
        isTemplate: protocolEntity.isTemplate,
        materials: protocolEntity.materials,
        steps: protocolEntity.steps,
        conditions: protocolEntity.conditions,
        safetyNotes: protocolEntity.safetyNotes,
        references: protocolEntity.references,
        createdById: protocolEntity.createdById,
        createdAt: protocolEntity.createdAt,
        updatedAt: protocolEntity.updatedAt,
        usageCount: protocolEntity.usageCount,
      },
    })

    console.log(`✅ Protocol created: ${savedProtocol.name}`)
    console.log(`   ID: ${savedProtocol.id}`)
    console.log(`   Category: ${savedProtocol.category}`)
    console.log(`   Version: ${savedProtocol.version}\n`)

    // 5. Create an experiment
    console.log('5. Creating an experiment...')
    const experimentInput = {
      title: 'Test Experiment',
      description: 'A test experiment for demonstration',
      protocolId: savedProtocol.id,
      variables: {
        sampleType: 'DNA',
        concentration: '50 ng/μL',
        replicates: 3,
      },
      createdById: savedUser.id,
    }

    const experimentEntity = ExperimentEntity.create(experimentInput)
    const experimentValidation = experimentEntity.validate()
    
    if (!experimentValidation.isValid) {
      console.log(`❌ Experiment validation failed: ${experimentValidation.errors.join(', ')}`)
      return
    }

    const savedExperiment = await prisma.experiment.create({
      data: {
        id: experimentEntity.id,
        title: experimentEntity.title,
        description: experimentEntity.description,
        status: experimentEntity.status,
        protocolId: experimentEntity.protocolId,
        variables: experimentEntity.variables,
        createdById: experimentEntity.createdById,
        createdAt: experimentEntity.createdAt,
        updatedAt: experimentEntity.updatedAt,
      },
    })

    console.log(`✅ Experiment created: ${savedExperiment.title}`)
    console.log(`   ID: ${savedExperiment.id}`)
    console.log(`   Status: ${savedExperiment.status}`)
    console.log(`   Protocol ID: ${savedExperiment.protocolId}\n`)

    // 6. Query data with relationships
    console.log('6. Querying data with relationships...')
    const experimentWithDetails = await prisma.experiment.findUnique({
      where: { id: savedExperiment.id },
      include: {
        protocol: true,
        createdBy: true,
      },
    })

    if (experimentWithDetails) {
      console.log(`✅ Experiment details retrieved:`)
      console.log(`   Title: ${experimentWithDetails.title}`)
      console.log(`   Protocol: ${experimentWithDetails.protocol.name}`)
      console.log(`   Created by: ${experimentWithDetails.createdBy.name}`)
      console.log(`   Status: ${experimentWithDetails.status}\n`)
    }

    // 7. Update experiment status
    console.log('7. Updating experiment status...')
    const updatedExperiment = await prisma.experiment.update({
      where: { id: savedExperiment.id },
      data: {
        status: ExperimentStatus.IN_PROGRESS,
        startDate: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log(`✅ Experiment status updated to: ${updatedExperiment.status}`)
    console.log(`   Start date: ${updatedExperiment.startDate}\n`)

    // 8. List all experiments for the user
    console.log('8. Listing user experiments...')
    const userExperiments = await prisma.experiment.findMany({
      where: { createdById: savedUser.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    console.log(`✅ Found ${userExperiments.length} experiment(s) for user:`)
    userExperiments.forEach((exp, index) => {
      console.log(`   ${index + 1}. ${exp.title} (${exp.status})`)
    })

    // 9. Clean up test data
    console.log('\n9. Cleaning up test data...')
    await prisma.experiment.deleteMany({
      where: { createdById: savedUser.id },
    })
    
    await prisma.protocol.deleteMany({
      where: { createdById: savedUser.id },
    })
    
    await prisma.user.deleteMany({
      where: { email: 'test.user@example.com' },
    })

    console.log('✅ Test data cleaned up\n')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('=== Example Complete ===')
  }
}

// Run the example
runPrismaExample().catch(console.error)
import { prisma } from "../src/infrastructure/database/prisma-client"
import bcrypt from "bcryptjs"


async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123$', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lab.com' },
    update: {},
    create: {
      email: 'admin@lab.com',
      password: adminPassword,
      name: 'Lab Administrator',
      role: 'ADMIN',
      plan: 'ENTERPRISE',
    },
  })

  // Create researcher user
  const researcherPassword = await bcrypt.hash('researcher123$', 10)
  const researcherUser = await prisma.user.upsert({
    where: { email: 'researcher@lab.com' },
    update: {},
    create: {
      email: 'researcher@lab.com',
      password: researcherPassword,
      name: 'Dr. Jane Smith',
      role: 'RESEARCHER',
      plan: 'PRO',
    },
  })

  // Create lab manager user
  const labManagerPassword = await bcrypt.hash('manager123$', 10)
  const labManagerUser = await prisma.user.upsert({
    where: { email: 'manager@lab.com' },
    update: {},
    create: {
      email: 'manager@lab.com',
      password: labManagerPassword,
      name: 'Dr. John Doe',
      role: 'LAB_MANAGER',
      plan: 'ENTERPRISE',
    },
  })


  const labStudentPassword = await bcrypt.hash('student123$', 10)
  const labStudentUser = await prisma.user.upsert({
    where: { email: 'student@lab.com' },
    update: {},
    create: {
      email: 'student@lab.com',
      password: labStudentPassword,
      name: 'Peter Pan',
      role: 'STUDENT',
      plan: 'ENTERPRISE',
    },
  })

  console.log(`✅ Created users: ${adminUser.name}, ${researcherUser.name}, ${labManagerUser.name}, ${labStudentUser.name}`)

  // Create user settings
  await prisma.userSettings.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      theme: 'DARK',
      language: 'en',
      measurementSystem: 'METRIC',
      emailNotifications: true,
      pushNotifications: true,
      experimentAlerts: true,
      preferredAnalysisModel: 'nova-2-lite',
      preferredVoiceModel: 'nova-2-sonic',
    },
  })

  // Create a lab
  const mainLab = await prisma.lab.create({
    data: {
      name: 'Main Research Lab',
      description: 'Primary research laboratory for molecular biology experiments',
      location: 'Building A, Room 101',
      contactEmail: 'lab@research.edu',
      settings: {
        safetyLevel: 'BSL-2',
        operatingHours: '9:00 AM - 6:00 PM',
        emergencyContact: '555-0123',
      },
      createdById: adminUser.id,
    },
  })

  console.log(`✅ Created lab: ${mainLab.name}`)

  // Add team members to lab
  await prisma.teamMember.createMany({
    data: [
      {
        userId: adminUser.id,
        labId: mainLab.id,
        role: 'ADMIN',
      },
      {
        userId: researcherUser.id,
        labId: mainLab.id,
        role: 'LEADER',
      },
      {
        userId: labManagerUser.id,
        labId: mainLab.id,
        role: 'ADMIN',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Added team members to lab')

  // Create protocol tags
  const tags = await Promise.all([
    prisma.protocolTag.create({
      data: { name: 'Molecular Biology', color: '#3b82f6' },
    }),
    prisma.protocolTag.create({
      data: { name: 'Cell Culture', color: '#10b981' },
    }),
    prisma.protocolTag.create({
      data: { name: 'Protein Analysis', color: '#f59e0b' },
    }),
    prisma.protocolTag.create({
      data: { name: 'DNA Sequencing', color: '#8b5cf6' },
    }),
  ])

  console.log(`✅ Created protocol tags: ${tags.map(t => t.name).join(', ')}`)

  // Create a PCR protocol
  const pcrProtocol = await prisma.protocol.create({
    data: {
      name: 'Standard PCR Amplification',
      description: 'Standard protocol for amplifying DNA fragments using PCR',
      category: 'PCR',
      version: '1.0.0',
      isPublic: true,
      isTemplate: true,
      materials: [
        { name: 'Template DNA', quantity: '50', unit: 'ng', catalogNumber: 'N/A' },
        { name: 'Forward Primer', quantity: '0.5', unit: 'μM', catalogNumber: 'Custom' },
        { name: 'Reverse Primer', quantity: '0.5', unit: 'μM', catalogNumber: 'Custom' },
        { name: 'Taq Polymerase', quantity: '1', unit: 'U/μL', catalogNumber: 'NEB M0273' },
        { name: '10X PCR Buffer', quantity: '1', unit: 'X', catalogNumber: 'NEB B9014' },
        { name: 'dNTP Mix', quantity: '0.2', unit: 'mM each', catalogNumber: 'NEB N0447' },
        { name: 'Nuclease-free water', quantity: 'variable', unit: 'μL', catalogNumber: 'N/A' },
      ],
      steps: [
        { step: 1, action: 'Prepare master mix on ice', duration: '10 min' },
        { step: 2, action: 'Add template DNA', duration: '5 min' },
        { step: 3, action: 'Initial denaturation', duration: '2 min', notes: '95°C' },
        { step: 4, action: 'Denaturation (30 cycles)', duration: '30 sec', notes: '95°C' },
        { step: 5, action: 'Annealing (30 cycles)', duration: '30 sec', notes: '55-65°C' },
        { step: 6, action: 'Extension (30 cycles)', duration: '1 min/kb', notes: '72°C' },
        { step: 7, action: 'Final extension', duration: '5 min', notes: '72°C' },
        { step: 8, action: 'Hold at 4°C', duration: '∞' },
      ],
      conditions: {
        temperature: 'See steps',
        cycles: '30',
        volume: '25-50 μL',
      },
      safetyNotes: 'Wear gloves and lab coat. Handle reagents carefully.',
      references: 'Standard molecular biology protocols',
      createdById: researcherUser.id,
    },
  })

  // Create a Western Blot protocol
  const westernBlotProtocol = await prisma.protocol.create({
    data: {
      name: 'Standard Western Blot',
      description: 'Protocol for protein detection using Western blotting',
      category: 'WESTERN_BLOT',
      version: '1.0.0',
      isPublic: true,
      isTemplate: true,
      materials: [
        { name: 'Acrylamide/Bis solution', quantity: '10', unit: '%', catalogNumber: 'N/A' },
        { name: 'SDS', quantity: '0.1', unit: '%', catalogNumber: 'N/A' },
        { name: 'Primary antibody', quantity: '1', unit: 'μg/mL', catalogNumber: 'Custom' },
        { name: 'Secondary antibody', quantity: '1', unit: 'μg/mL', catalogNumber: 'Goat anti-rabbit HRP' },
        { name: 'Blocking buffer', quantity: '5', unit: '%', catalogNumber: 'Non-fat dry milk' },
      ],
      steps: [
        { step: 1, action: 'Prepare SDS-PAGE gel', duration: '45 min' },
        { step: 2, action: 'Load samples and run gel', duration: '1.5 hours', notes: '100V' },
        { step: 3, action: 'Transfer to membrane', duration: '1 hour', notes: 'Wet transfer' },
        { step: 4, action: 'Block membrane', duration: '1 hour', notes: '5% milk' },
        { step: 5, action: 'Incubate with primary antibody', duration: '1 hour to overnight' },
        { step: 6, action: 'Wash membrane', duration: '3 × 5 min' },
        { step: 7, action: 'Incubate with secondary antibody', duration: '1 hour' },
        { step: 8, action: 'Wash membrane', duration: '3 × 5 min' },
        { step: 9, action: 'Detect signal', duration: '5 min', notes: 'Chemiluminescence' },
      ],
      conditions: {
        temperature: 'Room temperature',
        transferMethod: 'wet',
        detectionMethod: 'chemiluminescence',
      },
      safetyNotes: 'Acrylamide is neurotoxic. Wear gloves and work in fume hood.',
      references: 'Standard protein analysis protocols',
      createdById: researcherUser.id,
    },
  })

  console.log(`✅ Created protocols: ${pcrProtocol.name}, ${westernBlotProtocol.name}`)

  // Create an experiment
  const experiment = await prisma.experiment.create({
    data: {
      title: 'Gene X Expression Analysis',
      description: 'Analyzing expression levels of Gene X under different conditions',
      status: 'COMPLETED',
      protocolId: pcrProtocol.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-20'),
      notes: 'All samples showed good amplification. Need to repeat condition B.',
      variables: {
        conditions: ['Control', 'Treatment A', 'Treatment B'],
        replicates: 3,
        targetGene: 'Gene X',
        housekeepingGene: 'GAPDH',
      },
      results: [
        { condition: 'Control', expression: 1.0, sd: 0.1 },
        { condition: 'Treatment A', expression: 2.5, sd: 0.3 },
        { condition: 'Treatment B', expression: 3.2, sd: 0.4 },
      ],
      conclusion: 'Gene X is upregulated under both treatment conditions',
      success: true,
      createdById: researcherUser.id,
      labId: mainLab.id,
    },
  })

  console.log(`✅ Created experiment: ${experiment.title}`)

  // Create an analysis for the experiment
  await prisma.analysis.create({
    data: {
      experimentId: experiment.id,
      type: 'GEL_IMAGE',
      inputData: {
        imageUrl: 'https://example.com/gel-image.jpg',
        lanes: 12,
        markers: ['100bp', '200bp', '300bp'],
      },
      modelUsed: 'nova-multimodal-v1',
      observations: [
        {
          type: 'band_presence',
          description: 'Clear bands present in all sample lanes',
          confidence: 0.95,
          location: 'Lanes 1-9',
        },
        {
          type: 'band_intensity',
          description: 'Stronger bands in treatment conditions',
          confidence: 0.88,
          location: 'Lanes 4-9',
        },
      ],
      confidence: 0.92,
      recommendations: [
        {
          action: 'Repeat condition B with more replicates',
          priority: 'MEDIUM',
          rationale: 'High standard deviation in condition B results',
        },
        {
          action: 'Include positive control in next experiment',
          priority: 'LOW',
          rationale: 'To ensure PCR efficiency',
        },
      ],
      nextSteps: [
        {
          step: 'Quantify band intensities',
          description: 'Use image analysis software to quantify band intensities',
        },
        {
          step: 'Calculate fold change',
          description: 'Normalize to housekeeping gene and calculate fold change',
        },
      ],
      requestedById: researcherUser.id,
      completedAt: new Date(),
      processingTime: 1500,
    },
  })

  console.log('✅ Created analysis for experiment')

  // Create equipment
  await prisma.equipment.createMany({
    data: [
      {
        labId: mainLab.id,
        name: 'Thermocycler 1',
        type: 'THERMOCYCLER',
        model: 'Applied Biosystems 9700',
        serialNumber: 'TC-2024-001',
        status: 'OPERATIONAL',
        lastCalibration: new Date('2024-01-10'),
        nextCalibration: new Date('2024-07-10'),
        purchasedAt: new Date('2023-06-15'),
        notes: 'Primary PCR machine',
      },
      {
        labId: mainLab.id,
        name: 'Centrifuge 1',
        type: 'CENTRIFUGE',
        model: 'Eppendorf 5424R',
        serialNumber: 'CF-2024-002',
        status: 'OPERATIONAL',
        lastCalibration: new Date('2024-01-15'),
        nextCalibration: new Date('2024-07-15'),
        purchasedAt: new Date('2023-05-20'),
        notes: 'Refrigerated microcentrifuge',
      },
      {
        labId: mainLab.id,
        name: 'Microscope 1',
        type: 'MICROSCOPE',
        model: 'Nikon Eclipse Ti2',
        serialNumber: 'MS-2024-003',
        status: 'MAINTENANCE',
        lastCalibration: new Date('2023-12-01'),
        nextCalibration: new Date('2024-06-01'),
        purchasedAt: new Date('2022-11-30'),
        notes: 'Currently undergoing annual maintenance',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Created equipment records')

  // Create a subscription
  await prisma.subscription.create({
    data: {
      userId: researcherUser.id,
      plan: 'PRO',
      status: 'ACTIVE',
      maxExperiments: 100,
      maxStorageMB: 1024,
      maxAnalyses: 50,
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2024-12-31'),
    },
  })

  console.log('✅ Created subscription')

  console.log('🌱 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
// Test script for Experiment API endpoints
// Run with: node test-experiment-api.js

const BASE_URL = 'http://localhost:3000/api';

// Store tokens and IDs for testing
let authToken = '';
let userId = '';
let protocolId = '';
let experimentId = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`❌ ${method} ${endpoint} failed:`, result);
      return { success: false, error: result };
    }
    
    console.log(`✅ ${method} ${endpoint} succeeded`);
    return { success: true, data: result };
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test functions
async function testLogin() {
  console.log('\n📝 Testing User Login...');
  const result = await apiCall('POST', '/users/login', {
    email: 'researcher@lab.com',
    password: 'password123'
  });
  
  if (result.success && result.data.data.token) {
    authToken = result.data.data.token;
    userId = result.data.data.user.id;
    console.log('🔑 Auth token obtained');
    console.log('👤 User ID:', userId);
    return true;
  }
  return false;
}

async function testCreateProtocol() {
  console.log('\n📝 Testing Create Protocol...');
  const result = await apiCall('POST', '/protocols', {
    name: 'Test PCR Protocol for Experiments',
    description: 'A test protocol for experiment API testing',
    category: 'PCR',
    version: '1.0.0',
    isPublic: false,
    isTemplate: false,
    materials: [
      {
        name: 'DNA Template',
        quantity: '50',
        unit: 'ng',
        catalogNumber: 'DNA-001',
        supplier: 'Lab Supplies Inc'
      },
      {
        name: 'PCR Master Mix',
        quantity: '25',
        unit: 'μL',
        catalogNumber: 'PCR-MM-100',
        supplier: 'BioTech Corp'
      }
    ],
    steps: [
      {
        step: 1,
        action: 'Prepare master mix',
        duration: '10 minutes',
        notes: 'Mix all reagents on ice'
      },
      {
        step: 2,
        action: 'Add DNA template',
        duration: '5 minutes',
        notes: 'Pipette carefully to avoid contamination'
      },
      {
        step: 3,
        action: 'Run PCR cycles',
        duration: '2 hours',
        notes: 'Use thermocycler program PCR-01'
      }
    ],
    conditions: {
      temperature: '95°C initial, 58°C annealing, 72°C extension',
      time: '2 hours total',
      cycles: '35 cycles'
    },
    safetyNotes: 'Wear gloves and lab coat. Work in biosafety cabinet.',
    references: 'Standard PCR protocol v1.0'
  }, authToken);
  
  if (result.success && result.data.data.id) {
    protocolId = result.data.data.id;
    console.log('🧪 Protocol ID:', protocolId);
    return true;
  }
  return false;
}

async function testCreateExperiment() {
  console.log('\n📝 Testing Create Experiment...');
  const result = await apiCall('POST', '/experiments', {
    title: 'PCR Amplification - Test Sample A',
    description: 'Testing new primer set for gene amplification',
    protocolId: protocolId,
    variables: {
      sampleId: 'TEST-A-001',
      primerSet: 'PS-TEST-123',
      templateConcentration: '50ng/μL',
      annealingTemp: '58°C',
      extensionTime: '30s',
      cycles: 35,
      polymerase: 'Taq DNA Polymerase',
      bufferType: '10X PCR Buffer'
    }
  }, authToken);
  
  if (result.success && result.data.data.id) {
    experimentId = result.data.data.id;
    console.log('🔬 Experiment ID:', experimentId);
    console.log('📊 Status:', result.data.data.status);
    return true;
  }
  return false;
}

async function testGetExperiment() {
  console.log('\n📝 Testing Get Experiment...');
  const result = await apiCall('GET', `/experiments/${experimentId}`, null, authToken);
  
  if (result.success) {
    console.log('📋 Experiment Title:', result.data.data.title);
    console.log('📊 Status:', result.data.data.status);
    console.log('🧪 Protocol:', result.data.data.protocol?.name);
    return true;
  }
  return false;
}

async function testStartExperiment() {
  console.log('\n📝 Testing Start Experiment...');
  const result = await apiCall('POST', `/experiments/${experimentId}/start`, {}, authToken);
  
  if (result.success) {
    console.log('▶️  Experiment started');
    console.log('📊 Status:', result.data.data.status);
    console.log('🕐 Start Date:', result.data.data.startDate);
    return true;
  }
  return false;
}

async function testUpdateExperiment() {
  console.log('\n📝 Testing Update Experiment...');
  const result = await apiCall('PUT', `/experiments/${experimentId}`, {
    notes: 'Step 1 completed at 10:15 AM. Master mix prepared successfully.',
    results: [
      {
        step: 1,
        observation: 'Master mix appears homogeneous',
        timestamp: new Date().toISOString(),
        temperature: '4°C'
      }
    ]
  }, authToken);
  
  if (result.success) {
    console.log('📝 Notes updated');
    console.log('📊 Results recorded:', result.data.data.results?.length || 0);
    return true;
  }
  return false;
}

async function testListMyExperiments() {
  console.log('\n📝 Testing List My Experiments...');
  const result = await apiCall('GET', '/experiments/user/my-experiments?page=1&limit=10', null, authToken);
  
  if (result.success) {
    console.log('📋 Total experiments:', result.data.data.total);
    console.log('📄 Page:', result.data.data.page);
    console.log('🔢 Experiments on this page:', result.data.data.data.length);
    return true;
  }
  return false;
}

async function testListProtocolExperiments() {
  console.log('\n📝 Testing List Protocol Experiments...');
  const result = await apiCall('GET', `/experiments/protocol/${protocolId}?page=1&limit=10`, null, authToken);
  
  if (result.success) {
    console.log('📋 Experiments using this protocol:', result.data.data.total);
    return true;
  }
  return false;
}

async function testSearchExperiments() {
  console.log('\n📝 Testing Search Experiments...');
  const result = await apiCall('GET', '/experiments/search?q=PCR&page=1&limit=10', null, authToken);
  
  if (result.success) {
    console.log('🔍 Search results:', result.data.data.total);
    return true;
  }
  return false;
}

async function testCompleteExperiment() {
  console.log('\n📝 Testing Complete Experiment...');
  const result = await apiCall('POST', `/experiments/${experimentId}/complete`, {
    success: true,
    conclusion: 'PCR amplification successful. Clear bands visible at expected size (500bp). No primer dimers detected. Ready for sequencing.'
  }, authToken);
  
  if (result.success) {
    console.log('✅ Experiment completed');
    console.log('📊 Status:', result.data.data.status);
    console.log('🎯 Success:', result.data.data.success);
    console.log('🕐 End Date:', result.data.data.endDate);
    return true;
  }
  return false;
}

async function testGetExperimentWithAnalyses() {
  console.log('\n📝 Testing Get Experiment with Analyses...');
  const result = await apiCall('GET', `/experiments/${experimentId}/analyses`, null, authToken);
  
  if (result.success) {
    console.log('📋 Experiment:', result.data.data.title);
    console.log('🔬 Analyses:', result.data.data.analyses?.length || 0);
    return true;
  }
  return false;
}

async function testCreateFailedExperiment() {
  console.log('\n📝 Testing Create and Fail Experiment...');
  
  // Create another experiment
  const createResult = await apiCall('POST', '/experiments', {
    title: 'PCR Amplification - Test Sample B (Will Fail)',
    description: 'Testing contamination scenario',
    protocolId: protocolId,
    variables: {
      sampleId: 'TEST-B-002',
      primerSet: 'PS-TEST-456'
    }
  }, authToken);
  
  if (!createResult.success) return false;
  
  const failExperimentId = createResult.data.data.id;
  console.log('🔬 Created experiment:', failExperimentId);
  
  // Start it
  await apiCall('POST', `/experiments/${failExperimentId}/start`, {}, authToken);
  
  // Fail it
  const failResult = await apiCall('POST', `/experiments/${failExperimentId}/fail`, {
    reason: 'Contamination detected in step 2. No visible bands on gel. Possible primer degradation.'
  }, authToken);
  
  if (failResult.success) {
    console.log('❌ Experiment marked as failed');
    console.log('📊 Status:', failResult.data.data.status);
    console.log('💬 Reason:', failResult.data.data.conclusion);
    return true;
  }
  return false;
}

async function testCancelExperiment() {
  console.log('\n📝 Testing Cancel Experiment...');
  
  // Create another experiment
  const createResult = await apiCall('POST', '/experiments', {
    title: 'PCR Amplification - Test Sample C (Will Cancel)',
    description: 'Testing cancellation scenario',
    protocolId: protocolId,
    variables: {
      sampleId: 'TEST-C-003'
    }
  }, authToken);
  
  if (!createResult.success) return false;
  
  const cancelExperimentId = createResult.data.data.id;
  console.log('🔬 Created experiment:', cancelExperimentId);
  
  // Cancel it (can cancel from PLANNED status)
  const cancelResult = await apiCall('POST', `/experiments/${cancelExperimentId}/cancel`, {
    reason: 'Equipment malfunction. Thermocycler not heating properly. Will reschedule.'
  }, authToken);
  
  if (cancelResult.success) {
    console.log('🚫 Experiment cancelled');
    console.log('📊 Status:', cancelResult.data.data.status);
    console.log('💬 Reason:', cancelResult.data.data.conclusion);
    return true;
  }
  return false;
}

async function testDeleteExperiment() {
  console.log('\n📝 Testing Delete Experiment...');
  
  // Create a temporary experiment to delete
  const createResult = await apiCall('POST', '/experiments', {
    title: 'Temporary Experiment (Will Delete)',
    protocolId: protocolId,
    variables: { test: 'delete' }
  }, authToken);
  
  if (!createResult.success) return false;
  
  const deleteExperimentId = createResult.data.data.id;
  console.log('🔬 Created temporary experiment:', deleteExperimentId);
  
  // Delete it
  const deleteResult = await apiCall('DELETE', `/experiments/${deleteExperimentId}`, null, authToken);
  
  if (deleteResult.success) {
    console.log('🗑️  Experiment deleted');
    return true;
  }
  return false;
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Experiment API Tests...\n');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Create Protocol', fn: testCreateProtocol },
    { name: 'Create Experiment', fn: testCreateExperiment },
    { name: 'Get Experiment', fn: testGetExperiment },
    { name: 'Start Experiment', fn: testStartExperiment },
    { name: 'Update Experiment', fn: testUpdateExperiment },
    { name: 'List My Experiments', fn: testListMyExperiments },
    { name: 'List Protocol Experiments', fn: testListProtocolExperiments },
    { name: 'Search Experiments', fn: testSearchExperiments },
    { name: 'Complete Experiment', fn: testCompleteExperiment },
    { name: 'Get Experiment with Analyses', fn: testGetExperimentWithAnalyses },
    { name: 'Create and Fail Experiment', fn: testCreateFailedExperiment },
    { name: 'Cancel Experiment', fn: testCancelExperiment },
    { name: 'Delete Experiment', fn: testDeleteExperiment },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${tests.length}`);
  console.log(`🎯 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);

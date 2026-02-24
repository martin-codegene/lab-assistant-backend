// Test script for Analysis API endpoints
// Run with: node test-analysis-api.js

const BASE_URL = 'http://localhost:3000/api';

// Store tokens and IDs for testing
let authToken = '';
let userId = '';
let protocolId = '';
let experimentId = '';
let analysisId = '';

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
    password: 'password123$'
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
    name: 'Test PCR Protocol for Analysis',
    description: 'Protocol for testing analysis features',
    category: 'PCR',
    version: '1.0.0',
    materials: [
      { name: 'DNA Template', quantity: '50', unit: 'ng' }
    ],
    steps: [
      { step: 1, action: 'Prepare master mix', duration: '10 minutes' },
      { step: 2, action: 'Run PCR', duration: '2 hours' }
    ],
    conditions: {
      temperature: '95°C',
      cycles: '35'
    }
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
    title: 'PCR Experiment for Analysis Testing',
    description: 'Testing AI analysis features',
    protocolId: protocolId,
    variables: {
      sampleId: 'TEST-001',
      cycles: 35
    }
  }, authToken);
  
  if (result.success && result.data.data.id) {
    experimentId = result.data.data.id;
    console.log('🔬 Experiment ID:', experimentId);
    return true;
  }
  return false;
}

async function testStartExperiment() {
  console.log('\n📝 Testing Start Experiment...');
  const result = await apiCall('POST', `/experiments/${experimentId}/start`, {}, authToken);
  
  if (result.success) {
    console.log('▶️  Experiment started');
    return true;
  }
  return false;
}

async function testGelImageAnalysis() {
  console.log('\n📝 Testing Gel Image Analysis (AI)...');
  const result = await apiCall('POST', '/analyses/gel-image', {
    experimentId: experimentId,
    imageUrl: 'https://example.com/test-gel-image.jpg',
    metadata: {
      lanes: 4,
      marker: '1kb DNA ladder',
      expectedSize: '500bp'
    }
  }, authToken);
  
  if (result.success && result.data.data.id) {
    analysisId = result.data.data.id;
    console.log('🔬 Analysis ID:', analysisId);
    console.log('🤖 Model Used:', result.data.data.modelUsed);
    console.log('📊 Confidence:', (result.data.data.confidence * 100).toFixed(1) + '%');
    console.log('👁️  Observations:', result.data.data.observations.length);
    console.log('💡 Recommendations:', result.data.data.recommendations.length);
    console.log('⏱️  Processing Time:', result.data.data.processingTime + 'ms');
    return true;
  }
  return false;
}

async function testTroubleshootingAnalysis() {
  console.log('\n📝 Testing Troubleshooting Analysis (AI)...');
  const result = await apiCall('POST', '/analyses/troubleshoot', {
    experimentId: experimentId,
    problem: 'No bands visible on gel after PCR amplification',
    context: {
      protocol: 'Standard PCR',
      reagents: ['Taq polymerase', 'dNTPs', 'primers'],
      conditions: {
        annealingTemp: '58°C',
        cycles: 35
      }
    }
  }, authToken);
  
  if (result.success && result.data.data.id) {
    console.log('🔍 Troubleshooting Analysis ID:', result.data.data.id);
    console.log('📊 Confidence:', (result.data.data.confidence * 100).toFixed(1) + '%');
    console.log('🔴 Issues Identified:', result.data.data.observations.length);
    console.log('✅ Recommendations:', result.data.data.recommendations.length);
    
    // Display first recommendation
    if (result.data.data.recommendations.length > 0) {
      const rec = result.data.data.recommendations[0];
      console.log(`   → ${rec.action} (${rec.priority})`);
    }
    return true;
  }
  return false;
}

async function testProtocolOptimization() {
  console.log('\n📝 Testing Protocol Optimization (AI)...');
  const result = await apiCall('POST', '/analyses/optimize-protocol', {
    experimentId: experimentId,
    currentProtocol: {
      steps: [
        { step: 1, action: 'Prepare master mix', duration: '10 min' },
        { step: 2, action: 'Add template', duration: '5 min' },
        { step: 3, action: 'Run PCR', duration: '2 hours' }
      ],
      materials: [
        { name: 'Taq polymerase', quantity: '2.5', unit: 'U' }
      ],
      conditions: {
        annealingTemp: '58°C',
        extensionTime: '1 min',
        cycles: 35
      }
    },
    issues: ['Takes too long', 'High reagent cost']
  }, authToken);
  
  if (result.success && result.data.data.id) {
    console.log('⚡ Optimization Analysis ID:', result.data.data.id);
    console.log('📊 Confidence:', (result.data.data.confidence * 100).toFixed(1) + '%');
    console.log('💡 Optimization Suggestions:', result.data.data.recommendations.length);
    
    // Display optimizations
    result.data.data.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec.action} (${rec.priority})`);
    });
    return true;
  }
  return false;
}

async function testGetAnalysisById() {
  console.log('\n📝 Testing Get Analysis by ID...');
  const result = await apiCall('GET', `/analyses/${analysisId}`, null, authToken);
  
  if (result.success) {
    console.log('📋 Analysis Type:', result.data.data.type);
    console.log('🔬 Experiment ID:', result.data.data.experimentId);
    console.log('📊 Confidence:', (result.data.data.confidence * 100).toFixed(1) + '%');
    return true;
  }
  return false;
}

async function testListExperimentAnalyses() {
  console.log('\n📝 Testing List Experiment Analyses...');
  const result = await apiCall('GET', `/analyses/experiment/${experimentId}?page=1&limit=10`, null, authToken);
  
  if (result.success) {
    console.log('📋 Total analyses for experiment:', result.data.data.total);
    console.log('📄 Analyses on this page:', result.data.data.data.length);
    return true;
  }
  return false;
}

async function testListMyAnalyses() {
  console.log('\n📝 Testing List My Analyses...');
  const result = await apiCall('GET', '/analyses/user/my-analyses?page=1&limit=10', null, authToken);
  
  if (result.success) {
    console.log('📋 Total my analyses:', result.data.data.total);
    console.log('📄 Analyses on this page:', result.data.data.data.length);
    return true;
  }
  return false;
}

async function testListAnalysesByType() {
  console.log('\n📝 Testing List Analyses by Type...');
  const result = await apiCall('GET', '/analyses/type/GEL_IMAGE?page=1&limit=10', null, authToken);
  
  if (result.success) {
    console.log('📋 Total GEL_IMAGE analyses:', result.data.data.total);
    return true;
  }
  return false;
}

async function testListRecentAnalyses() {
  console.log('\n📝 Testing List Recent Analyses...');
  const result = await apiCall('GET', '/analyses/recent?page=1&limit=5', null, authToken);
  
  if (result.success) {
    console.log('📋 Recent analyses:', result.data.data.data.length);
    return true;
  }
  return false;
}

async function testAnalysisWithExperimentDetails() {
  console.log('\n📝 Testing Get Experiment with Analyses...');
  const result = await apiCall('GET', `/experiments/${experimentId}/analyses`, null, authToken);
  
  if (result.success) {
    console.log('🔬 Experiment:', result.data.data.title);
    console.log('📊 Analyses count:', result.data.data.analyses?.length || 0);
    
    if (result.data.data.analyses && result.data.data.analyses.length > 0) {
      console.log('\nAnalyses:');
      result.data.data.analyses.forEach((analysis, i) => {
        console.log(`  ${i + 1}. ${analysis.type} - Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      });
    }
    return true;
  }
  return false;
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Analysis API Tests...\n');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Create Protocol', fn: testCreateProtocol },
    { name: 'Create Experiment', fn: testCreateExperiment },
    { name: 'Start Experiment', fn: testStartExperiment },
    { name: 'Gel Image Analysis (AI)', fn: testGelImageAnalysis },
    { name: 'Troubleshooting Analysis (AI)', fn: testTroubleshootingAnalysis },
    { name: 'Protocol Optimization (AI)', fn: testProtocolOptimization },
    { name: 'Get Analysis by ID', fn: testGetAnalysisById },
    { name: 'List Experiment Analyses', fn: testListExperimentAnalyses },
    { name: 'List My Analyses', fn: testListMyAnalyses },
    { name: 'List Analyses by Type', fn: testListAnalysesByType },
    { name: 'List Recent Analyses', fn: testListRecentAnalyses },
    { name: 'Get Experiment with Analyses', fn: testAnalysisWithExperimentDetails },
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
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${tests.length}`);
  console.log(`🎯 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! AI Analysis system is working perfectly!');
    console.log('\n💡 Note: Currently using mock AI responses.');
    console.log('   To use real Amazon Nova, add AMAZON_NOVA_API_KEY to .env');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);

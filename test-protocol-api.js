// Test script for Protocol API endpoints
const BASE_URL = 'http://localhost:3000/api';

let authToken = '';
let userId = '';
let protocolId = '';

// Helper function to make requests
async function request(method, path, body = null, useAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  
  console.log(`\n${method} ${path}`);
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  
  return { response, data };
}

async function runTests() {
  console.log('=== Protocol API Tests ===\n');

  try {
    // 1. Register a test user
    console.log('\n--- 1. Register Test User ---');
    const registerResult = await request('POST', '/users', {
      email: `test-protocol-${Date.now()}@lab.com`,
      password: 'testpassword123',
      name: 'Protocol Test User',
      role: 'RESEARCHER'
    });

    if (registerResult.data.success) {
      authToken = registerResult.data.data.token;
      userId = registerResult.data.data.user.id;
      console.log('✓ User registered successfully');
    } else {
      console.error('✗ Failed to register user');
      return;
    }

    // 2. Create a protocol
    console.log('\n--- 2. Create Protocol ---');
    const createResult = await request('POST', '/protocols', {
      name: 'Test PCR Protocol',
      description: 'A test PCR protocol for API testing',
      category: 'PCR',
      version: '1.0.0',
      isPublic: true,
      isTemplate: false,
      materials: [
        {
          name: 'Template DNA',
          quantity: '100',
          unit: 'ng',
          catalogNumber: 'DNA-001'
        },
        {
          name: 'Taq Polymerase',
          quantity: '1',
          unit: 'U',
          catalogNumber: 'TAQ-001'
        }
      ],
      steps: [
        {
          step: 1,
          action: 'Prepare master mix',
          duration: '10 min',
          notes: 'Keep on ice'
        },
        {
          step: 2,
          action: 'Add template DNA',
          duration: '5 min'
        },
        {
          step: 3,
          action: 'Run PCR',
          duration: '2 hours',
          notes: '95°C initial denaturation'
        }
      ],
      conditions: {
        temperature: '95°C',
        time: '2 hours',
        cycles: '35'
      },
      safetyNotes: 'Wear appropriate PPE',
      references: 'Standard PCR protocols'
    }, true);

    if (createResult.data.success) {
      protocolId = createResult.data.data.id;
      console.log('✓ Protocol created successfully');
    } else {
      console.error('✗ Failed to create protocol');
      return;
    }

    // 3. Get protocol by ID
    console.log('\n--- 3. Get Protocol by ID ---');
    await request('GET', `/protocols/${protocolId}`);

    // 4. List user's protocols
    console.log('\n--- 4. List User Protocols ---');
    await request('GET', '/protocols/user/my-protocols?page=1&limit=10', null, true);

    // 5. List public protocols
    console.log('\n--- 5. List Public Protocols ---');
    await request('GET', '/protocols/public?page=1&limit=10');

    // 6. List templates
    console.log('\n--- 6. List Protocol Templates ---');
    await request('GET', '/protocols/templates?page=1&limit=10');

    // 7. Search protocols
    console.log('\n--- 7. Search Protocols ---');
    await request('GET', '/protocols/search?q=PCR&page=1&limit=10', null, true);

    // 8. Update protocol
    console.log('\n--- 8. Update Protocol ---');
    await request('PUT', `/protocols/${protocolId}`, {
      name: 'Updated Test PCR Protocol',
      description: 'Updated description for testing'
    }, true);

    // 9. Record protocol usage
    console.log('\n--- 9. Record Protocol Usage ---');
    await request('POST', `/protocols/${protocolId}/use`, null, true);

    // 10. Duplicate protocol
    console.log('\n--- 10. Duplicate Protocol ---');
    const duplicateResult = await request('POST', `/protocols/${protocolId}/duplicate`, null, true);
    const duplicateId = duplicateResult.data.success ? duplicateResult.data.data.id : null;

    // 11. List protocols by category
    console.log('\n--- 11. List Protocols by Category (PCR) ---');
    await request('GET', '/protocols/category/PCR?page=1&limit=10');

    // 12. Delete duplicated protocol
    if (duplicateId) {
      console.log('\n--- 12. Delete Duplicated Protocol ---');
      await request('DELETE', `/protocols/${duplicateId}`, null, true);
    }

    // 13. Delete original protocol
    console.log('\n--- 13. Delete Original Protocol ---');
    await request('DELETE', `/protocols/${protocolId}`, null, true);

    console.log('\n=== All Tests Completed ===\n');

  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
  }
}

// Run tests
runTests();

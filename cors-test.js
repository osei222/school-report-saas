// CORS and Teacher Creation Test Script
// Run this in your browser console on https://elitetechreport.netlify.app

console.log('🧪 Starting CORS and Teacher Creation Test...');

const API_BASE_URL = 'https://school-report-saas.onrender.com/api';

// Test 1: Basic CORS Test
async function testBasicCORS() {
    console.log('\n1️⃣ Testing Basic CORS...');
    try {
        const response = await fetch(`${API_BASE_URL}/cors-test/`, {
            method: 'GET',
        });
        const data = await response.json();
        console.log('✅ Basic CORS Test:', data);
        return true;
    } catch (error) {
        console.error('❌ Basic CORS Test Failed:', error);
        return false;
    }
}

// Test 2: Teacher CORS Test
async function testTeacherCORS() {
    console.log('\n2️⃣ Testing Teacher CORS...');
    try {
        const response = await fetch(`${API_BASE_URL}/teachers/cors-test/`, {
            method: 'GET',
        });
        const data = await response.json();
        console.log('✅ Teacher CORS Test:', data);
        return true;
    } catch (error) {
        console.error('❌ Teacher CORS Test Failed:', error);
        return false;
    }
}

// Test 3: Teacher CORS POST Test
async function testTeacherCORSPost() {
    console.log('\n3️⃣ Testing Teacher CORS POST...');
    try {
        const testData = {
            test: 'data',
            email: 'test@example.com'
        };
        
        const response = await fetch(`${API_BASE_URL}/teachers/cors-test/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        const data = await response.json();
        console.log('✅ Teacher CORS POST Test:', data);
        return true;
    } catch (error) {
        console.error('❌ Teacher CORS POST Test Failed:', error);
        return false;
    }
}

// Test 4: Authentication Test
async function testAuthentication() {
    console.log('\n4️⃣ Testing Authentication...');
    try {
        // Try to login with test credentials
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@testschool.com',
                password: 'admin123'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const token = loginData.access_token || loginData.access || loginData.token;
            console.log('✅ Authentication successful, token received:', !!token);
            return token;
        } else {
            const errorData = await loginResponse.text();
            console.log('⚠️ Authentication failed (expected if admin user doesn\'t exist):', errorData);
            return null;
        }
    } catch (error) {
        console.error('❌ Authentication test failed:', error);
        return null;
    }
}

// Test 5: Teacher Creation Test (with auth)
async function testTeacherCreation(token) {
    if (!token) {
        console.log('\n5️⃣ Skipping Teacher Creation Test (no auth token)');
        return false;
    }
    
    console.log('\n5️⃣ Testing Teacher Creation...');
    try {
        const teacherData = {
            email: 'test.teacher@example.com',
            password: 'testpass123',
            first_name: 'Test',
            last_name: 'Teacher',
            phone_number: '+1234567890',
            address: 'Test Address',
            role: 'teacher'
        };
        
        const response = await fetch(`${API_BASE_URL}/teachers/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(teacherData)
        });
        
        const responseText = await response.text();
        console.log('Teacher Creation Response Status:', response.status);
        console.log('Teacher Creation Response:', responseText);
        
        if (response.ok) {
            console.log('✅ Teacher creation successful');
            return true;
        } else {
            console.log('⚠️ Teacher creation failed (may be due to permissions)');
            return false;
        }
    } catch (error) {
        console.error('❌ Teacher Creation Test Failed:', error);
        return false;
    }
}

// Test 6: OPTIONS Preflight Test
async function testPreflightRequest() {
    console.log('\n6️⃣ Testing OPTIONS Preflight...');
    try {
        const response = await fetch(`${API_BASE_URL}/teachers/`, {
            method: 'OPTIONS',
            headers: {
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, Authorization',
                'Origin': window.location.origin
            }
        });
        
        console.log('OPTIONS Response Status:', response.status);
        console.log('OPTIONS Response Headers:');
        for (let [key, value] of response.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        return response.ok;
    } catch (error) {
        console.error('❌ OPTIONS Preflight Test Failed:', error);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running Complete CORS and Teacher Creation Test Suite...');
    
    const results = {
        basicCORS: await testBasicCORS(),
        teacherCORS: await testTeacherCORS(),
        teacherCORSPost: await testTeacherCORSPost(),
        optionsPreflight: await testPreflightRequest(),
        authentication: await testAuthentication(),
    };
    
    results.teacherCreation = await testTeacherCreation(results.authentication);
    
    console.log('\n📊 Test Results Summary:');
    console.log('═══════════════════════════');
    Object.entries(results).forEach(([test, result]) => {
        const icon = result ? '✅' : '❌';
        console.log(`${icon} ${test}: ${result || 'Failed'}`);
    });
    
    const passedTests = Object.values(results).filter(result => result).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (results.basicCORS && results.teacherCORS && results.optionsPreflight) {
        console.log('🎉 CORS is working correctly!');
    } else {
        console.log('⚠️ CORS issues detected. Check the failed tests above.');
    }
    
    return results;
}

// Auto-run the tests
runAllTests().catch(error => {
    console.error('❌ Test suite failed to run:', error);
});

// Export functions for manual testing
window.corsTest = {
    runAll: runAllTests,
    basicCORS: testBasicCORS,
    teacherCORS: testTeacherCORS,
    teacherCORSPost: testTeacherCORSPost,
    preflight: testPreflightRequest,
    auth: testAuthentication,
    createTeacher: testTeacherCreation
};

console.log('\n💡 You can also run individual tests manually:');
console.log('• corsTest.basicCORS()');
console.log('• corsTest.teacherCORS()');
console.log('• corsTest.preflight()');
console.log('• corsTest.runAll()');
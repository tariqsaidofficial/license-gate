// Debug router structure
const fs = require('fs');

console.log('🔍 Debugging Router Structure');
console.log('='.repeat(50));

// Read the admin-fixed.ts file
const adminRouterContent = fs.readFileSync('./src/routers/admin-fixed.ts', 'utf8');

console.log('📄 Admin Router Content Analysis:');
console.log('');

// Check for setCustomPassword
if (adminRouterContent.includes('setCustomPassword')) {
  console.log('✅ setCustomPassword found in file');
  
  // Find the procedure definition
  const lines = adminRouterContent.split('\n');
  let inSetCustomPassword = false;
  let procedureLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('setCustomPassword:')) {
      inSetCustomPassword = true;
      console.log(`✅ Found setCustomPassword at line ${i + 1}`);
    }
    
    if (inSetCustomPassword) {
      procedureLines.push(`${i + 1}: ${line}`);
      
      if (line.includes('})') && procedureLines.length > 5) {
        break;
      }
    }
  }
  
  console.log('');
  console.log('📋 Procedure Definition:');
  procedureLines.slice(0, 10).forEach(line => console.log(line));
  
} else {
  console.log('❌ setCustomPassword NOT found in file');
}

console.log('');
console.log('🔍 Checking router export...');

if (adminRouterContent.includes('export const adminRouter')) {
  console.log('✅ adminRouter export found');
} else {
  console.log('❌ adminRouter export NOT found');
}

console.log('');
console.log('🔍 Checking procedure structure...');

const procedureCount = (adminRouterContent.match(/protectedProcedure/g) || []).length;
console.log(`📊 Found ${procedureCount} protectedProcedure definitions`);

const mutationCount = (adminRouterContent.match(/\.mutation\(/g) || []).length;
console.log(`📊 Found ${mutationCount} mutation definitions`);

const queryCount = (adminRouterContent.match(/\.query\(/g) || []).length;
console.log(`📊 Found ${queryCount} query definitions`);
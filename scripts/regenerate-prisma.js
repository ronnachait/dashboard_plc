/**
 * Regenerate Prisma Client
 * หยุด server ก่อนแล้วรันสคริปต์นี้
 */

const { execSync } = require('child_process');

console.log('🔄 Regenerating Prisma Client...');

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully!');
  console.log('\n💡 ตอนนี้สามารถเริ่ม dev server ได้แล้ว: npm run dev');
} catch (error) {
  console.error('❌ Error generating Prisma Client:', error.message);
  process.exit(1);
}




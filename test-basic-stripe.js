// Basic Stripe connection test
require('dotenv').config();

console.log('🔍 Testing Basic Stripe Connection...\n');

try {
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  console.log('🔗 Testing Stripe API Connection...');
  
  // Test API connection by retrieving account info
  stripe.accounts.retrieve().then(account => {
    console.log(`✅ Stripe connection successful!`);
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Payouts enabled: ${account.payouts_enabled}`);
    console.log(`   Mode: ${account.livemode ? 'Live' : 'Test'}`);
    
    console.log('\n🎉 Basic Stripe setup is working!');
    console.log('\n📝 Next steps:');
    console.log('1. Create products in Stripe Dashboard to get Price IDs');
    console.log('2. Set up webhook endpoint');
    console.log('3. Add the missing environment variables');
    
  }).catch(error => {
    console.log(`❌ Stripe connection failed: ${error.message}`);
    if (error.message.includes('Invalid API Key')) {
      console.log('Please check your STRIPE_SECRET_KEY is correct.');
    }
  });
  
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

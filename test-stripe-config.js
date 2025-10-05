// Test script to verify Stripe configuration
require('dotenv').config();

console.log('🔍 Testing Stripe Configuration...\n');

// Check required environment variables
const requiredVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_BASIC_PRICE_ID',
  'STRIPE_PRO_PRICE_ID',
  'STRIPE_ENTERPRISE_PRICE_ID'
];

let allVarsPresent = true;

console.log('📋 Environment Variables Check:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allVarsPresent = false;
  }
});

if (!allVarsPresent) {
  console.log('\n❌ Some required environment variables are missing!');
  console.log('Please check your .env file and ensure all Stripe variables are set.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are present!');

// Test Stripe connection
try {
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  console.log('\n🔗 Testing Stripe Connection...');
  
  // Test API connection by retrieving account info
  stripe.accounts.retrieve().then(account => {
    console.log(`✅ Stripe connection successful!`);
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Payouts enabled: ${account.payouts_enabled}`);
    
    // Test price retrieval
    console.log('\n💰 Testing Price IDs...');
    
    const priceIds = [
      { name: 'Basic', id: process.env.STRIPE_BASIC_PRICE_ID },
      { name: 'Pro', id: process.env.STRIPE_PRO_PRICE_ID },
      { name: 'Enterprise', id: process.env.STRIPE_ENTERPRISE_PRICE_ID }
    ];
    
    Promise.all(priceIds.map(async ({ name, id }) => {
      try {
        const price = await stripe.prices.retrieve(id);
        console.log(`✅ ${name} Price: ${price.unit_amount/100} ${price.currency.toUpperCase()}/${price.recurring?.interval}`);
      } catch (error) {
        console.log(`❌ ${name} Price: ${error.message}`);
      }
    })).then(() => {
      console.log('\n🎉 Stripe configuration test completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Make sure your webhook endpoint is configured in Stripe Dashboard');
      console.log('2. Test the subscription flow in your application');
      console.log('3. Use Stripe CLI for local webhook testing: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
    });
    
  }).catch(error => {
    console.log(`❌ Stripe connection failed: ${error.message}`);
    console.log('Please check your STRIPE_SECRET_KEY is correct.');
  });
  
} catch (error) {
  console.log(`❌ Error initializing Stripe: ${error.message}`);
  console.log('Make sure you have installed the stripe package: npm install stripe');
}

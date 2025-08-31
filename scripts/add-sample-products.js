/**
 * Add Sample Products
 * Adds products directly to Firestore
 */

console.log('📦 TO ADD SAMPLE PRODUCTS:\n');

console.log('Option 1: Via Firebase Console (Easiest)');
console.log('1. Go to: https://console.firebase.google.com/project/souk-el-syarat/firestore/data');
console.log('2. Click "Start collection"');
console.log('3. Collection ID: "products"');
console.log('4. Add these fields:');
console.log(`
{
  title: "Toyota Camry 2023",
  description: "Excellent condition, low mileage",
  price: 850000,
  category: "sedan",
  brand: "Toyota",
  model: "Camry",
  year: 2023,
  image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800",
  isActive: true,
  vendorId: "vendor1",
  createdAt: [Click timestamp]
}
`);

console.log('\nOption 2: Quick Test Product');
console.log('Copy and paste this in Firestore Console:');

const sampleProduct = {
  title: "Mercedes C200 2023",
  description: "Premium sedan, fully loaded, like new condition",
  price: 1500000,
  category: "sedan",
  brand: "Mercedes-Benz",
  model: "C200",
  year: 2023,
  mileage: 5000,
  condition: "excellent",
  features: ["Leather Seats", "Sunroof", "Navigation", "Premium Sound"],
  images: [
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800"
  ],
  location: "Cairo",
  isActive: true,
  isFeatured: true,
  vendorId: "system",
  vendorName: "Souk El-Syarat",
  views: 0,
  likes: 0
};

console.log(JSON.stringify(sampleProduct, null, 2));

console.log('\n✅ After adding products, refresh your website to see them!');
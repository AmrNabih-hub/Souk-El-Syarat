"use strict";
/**
 * Database Seeder - Adds Real Test Data
 * Run this to populate your database with realistic data
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedData = void 0;
exports.seedDatabase = seedDatabase;
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();
async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    try {
        // 1. Create Test Users
        console.log('Creating users...');
        const users = [
            {
                email: 'admin@soukelsyarat.com',
                password: 'Admin@123456',
                displayName: 'System Admin',
                role: 'admin',
                firstName: 'System',
                lastName: 'Admin'
            },
            {
                email: 'vendor1@test.com',
                password: 'Vendor@123456',
                displayName: 'Cairo Motors',
                role: 'vendor',
                firstName: 'Ahmed',
                lastName: 'Hassan'
            },
            {
                email: 'customer1@test.com',
                password: 'Customer@123456',
                displayName: 'John Doe',
                role: 'customer',
                firstName: 'John',
                lastName: 'Doe'
            }
        ];
        for (const userData of users) {
            try {
                const userRecord = await auth.createUser({
                    email: userData.email,
                    password: userData.password,
                    displayName: userData.displayName,
                    emailVerified: true
                });
                await db.collection('users').doc(userRecord.uid).set({
                    email: userData.email,
                    displayName: userData.displayName,
                    role: userData.role,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    isActive: true,
                    emailVerified: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    preferences: {
                        language: 'ar',
                        currency: 'EGP',
                        notifications: {
                            email: true,
                            sms: false,
                            push: true
                        }
                    }
                });
                // Add to realtime database
                await realtimeDb.ref(`users/${userRecord.uid}`).set({
                    displayName: userData.displayName,
                    email: userData.email,
                    role: userData.role,
                    status: 'online',
                    lastSeen: admin.database.ServerValue.TIMESTAMP
                });
                console.log(`✅ Created user: ${userData.email}`);
            }
            catch (error) {
                if (error.code === 'auth/email-already-exists') {
                    console.log(`⚠️ User ${userData.email} already exists`);
                }
                else {
                    console.error(`❌ Error creating ${userData.email}:`, error.message);
                }
            }
        }
        // 2. Create Categories
        console.log('Creating categories...');
        const categories = [
            { id: 'sedan', name: 'Sedan', nameAr: 'سيدان', icon: '🚗', order: 1 },
            { id: 'suv', name: 'SUV', nameAr: 'دفع رباعي', icon: '🚙', order: 2 },
            { id: 'hatchback', name: 'Hatchback', nameAr: 'هاتشباك', icon: '🚗', order: 3 },
            { id: 'coupe', name: 'Coupe', nameAr: 'كوبيه', icon: '🏎️', order: 4 },
            { id: 'truck', name: 'Truck', nameAr: 'شاحنة', icon: '🚚', order: 5 },
            { id: 'van', name: 'Van', nameAr: 'فان', icon: '🚐', order: 6 },
            { id: 'motorcycle', name: 'Motorcycle', nameAr: 'دراجة نارية', icon: '🏍️', order: 7 },
            { id: 'electric', name: 'Electric', nameAr: 'كهربائية', icon: '⚡', order: 8 }
        ];
        for (const category of categories) {
            await db.collection('categories').doc(category.id).set(category);
        }
        console.log(`✅ Created ${categories.length} categories`);
        // 3. Create Brands
        console.log('Creating brands...');
        const brands = [
            { name: 'Toyota', country: 'Japan', popular: true },
            { name: 'Honda', country: 'Japan', popular: true },
            { name: 'Nissan', country: 'Japan', popular: true },
            { name: 'BMW', country: 'Germany', popular: true },
            { name: 'Mercedes-Benz', country: 'Germany', popular: true },
            { name: 'Audi', country: 'Germany', popular: true },
            { name: 'Volkswagen', country: 'Germany', popular: true },
            { name: 'Ford', country: 'USA', popular: true },
            { name: 'Chevrolet', country: 'USA', popular: true },
            { name: 'Hyundai', country: 'South Korea', popular: true },
            { name: 'Kia', country: 'South Korea', popular: true },
            { name: 'Mazda', country: 'Japan', popular: false },
            { name: 'Mitsubishi', country: 'Japan', popular: false },
            { name: 'Peugeot', country: 'France', popular: false },
            { name: 'Renault', country: 'France', popular: false },
            { name: 'Fiat', country: 'Italy', popular: false },
            { name: 'Tesla', country: 'USA', popular: true },
            { name: 'Volvo', country: 'Sweden', popular: false },
            { name: 'Porsche', country: 'Germany', popular: true },
            { name: 'Lexus', country: 'Japan', popular: true }
        ];
        for (const brand of brands) {
            await db.collection('brands').add(Object.assign(Object.assign({}, brand), { isActive: true, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        }
        console.log(`✅ Created ${brands.length} brands`);
        // 4. Create Realistic Products
        console.log('Creating products...');
        const products = [
            // Sedans
            {
                title: 'Toyota Camry 2023 - Like New',
                titleAr: 'تويوتا كامري 2023 - كالجديدة',
                description: 'Excellent condition, single owner, full service history, warranty valid',
                descriptionAr: 'حالة ممتازة، مالك واحد، سجل خدمة كامل، الضمان ساري',
                price: 950000,
                originalPrice: 1100000,
                discount: 13,
                category: 'sedan',
                brand: 'Toyota',
                model: 'Camry',
                year: 2023,
                mileage: 15000,
                condition: 'excellent',
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Pearl White',
                engineSize: '2.5L',
                features: ['Leather Seats', 'Sunroof', 'Navigation', 'Backup Camera', 'Cruise Control', 'Bluetooth', 'USB Ports', 'Keyless Entry'],
                images: [
                    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
                    'https://images.unsplash.com/photo-1619976215249-0b68cef412e6?w=800',
                    'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800'
                ],
                location: 'Cairo, Nasr City',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: true,
                views: 245,
                likes: 18,
                stock: 1
            },
            {
                title: 'Honda Civic 2023 Sport',
                titleAr: 'هوندا سيفيك 2023 سبورت',
                description: 'Sport edition with turbo engine, low mileage, perfect for young professionals',
                descriptionAr: 'إصدار رياضي بمحرك توربو، عدد كيلومترات قليل، مثالي للمحترفين الشباب',
                price: 750000,
                originalPrice: 850000,
                discount: 12,
                category: 'sedan',
                brand: 'Honda',
                model: 'Civic',
                year: 2023,
                mileage: 8000,
                condition: 'excellent',
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Sonic Gray',
                engineSize: '1.5L Turbo',
                features: ['Sport Mode', 'Apple CarPlay', 'Android Auto', 'Lane Assist', 'Adaptive Cruise', 'Wireless Charging', 'Premium Audio'],
                images: [
                    'https://images.unsplash.com/photo-1606611013016-969c19ba1be3?w=800',
                    'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800'
                ],
                location: 'Cairo, Heliopolis',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: true,
                views: 189,
                likes: 22,
                stock: 2
            },
            {
                title: 'Mercedes-Benz C200 2022',
                titleAr: 'مرسيدس بنز C200 2022',
                description: 'Luxury sedan with AMG package, full options, pristine condition',
                descriptionAr: 'سيدان فاخرة مع باقة AMG، كامل المواصفات، حالة ممتازة',
                price: 1850000,
                originalPrice: 2200000,
                discount: 16,
                category: 'sedan',
                brand: 'Mercedes-Benz',
                model: 'C200',
                year: 2022,
                mileage: 25000,
                condition: 'excellent',
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Obsidian Black',
                engineSize: '2.0L Turbo',
                features: ['AMG Package', 'Burmester Audio', 'Ambient Lighting', 'Digital Cockpit', 'Panoramic Roof', 'Ventilated Seats', 'Night Vision', 'Park Assist'],
                images: [
                    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
                    'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800'
                ],
                location: 'Cairo, New Cairo',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: true,
                views: 412,
                likes: 45,
                stock: 1
            },
            // SUVs
            {
                title: 'BMW X5 2023 M Sport',
                titleAr: 'بي إم دبليو X5 2023 إم سبورت',
                description: 'Premium SUV with M Sport package, 7 seats, perfect family car',
                descriptionAr: 'SUV فاخرة مع باقة M Sport، 7 مقاعد، سيارة عائلية مثالية',
                price: 2950000,
                originalPrice: 3400000,
                discount: 13,
                category: 'suv',
                brand: 'BMW',
                model: 'X5',
                year: 2023,
                mileage: 12000,
                condition: 'excellent',
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Alpine White',
                engineSize: '3.0L Twin Turbo',
                features: ['M Sport Package', '7 Seats', 'Panoramic Roof', 'Harman Kardon', 'Head-up Display', 'Gesture Control', 'Air Suspension', 'Night Vision'],
                images: [
                    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
                    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800'
                ],
                location: 'Cairo, Zamalek',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: true,
                views: 567,
                likes: 89,
                stock: 1
            },
            {
                title: 'Toyota Land Cruiser 2022',
                titleAr: 'تويوتا لاند كروزر 2022',
                description: 'The ultimate off-road vehicle, V8 engine, ready for any adventure',
                descriptionAr: 'أفضل سيارة للطرق الوعرة، محرك V8، جاهزة لأي مغامرة',
                price: 3200000,
                originalPrice: 3600000,
                discount: 11,
                category: 'suv',
                brand: 'Toyota',
                model: 'Land Cruiser',
                year: 2022,
                mileage: 35000,
                condition: 'very-good',
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Desert Sand',
                engineSize: '5.7L V8',
                features: ['4WD', 'Crawl Control', 'Multi-Terrain Monitor', 'Cooled Box', 'Premium Leather', '14 Speakers', 'Rear Entertainment'],
                images: [
                    'https://images.unsplash.com/photo-1519641766711-708ef5a01e5d?w=800',
                    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'
                ],
                location: 'Cairo, Maadi',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: false,
                views: 234,
                likes: 34,
                stock: 1
            },
            // Electric
            {
                title: 'Tesla Model 3 2023',
                titleAr: 'تسلا موديل 3 2023',
                description: 'Full self-driving capability, long range battery, zero emissions',
                descriptionAr: 'قدرة قيادة ذاتية كاملة، بطارية طويلة المدى، صفر انبعاثات',
                price: 1950000,
                originalPrice: 2300000,
                discount: 15,
                category: 'electric',
                brand: 'Tesla',
                model: 'Model 3',
                year: 2023,
                mileage: 5000,
                condition: 'excellent',
                fuelType: 'electric',
                transmission: 'automatic',
                color: 'Pearl White',
                engineSize: 'Dual Motor',
                features: ['Autopilot', 'Full Self-Driving', 'Premium Interior', 'Glass Roof', 'Wireless Charging', 'Netflix', 'Sentry Mode', 'Supercharging'],
                images: [
                    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
                    'https://images.unsplash.com/photo-1571987937324-70e9e0ea7f48?w=800'
                ],
                location: 'Cairo, 6th October',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: true,
                views: 892,
                likes: 156,
                stock: 1
            },
            // Hatchback
            {
                title: 'Volkswagen Golf GTI 2023',
                titleAr: 'فولكس فاجن جولف GTI 2023',
                description: 'Hot hatch icon, perfect balance of performance and practicality',
                descriptionAr: 'أيقونة الهاتشباك الرياضية، توازن مثالي بين الأداء والعملية',
                price: 850000,
                originalPrice: 950000,
                discount: 11,
                category: 'hatchback',
                brand: 'Volkswagen',
                model: 'Golf GTI',
                year: 2023,
                mileage: 10000,
                condition: 'excellent',
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Tornado Red',
                engineSize: '2.0L Turbo',
                features: ['Sport Seats', 'Digital Cockpit', 'Ambient Lighting', 'Performance Monitor', 'Launch Control', 'Dynamic Chassis'],
                images: [
                    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800'
                ],
                location: 'Cairo, Sheikh Zayed',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: false,
                views: 145,
                likes: 28,
                stock: 1
            },
            // Budget Options
            {
                title: 'Nissan Sunny 2022',
                titleAr: 'نيسان صني 2022',
                description: 'Economical and reliable, perfect first car or daily commuter',
                descriptionAr: 'اقتصادية وموثوقة، مثالية كسيارة أولى أو للتنقل اليومي',
                price: 380000,
                originalPrice: 420000,
                discount: 10,
                category: 'sedan',
                brand: 'Nissan',
                model: 'Sunny',
                year: 2022,
                mileage: 45000,
                condition: 'good',
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Silver',
                engineSize: '1.5L',
                features: ['Air Conditioning', 'Power Windows', 'Central Lock', 'ABS', 'Airbags', 'Radio/USB'],
                images: [
                    'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800'
                ],
                location: 'Cairo, Shobra',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: false,
                views: 89,
                likes: 12,
                stock: 3
            },
            // Luxury Coupe
            {
                title: 'Porsche 911 Carrera 2023',
                titleAr: 'بورش 911 كاريرا 2023',
                description: 'Iconic sports car, timeless design, exhilarating performance',
                descriptionAr: 'سيارة رياضية أيقونية، تصميم خالد، أداء مثير',
                price: 4500000,
                originalPrice: 5200000,
                discount: 13,
                category: 'coupe',
                brand: 'Porsche',
                model: '911 Carrera',
                year: 2023,
                mileage: 3000,
                condition: 'excellent',
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Guards Red',
                engineSize: '3.0L Twin Turbo',
                features: ['Sport Chrono', 'PASM', 'Bose Audio', 'Sport Exhaust', 'Rear Axle Steering', 'Carbon Interior', 'Track Precision App'],
                images: [
                    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800',
                    'https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=800'
                ],
                location: 'Cairo, Garden City',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: true,
                views: 1234,
                likes: 234,
                stock: 1
            },
            // Family Van
            {
                title: 'Toyota Hiace 2022',
                titleAr: 'تويوتا هايس 2022',
                description: '15 passenger van, ideal for large families or commercial use',
                descriptionAr: 'فان 15 راكب، مثالي للعائلات الكبيرة أو الاستخدام التجاري',
                price: 680000,
                originalPrice: 750000,
                discount: 9,
                category: 'van',
                brand: 'Toyota',
                model: 'Hiace',
                year: 2022,
                mileage: 60000,
                condition: 'good',
                fuelType: 'diesel',
                transmission: 'manual',
                color: 'White',
                engineSize: '2.8L Diesel',
                features: ['15 Seats', 'Air Conditioning', 'Power Steering', 'Dual Sliding Doors', 'High Roof'],
                images: [
                    'https://images.unsplash.com/photo-1570733117311-d990c3816c47?w=800'
                ],
                location: 'Cairo, Downtown',
                vendorId: 'vendor1',
                vendorName: 'Cairo Motors',
                vendorPhone: '+201234567890',
                isActive: true,
                isFeatured: false,
                views: 67,
                likes: 8,
                stock: 2
            }
        ];
        const batch = db.batch();
        let productCount = 0;
        for (const product of products) {
            const productRef = db.collection('products').doc();
            batch.set(productRef, Object.assign(Object.assign({}, product), { id: productRef.id, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
            productCount++;
        }
        await batch.commit();
        console.log(`✅ Created ${productCount} products`);
        // 5. Update Real-time Database Stats
        console.log('Updating real-time stats...');
        await realtimeDb.ref('stats').set({
            users: {
                total: 3,
                online: 0,
                byRole: {
                    admin: 1,
                    vendor: 1,
                    customer: 1
                }
            },
            products: {
                total: products.length,
                active: products.length,
                featured: products.filter(p => p.isFeatured).length,
                byCategory: {
                    sedan: products.filter(p => p.category === 'sedan').length,
                    suv: products.filter(p => p.category === 'suv').length,
                    electric: products.filter(p => p.category === 'electric').length,
                    hatchback: products.filter(p => p.category === 'hatchback').length,
                    coupe: products.filter(p => p.category === 'coupe').length,
                    van: products.filter(p => p.category === 'van').length
                }
            },
            orders: {
                total: 0,
                pending: 0,
                completed: 0
            },
            revenue: {
                total: 0,
                today: 0,
                month: 0
            }
        });
        // 6. Create sample vendor applications
        console.log('Creating vendor applications...');
        const vendorApplications = [
            {
                businessName: 'Premium Auto Gallery',
                businessType: 'dealership',
                nationalId: '29901011234567',
                commercialRegister: 'CR789012',
                taxNumber: 'TAX345678',
                businessAddress: '45 Tahrir Street, Cairo',
                bankAccount: 'IBAN9876543210',
                subscriptionPlan: 'premium',
                status: 'pending',
                submittedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                businessName: 'Speed Motors',
                businessType: 'dealership',
                nationalId: '29802021234567',
                commercialRegister: 'CR456789',
                taxNumber: 'TAX901234',
                businessAddress: '12 Nasr Road, Cairo',
                bankAccount: 'IBAN5432109876',
                subscriptionPlan: 'basic',
                status: 'pending',
                submittedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];
        for (const app of vendorApplications) {
            const appRef = await db.collection('vendor_applications').add(app);
            // Add to real-time notifications
            await realtimeDb.ref('admin/notifications').push({
                type: 'new_vendor_application',
                applicationId: appRef.id,
                businessName: app.businessName,
                timestamp: admin.database.ServerValue.TIMESTAMP,
                read: false
            });
        }
        console.log(`✅ Created ${vendorApplications.length} vendor applications`);
        // 7. Initialize real-time presence
        console.log('Setting up real-time presence...');
        await realtimeDb.ref('presence').set({
            online_users: 0,
            last_update: admin.database.ServerValue.TIMESTAMP
        });
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Test Accounts Created:');
        console.log('Admin: admin@soukelsyarat.com / Admin@123456');
        console.log('Vendor: vendor1@test.com / Vendor@123456');
        console.log('Customer: customer1@test.com / Customer@123456');
        console.log(`\n📦 Created ${products.length} products`);
        console.log(`📂 Created ${categories.length} categories`);
        console.log(`🏷️ Created ${brands.length} brands`);
        console.log(`📋 Created ${vendorApplications.length} vendor applications`);
        return {
            success: true,
            stats: {
                users: users.length,
                products: products.length,
                categories: categories.length,
                brands: brands.length,
                applications: vendorApplications.length
            }
        };
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}
// Export as cloud function
exports.seedData = admin.firestore().collection('_seeds').doc('trigger')
    .onCreate(async () => {
    return await seedDatabase();
});
//# sourceMappingURL=seed-database.js.map
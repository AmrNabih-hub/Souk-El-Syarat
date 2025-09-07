/**
 * 📊 Test Data Generator
 * Professional test data management for Souk El-Syarat platform
 */

import { faker } from '@faker-js/faker'

export interface TestUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: 'customer' | 'vendor' | 'admin'
  isActive: boolean
  createdAt: Date
  profile: {
    address: string
    city: string
    country: string
    avatar?: string
  }
  preferences: {
    language: string
    currency: string
    notifications: boolean
  }
}

export interface TestProduct {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  brand: string
  model: string
  year: number
  mileage: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric'
  transmission: 'manual' | 'automatic'
  color: string
  images: string[]
  features: string[]
  vendorId: string
  isActive: boolean
  createdAt: Date
  location: {
    city: string
    governorate: string
    coordinates: {
      lat: number
      lng: number
    }
  }
}

export interface TestOrder {
  id: string
  customerId: string
  vendorId: string
  productId: string
  quantity: number
  totalPrice: number
  currency: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'installments'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: {
    street: string
    city: string
    governorate: string
    postalCode: string
    phone: string
  }
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface TestCategory {
  id: string
  name: string
  slug: string
  description: string
  parentId?: string
  isActive: boolean
  sortOrder: number
  icon?: string
  image?: string
}

export interface TestVendor {
  id: string
  businessName: string
  contactPerson: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  documents: {
    businessLicense: string
    taxId: string
    bankAccount: string
  }
  address: {
    street: string
    city: string
    governorate: string
    postalCode: string
  }
  rating: number
  totalSales: number
  joinedAt: Date
}

export interface TestDataCollection {
  users: TestUser[]
  products: TestProduct[]
  orders: TestOrder[]
  categories: TestCategory[]
  vendors: TestVendor[]
}

export class TestDataGenerator {
  private static instance: TestDataGenerator
  private generatedData: TestDataCollection | null = null

  private constructor() {}

  static getInstance(): TestDataGenerator {
    if (!TestDataGenerator.instance) {
      TestDataGenerator.instance = new TestDataGenerator()
    }
    return TestDataGenerator.instance
  }

  /**
   * 🎯 Generate comprehensive test data
   */
  generateTestData(options: {
    userCount?: number
    productCount?: number
    orderCount?: number
    categoryCount?: number
    vendorCount?: number
  } = {}): TestDataCollection {
    const {
      userCount = 50,
      productCount = 100,
      orderCount = 200,
      categoryCount = 10,
      vendorCount = 20
    } = options

    console.log('📊 Generating comprehensive test data...')

    // Generate categories first
    const categories = this.generateCategories(categoryCount)
    
    // Generate vendors
    const vendors = this.generateVendors(vendorCount)
    
    // Generate users
    const users = this.generateUsers(userCount)
    
    // Generate products
    const products = this.generateProducts(productCount, categories, vendors)
    
    // Generate orders
    const orders = this.generateOrders(orderCount, users, vendors, products)

    this.generatedData = {
      users,
      products,
      orders,
      categories,
      vendors
    }

    console.log('✅ Test data generation completed!')
    return this.generatedData
  }

  /**
   * 👥 Generate test users
   */
  private generateUsers(count: number): TestUser[] {
    const users: TestUser[] = []
    const roles: ('customer' | 'vendor' | 'admin')[] = ['customer', 'vendor', 'admin']

    for (let i = 0; i < count; i++) {
      const role = i < 5 ? 'admin' : i < 25 ? 'vendor' : 'customer'
      
      users.push({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number('+20##########'),
        role,
        isActive: faker.datatype.boolean(0.9),
        createdAt: faker.date.past(),
        profile: {
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          country: 'Egypt',
          avatar: faker.image.avatar()
        },
        preferences: {
          language: faker.helpers.arrayElement(['ar', 'en']),
          currency: 'EGP',
          notifications: faker.datatype.boolean()
        }
      })
    }

    return users
  }

  /**
   * 🚗 Generate test products
   */
  private generateProducts(
    count: number, 
    categories: TestCategory[], 
    vendors: TestVendor[]
  ): TestProduct[] {
    const products: TestProduct[] = []
    const brands = ['Toyota', 'BMW', 'Mercedes', 'Audi', 'Honda', 'Nissan', 'Hyundai', 'Kia']
    const conditions: TestProduct['condition'][] = ['excellent', 'good', 'fair', 'poor']
    const fuelTypes: TestProduct['fuelType'][] = ['gasoline', 'diesel', 'hybrid', 'electric']
    const transmissions: TestProduct['transmission'][] = ['manual', 'automatic']
    const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Gray', 'Green', 'Brown']

    for (let i = 0; i < count; i++) {
      const category = faker.helpers.arrayElement(categories)
      const vendor = faker.helpers.arrayElement(vendors)
      const brand = faker.helpers.arrayElement(brands)
      const year = faker.number.int({ min: 2015, max: 2024 })
      
      products.push({
        id: faker.string.uuid(),
        title: `${brand} ${faker.vehicle.model()} ${year}`,
        description: faker.lorem.paragraphs(2),
        price: faker.number.int({ min: 50000, max: 2000000 }),
        currency: 'EGP',
        category: category.name,
        brand,
        model: faker.vehicle.model(),
        year,
        mileage: faker.number.int({ min: 0, max: 200000 }),
        condition: faker.helpers.arrayElement(conditions),
        fuelType: faker.helpers.arrayElement(fuelTypes),
        transmission: faker.helpers.arrayElement(transmissions),
        color: faker.helpers.arrayElement(colors),
        images: Array.from({ length: faker.number.int({ min: 1, max: 8 }) }, () => 
          faker.image.urlLoremFlickr({ category: 'car' })
        ),
        features: faker.helpers.arrayElements([
          'Air Conditioning', 'Power Steering', 'ABS', 'Airbags', 'Bluetooth',
          'GPS Navigation', 'Backup Camera', 'Leather Seats', 'Sunroof',
          'Cruise Control', 'Keyless Entry', 'Remote Start'
        ], { min: 3, max: 8 }),
        vendorId: vendor.id,
        isActive: faker.datatype.boolean(0.95),
        createdAt: faker.date.past(),
        location: {
          city: faker.location.city(),
          governorate: faker.helpers.arrayElement([
            'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said',
            'Suez', 'Luxor', 'Mansoura', 'Tanta', 'Asyut'
          ]),
          coordinates: {
            lat: faker.location.latitude({ min: 22, max: 32 }),
            lng: faker.location.longitude({ min: 25, max: 37 })
          }
        }
      })
    }

    return products
  }

  /**
   * 📦 Generate test orders
   */
  private generateOrders(
    count: number,
    users: TestUser[],
    vendors: TestVendor[],
    products: TestProduct[]
  ): TestOrder[] {
    const orders: TestOrder[] = []
    const statuses: TestOrder['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    const paymentMethods: TestOrder['paymentMethod'][] = ['cash', 'bank_transfer', 'credit_card', 'installments']
    const paymentStatuses: TestOrder['paymentStatus'][] = ['pending', 'paid', 'failed', 'refunded']

    for (let i = 0; i < count; i++) {
      const customer = faker.helpers.arrayElement(users.filter(u => u.role === 'customer'))
      const product = faker.helpers.arrayElement(products)
      const vendor = vendors.find(v => v.id === product.vendorId)!
      const status = faker.helpers.arrayElement(statuses)
      const paymentMethod = faker.helpers.arrayElement(paymentMethods)
      const paymentStatus = faker.helpers.arrayElement(paymentStatuses)
      
      orders.push({
        id: faker.string.uuid(),
        customerId: customer.id,
        vendorId: vendor.id,
        productId: product.id,
        quantity: 1,
        totalPrice: product.price,
        currency: 'EGP',
        status,
        paymentMethod,
        paymentStatus,
        shippingAddress: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          governorate: faker.helpers.arrayElement([
            'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said'
          ]),
          postalCode: faker.location.zipCode(),
          phone: faker.phone.number('+20##########')
        },
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : undefined,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent()
      })
    }

    return orders
  }

  /**
   * 📂 Generate test categories
   */
  private generateCategories(count: number): TestCategory[] {
    const categories: TestCategory[] = []
    const categoryNames = [
      'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon',
      'Pickup', 'Van', 'Truck', 'Motorcycle'
    ]

    for (let i = 0; i < count; i++) {
      const name = categoryNames[i] || faker.vehicle.type()
      
      categories.push({
        id: faker.string.uuid(),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: faker.lorem.sentence(),
        isActive: faker.datatype.boolean(0.9),
        sortOrder: i + 1,
        icon: faker.helpers.arrayElement(['🚗', '🚙', '🏎️', '🚐', '🚚', '🏍️']),
        image: faker.image.urlLoremFlickr({ category: 'car' })
      })
    }

    return categories
  }

  /**
   * 🏪 Generate test vendors
   */
  private generateVendors(count: number): TestVendor[] {
    const vendors: TestVendor[] = []
    const statuses: TestVendor['status'][] = ['pending', 'approved', 'rejected', 'suspended']

    for (let i = 0; i < count; i++) {
      const status = i < 15 ? 'approved' : faker.helpers.arrayElement(statuses)
      
      vendors.push({
        id: faker.string.uuid(),
        businessName: faker.company.name() + ' Auto',
        contactPerson: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number('+20##########'),
        status,
        documents: {
          businessLicense: faker.string.alphanumeric(10).toUpperCase(),
          taxId: faker.string.numeric(9),
          bankAccount: faker.finance.accountNumber()
        },
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          governorate: faker.helpers.arrayElement([
            'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said'
          ]),
          postalCode: faker.location.zipCode()
        },
        rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
        totalSales: faker.number.int({ min: 0, max: 1000000 }),
        joinedAt: faker.date.past()
      })
    }

    return vendors
  }

  /**
   * 🎯 Get specific test data
   */
  getTestData(): TestDataCollection | null {
    return this.generatedData
  }

  /**
   * 👤 Get test user by role
   */
  getTestUserByRole(role: 'customer' | 'vendor' | 'admin'): TestUser | null {
    if (!this.generatedData) return null
    return this.generatedData.users.find(user => user.role === role) || null
  }

  /**
   * 🚗 Get test product by category
   */
  getTestProductsByCategory(category: string): TestProduct[] {
    if (!this.generatedData) return []
    return this.generatedData.products.filter(product => product.category === category)
  }

  /**
   * 📦 Get test orders by status
   */
  getTestOrdersByStatus(status: TestOrder['status']): TestOrder[] {
    if (!this.generatedData) return []
    return this.generatedData.orders.filter(order => order.status === status)
  }

  /**
   * 🏪 Get test vendors by status
   */
  getTestVendorsByStatus(status: TestVendor['status']): TestVendor[] {
    if (!this.generatedData) return []
    return this.generatedData.vendors.filter(vendor => vendor.status === status)
  }

  /**
   * 🔄 Reset test data
   */
  resetTestData(): void {
    this.generatedData = null
    console.log('🔄 Test data reset completed')
  }

  /**
   * 💾 Export test data to JSON
   */
  exportTestData(): string {
    if (!this.generatedData) {
      throw new Error('No test data available to export')
    }
    return JSON.stringify(this.generatedData, null, 2)
  }

  /**
   * 📥 Import test data from JSON
   */
  importTestData(jsonData: string): void {
    try {
      this.generatedData = JSON.parse(jsonData)
      console.log('📥 Test data imported successfully')
    } catch (error) {
      throw new Error('Invalid JSON data for import')
    }
  }

  /**
   * 📊 Get test data statistics
   */
  getTestDataStatistics(): Record<string, number> {
    if (!this.generatedData) {
      return { users: 0, products: 0, orders: 0, categories: 0, vendors: 0 }
    }

    return {
      users: this.generatedData.users.length,
      products: this.generatedData.products.length,
      orders: this.generatedData.orders.length,
      categories: this.generatedData.categories.length,
      vendors: this.generatedData.vendors.length
    }
  }
}

// Export singleton instance
export const testDataGenerator = TestDataGenerator.getInstance()
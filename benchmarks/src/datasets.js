import { faker } from '@faker-js/faker'
import githubRepos from '../data/github-repos.json' with { type: 'json' }

// Seed for reproducibility
faker.seed(12345)

export function generateAnalyticsData(days, startDate = '2025-01-01') {
  const date = new Date(startDate)

  return {
    metrics: Array.from({ length: days }, (_, i) => {
      const currentDate = new Date(date)
      currentDate.setDate(currentDate.getDate() + i)

      const baseViews = 5000
      const weekendMultiplier = currentDate.getDay() === 0 || currentDate.getDay() === 6 ? 0.7 : 1.0
      const views = Math.round(baseViews * weekendMultiplier + faker.number.int({ min: -1000, max: 3000 }))
      const clicks = Math.round(views * faker.number.float({ min: 0.02, max: 0.08 }))
      const conversions = Math.round(clicks * faker.number.float({ min: 0.05, max: 0.15 }))
      const avgOrderValue = faker.number.float({ min: 49.99, max: 299.99 })
      const revenue = Number((conversions * avgOrderValue).toFixed(2))

      return {
        date: currentDate.toISOString().split('T')[0],
        views,
        clicks,
        conversions,
        revenue,
        bounceRate: faker.number.float({ min: 0.3, max: 0.7, fractionDigits: 2 }),
      }
    }),
  }
}

const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Operations', 'Finance']

function generateEmployees(count) {
  return {
    employees: Array.from({ length: count }, (_, i) => {
      const yearsExp = faker.number.int({ min: 1, max: 25 })
      return {
        id: i + 1,
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        department: departments[i % departments.length],
        salary: faker.number.int({ min: 45000, max: 150000 }),
        yearsExperience: yearsExp,
        active: faker.datatype.boolean(0.8),
      }
    }),
  }
}

const tabularDataset = {
  name: 'tabular',
  description: 'Uniform employee records',
  data: generateEmployees(100),
  metadata: {
    supportsCSV: true,
    structureClass: 'uniform',
    tabularEligibility: 100,
  },
}

const PRODUCT_NAMES = ['Wireless Mouse', 'USB Cable', 'Laptop Stand', 'Keyboard', 'Webcam', 'Headphones', 'Monitor', 'Desk Lamp']
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

function generateOrders(count) {
  return {
    orders: Array.from({ length: count }, (_, i) => {
      const customerId = (i % 20) + 1
      const itemCount = faker.number.int({ min: 1, max: 4 })

      const items = Array.from({ length: itemCount }, (_, j) => {
        const price = faker.number.float({
          min: 9.99,
          max: 199.99,
          fractionDigits: 2,
        })
        const quantity = faker.number.int({ min: 1, max: 5 })
        return {
          sku: `SKU-${faker.string.alphanumeric({ length: 6 }).toUpperCase()}`,
          name: PRODUCT_NAMES[j % PRODUCT_NAMES.length],
          quantity,
          price,
        }
      })

      const subtotal = Number(items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2))
      const tax = Number((subtotal * 0.08).toFixed(2))
      const total = Number((subtotal + tax).toFixed(2))

      return {
        orderId: `ORD-${String(i + 1).padStart(4, '0')}`,
        customer: {
          id: customerId,
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: faker.phone.number(),
        },
        items,
        subtotal,
        tax,
        total,
        status: ORDER_STATUSES[i % ORDER_STATUSES.length],
        orderDate: faker.date.recent({ days: 90 }).toISOString().split('T')[0],
      }
    }),
  }
}

const nestedDataset = {
  name: 'nested',
  description: 'E-commerce orders with nested structures',
  data: generateOrders(50),
  metadata: {
    supportsCSV: false,
    structureClass: 'nested',
    tabularEligibility: 33,
  },
}

const analyticsDataset = {
  name: 'analytics',
  description: 'Time-series analytics data',
  data: generateAnalyticsData(60),
  metadata: {
    supportsCSV: true,
    structureClass: 'uniform',
    tabularEligibility: 100,
  },
}

const githubDataset = {
  name: 'github',
  description: 'Top 100 GitHub repositories',
  data: {
    repositories: githubRepos,
  },
  metadata: {
    supportsCSV: true,
    structureClass: 'uniform',
    tabularEligibility: 100,
  },
}

export function generateOrderData() {
  return {
    orderId: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
    customer: {
      id: faker.number.int({ min: 1000, max: 9999 }),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    },
    items: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
      sku: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
      name: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 5 }),
      price: Number(faker.commerce.price({ min: 10, max: 200 })),
    })),
    subtotal: Number(faker.commerce.price({ min: 100, max: 500 })),
    tax: Number(faker.commerce.price({ min: 10, max: 50 })),
    total: Number(faker.commerce.price({ min: 110, max: 550 })),
    status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
  }
}

export function generateEventLogs(count) {
  const endpoints = ['/api/users', '/api/orders', '/api/products', '/api/auth', '/api/payments']
  const levels = ['info', 'warn', 'error']

  return {
    logs: Array.from({ length: count }, () => {
      const level = faker.helpers.arrayElement(levels)
      const hasError = level === 'error' || (level === 'warn' && faker.datatype.boolean(0.3))

      const log = {
        timestamp: faker.date.recent({ days: 7 }).toISOString(),
        level,
        endpoint: faker.helpers.arrayElement(endpoints),
        statusCode: hasError
          ? faker.number.int({ min: 400, max: 599 })
          : faker.number.int({ min: 200, max: 299 }),
        responseTime: faker.number.int({ min: 10, max: 5000 }),
        userId: faker.number.int({ min: 1000, max: 9999 }),
      }

      if (hasError) {
        log.error = {
          message: faker.helpers.arrayElement([
            'Database connection timeout',
            'Invalid authentication token',
            'Resource not found',
            'Internal server error',
            'Rate limit exceeded',
          ]),
          stack: `Error: ${faker.lorem.sentence()}\n  at ${faker.lorem.word()}\n  at ${faker.lorem.word()}`,
          retryable: faker.datatype.boolean(0.6),
        }
      }

      return log
    }),
  }
}

export function generateNestedConfig() {
  return {
    environment: faker.helpers.arrayElement(['production', 'staging', 'development']),
    version: faker.system.semver(),
    database: {
      host: faker.internet.domainName(),
      port: 5432,
      name: faker.database.type(),
      pool: {
        min: 2,
        max: faker.number.int({ min: 10, max: 50 }),
        idleTimeout: 30000,
      },
      replicas: Array.from({ length: 3 }, (_, i) => ({
        host: `replica-${i + 1}.${faker.internet.domainName()}`,
        port: 5432,
        priority: i + 1,
      })),
    },
    features: {
      darkMode: {
        enabled: faker.datatype.boolean(),
        rollout: faker.number.int({ min: 0, max: 100 }),
        variants: [
          {
            name: 'default',
            weight: 70,
            config: { theme: 'dark', animations: true },
          },
          {
            name: 'minimal',
            weight: 30,
            config: { theme: 'dark', animations: false },
          },
        ],
      },
      analytics: {
        enabled: faker.datatype.boolean(),
        rollout: faker.number.int({ min: 0, max: 100 }),
        variants: [
          {
            name: 'full',
            weight: 100,
            config: { tracking: 'all', sampling: 1.0 },
          },
        ],
      },
    },
    authentication: {
      providers: [
        {
          name: 'oauth2',
          clientId: faker.string.uuid(),
          scopes: ['read', 'write', 'admin'],
          config: {
            authUrl: faker.internet.url(),
            tokenUrl: faker.internet.url(),
          },
        },
        {
          name: 'saml',
          clientId: faker.string.uuid(),
          scopes: ['read'],
          config: {
            entryPoint: faker.internet.url(),
            cert: faker.string.alphanumeric({ length: 64 }),
          },
        },
      ],
      session: {
        secret: faker.string.alphanumeric({ length: 32 }),
        duration: 86400,
        refreshThreshold: 3600,
      },
    },
    permissions: {
      roles: {
        admin: {
          permissions: ['read', 'write', 'delete', 'manage_users', 'manage_roles'],
          inherits: [],
        },
        editor: {
          permissions: ['read', 'write'],
          inherits: ['viewer'],
        },
        viewer: {
          permissions: ['read'],
          inherits: [],
        },
      },
      groups: {
        engineering: {
          members: Array.from({ length: 5 }, () => faker.internet.email()),
          roles: ['admin', 'editor'],
        },
        support: {
          members: Array.from({ length: 3 }, () => faker.internet.email()),
          roles: ['viewer'],
        },
      },
    },
  }
}

export function generateProducts(count) {
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys']

  return {
    products: Array.from({ length: count }, (_, i) => ({
      sku: `SKU-${String(i + 1).padStart(6, '0')}`,
      name: faker.commerce.productName(),
      category: categories[i % categories.length],
      price: Number(faker.commerce.price({ min: 5, max: 500 })),
      qty: faker.number.int({ min: 0, max: 1000 }),
      lastUpdated: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    })),
  }
}

function generateStructuralValidationFixtures() {
  const baseData = generateEmployees(20)

  return [
    {
      type: 'truncated',
      description: 'Valid complete dataset (control)',
      data: { employees: baseData.employees },
      isValid: true,
    },
    {
      type: 'truncated',
      description: 'Array truncated: 3 rows removed from end',
      data: { employees: baseData.employees.slice(0, -3) },
      isValid: false,
    },
    {
      type: 'extra-rows',
      description: 'Extra rows added beyond declared length',
      data: {
        employees: [
          ...baseData.employees,
          ...generateEmployees(3).employees,
        ],
      },
      isValid: false,
    },
    {
      type: 'width-mismatch',
      description: 'Inconsistent field count (missing salary in row 10)',
      data: {
        employees: baseData.employees.map((emp, i) => {
          if (i === 9) {
            const { salary, ...rest } = emp
            return rest
          }
          return emp
        }),
      },
      isValid: false,
    },
    {
      type: 'missing-fields',
      description: 'Missing required fields (no email in multiple rows)',
      data: {
        employees: baseData.employees.map((emp, i) => {
          if (i % 5 === 0) {
            const { email, ...rest } = emp
            return rest
          }
          return emp
        }),
      },
      isValid: false,
    },
  ]
}

const eventLogsDataset = {
  name: 'event-logs',
  description: 'Semi-uniform event logs',
  data: generateEventLogs(75),
  metadata: {
    supportsCSV: false,
    structureClass: 'semi-uniform',
    tabularEligibility: 50,
  },
}

const nestedConfigDataset = {
  name: 'nested-config',
  description: 'Deeply nested configuration',
  data: generateNestedConfig(),
  metadata: {
    supportsCSV: false,
    structureClass: 'deep',
    tabularEligibility: 0,
  },
}

const structuralValidationDatasets = generateStructuralValidationFixtures().map((fixture, index) => {
  const datasetNames = [
    'structural-validation-control',
    'structural-validation-truncated',
    'structural-validation-extra-rows',
    'structural-validation-width-mismatch',
    'structural-validation-missing-fields',
  ]

  return {
    name: datasetNames[index],
    description: fixture.description,
    data: fixture.data,
    metadata: {
      supportsCSV: true,
      structureClass: 'uniform',
      tabularEligibility: 100,
    },
  }
})

export const ACCURACY_DATASETS = [
  tabularDataset,
  nestedDataset,
  analyticsDataset,
  githubDataset,
  eventLogsDataset,
  nestedConfigDataset,
  ...structuralValidationDatasets,
]

export const TOKEN_EFFICIENCY_DATASETS = [
  {
    name: 'tabular',
    description: 'Uniform employee records',
    data: generateEmployees(2000),
    metadata: {
      supportsCSV: true,
      structureClass: 'uniform',
      tabularEligibility: 100,
    },
  },
  {
    name: 'nested',
    description: 'E-commerce orders with nested structures',
    data: generateOrders(500),
    metadata: {
      supportsCSV: false,
      structureClass: 'nested',
      tabularEligibility: 33,
    },
  },
  {
    name: 'analytics',
    description: 'Time-series analytics data',
    data: generateAnalyticsData(365),
    metadata: {
      supportsCSV: true,
      structureClass: 'uniform',
      tabularEligibility: 100,
    },
  },
  githubDataset,
  {
    name: 'event-logs',
    description: 'Semi-uniform event logs',
    data: generateEventLogs(2000),
    metadata: {
      supportsCSV: false,
      structureClass: 'semi-uniform',
      tabularEligibility: 50,
    },
  },
  nestedConfigDataset,
]

import { createTestUser, createTestOrganization } from './db-helpers'
import bcrypt from 'bcryptjs'

export interface TestCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
}

export const createTestCredentials = (): TestCredentials => ({
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
})

export const createTestUserWithOrg = async () => {
  const organization = await createTestOrganization()
  const credentials = createTestCredentials()
  
  const hashedPassword = await bcrypt.hash(credentials.password, 10)
  
  const user = await createTestUser({
    email: credentials.email,
    password: hashedPassword,
    firstName: credentials.firstName,
    lastName: credentials.lastName,
    organizationId: organization.id
  })
  
  return {
    user,
    organization,
    credentials
  }
}

export const getAuthHeaders = (sessionToken?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`
  }
  
  return headers
}

export const createValidSignupData = () => ({
  name: 'Test User',
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!'
})

export const createInvalidSignupData = () => [
  {
    name: '',
    email: 'test@example.com',
    password: 'TestPassword123!',
    expectedError: 'Ime je obavezno'
  },
  {
    name: 'Test User',
    email: 'invalid-email',
    password: 'TestPassword123!',
    expectedError: 'Molimo unesite valjanu email adresu'
  },
  {
    name: 'Test User',
    email: 'test@example.com',
    password: '123',
    expectedError: 'Lozinka mora imati najmanje 8 znakova'
  }
]

export const createValidSigninData = () => ({
  email: 'test@example.com',
  password: 'TestPassword123!'
})

export const createInvalidSigninData = () => [
  {
    email: '',
    password: 'TestPassword123!',
    expectedError: 'Email je obavezan'
  },
  {
    email: 'test@example.com',
    password: '',
    expectedError: 'Lozinka je obavezna'
  },
  {
    email: 'test@example.com',
    password: 'wrongpassword',
    expectedError: 'Neispravni podaci za prijavu'
  }
]

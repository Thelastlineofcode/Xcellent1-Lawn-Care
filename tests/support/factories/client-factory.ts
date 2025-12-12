// Client Factory - Following data-factories.md patterns
// Provides deterministic test client data with overrides

import { faker } from "https://esm.sh/@faker-js/faker";

export interface TestClient {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  property_address: string;
  service_plan: "weekly" | "biweekly" | "monthly" | "one-time";
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createClient = (
  overrides: Partial<TestClient> = {},
): TestClient => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  property_address:
    `${faker.location.streetAddress()}, ${faker.location.city()}, LA ${faker.location.zipCode()}`,
  service_plan: "weekly",
  notes: faker.lorem.sentence(),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createResidentialClient = (
  overrides: Partial<TestClient> = {},
): TestClient => createClient({ service_plan: "weekly", ...overrides });

export const createCommercialClient = (
  overrides: Partial<TestClient> = {},
): TestClient =>
  createClient({
    service_plan: "biweekly",
    property_address:
      `${faker.company.name()} - ${faker.location.streetAddress()}, ${faker.location.city()}, LA ${faker.location.zipCode()}`,
    ...overrides,
  });

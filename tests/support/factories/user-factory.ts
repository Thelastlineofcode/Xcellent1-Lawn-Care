// User Factory - Following data-factories.md patterns
// Provides deterministic test data with overrides

import { faker } from "https://esm.sh/@faker-js/faker";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "crew" | "client";
  created_at?: Date;
  updated_at?: Date;
}

export const createUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: "client",
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createOwner = (overrides: Partial<TestUser> = {}): TestUser =>
  createUser({ role: "owner", ...overrides });

export const createCrew = (overrides: Partial<TestUser> = {}): TestUser =>
  createUser({ role: "crew", ...overrides });

export const createClient = (overrides: Partial<TestUser> = {}): TestUser =>
  createUser({ role: "client", ...overrides });

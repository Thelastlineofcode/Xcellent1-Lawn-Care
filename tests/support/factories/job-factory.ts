// Job Factory - Following data-factories.md patterns
// Provides deterministic test job data with overrides

import { faker } from "https://esm.sh/@faker-js/faker";

export interface TestJob {
  id?: string;
  client_id: string;
  crew_id?: string;
  scheduled_date: string;
  services: string[];
  status: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  estimated_duration?: number;
  actual_duration?: number;
  created_at?: Date;
  updated_at?: Date;
}

export const createJob = (clientId: string, overrides: Partial<TestJob> = {}): TestJob => ({
  id: faker.string.uuid(),
  client_id: clientId,
  crew_id: faker.string.uuid(),
  scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
  services: ['Mowing', 'Edging'],
  status: 'scheduled',
  notes: faker.lorem.sentence(),
  estimated_duration: faker.number.int({ min: 30, max: 120 }),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createScheduledJob = (clientId: string, overrides: Partial<TestJob> = {}): TestJob =>
  createJob(clientId, { status: 'scheduled', ...overrides });

export const createInProgressJob = (clientId: string, overrides: Partial<TestJob> = {}): TestJob =>
  createJob(clientId, { status: 'in_progress', ...overrides });

export const createCompletedJob = (clientId: string, overrides: Partial<TestJob> = {}): TestJob =>
  createJob(clientId, { 
    status: 'completed', 
    actual_duration: faker.number.int({ min: 30, max: 120 }),
    ...overrides 
  });

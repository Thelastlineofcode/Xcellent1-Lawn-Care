// Test Fixtures - Following fixture-architecture.md patterns
// Provides composable setup/cleanup for test data

import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import {
  createClient,
  createCrew,
  createOwner,
  createUser,
} from "../factories/user-factory.ts";
import { createClient as createClientData } from "../factories/client-factory.ts";
import { createJob } from "../factories/job-factory.ts";

export class TestFixture {
  private dbClient: Client | null = null;
  private createdUsers: string[] = [];
  private createdClients: string[] = [];
  private createdJobs: string[] = [];
  private createdInvoices: string[] = [];
  private createdWaitlist: string[] = [];
  private createdApplications: string[] = [];

  async connect() {
    const DATABASE_URL = Deno.env.get("DATABASE_URL");
    if (DATABASE_URL) {
      this.dbClient = new Client(DATABASE_URL);
      await this.dbClient.connect();
    }
  }

  async disconnect() {
    if (this.dbClient) {
      await this.dbClient.end();
      this.dbClient = null;
    }
  }

  // User management
  async createTestUser(role: "owner" | "crew" | "client" = "client") {
    const user = role === "owner"
      ? createOwner()
      : role === "crew"
        ? createCrew()
        : createClient();

    if (this.dbClient) {
      // Insert into database
      await this.dbClient.queryObject(
        `
        INSERT INTO users (auth_user_id, email, name, role)
        VALUES (NULL, $1, $2, $3)
        RETURNING id
      `,
        [user.email, user.name, user.role],
      );

      const result = await this.dbClient.queryObject(
        `SELECT id FROM users WHERE email = $1`,
        [user.email],
      );
      const dbUser = result.rows[0] as any;
      user.id = dbUser.id;
    }

    this.createdUsers.push(user.id);
    return user;
  }

  async createTestClient(userId?: string) {
    const clientData = createClientData();

    if (this.dbClient) {
      // Insert client into database
      const result = await this.dbClient.queryObject(
        `
        INSERT INTO clients (user_id, property_address, service_plan)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
        [
          userId || null,
          clientData.property_address,
          clientData.service_plan,
        ],
      );

      const dbClient = result.rows[0] as any;
      clientData.id = dbClient.id;
    }

    this.createdClients.push(clientData.id!);
    return clientData;
  }

  async createTestClientForOwner(userId: string) {
    return await this.createTestClient(userId);
  }

  async createTestJob(
    clientId: string,
    overrides: Partial<Record<string, unknown>> = {},
  ) {
    const jobData = createJob(clientId, overrides as any);

    if (this.dbClient) {
      // Insert job into database
      const result = await this.dbClient.queryObject(
        `
        INSERT INTO jobs (client_id, crew_id, scheduled_date, services, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
        [
          jobData.client_id,
          (jobData as any).crew_id || null,
          jobData.scheduled_date,
          jobData.services,
          jobData.status,
          jobData.notes,
        ],
      );

      const dbJob = result.rows[0] as any;
      jobData.id = dbJob.id;
    }

    this.createdJobs.push(jobData.id!);
    return jobData;
  }

  // Cleanup methods
  async cleanup() {
    if (!this.dbClient) return;

    // Clean up in reverse order to maintain referential integrity
    // Thorough cleanup - delete everything from these tables to ensure a clean slate
    // The order matters for foreign keys, or we can use CASCADE if available
    try {
      await this.dbClient.queryObject(`DELETE FROM invoices`);
      await this.dbClient.queryObject(`DELETE FROM jobs`);
      await this.dbClient.queryObject(`DELETE FROM clients`);
      await this.dbClient.queryObject(`DELETE FROM users`);
      await this.dbClient.queryObject(`DELETE FROM waitlist`);
      await this.dbClient.queryObject(`DELETE FROM applications`);
      await this.dbClient.queryObject(`DELETE FROM job_photos`);
      await this.dbClient.queryObject(`DELETE FROM payments`);
    } catch (err) {
      console.warn("Cleanup warning (can be ignored if foreign keys handled):", (err as Error).message);
    }

    // Reset tracking arrays
    this.createdUsers = [];
    this.createdClients = [];
    this.createdJobs = [];
    this.createdInvoices = [];
  }

  // Utility methods
  trackInvoice(id: string) {
    this.createdInvoices.push(id);
  }

  trackWaitlist(id: string) {
    this.createdWaitlist.push(id);
  }

  trackApplication(id: string) {
    this.createdApplications.push(id);
  }

  getCreatedUsers() {
    return [...this.createdUsers];
  }

  getCreatedClients() {
    return [...this.createdClients];
  }

  getCreatedJobs() {
    return [...this.createdJobs];
  }
}

// Global fixture instance
export const testFixture = new TestFixture();

// Seed data — no-op in demo mode (data is pre-seeded in mockStore)
export async function seedAdminAccount(): Promise<{ success: boolean; message: string }> {
  return { success: true, message: 'Demo mode: admin pre-seeded' };
}

export async function seedDemoData(): Promise<void> {}

export async function runSeeder(): Promise<void> {}

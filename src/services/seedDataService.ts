// Seed data service — no-op in demo mode (data is pre-seeded in mockStore)
export async function seedMockData(_userId: string): Promise<void> {
  console.log('Demo mode: data is pre-seeded in mockStore');
}

export async function clearAllData(_userId: string): Promise<void> {
  console.log('Demo mode: clear not available');
}

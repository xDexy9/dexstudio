// Video upload not available in demo mode — returns a local object URL instead

export async function uploadVideoToStorage(
  blob: Blob,
  _jobId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Simulate progress
  if (onProgress) {
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 50));
      onProgress(i);
    }
  }
  // Return a local object URL (works only for current session)
  return URL.createObjectURL(blob);
}

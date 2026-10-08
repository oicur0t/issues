// Runs once when the Next.js server starts. Starts background jobs (Node runtime only).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTailscaleScheduler } = await import('./lib/tailscale-scheduler')
    startTailscaleScheduler()
  }
}

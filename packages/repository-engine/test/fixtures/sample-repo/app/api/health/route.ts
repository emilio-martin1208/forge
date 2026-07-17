export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const undocumented = process.env.SAMPLE_UNDOCUMENTED_SECRET;
  return new Response(JSON.stringify({ ok: Boolean(dbUrl && stripeKey && undocumented) }));
}

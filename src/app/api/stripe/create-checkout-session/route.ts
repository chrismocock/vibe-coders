import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover",
  });

  const { plan } = await req.json();
  const success = `${
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  }/projects?success=true`;
  const cancel = `${
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  }/pricing`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan, quantity: 1 }],
    success_url: success,
    cancel_url: cancel,
  });

  return NextResponse.json({ url: session.url });
}



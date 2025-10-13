import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-09-30.acacia" });

export async function POST(req: Request) {
  const { plan } = await req.json();
  const success = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?success=true`;
  const cancel = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pricing`;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan, quantity: 1 }],
    success_url: success,
    cancel_url: cancel,
  });
  return NextResponse.json({ url: session.url });
}



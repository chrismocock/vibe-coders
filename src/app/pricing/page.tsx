import { Button } from "@/components/ui/button";

export default function Pricing() {
  const plans = [
    { name: "Free", price: "£0", features: ["2 stages", "1 project"] },
    { name: "Builder", price: "£19/mo", features: ["6 stages", "AI mentor"] },
    { name: "Pro Founder", price: "£49/mo", features: ["Reports", "Integrations"] },
  ];
  return (
    <div className="p-8 text-center space-y-8">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className="rounded-lg border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="my-2 text-2xl font-bold">{p.price}</p>
            <ul className="mb-4 space-y-1 text-sm">
              {p.features.map((f) => (
                <li key={f}>✅ {f}</li>
              ))}
            </ul>
            <Button>Get Started</Button>
          </div>
        ))}
      </div>
    </div>
  );
}



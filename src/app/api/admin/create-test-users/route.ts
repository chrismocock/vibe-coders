import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const testUsers = [
  {
    email: 'john.doe@example.com',
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe'
  },
  {
    email: 'jane.smith@example.com',
    password: 'password123',
    first_name: 'Jane',
    last_name: 'Smith'
  },
  {
    email: 'mike.johnson@example.com',
    password: 'password123',
    first_name: 'Mike',
    last_name: 'Johnson'
  },
  {
    email: 'sarah.wilson@example.com',
    password: 'password123',
    first_name: 'Sarah',
    last_name: 'Wilson'
  },
  {
    email: 'david.brown@example.com',
    password: 'password123',
    first_name: 'David',
    last_name: 'Brown'
  },
  {
    email: 'lisa.davis@example.com',
    password: 'password123',
    first_name: 'Lisa',
    last_name: 'Davis'
  },
  {
    email: 'chris.miller@example.com',
    password: 'password123',
    first_name: 'Chris',
    last_name: 'Miller'
  },
  {
    email: 'amanda.garcia@example.com',
    password: 'password123',
    first_name: 'Amanda',
    last_name: 'Garcia'
  },
  {
    email: 'robert.martinez@example.com',
    password: 'password123',
    first_name: 'Robert',
    last_name: 'Martinez'
  },
  {
    email: 'jennifer.anderson@example.com',
    password: 'password123',
    first_name: 'Jennifer',
    last_name: 'Anderson'
  }
];

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();
    
    const results = {
      success: [],
      errors: []
    };

    for (const user of testUsers) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name
          },
          email_confirm: true // Auto-confirm email
        });

        if (error) {
          results.errors.push({ email: user.email, error: error.message });
        } else {
          results.success.push({ email: user.email, id: data.user.id });
        }
      } catch (err) {
        results.errors.push({ 
          email: user.email, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.success.length} test users successfully`,
      results
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to create test users" }, { status: 500 });
  }
}

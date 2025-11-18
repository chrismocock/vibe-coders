import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

// Get all users
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();
    
    // Get all users from auth.users table
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Get project counts for each user
    const userIds = users.users.map(user => user.id);
    const { data: projects } = await supabase
      .from("projects")
      .select("user_id")
      .in("user_id", userIds);

    // Count projects per user
    const projectCounts = projects?.reduce((acc, project) => {
      acc[project.user_id] = (acc[project.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Format user data
    const formattedUsers = users.users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name || "Unknown",
      lastName: user.user_metadata?.last_name || "User",
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      isActive: true, // Default to active (ban status not directly available in user object)
      projectCount: projectCounts[user.id] || 0
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Perform user actions (disable, enable, reset password, etc.)
export async function POST(req: Request) {
  try {
    const { action, userId, newPassword, userEmail } = await req.json();
    const supabase = getSupabaseServer();

    switch (action) {
      case 'disable':
        const { error: disableError } = await supabase.auth.admin.updateUserById(
          userId,
          { ban_duration: '876000h' } // Ban for 100 years (effectively permanent)
        );
        if (disableError) throw disableError;
        break;

      case 'enable':
        const { error: enableError } = await supabase.auth.admin.updateUserById(
          userId,
          { ban_duration: 'none' } // Remove ban
        );
        if (enableError) throw enableError;
        break;

      case 'resetPassword':
        if (!userEmail) {
          return NextResponse.json({ error: "User email required for password reset" }, { status: 400 });
        }
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: userEmail,
        });
        if (resetError) throw resetError;
        break;

      case 'changePassword':
        if (!newPassword || newPassword.length < 6) {
          return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }
        const { error: changeError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );
        if (changeError) throw changeError;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `User ${action} successful` });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}

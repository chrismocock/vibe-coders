# Admin Dashboard

A comprehensive admin dashboard for managing user accounts and system administration.

## Features

### 🔐 Admin Authentication

- Secure login with username/password
- Session management with localStorage
- Environment variable configuration

### 👥 User Management

- **View all users** with detailed information
- **Search and filter** users by name or email
- **User statistics** (total, active, disabled, projects)
- **Real-time data** with refresh functionality

### 🛠️ User Actions

- **Disable/Enable accounts** - Ban or unban users
- **Change passwords** - Set new passwords for users
- **Send password reset** - Generate recovery links
- **View user details** - Complete user information

### 📊 Dashboard Overview

- **Statistics cards** showing key metrics
- **User activity tracking** with last sign-in dates
- **Project counts** per user
- **Status indicators** for account states

## Access

Navigate to `/admin` to access the admin dashboard.

### Default Credentials

- **Username**: `admin` (or set `ADMIN_USERNAME` env var)
- **Password**: `admin123` (or set `ADMIN_PASSWORD` env var)

## Environment Variables

Add these to your `.env.local` file:

```env
# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
```

## Security Features

- ✅ **Admin-only access** - Separate from user authentication
- ✅ **Secure password handling** - Environment variable storage
- ✅ **Session management** - Automatic logout on browser close
- ✅ **Input validation** - Password requirements and data validation
- ✅ **Error handling** - Comprehensive error messages

## API Endpoints

### Authentication

- `POST /api/admin/auth` - Admin login

### User Management

- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Perform user actions

## Future Enhancements

The admin dashboard is designed to be extensible. Future features can include:

- 📈 **Analytics dashboard** - User growth, project statistics
- 🔧 **System settings** - App configuration management
- 📧 **Email management** - Send notifications to users
- 📊 **Reports** - Generate user and usage reports
- 🔒 **Role management** - Multi-level admin access
- 📝 **Audit logs** - Track admin actions
- 🎨 **Theme management** - Customize app appearance
- 💳 **Billing management** - Handle subscriptions and payments

## Technical Details

### Components

- `src/app/admin/page.tsx` - Main admin dashboard
- `src/components/admin/UserManagement.tsx` - User management interface
- `src/app/api/admin/auth/route.ts` - Admin authentication API
- `src/app/api/admin/users/route.ts` - User management API

### Dependencies

- Supabase Admin API for user management
- React hooks for state management
- Lucide React for icons
- Tailwind CSS for styling

## Usage

1. **Login** with admin credentials
2. **View users** in the management table
3. **Search/filter** users as needed
4. **Click actions** on any user to manage their account
5. **Monitor statistics** in the overview cards

The dashboard provides a complete solution for managing your SaaS application's user base with room for future expansion.

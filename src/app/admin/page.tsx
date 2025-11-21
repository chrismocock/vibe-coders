"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserManagement from "@/components/admin/UserManagement";
import AIConfig from "@/components/admin/AIConfig";
import StageSettings from "@/components/admin/StageSettings";
import { 
  Users, 
  Settings, 
  Shield, 
  UserCheck, 
  UserX,
  Bot,
  Database
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastSignIn: string;
  isActive: boolean;
  projectCount: number;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: ""
  });
  const [isCreatingTestUsers, setIsCreatingTestUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'ai-config' | 'stages'>('users');

  const router = useRouter();

  useEffect(() => {
    // Check if admin is already authenticated
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadUsers();
    }
    setIsLoading(false);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCredentials)
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuth', 'true');
        await loadUsers();
      } else {
        alert('Invalid admin credentials');
      }
    } catch (error) {
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to load users:', response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const handleUserAction = async (action: string, userId: string, data?: any) => {
    try {
      const user = users.find(u => u.id === userId);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          userId, 
          userEmail: user?.email,
          ...data 
        })
      });

      if (response.ok) {
        await loadUsers(); // Refresh user list
        alert(`User ${action} successful`);
      } else {
        const errorData = await response.json();
        alert(`Failed to ${action} user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${action} failed`);
    }
  };

  const createTestUsers = async () => {
    setIsCreatingTestUsers(true);
    try {
      const response = await fetch('/api/admin/create-test-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}\n\nSuccess: ${data.results.success.length}\nErrors: ${data.results.errors.length}`);
        await loadUsers(); // Refresh user list
      } else {
        alert('Failed to create test users');
      }
    } catch (error) {
      alert('Error creating test users');
    } finally {
      setIsCreatingTestUsers(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setUsers([]);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-neutral-900">Admin Login</CardTitle>
            <p className="text-neutral-600">Enter admin credentials to access the dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Username
                </label>
                <Input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter admin username"
                  required
                  className="border-neutral-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Password
                </label>
                <Input
                  type="password"
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter admin password"
                  required
                  className="border-neutral-300"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
                <p className="text-sm text-neutral-600">User Management & System Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={createTestUsers} 
                disabled={isCreatingTestUsers}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCreatingTestUsers ? 'Creating...' : 'Create Test Users'}
              </Button>
              <Button onClick={logout} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-neutral-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Total Users</p>
                  <p className="text-2xl font-bold text-neutral-900">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Active Users</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Disabled Users</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {users.filter(u => !u.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Total Projects</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {users.reduce((sum, user) => sum + user.projectCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                User Management
              </button>
              <button
                onClick={() => setActiveTab('ai-config')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai-config'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Bot className="h-4 w-4 inline mr-2" />
                AI Configuration
              </button>
              <button
                onClick={() => setActiveTab('stages')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stages'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Database className="h-4 w-4 inline mr-2" />
                Stages
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <UserManagement 
            users={users}
            onRefresh={loadUsers}
            onUserAction={handleUserAction}
          />
        )}

        {activeTab === 'ai-config' && (
          <AIConfig onRefresh={loadUsers} />
        )}

        {activeTab === 'stages' && (
          <StageSettings />
        )}
      </div>

    </div>
  );
}

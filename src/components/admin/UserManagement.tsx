"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  MoreVertical, 
  Mail, 
  Key, 
  UserCheck, 
  UserX,
  Eye,
  EyeOff,
  RefreshCw
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

interface UserManagementProps {
  users: User[];
  onRefresh: () => void;
  onUserAction: (action: string, userId: string, data?: any) => Promise<void>;
}

export default function UserManagement({ users, onRefresh, onUserAction }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserActions, setShowUserActions] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = async (action: string, userId: string, data?: any) => {
    setIsLoading(true);
    try {
      await onUserAction(action, userId, data);
      setShowUserActions(false);
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    handleUserAction('changePassword', selectedUser!.id, { newPassword });
  };

  return (
    <>
      <Card className="border border-neutral-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-neutral-900">
              User Management
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border-neutral-300"
                />
              </div>
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="border-neutral-300"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">User</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Projects</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Last Sign In</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-neutral-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-neutral-500">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-neutral-900">{user.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-neutral-900">{user.projectCount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-neutral-900">
                        {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : 'Never'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserActions(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-neutral-300"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Actions Modal */}
      {showUserActions && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Manage User: {selectedUser.firstName} {selectedUser.lastName}
              </CardTitle>
              <p className="text-sm text-neutral-600">{selectedUser.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={() => handleUserAction('resetPassword', selectedUser.id)}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isLoading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Password Reset
                </Button>
                
                <Button
                  onClick={() => {
                    setShowUserActions(false);
                    setShowPasswordModal(true);
                  }}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                
                <Button
                  onClick={() => handleUserAction(
                    selectedUser.isActive ? 'disable' : 'enable', 
                    selectedUser.id
                  )}
                  className={`w-full justify-start ${
                    selectedUser.isActive 
                      ? 'text-red-600 border-red-200 hover:bg-red-50' 
                      : 'text-green-600 border-green-200 hover:bg-green-50'
                  }`}
                  variant="outline"
                  disabled={isLoading}
                >
                  {selectedUser.isActive ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Disable Account
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Enable Account
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowUserActions(false);
                    setSelectedUser(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Change Password for {selectedUser.firstName} {selectedUser.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setSelectedUser(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading || !newPassword || newPassword.length < 6}
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

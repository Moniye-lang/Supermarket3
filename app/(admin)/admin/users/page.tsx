"use client";
import { useEffect, useState, useContext } from "react";
import { Search, UserCog, Mail, ShieldAlert, CheckCircle, AlertCircle, History, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthContext } from "@/context/AuthContext";

export default function AdminUsersPage() {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name");
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.onrender.com";

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const currentToken = token || localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch users:", data);
        setError(data.error || "Failed to load users");
        setUsers([]);
        return;
      }
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    if (!confirm(`Change user role to ${newRole}?`)) return;
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      loadUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Are you sure you want to permanently delete this user account?")) return;
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      loadUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  async function fetchUserHistory(user: any) {
    setSelectedUserForHistory(user);
    setHistoryLoading(true);
    setUserOrders([]);
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user._id}/orders`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching user history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
      // role filter logic
      let matchesRole = true;
      if (roleFilter !== "all") {
          if (roleFilter === "admin") matchesRole = u.role === "admin";
          else if (roleFilter === "worker" || roleFilter === "rider") matchesRole = u.role === roleFilter;
          else if (roleFilter === "customer") matchesRole = u.role === "customer" || !u.role;
      }

      return matchesSearch && matchesRole;
  });

  // Apply sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
      if (sortOption === "name") {
          return (a.name || "").localeCompare(b.name || "");
      }
      if (sortOption === "orders") {
          return (b.totalOrders || 0) - (a.totalOrders || 0);
      }
      if (sortOption === "recent") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
  });

  const getRoleBadge = (user: any) => {
    if (user.role === "admin") {
        return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><ShieldAlert size={12}/> Admin</span>;
    }
    switch(user.role) {
        case "worker": return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><UserCog size={12}/> Worker</span>;
        case "rider": return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><UserCog size={12}/> Rider</span>;
        default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">Customer</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customers, workers, and admins</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 w-full max-w-md">
            <Input 
                placeholder="Search by name or email..." 
                icon={<Search size={18} className="text-gray-400" />}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {["all", "customer", "worker", "rider", "admin"].map(role => (
                <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                        roleFilter === role 
                        ? "bg-brand-primary text-white shadow-md font-bold" 
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                >
                    {role}
                </button>
            ))}
            {/* Sort dropdown */}
            <select 
                className="text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:border-brand-primary cursor-pointer text-gray-700"
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                title="Sort users"
            >
                <option value="name">Sort by Name</option>
                <option value="orders">Sort by Orders (Desc)</option>
                <option value="recent">Sort by Recent (Newest)</option>
            </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-8 text-center flex justify-center">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : sortedUsers.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-300 w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-gray-900">No users found</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th className="p-4 pl-6">User</th>
                            <th className="p-4">Contact Info</th>
                            <th className="p-4">Orders</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedUsers.map(user => (
                            <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{user.name || "Unnamed User"}</p>
                                            <p className="text-xs text-gray-500">Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail size={14} className="text-gray-400" />
                                        {user.email}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-700">{user.totalOrders ?? 0}</td>
                                <td className="p-4">
                                    {getRoleBadge(user)}
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                                        <CheckCircle size={14} /> Active
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 cursor-pointer"
                                            onClick={() => fetchUserHistory(user)}
                                            title="View Order History"
                                        >
                                            <History size={16} />
                                        </Button>
                                        {user.role !== "admin" && (user.role === "worker" || user.role === "rider") && (
                                            <>
                                                <select 
                                                    className="text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:border-brand-primary cursor-pointer text-gray-700"
                                                    value={user.role || "customer"}
                                                    onChange={(e) => updateUserRole(user._id, e.target.value)}
                                                >
                                                    <option value="customer">Set as Customer</option>
                                                    <option value="worker">Set as Pickup Worker</option>
                                                    <option value="rider">Set as Delivery Rider</option>
                                                </select>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                                    onClick={() => deleteUser(user._id)}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* User History Modal */}
      {selectedUserForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                onClick={() => setSelectedUserForHistory(null)}
            />
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-3xl relative z-10 border border-gray-100 max-h-[85vh] overflow-hidden flex flex-col text-gray-700">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedUserForHistory.name}&apos;s History</h2>
                        <p className="text-sm text-gray-500 font-medium">{selectedUserForHistory.email}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedUserForHistory(null)} 
                        className="text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2 cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {historyLoading ? (
                        <div className="p-8 text-center flex justify-center">
                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                    <p className="text-sm text-blue-600 font-bold mb-1">Total Orders</p>
                                    <p className="text-2xl font-black text-blue-900">{userOrders.length}</p>
                                </div>
                                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                                    <p className="text-sm text-green-600 font-bold mb-1">Lifetime Spend</p>
                                    <p className="text-2xl font-black text-green-900">
                                        ₦{userOrders.reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Order List */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Past Orders</h3>
                                {userOrders.length === 0 ? (
                                    <p className="text-gray-500 text-sm italic bg-gray-50 p-4 rounded-xl border border-gray-100">No past orders found for this user.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {userOrders.map(order => (
                                            <div key={order._id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-primary/30 transition-colors">
                                                <div>
                                                    <p className="font-bold text-gray-900">#{order.pickupCode || order.code}</p>
                                                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                                    <p className="text-xs font-medium text-gray-700 mt-1 capitalize">
                                                        {order.items?.length || 0} items • {order.collectionMethod}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 text-right">
                                                    <div>
                                                        <p className="font-bold text-brand-primary">₦{order.amount?.toLocaleString()}</p>
                                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                                                            order.status === "delivered" || order.status === "picked_up" || order.status === "completed" || order.fulfilled
                                                            ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                        }`}>
                                                            {order.fulfilled ? "Completed" : order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
      )}
    </div>
  );
}

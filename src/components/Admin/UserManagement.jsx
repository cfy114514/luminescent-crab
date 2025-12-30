import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit3, Shield, User, X, Check, Loader2, RefreshCw } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/users', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create user');
            }

            fetchUsers();
            setShowCreateModal(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateUser = async (id, updates) => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updates)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update user');
            }

            fetchUsers();
            setEditingUser(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('确定要删除此用户吗？此操作不可撤销。')) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">用户管理</h2>
                        <p className="text-xs text-slate-500">管理系统用户账户</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchUsers}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="刷新"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        添加用户
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 underline">关闭</button>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 text-left">
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">用户</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">角色</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">状态</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">创建时间</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-500/20' : 'bg-slate-700'}`}>
                                                {user.role === 'admin' ? (
                                                    <Shield className="w-4 h-4 text-purple-400" />
                                                ) : (
                                                    <User className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{user.display_name || user.username}</div>
                                                <div className="text-xs text-slate-500">@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>
                                            {user.role === 'admin' ? '管理员' : '用户'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {user.is_active ? '活跃' : '禁用'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-400">
                                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                                title="编辑"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                                                title="删除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <UserFormModal
                    title="添加用户"
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateUser}
                />
            )}

            {/* Edit Modal */}
            {editingUser && (
                <UserFormModal
                    title="编辑用户"
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSubmit={(data) => handleUpdateUser(editingUser.id, data)}
                />
            )}
        </div>
    );
};

const UserFormModal = ({ title, user, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        displayName: user?.display_name || '',
        password: '',
        role: user?.role || 'user',
        isActive: user?.is_active ?? true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSubmit(formData);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">用户名</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData(d => ({ ...d, username: e.target.value }))}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                            required
                            disabled={!!user}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">显示名称</label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData(d => ({ ...d, displayName: e.target.value }))}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                            {user ? '新密码 (留空保持不变)' : '密码'}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData(d => ({ ...d, password: e.target.value }))}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                            required={!user}
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">角色</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData(d => ({ ...d, role: e.target.value }))}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        >
                            <option value="user">普通用户</option>
                            <option value="admin">管理员</option>
                        </select>
                    </div>
                    {user && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(d => ({ ...d, isActive: e.target.checked }))}
                                className="rounded border-white/10"
                            />
                            <label htmlFor="isActive" className="text-sm text-slate-300">账户启用</label>
                        </div>
                    )}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;

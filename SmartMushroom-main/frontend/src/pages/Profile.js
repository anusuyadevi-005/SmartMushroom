import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import {
    User,
    Mail,
    Shield,
    Settings,
    Bell,
    Lock,
    LogOut,
    Camera,
    ChevronRight,
    Globe,
    MapPin,
    Phone,
    CheckCircle2,
    Edit2,
    X,
    Save,
    Key,
    AlertCircle,
    Loader2
} from "lucide-react";

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: "", phone: "", address: "" });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [message, setMessage] = useState({ type: "", text: "" });

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            setEditData({
                name: res.data.name || "",
                phone: res.data.phone || "",
                address: res.data.address || ""
            });
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            setError("Failed to load profile. Please try logging in again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePictureClick = () => {
        fileInputRef.current?.click();
    };

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await api.post("/auth/upload-picture", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setUser({ ...user, picture: res.data.picture });
            window.dispatchEvent(new Event('profileUpdated'));
            setMessage({ type: "success", text: "Profile picture updated!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.error || "Failed to upload image" });
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login";
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        try {
            await api.put('/auth/update', editData);
            setUser({ ...user, ...editData });
            window.dispatchEvent(new Event('profileUpdated'));
            setIsEditing(false);
            setMessage({ type: "success", text: "Profile updated successfully!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.error || "Failed to update profile" });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }
        try {
            await api.put('/auth/change-password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            setIsChangingPassword(false);
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setMessage({ type: "success", text: "Password changed successfully!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.error || "Failed to change password" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md">
                    <LogOut className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-800">Session Expired</h2>
                    <p className="text-red-600 mt-2 mb-6">{error}</p>
                    <button onClick={handleLogout} className="bg-red-600 text-white px-8 py-2 rounded-lg font-bold">Log In</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-['Outfit',_sans-serif]">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap');`}</style>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePictureUpload} 
                className="hidden" 
                accept="image/*"
            />

            {/* Notifications */}
            {message.text && (
                <div className={`fixed top-24 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce ${message.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                    } text-white`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            {/* Profile Header Overlay */}
            <div className="bg-emerald-800 h-48 relative">
                <div className="max-w-4xl mx-auto px-6 pt-24 text-white">
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 relative z-10 transition-all hover:shadow-emerald-900/10">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden transition-transform group-hover:scale-105">
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                ) : user.picture ? (
                                    <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-emerald-600" />
                                )}
                            </div>
                            <button 
                                onClick={handlePictureClick}
                                disabled={uploading}
                                className="absolute bottom-1 right-1 bg-emerald-600 text-white p-2.5 rounded-full shadow-lg hover:bg-emerald-700 hover:scale-110 transition-all disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h1 className="text-3xl font-extrabold text-gray-900">{user.name || "User"}</h1>
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                    <Shield className="w-3 h-3" /> {user.role || "Member"}
                                </span>
                            </div>
                            <p className="text-gray-500 mt-1.5 flex items-center justify-center md:justify-start gap-2 font-medium">
                                <Mail className="w-4 h-4 text-emerald-600" /> {user.email}
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
                                <button
                                    onClick={() => {
                                        setIsEditing(!isEditing);
                                        setIsChangingPassword(false);
                                    }}
                                    className="bg-emerald-600 text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    {isEditing ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
                                </button>
                                <button onClick={handleLogout} className="bg-gray-100 text-gray-700 px-8 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    <LogOut size={16} /> Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-36 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar Menu */}
                <div className="lg:col-span-1 space-y-3">
                    {[
                        { icon: <User className="w-5 h-5" />, label: "Personal Info", active: !isChangingPassword },
                        { icon: <Lock className="w-5 h-5" />, label: "Security", active: isChangingPassword, onClick: () => setIsChangingPassword(true) },
                        { icon: <Bell className="w-5 h-5" />, label: "Notifications" },
                        { icon: <Globe className="w-5 h-5" />, label: "Language" },
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={item.onClick || (() => setIsChangingPassword(false))}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${item.active
                                    ? 'bg-white shadow-xl border-emerald-100 text-emerald-700 font-bold translate-x-1'
                                    : 'bg-white/50 border-transparent hover:bg-white text-gray-400 font-medium hover:text-emerald-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${item.active ? 'rotate-90 opacity-100' : 'opacity-30'}`} />
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {!isChangingPassword ? (
                        <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><User size={24} /></div>
                                    Personal Details
                                </h3>
                                {isEditing && <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-tighter animate-pulse">Edit Mode</span>}
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {/* Full Name */}
                                    <div className="group space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Full Name</label>
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isEditing ? 'bg-white border-emerald-200 shadow-inner' : 'bg-gray-50 border-transparent'
                                            }`}>
                                            <User className={`w-5 h-5 ${isEditing ? 'text-emerald-600' : 'text-gray-300'}`} />
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent outline-none font-bold text-gray-800"
                                                    value={editData.name}
                                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                                    placeholder="Enter your name"
                                                />
                                            ) : (
                                                <span className="text-gray-800 font-bold">{user.name || "Enter your name"}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Number */}
                                    <div className="group space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Phone Number</label>
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isEditing ? 'bg-white border-emerald-200 shadow-inner' : 'bg-gray-50 border-transparent'
                                            }`}>
                                            <Phone className={`w-5 h-5 ${isEditing ? 'text-emerald-600' : 'text-gray-300'}`} />
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent outline-none font-bold text-gray-800"
                                                    value={editData.phone}
                                                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                                    placeholder="e.g. +91 98765 43210"
                                                />
                                            ) : (
                                                <span className="text-gray-800 font-bold">{user.phone || "No phone added"}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Physical Address */}
                                    <div className="md:col-span-2 group space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Delivery Address</label>
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isEditing ? 'bg-white border-emerald-200 shadow-inner' : 'bg-gray-50 border-transparent'
                                            }`}>
                                            <MapPin className={`w-5 h-5 ${isEditing ? 'text-emerald-600' : 'text-gray-300'}`} />
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent outline-none font-bold text-gray-800"
                                                    value={editData.address}
                                                    onChange={e => setEditData({ ...editData, address: e.target.value })}
                                                    placeholder="Street, City, State, Zip"
                                                />
                                            ) : (
                                                <span className="text-gray-800 font-bold">{user.address || "No address saved"}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="submit"
                                            className="bg-emerald-600 text-white px-10 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-2"
                                        >
                                            <Save size={18} /> Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="bg-gray-100 text-gray-500 px-10 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Lock size={24} /></div>
                                    Security Settings
                                </h3>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Current Password</label>
                                    <div className="flex items-center gap-3 p-4 rounded-2xl border-2 bg-gray-50 border-transparent focus-within:bg-white focus-within:border-emerald-200 transition-all">
                                        <Key className="w-5 h-5 text-gray-300 group-focus-within:text-emerald-600" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-transparent outline-none font-bold text-gray-800"
                                            value={passwordData.oldPassword}
                                            onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">New Password</label>
                                        <div className="flex items-center gap-3 p-4 rounded-2xl border-2 bg-gray-50 border-transparent focus-within:bg-white focus-within:border-emerald-200 transition-all">
                                            <Lock className="w-5 h-5 text-gray-300" />
                                            <input
                                                type="password"
                                                required
                                                className="w-full bg-transparent outline-none font-bold text-gray-800"
                                                value={passwordData.newPassword}
                                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Confirm Password</label>
                                        <div className="flex items-center gap-3 p-4 rounded-2xl border-2 bg-gray-50 border-transparent focus-within:bg-white focus-within:border-emerald-200 transition-all">
                                            <Lock className="w-5 h-5 text-gray-300" />
                                            <input
                                                type="password"
                                                required
                                                className="w-full bg-transparent outline-none font-bold text-gray-800"
                                                value={passwordData.confirmPassword}
                                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="submit"
                                        className="bg-emerald-900 text-white px-10 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-900/30 hover:bg-black hover:-translate-y-1 transition-all flex items-center gap-2"
                                    >
                                        Update Password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsChangingPassword(false)}
                                        className="bg-gray-100 text-gray-500 px-10 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Bottom Status Card */}
                    <div className="bg-emerald-900 rounded-[2rem] shadow-2xl p-8 text-white flex items-center justify-between overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="text-2xl font-black flex items-center gap-3">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" /> Account Active
                            </h4>
                            <p className="text-emerald-100/70 font-medium mt-1">Your identity is secured by AgroSense protocol.</p>
                        </div>
                        <div className="relative z-10">
                            <Shield className="w-20 h-20 text-emerald-800/50 group-hover:text-emerald-700/50 transition-colors group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;

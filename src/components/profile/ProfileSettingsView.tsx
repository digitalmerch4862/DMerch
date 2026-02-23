import React, { useEffect, useState } from 'react';
import { User, Palette, Save, Loader2, Shield } from 'lucide-react';

interface ProfileSettingsViewProps {
  username: string;
  fullName?: string;
  avatarUrl?: string;
  currency: 'PHP' | 'USD';
  isAdmin: boolean;
  isSaving: boolean;
  onSave: (payload: {
    username: string;
    fullName: string;
    avatarUrl: string;
    preferredCurrency: 'PHP' | 'USD';
  }) => Promise<void>;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  username,
  fullName,
  avatarUrl,
  currency,
  isAdmin,
  isSaving,
  onSave
}) => {
  const [form, setForm] = useState({
    username: username || '',
    fullName: fullName || '',
    avatarUrl: avatarUrl || '',
    preferredCurrency: currency
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      username: username || '',
      fullName: fullName || '',
      avatarUrl: avatarUrl || '',
      preferredCurrency: currency
    });
  }, [username, fullName, avatarUrl, currency]);

  const handleSave = async () => {
    setMessage(null);
    setError(null);

    if (!form.username.trim()) {
      setError('Username is required.');
      return;
    }

    try {
      await onSave({
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        avatarUrl: form.avatarUrl.trim(),
        preferredCurrency: form.preferredCurrency
      });
      setMessage('Profile settings updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile.');
    }
  };

  return (
    <div className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[#050810]">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tighter">Profile Settings</h2>
          <p className="text-slate-500 font-medium">Personalize your account and preferences.</p>
        </div>

        <div className="bg-[#0a0f1d] border border-white/5 rounded-[3rem] p-8 md:p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <User size={24} />
            </div>
            <div>
              <p className="text-white font-bold">Identity</p>
              <p className="text-[11px] text-slate-500">Set how your profile appears across the app.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                placeholder="your-username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                placeholder="Your full name"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avatar URL</label>
              <input
                type="url"
                value={form.avatarUrl}
                onChange={(e) => setForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Palette size={24} />
            </div>
            <div>
              <p className="text-white font-bold">Preferences</p>
              <p className="text-[11px] text-slate-500">Choose your default billing display currency.</p>
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Currency</label>
            <select
              value={form.preferredCurrency}
              onChange={(e) => setForm(prev => ({ ...prev, preferredCurrency: e.target.value as 'PHP' | 'USD' }))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer"
            >
              <option value="PHP">PHP</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div className="h-px bg-white/5" />

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <Shield size={14} />
              <span>{isAdmin ? 'Administrator account active' : 'Standard user account'}</span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20 flex items-center gap-3 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
          {message && <p className="text-emerald-400 text-xs font-medium">{message}</p>}
        </div>
      </div>
    </div>
  );
};

const fs = require('fs');
let content = fs.readFileSync('src/pages/PendingActions.tsx', 'utf8');

// Replace states
content = content.replace(
  "const [pending, setPending] = useState<any[]>([]);",
  "const [pending, setPending] = useState<any[]>([]);\n  const [phoneRequests, setPhoneRequests] = useState<any[]>([]);"
);

// Replace fetchData
content = content.replace(
  "const [attRes, usersRes] = await Promise.all([",
  "const [attRes, usersRes, phoneRes] = await Promise.all([\n        axios.get('/api/attendances'),\n        axios.get('/api/users'),\n        axios.get('/api/phone-requests')"
);

content = content.replace(
  "setUsers(usersRes.data);",
  "setUsers(usersRes.data);\n      setPhoneRequests((phoneRes.data || []).filter((r: any) => r.status === 'pending'));"
);

// Add handlePhoneAction
const handlePhoneActionCode = `
  const handlePhoneAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await axios.post(\`/api/phone-requests/\${id}\`, { status: action });
      toast.success(\`Pengajuan ganti nomor berhasil di-\${action === 'approved' ? 'setujui' : 'tolak'}\`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal memproses pengajuan ganti nomor');
    }
  };
`;
content = content.replace("const handleAction = async", handlePhoneActionCode + "\n  const handleAction = async");

// Add UI for Phone Requests
const phoneRequestsUI = `
      {/* Phone Requests Section */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mt-4">
        <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-blue-500 mr-2" />
            <h2 className="text-xs font-bold text-slate-400 uppercase">Persetujuan Ganti Nomor (Pending Actions)</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {phoneRequests.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">
              Tidak ada pengajuan ganti nomor yang menunggu persetujuan.
            </div>
          ) : (
            <div className="grid gap-4">
              {phoneRequests.map((req) => (
                <div key={req.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-start space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200">{req.user_name || req.user_id}</span>
                        <span className="text-xs text-slate-500 font-mono">{new Date(req.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Nomor Lama: <span className="text-slate-300 font-mono">{req.user_id}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Nomor Baru: <span className="text-emerald-400 font-mono font-bold">{req.new_number}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePhoneAction(req.id, 'approved')}
                      className="p-2 bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50 rounded transition-colors"
                      title="Setujui"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePhoneAction(req.id, 'rejected')}
                      className="p-2 bg-rose-900/50 text-rose-400 hover:bg-rose-800/50 rounded transition-colors"
                      title="Tolak"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
`;
content = content.replace("</div>\n    </div>", "</div>\n" + phoneRequestsUI + "    </div>");

fs.writeFileSync('src/pages/PendingActions.tsx', content);

const fs = require('fs');
let code = fs.readFileSync('src/pages/PendingActions.tsx', 'utf8');

if (!code.includes('isModalOpen')) {
  // Add modal state
  code = code.replace(
    /const \[selectedIds, setSelectedIds\] = useState<Set<string>>\(new Set\(\)\);/,
    `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAtt, setModalAtt] = useState<any>(null);
  const [modalAction, setModalAction] = useState<'approved'|'rejected'>('approved');
  const [modalData, setModalData] = useState({ notes: '', penalty_amount: 0, bonus_amount: 0, attendance_status: '' });`
  );

  // Replace handleAction with openModal
  code = code.replace(
    /const handleAction = async \(id: string, action: 'approved' \| 'rejected'\) => {[\s\S]*?};/,
    `const openModal = (att: any, action: 'approved' | 'rejected') => {
    setModalAtt(att);
    setModalAction(action);
    setModalData({
      notes: action === 'approved' ? 'Disetujui Admin' : 'Ditolak Admin',
      penalty_amount: att.penalty_amount || 0,
      bonus_amount: att.bonus_amount || 0,
      attendance_status: att.status || ''
    });
    setIsModalOpen(true);
  };

  const submitModalAction = async () => {
    if (!modalAtt) return;
    try {
      await axios.put(\`/api/attendances/\${modalAtt.id}/approval\`, {
        status: modalAction,
        notes: modalData.notes,
        penalty_amount: Number(modalData.penalty_amount),
        bonus_amount: Number(modalData.bonus_amount),
        attendance_status: modalData.attendance_status
      });
      toast.success(\`Absensi berhasil di-\${modalAction === 'approved' ? 'setujui' : 'tolak'}\`);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Gagal memproses aksi');
    }
  };`
  );

  // Update JSX buttons to call openModal instead of handleAction
  code = code.replace(
    /onClick=\{\(\) => handleAction\(att\.id, 'approved'\)\}/g,
    `onClick={() => openModal(att, 'approved')}`
  );
  code = code.replace(
    /onClick=\{\(\) => handleAction\(att\.id, 'rejected'\)\}/g,
    `onClick={() => openModal(att, 'rejected')}`
  );

  // Append modal JSX before the final closing div tag of the component
  const modalJsx = `
      {isModalOpen && modalAtt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-md w-full border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Konfirmasi {modalAction === 'approved' ? 'Persetujuan' : 'Penolakan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status Kehadiran</label>
                <select
                  value={modalData.attendance_status}
                  onChange={e => setModalData({...modalData, attendance_status: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="on_time">Tepat Waktu (on_time)</option>
                  <option value="late">Telat (late)</option>
                  <option value="early_leave">Pulang Cepat (early_leave)</option>
                  <option value="holiday">Izin/Libur (holiday)</option>
                  <option value="absent">Alpha (absent)</option>
                  <option value="overtime">Lembur (overtime)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Potongan/Denda (Rp)</label>
                <input type="number"
                  value={modalData.penalty_amount}
                  onChange={e => setModalData({...modalData, penalty_amount: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bonus (Rp)</label>
                <input type="number"
                  value={modalData.bonus_amount}
                  onChange={e => setModalData({...modalData, bonus_amount: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Catatan Admin (Balasan Bot)</label>
                <textarea
                  value={modalData.notes}
                  onChange={e => setModalData({...modalData, notes: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Batal</button>
                <button onClick={submitModalAction} className={\`px-4 py-2 \${modalAction === 'approved' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-lg text-sm font-medium transition-colors\`}>
                  Simpan Keputusan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;
  code = code.replace(/<\/div>\n    <\/div>\n  \);\n\}\n$/, `${modalJsx}    </div>\n  );\n}\n`);
}

fs.writeFileSync('src/pages/PendingActions.tsx', code);

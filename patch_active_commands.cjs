const fs = require('fs');
let code = fs.readFileSync('src/pages/ActiveCommands.tsx', 'utf8');

const importsOld = `import { Terminal, Bot } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ActiveCommands() {
  const [commands, setCommands] = useState<any>(null);
  const [customCommands, setCustomCommands] = useState<any[]>([]);`;

const importsNew = `import { Terminal, Bot, Save, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ActiveCommands() {
  const [commands, setCommands] = useState<any>(null);
  const [replies, setReplies] = useState<any>(null);
  const [customCommands, setCustomCommands] = useState<any[]>([]);
  const [templatesData, setTemplatesData] = useState<any>(null);`;

code = code.replace(importsOld, importsNew);

const fetchOld = `        if (response.data) {
          setCommands(response.data.commands || {});
          setCustomCommands(response.data.custom_commands || []);
        }`;

const fetchNew = `        if (response.data) {
          setTemplatesData(response.data);
          setCommands(response.data.commands || {});
          setReplies(response.data.replies || {});
          setCustomCommands(response.data.custom_commands || []);
        }`;

code = code.replace(fetchOld, fetchNew);

const saveFunc = `
  const handleSaveReplies = async () => {
    try {
      const updatedTemplates = { ...templatesData, replies };
      await axios.post('/api/bot-templates', updatedTemplates);
      toast.success('Pesan balasan berhasil disimpan');
      setTemplatesData(updatedTemplates);
    } catch (err) {
      toast.error('Gagal menyimpan pesan balasan');
    }
  };

  return (`;

code = code.replace(/  return \(/, saveFunc);

const repliesSection = `      {replies && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
              Pesan Balasan Sistem (Editable)
            </h2>
            <button
              onClick={handleSaveReplies}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors flex items-center text-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(replies).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <textarea
                    value={replies[key]}
                    onChange={(e) => setReplies({ ...replies, [key]: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 min-h-[100px]"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">*Gunakan variabel {'{name}'}, {'{time}'}, {'{duration}'}, {'{late_quota_left}'} di dalam teks jika diperlukan.</p>
          </div>
        </div>
      )}`;

code = code.replace(/    <\/div>\n  \);\n\}\n$/, `\n${repliesSection}\n    </div>\n  );\n}\n`);

fs.writeFileSync('src/pages/ActiveCommands.tsx', code);

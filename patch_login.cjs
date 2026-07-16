const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

if (!content.includes('to="/change-number"')) {
  content = content.replace(
    "</form>",
    `</form>
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50 flex flex-col items-center space-y-2">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Pengguna (Karyawan)</p>
          <Link to="/change-number" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Ajukan Ganti Nomor WhatsApp
          </Link>
        </div>`
  );
  
  if (!content.includes("import { Link")) {
    content = content.replace(
      "import { useNavigate } from 'react-router-dom';",
      "import { useNavigate, Link } from 'react-router-dom';"
    );
  }
}

fs.writeFileSync('src/pages/Login.tsx', content);

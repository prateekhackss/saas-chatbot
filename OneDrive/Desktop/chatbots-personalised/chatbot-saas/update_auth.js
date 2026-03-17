const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'auth', 'auth-shell.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Global replaces
content = content.replace(/slate-/g, 'stone-');
content = content.replace(/sky-/g, 'teal-');
content = content.replace(/cyan-/g, 'teal-');

// Background gradient
content = content.replace(
  /bg-\[radial-gradient\(circle_at_top_left,_rgba\(14,165,233,0\.18\),_transparent_34%\),radial-gradient\(circle_at_bottom_right,_rgba\(15,23,42,0\.12\),_transparent_40%\),linear-gradient\(180deg,_#f8fafc_0%,_#eef2ff_100%\)\]/g,
  'bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(28,25,23,0.12),_transparent_40%),linear-gradient(180deg,_#FAFAF9_0%,_#F5F5F4_100%)]'
);

// Left panel bg (handled mostly by slate -> stone)
// Left panel radial:
// Currently it's bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.28),_transparent_45%)]
content = content.replace(
  /bg-\[radial-gradient\(circle_at_top,_rgba\(56,189,248,0\.35\),_transparent_35%\),radial-gradient\(circle_at_bottom_right,_rgba\(59,130,246,0\.28\),_transparent_45%\)\]/g,
  'bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.35),_transparent_35%)]'
);

// Add missing main padding/classes adjustment if needed (the original had px-4 py-10 etc, preserved above by just replacing the bg class)

fs.writeFileSync(filePath, content, 'utf8');
console.log('auth-shell.tsx updated.');

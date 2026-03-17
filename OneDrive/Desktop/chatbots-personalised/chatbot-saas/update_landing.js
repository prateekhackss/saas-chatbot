const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'landing', 'landing-page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Global replaces
content = content.replace(/slate-/g, 'stone-');
content = content.replace(/sky-/g, 'teal-');
content = content.replace(/cyan-/g, 'teal-');

// Background gradient
content = content.replace(
  /bg-\[linear-gradient\(180deg,_#f8fbff_0%,_#ffffff_36%,_#f8fafc_100%\)\]/g,
  'bg-[linear-gradient(180deg,_#FAFAF9_0%,_#FFFFFF_36%,_#F5F5F4_100%)]'
);

// Blobs
content = content.replace(
  /bg-teal-300\/35/g,
  'bg-teal-200/30'
);
content = content.replace(
  /bg-teal-400\/25/g,
  'bg-amber-200/20'
);
content = content.replace(
  /bg-emerald-300\/20/g,
  'bg-emerald-200/25'
);

// Pricing Highlight Card
// Currently it's:
// `border-teal-400 bg-white text-stone-950` (after cyan->teal replace)
content = content.replace(
  /"border-teal-400 bg-white text-stone-950"/g,
  '"border-amber-400 bg-white text-stone-950"'
);

// Most popular pill
// Currently it's:
// <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-900">
content = content.replace(
  /<span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-\[0\.2em\] text-teal-900">/g,
  '<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('landing-page.tsx updated.');

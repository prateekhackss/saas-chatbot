const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function processContent(content, filePath) {
  let newContent = content;
  
  // Exclude globals.css and tailwind.config.ts and node_modules / build folders
  if (filePath.includes('.next') || filePath.includes('node_modules') || filePath.includes('globals.css') || filePath.includes('tailwind.config.ts') || filePath.includes('update_')) {
    return content;
  }

  // Only target tsx / ts files
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return content;

  // 1. All generic cyan, sky and slate to teal, teal and stone
  newContent = newContent.replace(/slate-/g, 'stone-');
  newContent = newContent.replace(/sky-/g, 'teal-');
  newContent = newContent.replace(/cyan-/g, 'teal-');
  
  // Specific tweaks based on NEXUSCHAT-DESIGN-SYSTEM.md
  
  // Dashboard Overview:
  // "bg-blue-100 text-blue-600" to "bg-teal-100 p-2"><Users className="text-teal-600" />
  // "bg-amber-100 p-2"><Bot className="text-amber-600" />
  // Currently the overview likely uses `bg-teal-100 text-teal-600` because `sky` gets replaced to `teal`. Wait, the design refers to `sky` as well? Let's not guess the exact existing string if `sky/cyan` replace already handles it. But we know we need `amber-` for the Bot icon so let's do a manual pass on DashboardOverview after this.
  
  // Widget: "Default primaryColor when none set: text-stone-900 or #0F766E"
  if (filePath.endsWith('widget-page-client.tsx')) {
    newContent = newContent.replace(/#000000/g, '#0F766E');
    newContent = newContent.replace(/#000/g, '#0F766E');
    newContent = newContent.replace(/black/g, '#0F766E');
    // typing dots
    newContent = newContent.replace(/gray-400\/60/g, 'stone-400/60');
    // user avatar defaults
    newContent = newContent.replace(/blue-500/g, 'teal-600');
    newContent = newContent.replace(/gray-100/g, 'teal-50');
  }

  // Auth pages (handled earlier but just in case)
  if (filePath.endsWith('auth-shell.tsx') || filePath.endsWith('landing-page.tsx')) {
    // skip, already meticulously processed
    return content; 
  }

  // Client Detail form accents
  // Dashboard Sidebar (slate->stone, sky->teal handled via regex)
  
  return newContent;
}

const targetDirs = [
  path.join(__dirname, 'components'),
  path.join(__dirname, 'app'),
];

targetDirs.forEach(dir => {
  walkDir(dir, (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const newContent = processContent(content, filePath);
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    } catch (e) {
      console.error(`Error reading ${filePath}`, e);
    }
  });
});

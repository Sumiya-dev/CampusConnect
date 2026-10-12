const fs = require('fs');
const path = require('path');

const replacements = {
  // Main colors
  '[#000000]': 'background',
  '[#0A0A0A]': 'surface',
  '[#121212]': 'elevated',
  '[#EDEDED]': 'foreground',
  '[#9AA1AA]': 'muted',
  '[#222222]': 'border',
  '[#FF6B00]': 'accent',
  
  // Secondary palette
  '[#111418]': 'surface',
  '[#171B20]': 'elevated',
  '[#252A31]': 'border',
  '[#F1F3F5]': 'foreground',

  // Red & Green (Success/Error)
  '[#EF4444]': 'red-500',
  '[#22C55E]': 'green-500',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let filesUpdated = 0;

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (const [hex, semantic] of Object.entries(replacements)) {
      // We want to replace things like bg-[hex] with bg-semantic
      // We'll use a regex to match the class prefixes
      const regex = new RegExp(`([a-zA-Z0-9-]+)-\\${hex}`, 'g');
      content = content.replace(regex, `$1-${semantic}`);

      // Also replace arbitrary opacities like bg-[#22C55E]/10
      const regexOpacity = new RegExp(`([a-zA-Z0-9-]+)-\\${hex}\\/([0-9]+)`, 'g');
      content = content.replace(regexOpacity, `$1-${semantic}/$2`);
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesUpdated++;
    }
  }
});

console.log(`Updated ${filesUpdated} files.`);

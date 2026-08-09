import fs from 'node:fs';

const file = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(file, 'utf8');
const replacements = [
  [/onclick="switchCompany\('([^']+)'\);toggleArchive\(\)"/g, 'data-action="switch-company" data-company="$1" data-close-archive="true"'],
  [/onclick="switchCompany\('([^']+)'\)"/g, 'data-action="switch-company" data-company="$1"'],
  [/onclick="switchSubTab\('([^']+)',\s*'([^']+)'\)"/g, 'data-action="switch-subtab" data-company="$1" data-category="$2"'],
  [/onclick="toggleCard\(this\)"/g, 'data-action="toggle-card"'],
  [/onclick="toggleArchive\(\)"/g, 'data-action="toggle-archive"'],
  [/onclick="scrollToTop\(\)"/g, 'data-action="scroll-top"'],
  [/onclick="expandAll\(\)"/g, 'data-action="expand-all"'],
  [/onclick="startTimer\('([^']+)',\s*(\d+)\)"/g, 'data-action="timer" data-target="$1" data-seconds="$2"'],
  [/onclick="speakText\(this\)"/g, 'data-action="speak"'],
  [/onclick="toggleMastered\(this,\s*(\d+)\)"/g, 'data-action="mastered" data-legacy-index="$1"'],
  [/onclick="randomPractice\('([^']+)'\)"/g, 'data-action="random" data-content="$1"'],
  [/oninput="filterInterviewCards\(this,\s*'([^']+)'\)"/g, 'data-action="filter" data-content="$1"'],
  [/\s+onerror="[^"]*"/g, '']
];
for (const [pattern, replacement] of replacements) html = html.replace(pattern, replacement);
fs.writeFileSync(file, html);

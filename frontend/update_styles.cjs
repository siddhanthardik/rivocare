const fs = require('fs');
const file = 'd:/carely/frontend/src/pages/Landing.jsx';
let code = fs.readFileSync(file, 'utf8');

// Color Updates
code = code.replace(/#0f52ba/g, '#2563EB');
code = code.replace(/#0f172a/g, '#1E293B');
code = code.replace(/text-blue-600/g, 'text-primary-600');
code = code.replace(/bg-blue-600/g, 'bg-primary-600');
code = code.replace(/bg-blue-50/g, 'bg-primary-50');
code = code.replace(/bg-blue-100/g, 'bg-primary-100');
code = code.replace(/border-blue-100/g, 'border-primary-100');
code = code.replace(/border-blue-200/g, 'border-primary-200');
code = code.replace(/border-blue-500/g, 'border-primary-500');
code = code.replace(/text-blue-500/g, 'text-primary-500');
code = code.replace(/shadow-blue-500\/20/g, 'shadow-primary-500/20');
code = code.replace(/hover:bg-blue-800/g, 'hover:bg-primary-800');
code = code.replace(/hover:bg-blue-50/g, 'hover:bg-primary-50');
code = code.replace(/bg-blue-700/g, 'bg-primary-700');

// Font Updates (Add font-poppins to headings)
code = code.replace(/<h([1-6])(.*?)className="/g, '<h$1$2className="font-poppins ');

fs.writeFileSync(file, code);
console.log("Updated colors and typography in Landing.jsx");

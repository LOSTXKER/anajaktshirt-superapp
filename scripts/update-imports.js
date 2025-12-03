#!/usr/bin/env node
/**
 * Update imports to use centralized index file
 */

const fs = require('fs');
const path = require('path');

// Files to process
const files = [
  'src/app/order/[token]/page.tsx',
  'src/app/settings/layout.tsx',
  'src/app/settings/page.tsx',
  'src/app/track/page.tsx',
  'src/app/products/[main_sku]/page.tsx',
  'src/app/products/layout.tsx',
  'src/app/products/page.tsx',
  'src/app/calculator/layout.tsx',
  'src/app/calculator/page.tsx',
  'src/app/crm/layout.tsx',
  'src/app/crm/page.tsx',
  'src/app/dashboard/layout.tsx',
  'src/app/audit/layout.tsx',
  'src/app/audit/page.tsx',
  'src/app/users/layout.tsx',
  'src/app/users/page.tsx',
  'src/app/production/layout.tsx',
  'src/app/production/tracking/[id]/page.tsx',
  'src/app/production/tracking/page.tsx',
  'src/app/production/page.tsx',
  'src/app/orders/layout.tsx',
  'src/app/orders/[id]/page.tsx',
  'src/app/orders/page.tsx',
  'src/app/orders/create/page.tsx',
  'src/app/(auth)/login/page.tsx',
  'src/app/stock/layout.tsx',
  'src/app/stock/history/page.tsx',
  'src/app/stock/page.tsx',
  'src/app/providers.tsx',
];

// Components that can be imported from index
const indexComponents = [
  'Button', 'ButtonProps',
  'Card', 'CardHeader', 'CardFooter', 'CardTitle', 'CardDescription', 'CardContent', 'StatCard',
  'Input', 'Textarea', 'Label', 'InputProps', 'TextareaProps', 'LabelProps',
  'Modal', 'ModalFooter',
  'Select', 'SelectProps',
  'Badge',
  'Dropdown',
  'StatusBadge', 'PaymentStatusBadge', 'PriorityBadge',
  'EmptyState', 'LoadingState', 'ErrorState',
  'PageHeader', 'PageContainer', 'Section',
  'Sidebar',
  'ToastProvider', 'useToast', 'ConfirmDialog',
  'FileUpload', 'ImageUpload',
];

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Find all imports from @/modules/shared/ui/*
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/modules\/shared\/ui\/[^'"]+['"]\s*;?\n?/g;
  const imports = new Set();
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    // Extract component names
    const components = match[1].split(',').map(c => c.trim()).filter(c => c);
    components.forEach(c => {
      // Handle 'Component as Alias' syntax
      const name = c.split(' as ')[0].trim();
      if (indexComponents.includes(name)) {
        imports.add(c.trim());
      }
    });
  }
  
  if (imports.size === 0) {
    console.log(`⏭️  No changes needed: ${filePath}`);
    return;
  }
  
  // Remove old imports
  content = content.replace(importRegex, '');
  
  // Clean up multiple empty lines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Add new consolidated import at the top (after 'use client' if present)
  const importLine = `import { ${Array.from(imports).sort().join(', ')} } from '@/modules/shared/ui';\n`;
  
  if (content.includes("'use client'")) {
    content = content.replace(/'use client';\n*/, `'use client';\n\n${importLine}`);
  } else {
    content = importLine + content;
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated: ${filePath} (${imports.size} imports consolidated)`);
  } else {
    console.log(`⏭️  No changes: ${filePath}`);
  }
}

console.log('🔄 Updating imports to use centralized index...\n');

files.forEach(file => {
  try {
    processFile(file);
  } catch (err) {
    console.log(`❌ Error processing ${file}:`, err.message);
  }
});

console.log('\n✨ Done!');


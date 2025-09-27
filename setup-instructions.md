# JMeter HTML Report Generator - Local Setup

## Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

## Setup Instructions

### 1. Create Project Directory
```bash
mkdir jmeter-report-generator
cd jmeter-report-generator
```

### 2. Initialize Project
```bash
npm init -y
```

### 3. Install Dependencies
```bash
# Core dependencies
npm install react@latest react-dom@latest
npm install @types/react@latest @types/react-dom@latest
npm install typescript@latest
npm install vite@latest @vitejs/plugin-react@latest

# UI and styling
npm install tailwindcss@latest autoprefixer@latest postcss@latest
npm install lucide-react@latest

# Data processing libraries
npm install papaparse@latest @types/papaparse@latest
npm install lodash@latest @types/lodash@latest
npm install simple-statistics@latest

# Chart libraries
npm install chart.js@latest chartjs-adapter-date-fns@latest
npm install date-fns@latest

# Development dependencies
npm install --save-dev eslint@latest @eslint/js@latest
npm install --save-dev typescript-eslint@latest
npm install --save-dev eslint-plugin-react-hooks@latest
npm install --save-dev eslint-plugin-react-refresh@latest
npm install --save-dev globals@latest
```

### 4. Create Configuration Files

Create these files in your project root:

#### package.json (update scripts section)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.app.json"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

#### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

#### tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

#### tsconfig.app.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

#### tsconfig.node.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

### 5. Create Directory Structure
```bash
mkdir -p src/components/charts
mkdir -p src/types
mkdir -p src/utils
```

### 6. Copy Source Files
You'll need to copy all the source files from the project:
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- All files in `src/components/`
- All files in `src/types/`
- All files in `src/utils/`

### 7. Run the Application
```bash
npm run dev
```

## Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist/` directory, which you can serve with any static file server.

## Using with Jenkins

For Jenkins integration:
1. Build the project: `npm run build`
2. Use the Jenkins publishHTML plugin to publish the `dist/` directory
3. The generated HTML reports will be self-contained and work in Jenkins

## Troubleshooting

### Common Issues:
1. **Node version**: Ensure you're using Node.js 16+
2. **Dependencies**: Run `npm install` if you encounter missing module errors
3. **TypeScript errors**: Run `npm run typecheck` to check for type issues
4. **Build issues**: Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

### Performance Tips:
- For large JMeter files (>100MB), consider splitting them or using the sampling feature
- The application processes files client-side, so larger files may take more time
- Generated HTML reports are self-contained and can be shared independently
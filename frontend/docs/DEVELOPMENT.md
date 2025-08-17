# Development Guide

This guide covers the development workflow, tools, and best practices for the Subscription Manager frontend application.

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn equivalent)
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### Initial Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd subscription/frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development server**:
```bash
npm run dev
```

## Development Workflow

### Daily Development

1. **Pull latest changes**:
```bash
git pull origin main
```

2. **Create feature branch**:
```bash
git checkout -b feature/your-feature-name
```

3. **Start development server**:
```bash
npm run dev
```

4. **Make changes and test**:
   - Edit files in `src/`
   - View changes at `http://localhost:5173`
   - Use browser dev tools for debugging

5. **Commit changes**:
```bash
git add .
git commit -m "feat: add new subscription form validation"
```

6. **Push and create PR**:
```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### Code Quality Checks

Before committing, always run:

```bash
# Type checking
npm run build

# Linting
npm run lint

# Format code
npm run format  # if you have prettier configured
```

## Project Structure Deep Dive

### Source Directory (`src/`)

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── Analytics.tsx    # Analytics dashboard
│   ├── NLPSubscriptionForm.tsx
│   ├── ServiceIcon.tsx
│   ├── Sidebar.tsx
│   ├── SubscriptionForm.tsx
│   ├── SubscriptionTable.tsx
│   ├── TrialOverview.tsx
│   └── TrialStatus.tsx
├── api/                # API client and services
│   └── client.ts
├── data/               # Static data and configurations
│   └── services.ts     # Service definitions and icons
├── lib/                # Utility libraries
│   └── utils.ts        # Helper functions
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Application utilities
│   └── trialUtils.ts   # Trial-related helper functions
├── App.css            # Global styles
├── App.tsx            # Root component
├── index.css          # Tailwind imports
├── main.tsx           # Application entry point
└── vite-env.d.ts      # Vite type definitions
```

### Configuration Files

```
frontend/
├── eslint.config.js     # ESLint configuration
├── postcss.config.cjs   # PostCSS configuration
├── tailwind.config.cjs  # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.app.json    # App-specific TypeScript config
├── tsconfig.node.json   # Node-specific TypeScript config
├── vite.config.ts       # Vite build configuration
└── vercel.json         # Vercel deployment configuration
```

## Development Tools

### Vite (Build Tool)

**Configuration** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
```

**Features**:
- Hot Module Replacement (HMR)
- Fast builds with esbuild
- Path aliases (`@/` → `src/`)
- TypeScript support out of the box

### ESLint (Code Linting)

**Configuration** (`eslint.config.js`):
```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config([
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
])
```

**Custom Rules**:
- Enforce React hooks rules
- Require TypeScript types
- Prevent unused variables
- Enforce consistent code style

### Tailwind CSS (Styling)

**Configuration** (`tailwind.config.cjs`):
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**Design System**:
- CSS variables for theming
- Custom color palette
- Responsive utilities
- Component animations

### TypeScript Configuration

**Main Config** (`tsconfig.json`):
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**App Config** (`tsconfig.app.json`):
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
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## Coding Standards

### Component Structure

```tsx
// Import order: external → internal → types
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { subscriptionApi } from '@/api/client';
import type { Subscription } from '@/types';

// Props interface
interface ComponentProps {
  required: string;
  optional?: number;
  callback: (data: string) => void;
}

// Component function
export default function Component({ required, optional = 0, callback }: ComponentProps) {
  // Hooks
  const [state, setState] = useState('');
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Event handlers
  const handleClick = () => {
    callback(state);
  };
  
  // Render
  return (
    <div>
      <Button onClick={handleClick}>
        {required}
      </Button>
    </div>
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`SubscriptionForm`)
- **Files**: PascalCase for components (`SubscriptionForm.tsx`)
- **Variables**: camelCase (`subscriptionData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types**: PascalCase (`SubscriptionData`)
- **CSS Classes**: kebab-case (Tailwind utilities)

### State Management

```tsx
// Use descriptive state names
const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Group related state
const [formData, setFormData] = useState({
  serviceName: '',
  account: '',
  cost: 0,
});

// Use useReducer for complex state
const [state, dispatch] = useReducer(subscriptionReducer, initialState);
```

### Error Handling

```tsx
// Component-level error handling
const [error, setError] = useState<string | null>(null);

const handleSubmit = async () => {
  try {
    setError(null);
    await subscriptionApi.create(formData);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error occurred');
  }
};

// Error display
{error && (
  <div className="text-red-600 text-sm mt-2">
    {error}
  </div>
)}
```

### Performance Best Practices

```tsx
// Memoize expensive calculations
const totalCost = useMemo(() => {
  return subscriptions.reduce((sum, sub) => sum + sub.monthly_cost, 0);
}, [subscriptions]);

// Memoize components
const SubscriptionCard = memo(({ subscription }: { subscription: Subscription }) => {
  return <div>{subscription.service?.name}</div>;
});

// Optimize callbacks
const handleDelete = useCallback((id: string) => {
  setSubscriptions(subs => subs.filter(sub => sub.id !== id));
}, []);
```

## Testing

### Unit Testing Setup

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

**Test Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### Writing Tests

```tsx
// Component test
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SubscriptionCard from './SubscriptionCard';

describe('SubscriptionCard', () => {
  const mockSubscription = {
    id: '1',
    service: { name: 'Netflix' },
    monthly_cost: 19.99,
  };

  it('displays subscription information', () => {
    render(<SubscriptionCard subscription={mockSubscription} />);
    
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<SubscriptionCard subscription={mockSubscription} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockSubscription);
  });
});
```

### API Testing

```tsx
// Mock API calls
vi.mock('@/api/client', () => ({
  subscriptionApi: {
    getAll: vi.fn(() => Promise.resolve([])),
    create: vi.fn(() => Promise.resolve({})),
  },
}));
```

## Debugging

### Browser DevTools

1. **React DevTools**: Install browser extension for component inspection
2. **Redux DevTools**: For state management debugging (if using Redux)
3. **Network Tab**: Monitor API calls and responses
4. **Console**: Use `console.log` strategically

### VS Code Debugging

**Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "args": ["dev"],
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Common Issues

1. **Component not re-rendering**:
   - Check dependency arrays in `useEffect`
   - Ensure state updates are immutable
   - Use React DevTools to inspect props/state

2. **TypeScript errors**:
   - Run `npm run build` to see all type errors
   - Use `// @ts-ignore` sparingly
   - Define proper interfaces for props

3. **API calls failing**:
   - Check network tab in browser
   - Verify backend is running
   - Check CORS configuration

## Build and Deployment

### Development Build

```bash
npm run dev
```

**Features**:
- Hot reload
- Source maps
- Development optimizations
- Error overlays

### Production Build

```bash
npm run build
```

**Output**:
- Minified JavaScript/CSS
- Optimized assets
- Tree-shaking applied
- Source maps (optional)

### Preview Production Build

```bash
npm run preview
```

### Deployment to Vercel

```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Deploy Commands**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables

**Development** (`.env`):
```env
VITE_API_URL=http://localhost:8000
VITE_NODE_ENV=development
```

**Production** (Vercel dashboard):
```env
VITE_API_URL=https://api.yourapp.com
VITE_NODE_ENV=production
```

## Performance Monitoring

### Bundle Analysis

```bash
# Install analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
    }),
  ],
});
```

### Core Web Vitals

Monitor these metrics:
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Optimization Techniques

1. **Code Splitting**:
```tsx
const Analytics = lazy(() => import('./Analytics'));
```

2. **Image Optimization**:
```tsx
<img 
  src={imageSrc} 
  alt={altText}
  loading="lazy"
  width={300}
  height={200}
/>
```

3. **Memoization**:
```tsx
const expensiveValue = useMemo(() => computeExpensiveValue(props), [props]);
```

## Troubleshooting

### Common Development Issues

1. **Port already in use**:
```bash
# Find process using port 5173
lsof -ti:5173
# Kill the process
kill -9 <process-id>
```

2. **Module not found**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

3. **TypeScript errors**:
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

4. **Tailwind styles not loading**:
   - Check `index.css` imports Tailwind directives
   - Verify `tailwind.config.cjs` content paths
   - Restart development server

### Getting Help

1. **Check documentation**: Read component docs in `docs/`
2. **Browser console**: Look for JavaScript errors
3. **Network tab**: Check API request/response
4. **React DevTools**: Inspect component state and props
5. **GitHub Issues**: Search for similar problems
6. **Stack Overflow**: Ask questions with specific error messages
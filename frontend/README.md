# Subscription Manager Frontend

A modern React-based web application for managing subscription services with intelligent Natural Language Processing (NLP) capabilities, analytics, and trial period tracking.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 8000

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   │   ├── Analytics.tsx    # Analytics dashboard
│   │   ├── NLPSubscriptionForm.tsx  # AI-powered subscription input
│   │   ├── SubscriptionForm.tsx     # Manual subscription form
│   │   ├── SubscriptionTable.tsx    # Main subscription table
│   │   ├── ServiceIcon.tsx  # Service icon component
│   │   ├── TrialStatus.tsx  # Trial period indicator
│   │   └── ...
│   ├── api/                 # API client
│   ├── data/               # Static data and services
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── App.tsx             # Main application component
├── public/
│   └── icons/              # Service icons (SVG)
└── ...
```

## 🧩 Core Components

### Main Components

#### `App.tsx`
- **Purpose**: Root application component with routing logic
- **Features**: State management, API integration, component coordination
- **State**: 
  - `activeTab`: Current view (subscriptions, analytics, trials)
  - `subscriptions`: Array of subscription data
  - `analytics`: Analytics data
  - Form visibility states

#### `SubscriptionTable.tsx`
- **Purpose**: Display and manage subscription list
- **Features**: 
  - Search and filtering
  - Sortable columns
  - Edit/delete actions
  - Trial status indicators
- **Props**:
  ```typescript
  interface SubscriptionTableProps {
    subscriptions: Subscription[];
    onEdit: (subscription: Subscription) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
    onNLPAdd?: () => void;
  }
  ```

#### `NLPSubscriptionForm.tsx`
- **Purpose**: AI-powered subscription creation using natural language
- **Features**:
  - Natural language input processing
  - Real-time parsing feedback
  - Trial period detection
  - Error handling and validation
- **Example Usage**:
  ```
  "添加amazon prime 服务 一个月6.99 前三个月免费"
  "Subscribe to Netflix Premium, $19.99/month, billing on 15th"
  ```

#### `Analytics.tsx`
- **Purpose**: Dashboard showing subscription analytics
- **Features**:
  - Monthly/annual spending totals
  - Category breakdown charts
  - Spending trends
  - Service count statistics

#### `TrialOverview.tsx`
- **Purpose**: Manage and track trial subscriptions
- **Features**:
  - Active trials list
  - Expiration tracking
  - Trial-to-paid conversion
  - Visual trial timeline

### UI Components (shadcn/ui based)

#### `components/ui/`
- **button.tsx**: Customizable button component
- **card.tsx**: Card layout component
- **dialog.tsx**: Modal dialog component
- **input.tsx**: Form input component
- **label.tsx**: Form label component

All UI components use:
- Tailwind CSS for styling
- Radix UI for accessibility
- Class Variance Authority for variant management

### Utility Components

#### `ServiceIcon.tsx`
- **Purpose**: Display service-specific icons
- **Features**: 
  - 70+ pre-defined service icons
  - Fallback to generic icon
  - Customizable sizing
- **Props**:
  ```typescript
  interface ServiceIconProps {
    serviceName: string;
    size?: number;
    className?: string;
  }
  ```

#### `TrialStatus.tsx`
- **Purpose**: Show trial status with visual indicators
- **Features**:
  - Color-coded status (active, ending soon, expired)
  - Days remaining calculation
  - Expiration date display

## 📊 Data Types

### Core Types

```typescript
interface Subscription {
  id: string;
  service_id: string;
  service?: Service;
  account: string;
  payment_date: string;
  cost: number;                    // Original price (monthly or yearly)
  billing_cycle: BillingCycle;     // 'monthly' | 'yearly'
  monthly_cost: number;            // Normalized monthly cost
  // Trial period fields
  is_trial?: boolean;
  trial_start_date?: string;
  trial_end_date?: string;
  trial_duration_days?: number;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

interface Service {
  id: string;
  name: string;
  icon_url?: string;
  category: string;
}

interface Analytics {
  total_monthly_cost: number;
  total_annual_cost: number;
  category_breakdown: { category: string; total: number }[];
  monthly_trend: { month: string; total: number }[];
  service_count: number;
}
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

### Tailwind Configuration

The app uses a custom Tailwind configuration with:
- Custom color palette
- Animation utilities
- Component-specific styles

### TypeScript Configuration

- Strict type checking enabled
- Path aliases configured (`@/` points to `src/`)
- React 19 type definitions

## 🎨 Styling & Design System

### Design Principles
- **Modern**: Clean, minimalist interface
- **Responsive**: Mobile-first design approach
- **Accessible**: WCAG 2.1 compliant components
- **Consistent**: Unified design tokens and spacing

### Color Scheme
- **Primary**: Blue tones for actions and highlights
- **Success**: Green for positive states and confirmations
- **Warning**: Yellow/orange for trial periods ending
- **Error**: Red for error states and deletions
- **Neutral**: Gray scale for text and backgrounds

### Components
Based on shadcn/ui design system:
- Consistent component API
- Composable and customizable
- Built with Radix UI primitives
- Styled with Tailwind CSS

## 🔌 API Integration

### API Client (`api/client.ts`)

```typescript
// Main API functions
subscriptionApi.getAll()           // Fetch all subscriptions
subscriptionApi.create(data)       // Create new subscription
subscriptionApi.update(id, data)   // Update subscription
subscriptionApi.delete(id)         // Delete subscription
subscriptionApi.getAnalytics()     // Fetch analytics data
subscriptionApi.parseNLP(text)     // Parse natural language input
```

### Error Handling
- Network error recovery
- User-friendly error messages
- Loading states and feedback
- Retry mechanisms for failed requests

## 🚀 Features

### Core Features
- ✅ **Subscription Management**: Add, edit, delete subscriptions
- ✅ **NLP Input**: Natural language subscription creation
- ✅ **Trial Tracking**: Monitor free trial periods
- ✅ **Analytics Dashboard**: Spending insights and trends
- ✅ **Service Icons**: 70+ predefined service icons
- ✅ **Search & Filter**: Find subscriptions quickly
- ✅ **Responsive Design**: Works on all devices

### Advanced Features
- ✅ **Billing Cycle Support**: Monthly and yearly subscriptions
- ✅ **Category Organization**: Group by service type
- ✅ **Payment Date Tracking**: Never miss a payment
- ✅ **Cost Calculation**: Automatic monthly cost normalization
- ✅ **Data Persistence**: Backend integration with database

### NLP Capabilities
The NLP system can parse natural language input like:
- "Add Netflix subscription, $19.99 per month, billing on 15th"
- "Subscribe to GitHub Pro, dev@company.com account, $7/month"
- "Amazon Prime for $6.99/month with 3 months free trial"
- "添加Spotify Premium订阅，每月9.99美元，10号扣费"

## 🛠️ Development

### Code Style
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Consistent import organization

### Component Guidelines
1. **Single Responsibility**: Each component has one clear purpose
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Error Boundaries**: Handle errors gracefully
4. **Loading States**: Show loading indicators for async operations
5. **Accessibility**: Use semantic HTML and ARIA labels

### Testing
```bash
# Run tests (when implemented)
npm test

# Type checking
npm run build
```

### Performance
- Lazy loading for large components
- Memoization for expensive calculations
- Optimized re-renders with React best practices
- Bundle size optimization with Vite

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔧 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Deployment
The app is configured for deployment on Vercel with the included `vercel.json` configuration.

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Update documentation for new components
4. Test responsiveness on mobile devices
5. Ensure accessibility compliance

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)

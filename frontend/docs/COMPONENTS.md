# Component Documentation

This document provides detailed information about all React components in the Subscription Manager frontend application.

## Component Architecture

The application follows a component-based architecture with clear separation of concerns:

- **UI Components**: Reusable, unstyled components (shadcn/ui)
- **Feature Components**: Business logic components
- **Layout Components**: Application structure components
- **Utility Components**: Helper and specialized components

## Core Components

### App.tsx

**Purpose**: Root application component that manages global state and routing.

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState<'subscriptions' | 'analytics' | 'trials'>('subscriptions');
const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
const [analytics, setAnalytics] = useState<Analytics | null>(null);
const [isFormOpen, setIsFormOpen] = useState(false);
const [isNLPFormOpen, setIsNLPFormOpen] = useState(false);
const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
```

**Key Features**:
- Global state management
- API data fetching
- Component orchestration
- Error boundary handling

**Usage**:
```typescript
function App() {
  // State and effect hooks
  // Event handlers
  // Component rendering logic
}
```

### SubscriptionTable.tsx

**Purpose**: Main table component for displaying and managing subscriptions.

**Props Interface**:
```typescript
interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onNLPAdd?: () => void;
}
```

**Features**:
- **Search & Filter**: Real-time subscription filtering
- **Sorting**: Clickable column headers for sorting
- **Actions**: Edit and delete buttons for each row
- **Trial Status**: Visual indicators for trial subscriptions
- **Service Icons**: Automatic icon display for known services

**Internal State**:
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [sortField, setSortField] = useState<keyof Subscription>('service');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
```

**Column Structure**:
- Service (with icon and name)
- Account
- Payment Date
- Cost (with billing cycle)
- Trial Status
- Actions

### SubscriptionForm.tsx

**Purpose**: Modal form for creating and editing subscriptions manually.

**Props Interface**:
```typescript
interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subscription: SubscriptionCreate) => void;
  subscription?: Subscription; // For editing
}
```

**Form Fields**:
```typescript
interface FormData {
  service: {
    name: string;
    category: string;
  };
  account: string;
  cost: number;
  billing_cycle: 'monthly' | 'yearly';
  payment_date: string;
  // Trial fields
  is_trial: boolean;
  trial_duration_days: number;
}
```

**Validation**:
- Service name: Required, min 2 characters
- Cost: Required, positive number
- Payment date: Valid date format
- Account: Required, valid email format (optional)

### NLPSubscriptionForm.tsx

**Purpose**: AI-powered subscription creation using natural language input.

**Props Interface**:
```typescript
interface NLPSubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Features**:
- **Natural Language Processing**: Converts text to structured data
- **Real-time Feedback**: Shows parsing results immediately
- **Error Handling**: Graceful failure with helpful messages
- **Multi-language Support**: English and Chinese input

**State Management**:
```typescript
const [inputText, setInputText] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [response, setResponse] = useState<NLPResponse | null>(null);
```

**Example Inputs**:
- "Add Netflix subscription for $19.99/month"
- "GitHub Pro, $7 monthly, dev@company.com"
- "添加Spotify Premium，每月9.99美元"

### Analytics.tsx

**Purpose**: Dashboard component showing subscription analytics and insights.

**Props Interface**:
```typescript
interface AnalyticsProps {
  analytics: Analytics;
  subscriptions: Subscription[];
}
```

**Sections**:
1. **Overview Cards**: Total costs and subscription count
2. **Category Breakdown**: Pie chart of spending by category
3. **Monthly Trends**: Line chart of spending over time
4. **Top Services**: List of highest-cost subscriptions

**Chart Components**:
```typescript
// Using Recharts library
<PieChart>
  <Pie data={categoryData} dataKey="total" nameKey="category" />
</PieChart>

<LineChart>
  <Line dataKey="total" stroke="#3b82f6" />
</LineChart>
```

### TrialOverview.tsx

**Purpose**: Specialized view for managing trial subscriptions.

**Features**:
- **Active Trials**: List of current trial subscriptions
- **Expiration Tracking**: Days remaining calculations
- **Status Indicators**: Visual trial status
- **Conversion Actions**: Convert trial to paid subscription

**Trial Status Types**:
```typescript
type TrialStatus = 'active' | 'ending-soon' | 'expired';

const getTrialStatus = (subscription: Subscription): TrialStatus => {
  if (!subscription.trial_end_date) return 'expired';
  
  const daysLeft = getDaysUntilExpiration(subscription.trial_end_date);
  if (daysLeft <= 0) return 'expired';
  if (daysLeft <= 7) return 'ending-soon';
  return 'active';
};
```

## UI Components (shadcn/ui)

### Button Component

**Purpose**: Customizable button with multiple variants and sizes.

**Props Interface**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

**Usage Examples**:
```tsx
<Button variant="default">Primary Action</Button>
<Button variant="outline" size="sm">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost" size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

### Card Component

**Purpose**: Container component for grouped content.

**Structure**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Dialog Component

**Purpose**: Modal dialog for forms and confirmations.

**Usage Pattern**:
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
    <DialogFooter>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Input Component

**Purpose**: Form input with consistent styling and validation.

**Props Interface**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}
```

**Usage**:
```tsx
<Input
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
/>
```

## Utility Components

### ServiceIcon.tsx

**Purpose**: Display service-specific icons with fallback.

**Props Interface**:
```typescript
interface ServiceIconProps {
  serviceName: string;
  size?: number;
  className?: string;
}
```

**Icon Resolution Logic**:
1. Check for exact service name match
2. Check for partial name match
3. Use category-based icon
4. Fall back to generic service icon

**Supported Services** (70+ icons):
- Streaming: Netflix, Hulu, Disney+, HBO Max, Amazon Prime
- Software: Adobe, Microsoft, GitHub, GitLab
- Cloud: AWS, GCP, Azure, Heroku, Vercel
- Music: Spotify, Apple Music, YouTube Music
- Gaming: Twitch, Steam, Xbox Live

### TrialStatus.tsx

**Purpose**: Visual indicator for trial subscription status.

**Props Interface**:
```typescript
interface TrialStatusProps {
  subscription: Subscription;
}
```

**Status Variants**:
```typescript
const statusConfig = {
  active: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Active Trial'
  },
  'ending-soon': {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    label: 'Ending Soon'
  },
  expired: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Expired'
  }
};
```

### Sidebar.tsx

**Purpose**: Navigation sidebar for switching between views.

**Props Interface**:
```typescript
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
```

**Navigation Items**:
- Subscriptions: Main subscription management
- Analytics: Spending insights and charts
- Trials: Trial period management

## Component Guidelines

### 1. Single Responsibility Principle
Each component should have one clear purpose and responsibility.

```tsx
// Good: Focused component
function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  return (
    <Card>
      <CardContent>
        <ServiceIcon serviceName={subscription.service?.name} />
        <h3>{subscription.service?.name}</h3>
        <p>${subscription.monthly_cost}/month</p>
      </CardContent>
    </Card>
  );
}

// Bad: Component doing too much
function SubscriptionManager() {
  // Handles display, editing, deletion, API calls, etc.
}
```

### 2. Props Interface Definition
Always define TypeScript interfaces for component props.

```tsx
interface ComponentProps {
  required: string;
  optional?: number;
  callback: (data: Data) => void;
  children?: React.ReactNode;
}

function Component({ required, optional = 0, callback, children }: ComponentProps) {
  // Component logic
}
```

### 3. Error Boundaries
Wrap components in error boundaries to handle failures gracefully.

```tsx
function SubscriptionTable() {
  try {
    return (
      <div>
        {/* Table content */}
      </div>
    );
  } catch (error) {
    return <ErrorFallback error={error} />;
  }
}
```

### 4. Loading States
Show loading indicators for async operations.

```tsx
function DataComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  if (loading) {
    return <LoadingSpinner />;
  }

  return <DataDisplay data={data} />;
}
```

### 5. Accessibility
Use semantic HTML and ARIA labels for screen readers.

```tsx
<button
  aria-label="Delete subscription"
  onClick={() => onDelete(subscription.id)}
>
  <Trash2 className="h-4 w-4" />
</button>
```

## Testing Components

### Unit Testing
```typescript
import { render, screen } from '@testing-library/react';
import { SubscriptionCard } from './SubscriptionCard';

test('displays subscription information', () => {
  const subscription = {
    id: '1',
    service: { name: 'Netflix' },
    monthly_cost: 19.99
  };

  render(<SubscriptionCard subscription={subscription} />);
  
  expect(screen.getByText('Netflix')).toBeInTheDocument();
  expect(screen.getByText('$19.99/month')).toBeInTheDocument();
});
```

### Integration Testing
```typescript
test('subscription form submission', async () => {
  const onSubmit = jest.fn();
  
  render(<SubscriptionForm isOpen={true} onSubmit={onSubmit} />);
  
  fireEvent.change(screen.getByLabelText('Service Name'), {
    target: { value: 'Netflix' }
  });
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        service: { name: 'Netflix' }
      })
    );
  });
});
```

## Performance Optimization

### Memoization
```tsx
const ExpensiveComponent = React.memo(({ data }: { data: Data[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);

  return <div>{processedData}</div>;
});
```

### Lazy Loading
```tsx
const Analytics = lazy(() => import('./Analytics'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Analytics />
    </Suspense>
  );
}
```

### Callback Optimization
```tsx
function Parent() {
  const handleCallback = useCallback((id: string) => {
    // Handle action
  }, []);

  return <Child onAction={handleCallback} />;
}
```
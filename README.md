# Subscription Manager

A full-stack web application for managing and tracking subscription services with a clean, minimalistic UI inspired by Neon's dashboard design.

## Features

- **Dashboard Overview**: View all active subscriptions at a glance
- **Subscription Management**: Add, edit, and delete subscription services
- **Smart Icon System**: 
  - 50+ predefined service provider icons
  - Automatic initial letter icon generation for custom services
  - Consistent color scheme based on service names
- **Analytics & Insights**: 
  - Cost breakdown by category (pie chart)
  - Monthly spending trends (bar chart)
  - Projected annual costs (line chart)
- **Search & Sort**: Find subscriptions quickly with real-time search and sortable columns
- **Local & Remote Storage**: Works with local storage or connects to a PostgreSQL database

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Recharts** for data visualization
- **Axios** for API calls

### Backend
- **FastAPI** for REST API
- **PostgreSQL** (Neon.tech) for database
- **SQLAlchemy** for ORM
- **Pydantic** for data validation

## Getting Started

### Prerequisites
- Node.js (v20+)
- Python 3.11+
- PostgreSQL database (optional, can use local storage)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, for API connection):
```bash
cp .env.example .env
# Edit .env and add your API URL
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file:
```bash
cp .env.example .env
# Edit .env and add your Neon PostgreSQL connection string
```

5. Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set the root directory to `frontend`
4. Add environment variable:
   - `VITE_API_URL`: Your Modal backend URL
5. Deploy

### Backend (Modal)

1. Install Modal CLI:
```bash
pip install modal
```

2. Authenticate with Modal:
```bash
modal setup
```

3. Create a secret for your database URL:
```bash
modal secret create neon-db-url DATABASE_URL=your_neon_connection_string
```

4. Deploy to Modal:
```bash
cd backend
modal deploy modal_app.py
```

## Database Setup (Neon)

1. Create a free account at [Neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add it to your backend `.env` file or Modal secret

## Sample Data

The application comes with sample subscription data including:
- Netflix ($19.99/month)
- Spotify ($9.99/month)
- GitHub ($7.00/month)
- AWS ($150.00/month)
- Custom Service ($25.00/month) - demonstrates auto-generated icon

This data is automatically loaded when using local storage mode.

## Icon System

### Predefined Services
The application includes 50+ predefined popular services with official icons:
- **Entertainment**: Netflix, Spotify, YouTube Premium, Disney+, Hulu, etc.
- **Development**: GitHub, GitLab, JetBrains, Figma, Adobe Creative Cloud, etc.
- **Cloud Services**: AWS, Google Cloud, Azure, DigitalOcean, Vercel, etc.
- **Productivity**: Slack, Discord, Zoom, Notion, Microsoft 365, etc.
- **Chinese Services**: 爱奇艺, 腾讯视频, 哔哩哔哩, 网易云音乐, 阿里云, etc.

### Auto-Generated Icons
For services not in the predefined list:
- Automatically generates colorful initial letter icons
- Colors are deterministic based on service name
- Maintains consistent branding across the application
- High contrast text ensures readability

### Usage
```typescript
import ServiceIcon from '@/components/ServiceIcon';

// Will use predefined icon if available
<ServiceIcon serviceName="Netflix" size={32} />

// Will generate initial letter icon for custom services
<ServiceIcon serviceName="My Custom Service" size={32} />
```

## API Endpoints

- `GET /subscriptions` - List all subscriptions
- `POST /subscriptions` - Create a new subscription
- `PUT /subscriptions/{id}` - Update a subscription
- `DELETE /subscriptions/{id}` - Delete a subscription
- `GET /analytics` - Get analytics data

## Environment Variables

### Frontend
- `VITE_API_URL` - Backend API URL (optional, defaults to http://localhost:8000)

### Backend
- `DATABASE_URL` - PostgreSQL connection string (required for database mode)

## Features in Detail

### Dashboard
- Clean, minimalistic design with white background
- Left sidebar navigation
- Cards with subtle shadows for visual hierarchy
- Green accent colors for positive indicators

### Subscription Table
- Service provider icons for visual recognition
- Account email display
- Payment date tracking
- Monthly cost display
- Inline edit and delete actions
- Real-time search functionality
- Sortable columns

### Analytics
- **Pie Chart**: Visual breakdown of costs by service category
- **Bar Chart**: Monthly spending over the last 6 months
- **Line Chart**: Projected vs actual annual costs
- **Summary Cards**: Total monthly cost, projected annual cost, active services, average cost

### Settings
- Toggle between local storage and remote database
- View current data storage mode
- Display API connection status

## Development

### Frontend Commands
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Backend Commands
```bash
uvicorn main:app --reload  # Start with auto-reload
python -m pytest           # Run tests (if available)
```

## License

MIT
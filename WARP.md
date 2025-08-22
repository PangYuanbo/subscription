# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a full-stack subscription management application consisting of:
- **Frontend**: React 18 + TypeScript + Vite application with modern UI components
- **Backend**: FastAPI service with PostgreSQL/SQLAlchemy and NLP capabilities
- **Browser Extension**: Chrome/Edge extension for automatic subscription detection
- **Multi-component architecture** with Auth0 authentication and Modal.com deployment support

## Essential Development Commands

### Frontend Development (in `frontend/` directory)
```bash
# Start development server
npm run dev

# Build for production (includes TypeScript checking)
npm run build  

# Lint code
npm run lint

# Preview production build
npm run preview

# Install dependencies
npm install
```

### Backend Development (in `backend/` directory)
```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies  
pip install -r requirements.txt

# Start development server with auto-reload
uvicorn main:app --reload --port 8000

# Run database initialization
python -c "import asyncio; from database import init_db; asyncio.run(init_db())"

# Deploy to Modal.com
modal deploy modal_app.py
```

### Browser Extension Development
```bash
# Install extension in Chrome/Edge
1. Open chrome://extensions/ or edge://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked" and select browser-extension/ directory
```

### Running Full Stack Application
```bash
# Terminal 1: Start backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2: Start frontend  
cd frontend && npm run dev

# Optional Terminal 3: Test individual components
npm run build  # Verify TypeScript compilation
```

## Architecture Overview

### Database Layer
- **SQLAlchemy models**: `User`, `Service`, `Subscription` with relationships
- **Multi-user support**: Each user has isolated subscription data via `user_id`
- **Trial tracking**: Built-in trial period support with dates and duration
- **Flexible storage**: PostgreSQL (production) or SQLite (development)

### Authentication Flow
- **Auth0 integration**: JWT-based authentication with automatic user creation
- **Graceful degradation**: Falls back to mock authentication when Auth0 not configured
- **User management**: Automatic user profile creation and session tracking

### Frontend Architecture  
- **Component structure**: Modular React components with TypeScript interfaces
- **State management**: React hooks with local/remote data synchronization  
- **API integration**: Axios-based client with authentication middleware
- **Dual data modes**: Can work with API backend OR local storage fallback

### Backend API Structure
- **RESTful endpoints**: Standard CRUD operations for subscriptions
- **NLP integration**: OpenRouter API for natural language subscription creation
- **User-scoped data**: All operations are automatically scoped to authenticated user
- **Comprehensive analytics**: Real-time cost calculations and trend analysis

### Key Files and Their Roles

#### Backend Core Files
- `main.py`: FastAPI app with Auth0 JWT validation and user-scoped endpoints
- `models.py`: SQLAlchemy models with proper relationships and trial support
- `database.py`: Async database configuration with connection pooling
- `openrouter_client.py`: NLP client for parsing natural language subscriptions
- `modal_app.py`: Serverless deployment configuration for Modal.com

#### Frontend Core Files  
- `App.tsx`: Main app component managing global state and authentication flow
- `components/SubscriptionTable.tsx`: Primary data display with search/sort/edit
- `components/NLPSubscriptionForm.tsx`: AI-powered natural language input
- `components/Analytics.tsx`: Data visualization dashboard with charts
- `api/auth-client.ts`: Authenticated API client with automatic token handling

#### Important Configuration Files
- `frontend/vite.config.ts`: Path aliases (`@/` → `src/`) and React plugin
- `frontend/package.json`: All dependencies and build scripts
- `backend/requirements.txt`: Python dependencies optimized for Modal deployment
- `CLAUDE.md`: Critical TypeScript configuration notes and known issues

## Critical Development Notes

### TypeScript Configuration (from CLAUDE.md)
- **axios imports**: Always use `import axios from 'axios'; import type { AxiosInstance } from 'axios';`
- **React types**: Use `import type { ReactNode } from 'react';` for type-only imports
- **Strict mode**: Project uses `verbatimModuleSyntax: true` - all type imports must use `type` keyword
- **Path aliases**: `@/` is configured to resolve to `./src/`

### Authentication Modes
- **Production**: Full Auth0 integration with JWT validation
- **Development**: Set empty `VITE_AUTH0_DOMAIN` to use mock authentication
- **Backend fallback**: Returns mock user when Auth0 not configured

### Database Considerations
- **User scoping**: All subscription operations are automatically filtered by authenticated user
- **Trial support**: Database includes comprehensive trial period tracking
- **Analytics**: Real-time calculations for spending trends and category breakdowns
- **Async operations**: Uses SQLAlchemy async for performance

### NLP Integration
- **OpenRouter API**: Requires `OPENROUTER_API_KEY` for natural language parsing
- **Pattern fallback**: Uses regex patterns when AI parsing unavailable
- **Multi-language**: Supports English and Chinese input
- **Smart categorization**: Automatically categorizes services and detects pricing

### Common Pitfalls to Avoid
1. **Import errors**: Don't use `import { AxiosInstance } from 'axios'` - use type imports
2. **Authentication assumptions**: Always check if Auth0 is configured before requiring authentication  
3. **User data isolation**: Never query subscriptions without user_id filtering
4. **TypeScript strictness**: Use `@ts-ignore` comments for legitimate unused variable warnings
5. **Build warnings**: Handle each TypeScript warning individually - don't mass-delete code

### Deployment Architecture
- **Frontend**: Vercel deployment with build command `npm run build`
- **Backend**: Modal.com serverless with secrets for database and API keys
- **Database**: Neon.tech PostgreSQL with connection pooling
- **Extension**: Manual installation from `browser-extension/` directory

### Testing Strategies
- **Frontend**: Use `npm run build` to verify TypeScript compilation
- **Backend**: Use FastAPI automatic docs at `http://localhost:8000/docs`
- **Integration**: Test with both API and local storage modes
- **Extension**: Test on Netflix, Spotify, GitHub pricing pages

### Environment Variables Required
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:8000
VITE_AUTH0_DOMAIN=your-domain.auth0.com    # Leave empty to disable auth
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier

# Backend (.env)  
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
OPENROUTER_API_KEY=sk-or-v1-your-key
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
```

This architecture supports both rapid prototyping (with local storage) and production deployment (with full authentication and database persistence). The NLP capabilities and browser extension provide advanced features for user experience, while maintaining clean separation of concerns across the full stack.

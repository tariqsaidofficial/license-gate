# LicenseGate - Development Guide 🚀

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/DevLeoko/license-gate/assets/13747815/65026d9c-86eb-47c8-804a-6b768a5786de">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/DevLeoko/license-gate/assets/13747815/e6425f96-e41b-431c-975c-4699006c6b04">
  <img src="https://github.com/DevLeoko/license-gate/assets/13747815/35c05ca5-51b7-440f-b589-29da9e27c876">
</picture>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

LicenseGate is an open-source licensing platform for developers to create, manage, and validate software licenses through a modern REST API and type-safe tRPC interface.

### Key Features

- ✅ **License Management**: Create and manage software licenses with ease
- 📊 **Real-time Analytics**: Live usage statistics and monitoring
- 🔐 **RSA Validation**: Secure key validation for untrusted environments
- 🚦 **Usage Controls**: IP limits, rate limiting, expiration dates, and scopes
- 🔌 **Multiple APIs**: REST API and tRPC with full TypeScript support
- 📱 **Modern UI**: Beautiful SvelteKit-based dashboard
- 🐳 **Docker Support**: Easy deployment with Docker Compose

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **SvelteKit** - Modern frontend framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **TanStack Query** - Data fetching and caching
- **D3.js** - Data visualization

#### Backend
- **Express.js** - Web framework
- **tRPC** - Type-safe API
- **Prisma** - Next-gen ORM
- **TypeScript** - Full type safety
- **Zod** - Schema validation
- **JWT** - Authentication

#### Database
- **MySQL** - Primary database
- **Prisma Migrate** - Database migrations

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** or **pnpm** (recommended)
- **MySQL** >= 8.0
- **Git**

### Recommended Tools

- **VS Code** with extensions:
  - Svelte for VS Code
  - Prisma
  - ESLint
  - Prettier

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/DevLeoko/license-gate.git
cd license-gate
git checkout LicenseGate-dev
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Run database migrations
npm run prisma-migrate

# Generate Prisma Client
npm run prisma-gen

# Start development server
npm run dev
```

The backend will be available at `http://localhost:3001`

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Create Admin User

```bash
cd backend
npm run set-admin
```

Follow the prompts to create your admin account.

## 📁 Project Structure

```
license-gate/
├── backend/                 # Express.js + tRPC Backend
│   ├── prisma/             # Database schema and migrations
│   │   ├── schema.prisma   # Prisma schema definition
│   │   └── migrations/     # Database migration files
│   ├── src/
│   │   ├── controller/     # Business logic
│   │   ├── routers/        # tRPC routers
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── index.ts        # Application entry point
│   ├── scripts/            # Utility scripts
│   ├── .env                # Environment variables
│   └── package.json
│
├── frontend/               # SvelteKit Frontend
│   ├── src/
│   │   ├── lib/           # Shared components and utilities
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── stores/    # Svelte stores
│   │   │   └── utils/     # Utility functions
│   │   ├── routes/        # SvelteKit pages and routes
│   │   └── app.scss       # Global styles
│   ├── static/            # Static assets
│   ├── svelte.config.js   # Svelte configuration
│   ├── vite.config.ts     # Vite configuration
│   └── package.json
│
├── docker-compose.yml     # Docker Compose configuration
├── README.md             # Main documentation
└── README.dev.md        # This file
```

## 💻 Development

### Running Both Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Backend Commands

```bash
# Development
npm run dev                          # Start dev server with hot reload

# Database
npm run prisma-dev                   # Create and apply migration
npm run prisma-dev:create-only       # Create migration only
npm run prisma-up                    # Push schema to database
npm run prisma-migrate               # Apply migrations (production)
npm run prisma-gen                   # Generate Prisma Client

# Code Generation
npm run tsoa-gen                     # Generate OpenAPI spec and routes
npm run gen-env                      # Generate environment types

# Utilities
npm run set-admin                    # Create/update admin user
npm run list-users                   # List all users
```

### Frontend Commands

```bash
# Development
npm run dev                          # Start dev server

# Production
npm run build                        # Build for production
npm run preview                      # Preview production build

# Code Quality
npm run check                        # Run Svelte type checking
npm run check:watch                  # Watch mode type checking
npm run lint                         # Lint code
npm run format                       # Format code with Prettier
```

## 📚 API Documentation

### REST API

The REST API is available at `http://localhost:3001/license/{userId}/{licenseKey}/verify`

#### Verify License

```http
GET /license/{userId}/{licenseKey}/verify
```

**Response:**
```json
{
  "valid": true,
  "status": "VALID",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "scopes": ["premium", "api-access"]
}
```

### tRPC API

tRPC endpoints are available at `http://localhost:3001/trpc`

#### Example Usage

```typescript
import { trpc } from '$lib/trpcClient';

// Login
const result = await trpc.auth.loginWithPassword.mutate({
  email: 'user@example.com',
  password: 'password123'
});

// Get licenses
const licenses = await trpc.license.getAll.query();
```

### OpenAPI Documentation

The OpenAPI specification is available at `/open-api.json`

## 🗄️ Database

### Schema Overview

- **User**: User accounts and authentication
- **License**: License keys and configurations
- **Product**: Software products
- **LicenseUsage**: Usage tracking and analytics
- **ApiKey**: API access management

### Running Migrations

```bash
# Development - creates and applies migration
npm run prisma-dev

# Production - applies existing migrations
npm run prisma-migrate
```

### Database Management

```bash
# Open Prisma Studio (GUI for database)
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npm run prisma-gen
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="mysql://user:password@localhost:3306/license_gate"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
HEX_USER_ID_OFFSET=1000

# Email (SMTP)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USERNAME=test@localhost
SMTP_PASSWORD=password
SMTP_SENDER=LicenseGate <noreply@localhost>

# Frontend URLs
SIGN_IN_URL=http://localhost:5173/auth/sign-in
RESET_PASSWORD_URL=http://localhost:5173/auth/reset-password
CORS_ORIGIN=http://localhost:5173

# Features
DISABLE_RECAPTCHA=true
DISABLE_SIGN_UP=false

# Google OAuth (optional)
GOOGLE_AUTH_CLIENT_ID=none

# ReCAPTCHA (optional)
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

### Frontend

Environment variables are handled through the backend API configuration in `src/lib/trpcClient.ts`

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Manual Testing

1. Create a license key through the UI
2. Test verification endpoint:
```bash
curl http://localhost:3001/license/{userId}/{licenseKey}/verify
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Manual Deployment

1. **Build Frontend:**
```bash
cd frontend
npm run build
```

2. **Configure Backend:**
```bash
cd backend
# Update .env with production values
npm run prisma-migrate
npm start
```

3. **Serve Frontend:**
Deploy the `frontend/build` folder to your hosting provider.

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- Use TypeScript for all new code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed
- Write tests for new features

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 3001 (Backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173 (Frontend)
lsof -ti:5173 | xargs kill -9
```

#### Database Connection Issues

1. Verify MySQL is running
2. Check credentials in `.env`
3. Ensure database exists:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS license_gate;"
```

#### CORS Errors

- Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL
- Restart backend after changing `.env`

#### TypeScript Errors

```bash
# Regenerate Prisma Client
cd backend
npm run prisma-gen

# Clear SvelteKit cache
cd frontend
rm -rf .svelte-kit
npm run dev
```

#### Sass Legacy API Warning

This is a deprecation warning and won't affect functionality. It will be addressed in future updates.

### Getting Help

- 📖 [Documentation](https://docs.licensegate.io)
- 💬 [Discord Community](https://discord.gg/ycDG6rS)
- 🐛 [GitHub Issues](https://github.com/DevLeoko/license-gate/issues)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Svelte](https://svelte.dev/)
- [Prisma](https://www.prisma.io/)
- [tRPC](https://trpc.io/)
- [Express](https://expressjs.com/)

---

**Made with ❤️ by the LicenseGate Community**

For more information, visit [licensegate.io](https://licensegate.io) or join our [Discord](https://discord.gg/ycDG6rS).

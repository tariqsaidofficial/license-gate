# 🚀 LicenseGate - Enterprise License Management System

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/DevLeoko/license-gate/assets/13747815/65026d9c-86eb-47c8-804a-6b768a5786de">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/DevLeoko/license-gate/assets/13747815/e6425f96-e41b-431c-975c-4699006c6b04">
  <img src="https://github.com/DevLeoko/license-gate/assets/13747815/35c05ca5-51b7-440f-b589-29da9e27c876">
</picture>

[![License: ELv2](https://img.shields.io/badge/License-ELv2-blue.svg)](https://www.elastic.co/licensing/elastic-license)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green)](https://github.com/DevLeoko/license-gate)

## 🎯 Overview

LicenseGate is a comprehensive, production-ready license management system designed for software developers and companies. Built with modern technologies and enterprise-grade security, it provides a complete solution for creating, managing, and validating software licenses.

### 🌟 What Makes LicenseGate Special

- **🔐 Enterprise Security**: JWT authentication, OAuth integration, RSA encryption
- **📊 Real-time Analytics**: Live dashboards with interactive charts
- **🚀 Modern Stack**: 100% TypeScript, SvelteKit, tRPC, Prisma
- **🐳 Production Ready**: Docker deployment, CI/CD pipelines, health monitoring
- **🎨 Professional UI**: Responsive design with modern UX patterns
- **⚡ High Performance**: Optimized for speed and scalability

## ✨ Key Features

### 🔐 **Authentication & Security**
- ✅ JWT-based authentication with secure token management
- ✅ OAuth integration (Google & GitHub sign-in)
- ✅ Advanced password reset system with modern UI
- ✅ Role-based access control (Admin/User permissions)
- ✅ RSA key pair generation for secure license validation
- ✅ Argon2 password hashing for maximum security

### 📄 **License Management**
- ✅ Unlimited license generation and management
- ✅ Real-time license validation API
- ✅ IP address restrictions and rate limiting
- ✅ Expiration date management with automated notifications
- ✅ Scope-based feature control
- ✅ Comprehensive usage tracking and analytics

### 🔑 **API Management**
- ✅ Secure API key generation and management
- ✅ Multiple authentication methods (JWT, API Keys)
- ✅ Rate limiting and usage monitoring
- ✅ RESTful API and type-safe tRPC endpoints

### 📊 **Analytics & Reporting**
- ✅ Real-time dashboard with live statistics
- ✅ Interactive charts powered by D3.js
- ✅ Comprehensive usage logs and audit trails
- ✅ Success/failure metrics with detailed reporting
- ✅ Historical data analysis and export capabilities

### 🎨 **Modern User Interface**
- ✅ Professional SvelteKit-based dashboard
- ✅ Fully responsive design for all devices
- ✅ Real-time data updates without page refresh
- ✅ Intuitive user experience with modern UX patterns
- ✅ Unified notification system
- ✅ Dark/light theme support

## 🏗️ Technology Stack

### Frontend
- **SvelteKit** - Modern frontend framework with SSR
- **TypeScript** - 100% type safety throughout
- **TailwindCSS** - Utility-first CSS framework
- **D3.js** - Advanced data visualization
- **Vite** - Lightning-fast build tool

### Backend
- **Express.js** - Robust web application framework
- **tRPC** - End-to-end type safety
- **Prisma** - Next-generation ORM with type safety
- **TypeScript** - Complete type coverage
- **Zod** - Runtime type validation
- **JWT** - Secure authentication

### Database & Infrastructure
- **MySQL** - Reliable relational database
- **Docker** - Containerized deployment
- **GitHub Actions** - CI/CD automation
- **Caddy** - Automatic HTTPS and reverse proxy

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MySQL >= 8.0
- Docker (optional, for containerized deployment)

### 1. Clone and Setup
```bash
git clone https://github.com/DevLeoko/license-gate.git
cd license-gate
git checkout LicenseGate-dev
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma-migrate
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:5173/user-management

## 📚 Documentation

Our comprehensive documentation is organized for easy navigation:

### 📖 **[Complete Documentation Hub](./docs/README.md)**

- **🚀 [Setup & Installation](./docs/setup/)** - Quick start guides and configuration
- **💻 [Development](./docs/development/)** - Development guidelines and architecture
- **🧪 [Testing](./docs/testing/)** - Testing procedures and results
- **🔌 [API Documentation](./docs/api/)** - Complete API reference and examples
- **📖 [User Guides](./docs/guides/)** - Feature guides and tutorials
- **🚀 [Deployment](./docs/deployment/)** - Production deployment guides

## ⚙️ OAuth Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Update `frontend/.env`:
```env
PUBLIC_GOOGLE_AUTH_CLIENT_ID=your-google-client-id
```

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:5173/auth/github/callback`
4. Update `frontend/.env`:
```env
PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
```

## 📧 Email System

✅ **Fully Configured Email System**
- **SMTP Integration**: Ready for production email sending
- **Email Templates**: Professional HTML templates included
- **Automated Emails**:
  - Welcome messages for new users
  - Password reset notifications
  - Email verification
  - License notifications

### Email Configuration
Update `backend/.env`:
```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-password
SMTP_SENDER=LicenseGate <noreply@yourdomain.com>
```

## 🐳 Docker Deployment

### Quick Deploy with Docker Compose
```bash
docker-compose up -d
```

### Manual Docker Build
```bash
# Backend
cd backend
docker build -t licensegate-backend .

# Frontend  
cd frontend
docker build -t licensegate-frontend .
```

## 📊 Project Status

**Current Status**: ✅ **Production Ready**

### ✅ **Completed Features (100%)**
- 🔐 Complete authentication system with OAuth
- 📄 Full license management functionality  
- 🔑 API key management system
- 📊 Real-time analytics and reporting
- 🎨 Modern, responsive user interface
- 🚀 Docker deployment configuration
- 📧 Email system integration
- 📚 Comprehensive documentation

### 🎯 **Recent Major Enhancements**
- ✅ **Advanced Password Reset**: Modern UI with custom/random password options
- ✅ **OAuth Integration**: Google and GitHub sign-in with professional design
- ✅ **Docker Containerization**: Production-ready multi-stage builds
- ✅ **CI/CD Pipeline**: Automated testing and deployment
- ✅ **Documentation Organization**: Comprehensive, categorized documentation
- ✅ **TypeScript Coverage**: 100% TypeScript implementation
- ✅ **Security Enhancements**: Enterprise-grade security measures

## 🔒 Security Features

- **🛡️ Authentication**: JWT with secure token rotation
- **🔐 Password Security**: Argon2 hashing with salt
- **🔑 API Security**: Rate limiting and API key management
- **🌐 CORS Protection**: Configurable cross-origin policies
- **🚫 Input Validation**: Comprehensive data sanitization
- **📝 Audit Logging**: Complete activity tracking

## 🧪 Testing & Quality

### TypeScript Coverage
- **Backend**: 100% TypeScript
- **Frontend**: 100% TypeScript  
- **Shared Types**: End-to-end type safety with tRPC

### Testing Status
- ✅ **Manual Testing**: Comprehensive UI/UX testing completed
- ✅ **Integration Testing**: Backend-Frontend communication verified
- ✅ **API Testing**: All endpoints validated
- ✅ **Security Testing**: Authentication and authorization verified

## 📈 Performance

- **Response Time**: < 200ms average API response
- **Frontend Load**: < 2 seconds initial load
- **Database**: Optimized queries with Prisma
- **Caching**: Efficient data caching strategies
- **Scalability**: Horizontal scaling ready

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📋 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

## 🔐 Security

For security concerns, please see [SECURITY.md](./SECURITY.md).

## 📄 License

### Original License
This project is based on software originally licensed under the **Elastic License 2.0 (ELv2)**.

### Modifications License
All modifications, new features, and improvements are **© DXBMark by Tariq Said, 2025**.

These modifications include:
- ✨ **Advanced Password Reset System** with modern UI
- 🔗 **Enhanced OAuth Integration** (Google & GitHub)
- 🐳 **Complete Docker Containerization** with multi-stage builds
- 🚀 **CI/CD Pipeline** with GitHub Actions
- 📚 **Comprehensive Documentation** organization
- 🎨 **UI/UX Improvements** and responsive design
- 🔒 **Security Enhancements** and best practices
- 📧 **Email System Integration** with professional templates

### License Terms
- **Original License**: [Elastic License 2.0](./LICENSE)
- **Additional Terms**: [Custom Modifications License](./LICENSE-ADDITIONAL.txt)

All modifications are provided under the same Elastic License 2.0 terms, with additional attribution requirements for educational and internal use.

## 🌟 Acknowledgments

- Original LicenseGate project by [DevLeoko](https://github.com/DevLeoko)
- Enhanced and extended by [DXBMark - Tariq Said](https://github.com/TariqSaid)
- Built with amazing open-source technologies

---

**🚀 Ready for Production • 🔒 Enterprise Security • 📊 Real-time Analytics**

For detailed documentation, visit our [Documentation Hub](./docs/README.md)

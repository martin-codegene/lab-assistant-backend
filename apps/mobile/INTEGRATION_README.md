# Lab Assistant AI - Integration Documentation

Complete integration documentation for connecting the Lab Assistant AI frontend with the backend API.

## 📚 Documentation Index

### Quick Start

- **[Quick Start Guide](./QUICK_START_GUIDE.md)** - Get up and running in 5 minutes
- **[Complete Integration Summary](./COMPLETE_INTEGRATION_SUMMARY.md)** - Full architecture overview

### API Documentation

- **[Experiment API Documentation](./EXPERIMENT_API_DOCUMENTATION.md)** - Complete experiment API reference
- **[Experiment API Quick Reference](./EXPERIMENT_API_QUICK_REFERENCE.md)** - Quick examples and patterns
- **[Protocol API Quick Reference](./PROTOCOL_API_QUICK_REFERENCE.md)** - Protocol API examples

### Integration Guides

- **[Experiment Integration Complete](./EXPERIMENT_INTEGRATION_COMPLETE.md)** - Experiment integration overview
- **[Experiment Details API Integration Guide](./EXPERIMENT_DETAILS_API_INTEGRATION_GUIDE.md)** - Step-by-step integration
- **[Protocol Integration Summary](./PROTOCOL_INTEGRATION_SUMMARY.md)** - Protocol integration details

### Implementation Guides

- **[API Implementation Guide](./API_IMPLEMENTATION_GUIDE.md)** - General API usage patterns
- **[API Implementation Summary](./API_IMPLEMENTATION_SUMMARY.md)** - Implementation overview

## 🎯 What's Integrated

### ✅ Completed Features

#### Authentication

- User registration and login
- JWT token management
- Secure token storage
- Auto-login on app start
- Profile management

#### Protocol Management

- Create, read, update, delete protocols
- List and search protocols
- Filter by assay type and status
- Sort by various criteria
- Duplicate protocols
- Track protocol usage

#### Experiment Management

- Create experiments from protocols
- View experiment details
- Track experiment progress
- Update notes and results
- Complete/fail/cancel experiments
- List and search experiments
- Real-time updates for running experiments

#### Navigation

- Protocols screen → Experiment details
- Deep linking support
- Back navigation
- Route configuration

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API

Update `lib/api.ts` with your API URL:

```typescript
const API_CONFIG = {
  BASE_URL: "https://your-api-url.com/api",
  TIMEOUT: 10000,
};
```

### 3. Start Development

```bash
npx expo start
```

### 4. Test Integration

```typescript
import { api } from "@/lib/api";

// Login
const response = await api.login({
  email: "user@example.com",
  password: "password",
});

// Create protocol
const protocol = await api.createProtocol({
  name: "PCR Protocol",
  category: "PCR",
  // ... other fields
});

// Create experiment
const experiment = await api.createExperiment({
  title: "Test Run",
  protocolId: protocol.data.id,
  variables: { cycles: 35 },
});
```

## 📖 Documentation Guide

### For New Developers

1. Start with [Quick Start Guide](./QUICK_START_GUIDE.md)
2. Read [Complete Integration Summary](./COMPLETE_INTEGRATION_SUMMARY.md)
3. Review [API Quick References](./EXPERIMENT_API_QUICK_REFERENCE.md)

### For API Integration

1. Check [Experiment API Documentation](./EXPERIMENT_API_DOCUMENTATION.md)
2. Use [API Quick References](./EXPERIMENT_API_QUICK_REFERENCE.md) for examples
3. Follow [Integration Guides](./EXPERIMENT_DETAILS_API_INTEGRATION_GUIDE.md)

### For Implementation

1. Review [API Implementation Guide](./API_IMPLEMENTATION_GUIDE.md)
2. Check [Integration Summaries](./EXPERIMENT_INTEGRATION_COMPLETE.md)
3. Follow code patterns in existing screens

## 🏗️ Architecture

```
Frontend (React Native + Expo)
    ↓
API Client (lib/api.ts)
    ↓
Backend API (Express + Prisma)
    ↓
Database (PostgreSQL)
```

### Key Files

- `lib/api.ts` - API client with all methods
- `screens/protocols-screen.tsx` - Protocol list and management
- `screens/create-protocol-screen.tsx` - Protocol creation
- `screens/experiement-details-screen.tsx` - Experiment details
- `app/(routes)/experiment-details.tsx` - Experiment route

## 🔧 API Client Usage

### Import

```typescript
import { api } from "@/lib/api";
```

### Authentication

```typescript
// Register
await api.register({ email, password, name });

// Login
await api.login({ email, password });

// Logout
await api.logout();

// Check auth status
const isAuthenticated = api.isAuthenticated();
const currentUser = api.getCurrentUser();
```

### Protocols

```typescript
// Create
await api.createProtocol(data);

// Read
await api.getProtocol(id);
await api.listMyProtocols({ page: 1, limit: 20 });

// Update
await api.updateProtocol(id, data);

// Delete
await api.deleteProtocol(id);

// Search
await api.searchProtocols({ query: "PCR" });
```

### Experiments

```typescript
// Create
await api.createExperiment(data);

// Read
await api.getExperiment(id);
await api.getExperimentWithAnalyses(id);
await api.listMyExperiments({ status: "IN_PROGRESS" });

// Update
await api.updateExperiment(id, data);

// Lifecycle
await api.startExperiment(id);
await api.completeExperiment(id, { success: true });
await api.failExperiment(id, { reason: "..." });
await api.cancelExperiment(id, { reason: "..." });

// Delete
await api.deleteExperiment(id);
```

## 📱 Screen Integration Status

| Screen             | API Integration | Status        |
| ------------------ | --------------- | ------------- |
| Protocols List     | ✅ Complete     | Working       |
| Create Protocol    | ✅ Complete     | Working       |
| Experiment Details | 🔄 Mock Data    | Ready for API |
| Analyze            | ⏳ Pending      | Not started   |
| Tools              | ⏳ Pending      | Not started   |
| Profile            | ⏳ Pending      | Not started   |

## 🎨 UI Components

### Protocol Card

- Displays protocol information
- Shows status and type
- Supports actions (edit, delete, duplicate)
- Navigates to details

### Experiment Card

- Shows experiment progress
- Displays status indicators
- Real-time updates for running experiments
- Quick actions menu

### Bottom Sheets

- Protocol quick view
- Experiment details
- Filter options
- Action menus

## 🔐 Security

- JWT authentication
- Secure token storage (expo-secure-store)
- HTTPS only
- Input validation
- Error message sanitization

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Protocol CRUD operations work
- [ ] Experiment CRUD operations work
- [ ] Navigation flows work
- [ ] Error handling works
- [ ] Loading states display correctly

### Automated Testing

```bash
# Run tests (when implemented)
npm test
```

## 📊 Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
API Client Method
    ↓
HTTP Request
    ↓
Backend API
    ↓
Database
    ↓
HTTP Response
    ↓
API Client Response
    ↓
Component State Update
    ↓
UI Re-render
```

## 🐛 Troubleshooting

### Common Issues

**Network Errors**

- Check API base URL
- Verify backend is running
- Check internet connection

**Authentication Errors**

- User may need to login again
- Token may have expired
- Check credentials

**Data Not Loading**

- Check API response format
- Verify data transformation
- Check for null/undefined values

**Navigation Issues**

- Verify route paths
- Check parameter passing
- Ensure route files exist

## 🚧 Next Steps

### Immediate

1. Update experiment details screen to use API
2. Add experiment creation flow
3. Implement AI analysis features

### Short Term

1. Add advanced search and filters
2. Implement collaboration features
3. Add data export functionality

### Long Term

1. Real-time collaboration
2. Advanced analytics
3. Mobile optimizations
4. Offline support

## 📞 Support

### Getting Help

1. Check relevant documentation
2. Review error messages
3. Verify API connectivity
4. Check authentication status

### Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 📝 Contributing

When adding new features:

1. Update API client if needed
2. Add TypeScript types
3. Update documentation
4. Test thoroughly
5. Follow existing patterns

## 📄 License

[Your License Here]

---

## 📚 Full Documentation List

1. **[Quick Start Guide](./QUICK_START_GUIDE.md)** - Get started in 5 minutes
2. **[Complete Integration Summary](./COMPLETE_INTEGRATION_SUMMARY.md)** - Full overview
3. **[Experiment API Documentation](./EXPERIMENT_API_DOCUMENTATION.md)** - Complete API reference
4. **[Experiment API Quick Reference](./EXPERIMENT_API_QUICK_REFERENCE.md)** - Quick examples
5. **[Protocol API Quick Reference](./PROTOCOL_API_QUICK_REFERENCE.md)** - Protocol examples
6. **[Experiment Integration Complete](./EXPERIMENT_INTEGRATION_COMPLETE.md)** - Integration overview
7. **[Experiment Details API Integration Guide](./EXPERIMENT_DETAILS_API_INTEGRATION_GUIDE.md)** - Step-by-step guide
8. **[Protocol Integration Summary](./PROTOCOL_INTEGRATION_SUMMARY.md)** - Protocol details
9. **[API Implementation Guide](./API_IMPLEMENTATION_GUIDE.md)** - Implementation patterns
10. **[API Implementation Summary](./API_IMPLEMENTATION_SUMMARY.md)** - Implementation overview

---

**Status**: ✅ Core Integration Complete

**Version**: 1.0.0

**Last Updated**: February 23, 2026

**Maintained By**: Lab Assistant AI Team

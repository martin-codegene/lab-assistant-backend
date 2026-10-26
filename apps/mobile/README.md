# 🧪 Lab Assistant AI

**An Intelligent Wet-Lab Companion Powered by Amazon Nova**

[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Amazon Nova](https://img.shields.io/badge/Amazon_Nova-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/nova/)

## 🎯 Overview

**Lab Assistant AI** is a smart laboratory companion designed to transform how wet-lab experiments are performed, interpreted, and documented. It connects experimental results, protocols, and scientific reasoning into one intelligent workflow, reducing trial-and-error experimentation and accelerating scientific discovery.

### 🏆 **Amazon Nova Competition Project**

This project is designed for the Amazon Nova competition, leveraging:

- **Nova 2 Lite** for advanced reasoning about experimental results
- **Nova 2 Sonic** for conversational Voice Lab Mode
- **Nova multimodal embeddings** for analyzing scientific images
- **Nova Act** for automating lab documentation workflows

## ✨ Key Features

### 🔬 **Intelligent Experiment Analysis**

- **Gel Image Analysis**: Upload PCR/Western blot images for automated analysis
- **Troubleshooting Assistant**: Get AI-powered recommendations for failed experiments
- **Protocol Optimization**: Receive suggestions for improving experimental conditions
- **Result Interpretation**: Context-aware analysis based on structured protocols

### 🎤 **Voice Lab Mode**

- **Hands-free Operation**: Ask questions and log observations while working at the bench
- **Real-time Guidance**: Receive step-by-step instructions during experiments
- **Natural Conversation**: Powered by Amazon Nova 2 Sonic for fluid voice interactions

### 📋 **Protocol Management**

- **Create & Import Protocols**: Structured protocol definitions with reaction setups and cycling conditions
- **Experiment History**: Searchable database of all experiments with linked results
- **Automated Documentation**: Generate clean, structured lab reports automatically

### 🧮 **Lab Tools**

- **Molarity Calculator**: Accurate solution preparation with step-by-step instructions
- **Dilution Assistant**: Prevent calculation errors with guided workflows
- **Unit Conversions**: Quick conversions between common lab units

### 📚 **Knowledge Hub**

- **Look Up**: Instant access to troubleshooting references and best practices
- **Help Center**: Guided tutorials for common lab challenges
- **Personalized Settings**: Tailor explanations and defaults to your research needs

## 🏗️ Architecture

### Frontend

- **React Native/Expo**: Cross-platform mobile app
- **TypeScript**: Type-safe development
- **File-based Routing**: Expo Router for navigation
- **Modern UI**: Custom design system with scientific aesthetic

### Backend (Planned)

- **Hono.js**: High-performance TypeScript backend
- **Amazon Nova Integration**: AI reasoning and multimodal analysis
- **PostgreSQL/SQLite**: Experiment and protocol database
- **Cloudflare Workers/AWS Lambda**: Edge deployment

### AI Integration

- **Amazon Nova 2 Lite**: Reasoning about experimental results
- **Amazon Nova 2 Sonic**: Voice AI for hands-free interaction
- **Amazon Nova Multimodal Embeddings**: Image analysis for gel data
- **Amazon Nova Act**: Workflow automation for documentation

## 📱 Screens

### Main Navigation

- **Analyze**: AI-powered experiment analysis and troubleshooting
- **Protocols**: Create, manage, and import lab protocols
- **Tools**: Molarity calculator, dilution assistant, and unit conversions
- **Profile**: Personal settings and experiment history
- **Voice Lab Mode**: Hands-free laboratory assistance

### Key Screens

1. **Analyze Screen**: Upload images, describe results, get AI recommendations
2. **Create Protocol Screen**: Structured protocol creation with step-by-step setup
3. **Experiment Details**: Comprehensive view of experiment results and analysis
4. **Onboarding**: Guided setup for new researchers
5. **Subscribe Screen**: Premium features and team collaboration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Amazon Nova API credentials (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/lab-assistant-ai.git
   cd lab-assistant-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Add your Amazon Nova API keys and configuration
   ```

4. **Start the development server**

   ```bash
   npx expo start
   ```

5. **Run on your preferred platform**

   ```bash
   # iOS
   npx expo run:ios

   # Android
   npx expo run:android

   # Web
   npx expo start --web
   ```

## 🧪 Development

### Project Structure

```
lab-app/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home/Analyze tab
│   │   ├── protocols.tsx  # Protocols tab
│   │   ├── tools.tsx      # Tools tab
│   │   └── profile.tsx    # Profile tab
│   ├── (routes)/          # Modal and nested routes
│   └── _layout.tsx        # Root layout
├── screens/               # Screen components
│   ├── analyze-screen.tsx # Main analysis interface
│   ├── create-protocol-screen.tsx
│   ├── onboarding-screen.tsx
│   └── ...
├── components/            # Reusable components
├── assets/               # Images, fonts, icons
├── .expo/                # Expo configuration
└── package.json
```

### Key Dependencies

- **@gorhom/bottom-sheet**: Interactive bottom sheets
- **@hugeicons/react-native**: Icon library
- **expo-audio**: Audio recording for Voice Lab Mode
- **expo-image-picker**: Image upload for gel analysis
- **react-native-safe-area-context**: Safe area handling
- **react-native-gesture-handler**: Gesture support

## 🔧 Configuration

### Environment Variables

```env
EXPO_PUBLIC_NOVA_API_KEY=your_nova_api_key
EXPO_PUBLIC_NOVA_ENDPOINT=https://api.nova.aws.amazon.com
EXPO_PUBLIC_ANALYSIS_MODEL=nova-2-lite
EXPO_PUBLIC_VOICE_MODEL=nova-2-sonic
EXPO_PUBLIC_MULTIMODAL_MODEL=nova-multimodal-embeddings
```

### Amazon Nova Integration

To enable AI features:

1. Sign up for Amazon Nova at [aws.amazon.com/nova](https://aws.amazon.com/nova)
2. Obtain API keys from AWS Console
3. Configure the appropriate models for your use case
4. Set up billing and usage limits

## 🎨 Design System

### Color Palette

- **Science Blue** (`#2563eb`): Primary brand color
- **Lab Green** (`#10b981`): Success and user actions
- **Warning Orange** (`#f59e0b`): Caution and alerts
- **Error Red** (`#ef4444`): Errors and critical issues
- **Neutral Grays**: Clean, scientific aesthetic

### Typography

- **Inter**: Clean, readable sans-serif font
- **Scientific Notation**: Proper formatting for units and measurements
- **Hierarchy**: Clear visual hierarchy for complex information

## 📊 Data Models

### Experiment

```typescript
interface Experiment {
  id: string;
  title: string;
  protocolId: string;
  date: Date;
  results: Result[];
  observations: string[];
  analysis: Analysis;
  recommendations: Recommendation[];
  attachments: Attachment[];
}
```

### Protocol

```typescript
interface Protocol {
  id: string;
  name: string;
  description: string;
  steps: ProtocolStep[];
  materials: Material[];
  conditions: Conditions;
  category: "PCR" | "Western Blot" | "Cell Culture" | "Other";
}
```

### Analysis Result

```typescript
interface Analysis {
  observations: string[];
  issues: Issue[];
  confidence: number;
  recommendations: Recommendation[];
  nextSteps: NextStep[];
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Maintain consistent code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Amazon Nova Team** for providing cutting-edge AI capabilities
- **Expo Team** for the excellent React Native framework
- **Scientific Community** for protocols and best practices
- **Open Source Contributors** for various libraries and tools

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/lab-assistant-ai/issues)
- **Documentation**: [Full documentation](https://docs.labassistant.ai)
- **Email**: support@labassistant.ai

## 🌟 Roadmap

### Phase 1: Core MVP (Current)

- [x] Basic experiment analysis interface
- [x] Protocol management
- [x] Voice Lab Mode foundation
- [x] Local data storage

### Phase 2: Amazon Nova Integration

- [ ] Nova 2 Lite integration for reasoning
- [ ] Nova 2 Sonic for enhanced voice AI
- [ ] Nova multimodal embeddings for image analysis
- [ ] Cloud backend with Hono.js

### Phase 3: Advanced Features

- [ ] Team collaboration
- [ ] Lab equipment integration
- [ ] Advanced analytics dashboard
- [ ] Publication-ready report generation

### Phase 4: Enterprise

- [ ] Multi-lab management
- [ ] Compliance and audit trails
- [ ] Integration with lab management systems
- [ ] Advanced security features

---

**Lab Assistant AI** - Transforming wet-lab research with intelligent AI assistance. 🧪🔬🤖

# Amazon Nova Integration Guide

## Overview

This guide explains how to integrate Amazon Nova AI service into the Lab Assistant AI backend for image analysis, troubleshooting, and protocol optimization.

## Architecture

The integration follows the **Adapter Pattern** for clean separation and easy swapping of AI providers:

```
┌─────────────────────────────────────────┐
│     Analysis Use Cases (Business Logic) │
├─────────────────────────────────────────┤
│     IAIService Interface (Abstraction)  │
├─────────────────────────────────────────┤
│  AmazonNovaService (Concrete Adapter)   │
├─────────────────────────────────────────┤
│        Amazon Nova API (External)       │
└─────────────────────────────────────────┘
```

## Files Structure

```
src/
├── infrastructure/
│   └── services/
│       ├── ai-service.interface.ts      # AI service abstraction
│       └── amazon-nova-service.ts       # Amazon Nova implementation
├── application/
│   └── use-cases/
│       └── analysis-use-cases.ts        # Uses IAIService
└── presentation/
    └── routes/
        └── analysis-routes.ts           # Injects AmazonNovaService
```

## Where Amazon Nova is Plugged In

### 1. Service Interface (`ai-service.interface.ts`)

Defines the contract that any AI service must implement:

```typescript
export interface IAIService {
  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult>;
  analyzeText(input: TextAnalysisInput): Promise<TextAnalysisResult>;
  isAvailable(): Promise<boolean>;
  getServiceName(): string;
}
```

### 2. Amazon Nova Adapter (`amazon-nova-service.ts`)

**This is where you integrate with Amazon Nova API:**

```typescript
export class AmazonNovaService implements IAIService {
  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    // TODO: Replace mock with actual Amazon Nova API call
    const response = await fetch(`${this.config.endpoint}/analyze-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model?.multimodal,
        image_url: input.imageUrl,
        analysis_type: input.analysisType,
        metadata: input.metadata,
      }),
    });

    const data = await response.json();
    
    return {
      observations: data.observations,
      recommendations: data.recommendations,
      nextSteps: data.next_steps,
      confidence: data.confidence,
      processingTime: Date.now() - startTime,
    };
  }
}
```

### 3. Dependency Injection (`analysis-routes.ts`)

The AI service is injected into the use cases:

```typescript
const aiService = new AmazonNovaService(); // ← Amazon Nova is plugged in here
const analysisUseCases = new AnalysisUseCases(
  analysisRepository,
  experimentRepository,
  aiService  // ← Injected
);
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Amazon Nova AI Service
AMAZON_NOVA_API_KEY="your-api-key-here"
AMAZON_NOVA_REGION="us-east-1"
AMAZON_NOVA_ENDPOINT="https://api.nova.amazonaws.com"

# Model Selection
AMAZON_NOVA_MULTIMODAL_MODEL="nova-multimodal-v1"
AMAZON_NOVA_TEXT_MODEL="nova-2-lite"
AMAZON_NOVA_VOICE_MODEL="nova-2-sonic"
```

### Getting Amazon Nova Credentials

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to Amazon Nova service
3. Create API credentials
4. Copy API key and endpoint URL
5. Add to `.env` file

## Implementation Steps

### Step 1: Update Amazon Nova Service

Open `src/infrastructure/services/amazon-nova-service.ts` and replace the mock implementations:

#### For Image Analysis:

```typescript
async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
  const startTime = Date.now();

  // Replace this section with actual Amazon Nova API call
  const response = await fetch(`${this.config.endpoint}/v1/multimodal/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Nova-Region': this.config.region || 'us-east-1',
    },
    body: JSON.stringify({
      model: this.config.model?.multimodal || 'nova-multimodal-v1',
      image: {
        url: input.imageUrl,
      },
      task: input.analysisType,
      parameters: {
        confidence_threshold: 0.7,
        max_observations: 10,
      },
      metadata: input.metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amazon Nova API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Map Amazon Nova response to our format
  return {
    observations: data.observations.map((obs: any) => ({
      type: obs.type,
      description: obs.description,
      confidence: obs.confidence,
      location: obs.location,
      metadata: obs.metadata,
    })),
    recommendations: data.recommendations.map((rec: any) => ({
      action: rec.action,
      priority: rec.priority,
      rationale: rec.rationale,
      estimatedTime: rec.estimated_time,
      resources: rec.resources,
    })),
    nextSteps: data.next_steps.map((step: any) => ({
      step: step.title,
      description: step.description,
      dependencies: step.dependencies,
    })),
    confidence: data.overall_confidence,
    processingTime: Date.now() - startTime,
  };
}
```

#### For Text Analysis:

```typescript
async analyzeText(input: TextAnalysisInput): Promise<TextAnalysisResult> {
  const startTime = Date.now();

  const response = await fetch(`${this.config.endpoint}/v1/text/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Nova-Region': this.config.region || 'us-east-1',
    },
    body: JSON.stringify({
      model: this.config.model?.text || 'nova-2-lite',
      prompt: input.prompt,
      context: input.context,
      task: input.analysisType,
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Amazon Nova API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    observations: data.observations,
    recommendations: data.recommendations,
    nextSteps: data.next_steps,
    confidence: data.confidence,
    processingTime: Date.now() - startTime,
  };
}
```

### Step 2: Test the Integration

```bash
# Start the server
bun run dev

# Test gel image analysis
curl -X POST http://localhost:3000/api/analyses/gel-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "experimentId": "experiment-uuid",
    "imageUrl": "https://example.com/gel-image.jpg",
    "metadata": {
      "lanes": 4,
      "marker": "1kb ladder"
    }
  }'
```

### Step 3: Handle Errors

Add proper error handling:

```typescript
async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
  try {
    // API call here
  } catch (error) {
    if (error instanceof Error) {
      // Log error for debugging
      console.error('Amazon Nova API Error:', {
        message: error.message,
        input: input.imageUrl,
        timestamp: new Date().toISOString(),
      });

      // Throw user-friendly error
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
    throw error;
  }
}
```

## API Endpoints Using Amazon Nova

### 1. Gel Image Analysis

**POST** `/api/analyses/gel-image`

```javascript
const response = await api.post('/analyses/gel-image', {
  experimentId: 'experiment-uuid',
  imageUrl: 'https://example.com/gel.jpg',
  metadata: {
    lanes: 4,
    marker: '1kb ladder'
  }
});
```

### 2. Troubleshooting

**POST** `/api/analyses/troubleshoot`

```javascript
const response = await api.post('/analyses/troubleshoot', {
  experimentId: 'experiment-uuid',
  problem: 'No bands visible on gel after PCR',
  context: {
    protocol: 'PCR Amplification',
    reagents: ['Taq polymerase', 'dNTPs', 'primers']
  }
});
```

### 3. Protocol Optimization

**POST** `/api/analyses/optimize-protocol`

```javascript
const response = await api.post('/analyses/optimize-protocol', {
  experimentId: 'experiment-uuid',
  currentProtocol: {
    steps: [...],
    materials: [...],
    conditions: {...}
  },
  issues: ['Takes too long', 'High reagent cost']
});
```

## Switching AI Providers

To switch from Amazon Nova to another AI provider (e.g., OpenAI, Google AI):

### 1. Create New Adapter

```typescript
// src/infrastructure/services/openai-service.ts
export class OpenAIService implements IAIService {
  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    // OpenAI implementation
  }

  async analyzeText(input: TextAnalysisInput): Promise<TextAnalysisResult> {
    // OpenAI implementation
  }

  isAvailable(): Promise<boolean> {
    // Check OpenAI availability
  }

  getServiceName(): string {
    return "OpenAI";
  }
}
```

### 2. Update Dependency Injection

```typescript
// src/presentation/routes/analysis-routes.ts
import { OpenAIService } from '@infrastructure/services/openai-service'

// Change this line:
const aiService = new OpenAIService(); // ← Switch to OpenAI
```

That's it! No changes needed in use cases or routes.

## Mock Mode (Development)

The system works without Amazon Nova configured:

- If `AMAZON_NOVA_API_KEY` is not set, it uses mock responses
- Perfect for development and testing
- Mock responses are realistic and cover all analysis types

## Production Checklist

- [ ] Set `AMAZON_NOVA_API_KEY` in production environment
- [ ] Configure correct `AMAZON_NOVA_REGION`
- [ ] Set appropriate `AMAZON_NOVA_ENDPOINT`
- [ ] Test all analysis types with real data
- [ ] Monitor API usage and costs
- [ ] Set up error logging and alerting
- [ ] Configure rate limiting if needed
- [ ] Add retry logic for failed requests
- [ ] Implement caching for repeated analyses

## Monitoring

Add logging to track Amazon Nova usage:

```typescript
async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
  const startTime = Date.now();
  
  console.log('Amazon Nova Request:', {
    type: 'image_analysis',
    analysisType: input.analysisType,
    timestamp: new Date().toISOString(),
  });

  const result = await this.callNovaAPI(input);

  console.log('Amazon Nova Response:', {
    type: 'image_analysis',
    processingTime: Date.now() - startTime,
    confidence: result.confidence,
    observationCount: result.observations.length,
  });

  return result;
}
```

## Cost Optimization

1. **Cache Results**: Store analysis results to avoid duplicate API calls
2. **Batch Processing**: Group multiple analyses when possible
3. **Confidence Threshold**: Only process high-quality images
4. **Rate Limiting**: Prevent excessive API usage
5. **Model Selection**: Use appropriate model for each task

## Troubleshooting

### Issue: "Amazon Nova service is not configured"

**Solution**: Set `AMAZON_NOVA_API_KEY` in `.env` file

### Issue: API calls failing

**Solution**: Check:
- API key is valid
- Endpoint URL is correct
- Network connectivity
- API rate limits

### Issue: Low confidence scores

**Solution**:
- Improve image quality
- Provide more context in metadata
- Adjust confidence thresholds

## Support

For Amazon Nova specific issues:
- AWS Support: https://aws.amazon.com/support/
- Amazon Nova Documentation: https://docs.aws.amazon.com/nova/

For integration issues:
- Check application logs
- Review error messages
- Test with mock mode first

---

**Last Updated**: February 23, 2026

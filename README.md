# CV-Job Matcher API

A Node.js server built with tRPC that provides an AI-powered CV and job description matching service. The service analyzes both documents and provides insights about candidate's fit for the position.

## 🚀 Features

- PDF processing for CVs and job descriptions
- AI-powered analysis using Gemini 1.5 Flash
- Candidate strengths and weaknesses identification
- Job fit evaluation
- Type-safe API using tRPC
- Rate limiting protection
- Comprehensive error handling
- File upload management

## 📋 Prerequisites

- Node.js 18 or higher (required for global fetch)
- npm or pnpm package manager
- Access to Gemini AI API

## 🛠 Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
npm install
# or if using pnpm
pnpm install
```

3. Configure environment variables:
```bash
cp env.example .env
```

Edit `.env` file with your configuration:
```env
AI_API_TOKEN=your_api_token_here
AI_API_ENDPOINT=https://intertest.woolf.engineering/invoke
MAX_REQUESTS_PER_MINUTE=20
MAX_REQUESTS_PER_HOUR=300
PORT=3000
UPLOAD_DIR=files
MAX_FILE_SIZE=5242880
NODE_ENV=development
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
This will start both the server and client in development mode with hot reloading.

### Production Mode
```bash
npm run build
npm run start
```

## 📝 API Documentation

### CV-Job Matching Endpoint

**Endpoint**: `match.analyzePdfs`

**Description**: Analyzes a CV and job description to evaluate candidate fit.

**Input Parameters**:
- `cv`: PDF file containing the candidate's CV
- `vacancy`: PDF file containing the job description

**Response Format**:
```typescript
{
  result: {
    score: number;          // Overall match score (0-100)
    strengths: string[];    // List of candidate's strengths
    weaknesses: string[];   // List of candidate's weaknesses
    recommendations: string[]; // Improvement suggestions
  }
}
```

### Rate Limits
- 20 requests per minute
- 300 requests per hour

## ⚠️ Error Handling

The API returns structured error responses in the following format:

```typescript
{
  code: string;        // Error code
  message: string;     // Human-readable error message
  details?: unknown;   // Additional error details if available
}
```

Common Error Codes:
- `RATE_LIMIT_EXCEEDED`: Request exceeds rate limit
- `INVALID_FILE_FORMAT`: Uploaded file is not a valid PDF
- `FILE_TOO_LARGE`: File size exceeds maximum limit
- `AI_SERVICE_ERROR`: Error from AI analysis service
- `PARSE_ERROR`: Error parsing PDF content

## 🔒 Security

- File uploads are limited to 5MB
- Only PDF files are accepted
- Temporary files are automatically cleaned up
- Rate limiting prevents abuse
- Environment variables for sensitive configuration

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

For development testing with hot reload:
```bash
npm run test-dev
```

## 📦 Project Structure

```
├── src/
│   ├── client/        # Client-side code
│   ├── server/        # Server implementation
│   │   ├── config/    # Configuration
│   │   ├── middleware/# Express middleware
│   │   ├── routers/  # tRPC routers
│   │   ├── services/ # Business logic
│   │   ├── types/    # TypeScript types
│   │   └── utils/    # Utility functions
│   └── shared/       # Shared types and utilities
├── test/            # Test files
├── files/           # Temporary file storage
└── logs/           # Application logs
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Communication Dashboard

A React-based dashboard for managing overlay notifications via Firebase Cloud Messaging (FCM).

## Features

- Configure and send overlay notifications to devices
- Upload CSV files containing FCM device tokens
- Preview overlay notifications before sending
- Track success/failure rates with detailed error reporting
- Two authentication options:
  - Directly provide an FCM OAuth token
  - Upload a Firebase service account JSON file to generate an FCM token

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Authentication Options

### Direct FCM Token
You can directly provide an FCM OAuth token obtained from the Google Cloud Platform. This token should include the "Bearer" prefix.

### Service Account JSON
Alternatively, you can upload a Firebase service account JSON file, which the application can use to generate an FCM token. 

**Important Note:** The service account authentication method requires a backend implementation. The frontend code includes placeholders for making API calls to a server endpoint that would handle JWT signing using the service account's private key. For security reasons, private keys should never be processed directly in the browser.

#### Backend Implementation Requirements

To fully implement the service account authentication method, you need to:

1. Create a server endpoint (e.g., `/api/generate-fcm-token`) that:
   - Accepts service account details
   - Creates and signs a JWT with the appropriate claims
   - Exchanges the JWT for an OAuth token via Google's token endpoint
   - Returns the token to the frontend

2. Update the `generateFCMTokenFromServiceAccount` function in `src/services/firebaseTokenService.ts` to call your backend endpoint instead of throwing an error.

## Usage

1. Choose your authentication method (FCM Token or Service Account)
2. Configure your overlay notification (title, description, actions, etc.)
3. Upload a CSV file containing FCM device tokens
4. Click "Send Overlay" to dispatch the notifications
5. View results and any errors in the summary dialog

## CSV Format

The CSV file should contain a column named "token" with FCM device tokens:

```csv
token
cGz0BFK5QA:APA91bG...
f-VQiQTQRGS:APA91bF...
```


import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add try-catch to catch any rendering errors that might cause white screen
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Failed to find root element");
    // Create a fallback root element if needed
    const fallbackRoot = document.createElement("div");
    fallbackRoot.id = "root";
    document.body.appendChild(fallbackRoot);
    createRoot(fallbackRoot).render(<App />);
  } else {
    createRoot(rootElement).render(<App />);
  }
} catch (error) {
  console.error("Critical rendering error:", error);
  
  // Display a user-friendly error message instead of white screen
  document.body.innerHTML = `
    <div style="font-family: sans-serif; padding: 20px; text-align: center;">
      <h2>Something went wrong</h2>
      <p>The application encountered an error. Please try refreshing the page.</p>
      <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 20px; cursor: pointer;">
        Refresh Page
      </button>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        Error details: ${error instanceof Error ? error.message : 'Unknown error'}
      </p>
    </div>
  `;
}

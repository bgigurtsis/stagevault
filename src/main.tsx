
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add robust error boundary to catch any rendering errors
try {
  // Find or create the root element
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Failed to find root element");
    // Create a fallback root element
    const fallbackRoot = document.createElement("div");
    fallbackRoot.id = "root";
    document.body.appendChild(fallbackRoot);
    
    try {
      createRoot(fallbackRoot).render(<App />);
    } catch (renderError) {
      console.error("Critical rendering error:", renderError);
      displayErrorFallback(renderError, fallbackRoot);
    }
  } else {
    try {
      createRoot(rootElement).render(<App />);
    } catch (renderError) {
      console.error("Critical rendering error:", renderError);
      displayErrorFallback(renderError, rootElement);
    }
  }
} catch (error) {
  console.error("Critical application initialization error:", error);
  
  // Ensure the DOM is available before trying to display the error
  if (document.body) {
    displayErrorFallback(error);
  } else {
    // If document.body is not available, wait for it
    window.addEventListener('DOMContentLoaded', () => {
      displayErrorFallback(error);
    });
  }
}

// Helper function to display a user-friendly error fallback
function displayErrorFallback(error: unknown, container: HTMLElement = document.body) {
  // Create a visually appealing error message
  const errorContainer = document.createElement('div');
  errorContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  errorContainer.style.padding = '20px';
  errorContainer.style.maxWidth = '600px';
  errorContainer.style.margin = '40px auto';
  errorContainer.style.borderRadius = '8px';
  errorContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  errorContainer.style.backgroundColor = '#fff';
  errorContainer.style.color = '#333';
  errorContainer.style.textAlign = 'center';

  // Add the error content
  errorContainer.innerHTML = `
    <div style="margin-bottom: 20px;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h2 style="font-size: 24px; margin-bottom: 16px; color: #e11d48;">Application Error</h2>
    <p style="margin-bottom: 20px; line-height: 1.5; color: #555;">
      The application encountered an unexpected error while loading. This might be due to a temporary issue.
    </p>
    <p style="margin-bottom: 24px; font-size: 14px; color: #666;">
      Error details: ${error instanceof Error ? error.message : 'Unknown error'}
    </p>
    <div style="margin-bottom: 8px;">
      <button onclick="window.location.reload()" style="background-color: #f97316; color: white; border: none; padding: 10px 16px; border-radius: 4px; font-weight: 500; cursor: pointer;">
        Refresh Page
      </button>
    </div>
    <div>
      <button onclick="window.location.href='/'" style="background-color: transparent; color: #555; border: 1px solid #ddd; padding: 8px 16px; border-radius: 4px; font-weight: 500; cursor: pointer; margin-top: 8px;">
        Go to Homepage
      </button>
    </div>
  `;

  // Clear the container and add the error message
  container.innerHTML = '';
  container.appendChild(errorContainer);
}


import React from 'react'
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
      createRoot(fallbackRoot).render(
        <React.StrictMode>
          <ErrorLogger>
            <App />
          </ErrorLogger>
        </React.StrictMode>
      );
    } catch (renderError) {
      console.error("Critical rendering error:", renderError);
      displayErrorFallback(renderError, fallbackRoot);
    }
  } else {
    try {
      createRoot(rootElement).render(
        <React.StrictMode>
          <ErrorLogger>
            <App />
          </ErrorLogger>
        </React.StrictMode>
      );
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

// Error logging component to catch all errors
function ErrorLogger({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  React.useEffect(() => {
    // Set up global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("GLOBAL ERROR:", event.error);
      console.error("Error message:", event.error?.message);
      console.error("Error stack:", event.error?.stack);
      
      // Don't setError/setHasError here to avoid triggering re-renders
      // Just log the error
    };
    
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{ 
        padding: '20px', 
        margin: '40px auto', 
        maxWidth: '600px', 
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#333',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" style={{ margin: '0 auto' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#e11d48', textAlign: 'center' }}>Application Error</h2>
        <p style={{ marginBottom: '20px', lineHeight: '1.5', color: '#555' }}>
          The application encountered an unexpected error while loading. This might be due to a temporary issue.
        </p>
        <p style={{ marginBottom: '24px', fontSize: '14px', color: '#666' }}>
          Error details: {error instanceof Error ? error.message : String(error)}
        </p>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              backgroundColor: '#f97316', 
              color: 'white', 
              border: 'none', 
              padding: '10px 16px', 
              borderRadius: '4px', 
              fontWeight: '500', 
              cursor: 'pointer' 
            }}
          >
            Refresh Page
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => window.location.href='/'} 
            style={{ 
              backgroundColor: 'transparent', 
              color: '#555', 
              border: '1px solid #ddd', 
              padding: '8px 16px', 
              borderRadius: '4px', 
              fontWeight: '500', 
              cursor: 'pointer', 
              marginTop: '8px' 
            }}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <React.ErrorBoundary
      fallback={({ error }) => {
        console.error("Error caught by ErrorBoundary:", error);
        return displayErrorUI(error);
      }}
      onError={(error, errorInfo) => {
        console.error("Error caught by ErrorBoundary:", error);
        console.error("Error Info:", errorInfo);
        setError(error);
        setHasError(true);
      }}
    >
      {children}
    </React.ErrorBoundary>
  );
}

// Helper function to display a user-friendly error fallback
function displayErrorFallback(error: unknown, container: HTMLElement = document.body) {
  console.error("Displaying error fallback for:", error);
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
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; text-align: left; margin-bottom: 20px; overflow: auto; max-height: 200px;">
      <pre style="margin: 0; font-size: 12px; color: #666; white-space: pre-wrap; word-break: break-word;">${error instanceof Error ? error.stack || error.message : String(error)}</pre>
    </div>
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
  
  // Log to console that the error UI has been displayed
  console.log("Error UI displayed to user");
}

// Helper function to display the error UI for the ErrorBoundary
function displayErrorUI(error: unknown) {
  console.error("Displaying error UI for:", error);
  return (
    <div style={{ 
      padding: '20px', 
      margin: '40px auto', 
      maxWidth: '600px', 
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#333',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" style={{ margin: '0 auto' }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#e11d48', textAlign: 'center' }}>Application Error</h2>
      <p style={{ marginBottom: '20px', lineHeight: '1.5', color: '#555' }}>
        The application encountered an unexpected error. This might be due to a temporary issue.
      </p>
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '4px', 
        textAlign: 'left', 
        marginBottom: '20px',
        overflow: 'auto',
        maxHeight: '200px'
      }}>
        <pre style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: '#666',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {error instanceof Error ? error.stack || error.message : String(error)}
        </pre>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            backgroundColor: '#f97316', 
            color: 'white', 
            border: 'none', 
            padding: '10px 16px', 
            borderRadius: '4px', 
            fontWeight: '500', 
            cursor: 'pointer' 
          }}
        >
          Refresh Page
        </button>
      </div>
      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={() => window.location.href='/'} 
          style={{ 
            backgroundColor: 'transparent', 
            color: '#555', 
            border: '1px solid #ddd', 
            padding: '8px 16px', 
            borderRadius: '4px', 
            fontWeight: '500', 
            cursor: 'pointer', 
            marginTop: '8px' 
          }}
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
}

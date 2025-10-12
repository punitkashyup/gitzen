import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking...')
  const [apiData, setApiData] = useState<any>(null)

  useEffect(() => {
    // Check API health on component mount
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    fetch(`${apiUrl}/health`)
      .then(res => res.json())
      .then(data => {
        setApiStatus('connected')
        setApiData(data)
      })
      .catch(err => {
        setApiStatus('disconnected')
        console.error('API health check failed:', err)
      })
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔐 Gitzen</h1>
        <p>Git Secret Detection & Cleanup Tool</p>
      </header>

      <main className="app-main">
        <div className="status-card">
          <h2>System Status</h2>
          <div className="status-item">
            <span>Frontend:</span>
            <span className="status-badge status-success">✅ Running</span>
          </div>
          <div className="status-item">
            <span>API Backend:</span>
            <span className={`status-badge ${apiStatus === 'connected' ? 'status-success' : 'status-error'}`}>
              {apiStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
          {apiData && (
            <div className="api-info">
              <p>Service: {apiData.service}</p>
              <p>Version: {apiData.version}</p>
            </div>
          )}
        </div>

        <div className="info-card">
          <h2>🚀 Development Environment Ready</h2>
          <p>Your Docker-based development environment is running!</p>
          <ul>
            <li>✅ PostgreSQL database</li>
            <li>✅ Redis cache</li>
            <li>✅ FastAPI backend</li>
            <li>✅ React frontend</li>
          </ul>
          <p className="next-steps">
            <strong>Next steps:</strong> Start building features from Sprint 0 backlog.
          </p>
        </div>

        <div className="links-card">
          <h2>📚 Quick Links</h2>
          <ul className="links-list">
            <li><a href="/docs" target="_blank">API Documentation</a></li>
            <li><a href="http://localhost:8000/health" target="_blank">API Health Check</a></li>
            <li><a href="https://github.com/punitkashyup/gitzen" target="_blank">GitHub Repository</a></li>
            <li><a href="https://geekfleet-dev.atlassian.net/jira/software/projects/GITZ" target="_blank">Jira Board</a></li>
          </ul>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with ❤️ for developer security and privacy</p>
      </footer>
    </div>
  )
}

export default App

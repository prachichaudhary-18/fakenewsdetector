import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Link as LinkIcon, AlertTriangle, CheckCircle, HelpCircle, Activity } from 'lucide-react';
import './Scanner.css';

const Scanner = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleScan = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsScanning(true);
    setProgress(0);
    setResult(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const fetchScanResult = async () => {
      try {
        const payload = activeTab === 'text' ? { text: inputValue } : { url: inputValue };
        // The Node.js backend is running on port 3004 as per .env
        const API_URL = `http://${window.location.hostname}:3004/scan`;
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // If authentication is required, add token here. 
            // For now, mirroring the existing server.js which has a 'protect' middleware.
            // Assuming the user might need to be logged in, but for this fix we'll try the request.
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Analysis failed. Please check if the backend is running.');
        }

        const data = await response.json();
        
        // Map backend response to frontend format
        setResult({
          verdict: data.verdict.toUpperCase(), // 'REAL' or 'FAKE'
          confidence: Math.round(data.confidence * 100),
          text: data.inputText || data.inputUrl || inputValue,
          limeHighlights: (data.highlights || data.lime_phrases || []).map(h => ({
            word: h.phrase,
            type: h.score > 0 ? 'highlight-green' : 'highlight-red'
          }))
        });
      } catch (error) {
        console.error('Scan error:', error);
        alert(error.message);
      } finally {
        setIsScanning(false);
        setProgress(100);
        clearInterval(interval);
      }
    };

    fetchScanResult();
  };

  const renderHighlightedText = () => {
    if (!result) return null;
    
    let htmlContent = result.text;
    result.limeHighlights.forEach(h => {
        const regex = new RegExp(`(${h.word})`, 'gi');
        htmlContent = htmlContent.replace(regex, `<span class="${h.type}">$1</span>`);
    });

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  return (
    <div className="scanner-page">
      <section className="hero-section">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Unmask the Truth <br/> with AI Precision
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          The next generation of fake news detection. Paste a story or URL to analyze linguistic patterns and potential misinformation instantly.
        </motion.p>
      </section>

      <div className="scanner-container glass-panel">
        <div className="scanner-content">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => { setActiveTab('text'); setInputValue(''); setResult(null); }}
            >
              <FileText size={20} /> Paste Article
            </button>
            <button 
              className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
              onClick={() => { setActiveTab('url'); setInputValue(''); setResult(null); }}
            >
              <LinkIcon size={20} /> Article URL
            </button>
          </div>

          <form onSubmit={handleScan} className="scan-form">
            <div className="input-wrapper">
              {activeTab === 'text' ? (
                <textarea
                  className="input-field textarea"
                  placeholder="Paste the full article text here for a deep linguistic analysis..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isScanning}
                />
              ) : (
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://news-site.com/article-to-scan"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isScanning}
                />
              )}
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={!inputValue.trim() || isScanning}
            >
              {isScanning ? (
                <>
                  <Activity className="spinner" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity size={20} />
                  Scan Content
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="progress-container"
              >
                <div className="progress-bar-bg">
                  <motion.div 
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="progress-text">Executing neural analysis... {progress}%</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {result && !isScanning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`result-card glass-panel ${result.verdict.toLowerCase()}`}
          >
            <div className="result-header">
              <div className="verdict-badge">
                <div className="verdict-icon">
                  {result.verdict === 'FAKE' ? <AlertTriangle size={48} color="var(--danger)" /> : <CheckCircle size={48} color="var(--success)" />}
                </div>
                <div className="verdict-info">
                  <span className="verdict-label">Analysis Verdict</span>
                  <h2>{result.verdict} CONTENT</h2>
                </div>
              </div>

              <div className="confidence-meter">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={`circle ${result.verdict.toLowerCase()}`}
                    strokeDasharray={`${result.confidence}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="confidence-value">{result.confidence}%</div>
              </div>
            </div>

            <div className="explanation-section">
              <h3>Explainability Report</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Our model identified specific linguistic markers that strongly influenced this verdict. 
              </p>
              <div className="text-analysis">
                {renderHighlightedText()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scanner;

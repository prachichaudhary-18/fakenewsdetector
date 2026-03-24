import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Clock, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import './History.css';

const History = () => {
  const [filter, setFilter] = useState('all');

  // Realistic mock data
  const stats = {
    total: 124,
    fake: 42,
    real: 78,
    uncertain: 4
  };

  const historyData = [
    {
      id: 1,
      title: "Global climate summit reaches historic agreement on emissions",
      verdict: "REAL",
      confidence: 98,
      timestamp: "2 hours ago",
      text: "Leaders from over 190 nations have signed a landmark treaty today in Geneva to reduce carbon footprints by 50% within the next decade."
    },
    {
      id: 2,
      title: "Ancient spacecraft discovered buried under Antarctic ice",
      verdict: "FAKE",
      confidence: 96,
      timestamp: "5 hours ago",
      text: "A secret archaeological mission has reportedly unearthed a metallic saucer-shaped object deep beneath the Shackleton Range."
    },
    {
      id: 3,
      title: "Tech company announces revolutionary transparent smartphone",
      verdict: "REAL",
      confidence: 85,
      timestamp: "Yesterday",
      text: "The new prototype uses a graphene-based display that is almost entirely see-through while maintaining structural integrity."
    }
  ];

  const chartData = [
    { name: 'Real', value: stats.real, color: 'var(--success)' },
    { name: 'Fake', value: stats.fake, color: 'var(--danger)' },
    { name: 'Uncertain', value: stats.uncertain, color: 'var(--warning)' }
  ];

  const filteredHistory = filter === 'all' 
    ? historyData 
    : historyData.filter(item => item.verdict.toLowerCase() === filter);

  return (
    <div className="history-page">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Analysis History
      </motion.h1>

      <div className="stats-grid">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          <div className="stat-icon"><BarChart3 size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Scans</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
          <div className="stat-icon" style={{color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)'}}><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.fake}</span>
            <span className="stat-label">Fake Detected</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stat-card">
          <div className="stat-icon" style={{color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)'}}><CheckCircle size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.real}</span>
            <span className="stat-label">Verified Real</span>
          </div>
        </motion.div>
      </div>

      <div className="history-content">
        <section className="history-section">
          <div className="history-section-header">
            <h3>Recent Analysis</h3>
            <div className="filters">
              {['all', 'real', 'fake'].map(f => (
                <button 
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="history-list">
            {filteredHistory.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="history-card"
              >
                <div className="history-card-top">
                  <div className="history-card-verdict">
                    {item.verdict === 'FAKE' ? <AlertTriangle size={16} color="var(--danger)" /> : <CheckCircle size={16} color="var(--success)" />}
                    <span className={`verdict-text-${item.verdict.toLowerCase()}`}>{item.verdict}</span>
                    <span style={{color: 'var(--text-muted)', marginLeft: '0.5rem'}}>{item.confidence}% confidence</span>
                  </div>
                  <div className="history-card-timestamp">
                    <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {item.timestamp}
                  </div>
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{item.title}</h4>
                <p className="history-card-text">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="chart-section">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="chart-card"
          >
            <h3>Detection Metrics</h3>
            <div style={{ height: '300px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: '1rem' }}>
              Aggregate performance across your last {stats.total} analysis sessions.
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default History;

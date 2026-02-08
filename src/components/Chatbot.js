// src/components/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../config/api';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI Air Quality Assistant. I can help you with:\n\n• Current air quality analysis\n• Health recommendations\n• Historical data insights\n• Threshold explanations\n• Sensor troubleshooting\n\nHow can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "What's the current air quality?",
    "Is it safe to exercise outside?",
    "Show PM2.5 trends",
    "Explain my readings"
  ]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // AI Response Logic
  const getAIResponse = async (userMessage) => {
    setIsTyping(true);
    
    try {
      // Get current sensor data
      const latestData = await api.get('/api/sensor-data/latest');
      const metrics = latestData.data?.metrics || {};
      
      // Get analytics data
      const [healthScore, trends] = await Promise.all([
        api.get('/api/analytics/health-score').catch(() => ({ data: { score: 0 } })),
        api.get('/api/analytics/trends').catch(() => ({ data: {} }))
      ]);

      const context = {
        metrics,
        healthScore: healthScore.data.score,
        trends: trends.data,
        timestamp: latestData.data?.timestamp
      };

      // Process user query
      const response = await processQuery(userMessage.toLowerCase(), context);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const processQuery = async (query, context) => {
    const { metrics, healthScore, trends } = context;

    // Current air quality queries
    if (query.includes('current') || query.includes('now') || query.includes('what') && query.includes('air quality')) {
      return generateCurrentStatusResponse(metrics, healthScore);
    }

    // PM2.5 specific
    if (query.includes('pm2.5') || query.includes('pm 2.5')) {
      return generatePM25Response(metrics.pm25, trends.pm25);
    }

    // PM10 specific
    if (query.includes('pm10') || query.includes('pm 10')) {
      return generatePM10Response(metrics.pm10, trends.pm10);
    }

    // CO specific
    if (query.includes('co') || query.includes('carbon monoxide')) {
      return generateCOResponse(metrics.co, trends.co);
    }

    // Safety/health queries
    if (query.includes('safe') || query.includes('exercise') || query.includes('outdoor')) {
      return generateSafetyRecommendation(metrics, healthScore);
    }

    // Trends and predictions
    if (query.includes('trend') || query.includes('improving') || query.includes('getting worse')) {
      return generateTrendResponse(trends);
    }

    // Threshold explanations
    if (query.includes('mean') || query.includes('threshold') || query.includes('limit')) {
      return generateThresholdExplanation(query);
    }

    // Historical data
    if (query.includes('yesterday') || query.includes('last week') || query.includes('history')) {
      return "I can help you analyze historical data! Go to the 'Historical Data' page to view trends. What specific time period are you interested in?";
    }

    // Alerts
    if (query.includes('alert') || query.includes('warning')) {
      return generateAlertInfo(metrics);
    }

    // Default response with suggestions
    return `I'm not sure I understand. Here are some things you can ask me:

• "What's the current air quality?"
• "Is it safe to exercise outside?"
• "Show me PM2.5 trends"
• "What does PM2.5 mean?"
• "Why is the air quality poor?"

What would you like to know?`;
  };

  const generateCurrentStatusResponse = (metrics, healthScore) => {
    const status = healthScore >= 80 ? 'Excellent ✅' : 
                   healthScore >= 60 ? 'Good 👍' : 
                   healthScore >= 40 ? 'Moderate ⚠️' : 
                   healthScore >= 20 ? 'Poor 😷' : 'Hazardous 🚨';

    return `**Current Air Quality Status: ${status}**
**Health Score: ${healthScore}/100**

**Current Readings:**
🌫️ PM2.5: ${metrics.pm25 || 'N/A'} µg/m³ ${metrics.pm25 > 35 ? '⚠️ Above safe limit!' : '✅'}
🌬️ PM10: ${metrics.pm10 || 'N/A'} µg/m³ ${metrics.pm10 > 150 ? '⚠️ High!' : '✅'}
☁️ CO: ${metrics.co || 'N/A'} ppm ${metrics.co > 9 ? '⚠️ Elevated!' : '✅'}
${metrics.temperature ? `🌡️ Temperature: ${metrics.temperature}°C` : ''}
${metrics.humidity ? `💧 Humidity: ${metrics.humidity}%` : ''}

${healthScore >= 60 ? '✅ Air quality is acceptable for most people.' : '⚠️ Sensitive individuals should limit prolonged outdoor exposure.'}`;
  };

  const generatePM25Response = (pm25, trend) => {
    const safe = pm25 <= 35;
    const direction = trend?.direction || 'stable';
    
    return `**PM2.5 Analysis**

**Current Level:** ${pm25} µg/m³ ${safe ? '✅ Safe' : '⚠️ Unhealthy'}
**Trend:** ${direction === 'increasing' ? '📈 Increasing' : direction === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}
${trend?.changePercent ? `**Change:** ${trend.changePercent}%` : ''}

**What is PM2.5?**
Fine particulate matter (PM2.5) are tiny particles less than 2.5 micrometers in diameter. They can penetrate deep into lungs and bloodstream.

**Safe Levels:**
• 0-12 µg/m³: Good
• 12-35 µg/m³: Moderate
• 35-55 µg/m³: Unhealthy for sensitive groups
• 55+: Unhealthy for everyone

${safe ? '✅ Your current PM2.5 level is within safe limits.' : '⚠️ Consider limiting outdoor activities, especially for sensitive individuals.'}`;
  };

  const generatePM10Response = (pm10, trend) => {
    return `**PM10 Analysis**

**Current Level:** ${pm10} µg/m³
**Safe Threshold:** 150 µg/m³
**Status:** ${pm10 <= 150 ? '✅ Acceptable' : '⚠️ High'}

PM10 particles are larger than PM2.5 but can still affect respiratory health. ${pm10 > 150 ? 'Consider wearing a mask outdoors.' : 'Level is within acceptable range.'}`;
  };

  const generateCOResponse = (co, trend) => {
    return `**Carbon Monoxide (CO) Analysis**

**Current Level:** ${co} ppm
**Safe Limit:** 9 ppm
**Status:** ${co <= 9 ? '✅ Safe' : '⚠️ Elevated'}

CO is a colorless, odorless gas that can be harmful at high concentrations. ${co > 9 ? '⚠️ Consider checking for nearby sources like vehicle exhaust or combustion.' : '✅ Level is safe.'}`;
  };

  const generateSafetyRecommendation = (metrics, healthScore) => {
    if (healthScore >= 80) {
      return `✅ **It's SAFE for outdoor activities!**

Air quality is excellent. You can:
• Exercise outdoors freely
• Run, jog, or bike
• Spend time in parks
• Open windows for ventilation

Enjoy the fresh air! 🌳`;
    } else if (healthScore >= 60) {
      return `👍 **Generally SAFE with minor precautions**

Air quality is acceptable. Recommendations:
• Outdoor exercise is okay for most people
• Sensitive individuals should monitor symptoms
• Consider indoor activities if you have respiratory conditions

Overall, outdoor activities are fine! 🏃`;
    } else if (healthScore >= 40) {
      return `⚠️ **MODERATE - Take precautions**

Recommendations:
• Limit prolonged outdoor exertion
• Sensitive groups should reduce outdoor activities
• Consider wearing a mask if exercising outside
• Indoor workouts are better today

Children, elderly, and those with lung/heart conditions should be careful. 😷`;
    } else {
      return `🚨 **UNHEALTHY - Avoid outdoor activities**

Strong recommendations:
• ❌ Avoid outdoor exercise
• Stay indoors with windows closed
• Use air purifiers if available
• Wear N95 masks if you must go outside
• Reschedule outdoor plans

Everyone may experience health effects. Sensitive groups should take extra precautions! 🏠`;
    }
  };

  const generateTrendResponse = (trends) => {
    const trendSummary = Object.entries(trends).map(([key, data]) => {
      const icon = data.direction === 'increasing' ? '📈' : data.direction === 'decreasing' ? '📉' : '➡️';
      return `${icon} ${key.toUpperCase()}: ${data.direction} (${data.changePercent}%)`;
    }).join('\n');

    return `**Air Quality Trends**

${trendSummary || 'No trend data available yet.'}

Trends show how pollutant levels are changing over time. ${trends.pm25?.direction === 'decreasing' ? 'Good news - levels are improving!' : 'Monitor conditions closely.'}`;
  };

  const generateThresholdExplanation = (query) => {
    return `**Air Quality Thresholds Explained**

**PM2.5 (Fine Particles):**
• Safe: 0-35 µg/m³
• Moderate: 35-55 µg/m³
• Unhealthy: 55+ µg/m³

**PM10 (Coarse Particles):**
• Safe: 0-150 µg/m³
• Unhealthy: 150+ µg/m³

**CO (Carbon Monoxide):**
• Safe: 0-9 ppm
• Elevated: 9+ ppm

**O3 (Ozone):**
• Safe: 0-100 ppb
• Unhealthy: 100+ ppb

These thresholds are based on WHO and EPA guidelines to protect public health. 📋`;
  };

  const generateAlertInfo = (metrics) => {
    const alerts = [];
    if (metrics.pm25 > 150) alerts.push('🚨 Critical PM2.5 level!');
    if (metrics.pm10 > 200) alerts.push('🚨 Critical PM10 level!');
    if (metrics.co > 10) alerts.push('⚠️ Elevated CO detected!');

    if (alerts.length === 0) {
      return '✅ **No active alerts!** All pollutant levels are within acceptable ranges.';
    }

    return `**Active Alerts:**

${alerts.join('\n')}

Please take immediate precautions and check the dashboard for details.`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    getAIResponse(input);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && <span className="chatbot-badge">AI</span>}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <span className="chatbot-icon">🤖</span>
              <div>
                <h3>AI Air Quality Assistant</h3>
                <span className="chatbot-status">● Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="chatbot-close">✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {msg.content.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line.startsWith('**') && line.endsWith('**') ? (
                          <strong>{line.replace(/\*\*/g, '')}</strong>
                        ) : (
                          line
                        )}
                        {i < msg.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chatbot-message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="chatbot-suggestions">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="chatbot-input">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about air quality..."
              rows="1"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="chatbot-send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;

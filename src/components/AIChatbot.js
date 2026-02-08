// src/components/AIChatbot.js
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../config/api';
import './AIChatbot.css';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I\'m your Air Quality AI Assistant. I can help you with:\n\n• Current air quality status\n• Historical data analysis\n• Health recommendations\n• Sensor data interpretation\n• Alert information\n• Predictions and trends\n\nHow can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Quick action suggestions
  const quickActions = [
    { icon: '📊', text: 'Current air quality', query: 'What is the current air quality status?' },
    { icon: '🏃', text: 'Safe to exercise?', query: 'Is it safe to exercise outside right now?' },
    { icon: '📈', text: 'Show trends', query: 'Show me air quality trends for the past 24 hours' },
    { icon: '⚠️', text: 'Any alerts?', query: 'Are there any active alerts or warnings?' },
    { icon: '🔮', text: 'Forecast', query: 'What is the air quality forecast for tomorrow?' },
    { icon: '💡', text: 'Health tips', query: 'Give me health recommendations based on current air quality' }
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/api/chatbot/query', {
        message: userMessage.text,
        timestamp: new Date().toISOString()
      });

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.data.response,
        data: response.data.data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (query) => {
    setInput(query);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      sender: 'bot',
      text: 'Chat cleared. How can I help you?',
      timestamp: new Date()
    }]);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chat-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && <span className="chat-badge">AI</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-avatar">🤖</div>
              <div>
                <div className="chat-title">Air Quality AI Assistant</div>
                <div className="chat-status">
                  <span className="status-indicator"></span>
                  Online & Ready
                </div>
              </div>
            </div>
            <div className="chat-actions">
              <button onClick={clearChat} className="chat-action-btn" title="Clear chat">
                🗑️
              </button>
              <button onClick={() => setIsOpen(false)} className="chat-action-btn" title="Close">
                ✕
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="quick-actions">
              <div className="quick-actions-title">Quick Actions:</div>
              <div className="quick-actions-grid">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action.query)}
                  >
                    <span className="quick-action-icon">{action.icon}</span>
                    <span className="quick-action-text">{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">
                  <div className="message-text">{msg.text}</div>
                  {msg.data && (
                    <div className="message-data">
                      <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                    </div>
                  )}
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-container">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about air quality..."
              rows="1"
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? '⏳' : '📤'}
            </button>
          </div>

          {/* Footer */}
          <div className="chat-footer">
            Powered by AI • {messages.length - 1} messages
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;

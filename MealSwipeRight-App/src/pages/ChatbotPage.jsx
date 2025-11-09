import { useState, useRef, useEffect } from 'react';
import { sendMessage, isApiKeyConfigured } from '../utils/geminiClient';
import './ChatbotPage.css';

function ChatbotPage({ 
  preferences, 
  userInfo, 
  likedFoods, 
  caloricMaintenance,
  mealPlan 
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your nutrition assistant. I can help you with meal suggestions, nutrition questions, and meal planning based on your preferences. How can I help you today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(!isApiKeyConfigured());

  // Check API key on mount and when component updates
  useEffect(() => {
    const configured = isApiKeyConfigured();
    setApiKeyError(!configured);
    if (!configured) {
      console.warn('⚠️ Gemini API key not found. Please create a .env file in MealSwipeRight-App/ with: VITE_GEMINI_API_KEY=your_key_here');
    }
  }, []);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!isApiKeyConfigured()) {
      setApiKeyError(true);
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Prepare user data for context
      const userData = {
        preferences,
        userInfo,
        likedFoods,
        caloricMaintenance,
        mealPlan: mealPlan || null
      };

      // Get conversation history (excluding system message)
      const conversationHistory = messages.slice(1); // Skip initial greeting

      // Call Gemini API
      const response = await sendMessage(userMessage, userData, conversationHistory);

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure your Gemini API key is configured correctly.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-page page-shell">
      <div className="chatbot-header">
        <div className="hero-pill">AI co-pilot</div>
        <h1>Nutrition Assistant</h1>
        <p>Ask for meal ideas, macro tweaks, or plan adjustments whenever you need a second brain.</p>
        {apiKeyError && (
          <div className="api-key-warning">
            <p>Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.</p>
            <p className="api-key-hint">Create a .env file in MealSwipeRight-App/ with: VITE_GEMINI_API_KEY=your_api_key_here</p>
          </div>
        )}
      </div>
      
      <div className="chatbot-content glass">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">
                {message.content.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant-message">
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

        <div className="chat-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={apiKeyError ? "API key required..." : "Type your message here..."}
            disabled={isLoading || apiKeyError}
            className="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading || apiKeyError}
            className="chat-send-button"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;

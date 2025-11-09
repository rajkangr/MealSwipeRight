import './ChatbotPage.css';

function ChatbotPage() {
  return (
    <div className="chatbot-page">
      <div className="chatbot-header">
        <h1>💬 Chatbot</h1>
      </div>
      <div className="chatbot-content">
        <div className="chatbot-placeholder">
          <div className="chatbot-icon">🤖</div>
          <h2>Chatbot Coming Soon</h2>
          <p>This feature is under development. Check back soon!</p>
          <div className="chat-input-placeholder">
            <input
              type="text"
              placeholder="Type your message here..."
              disabled
              className="chat-input"
            />
            <button className="chat-send-button" disabled>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;


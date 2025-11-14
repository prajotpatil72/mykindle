import { useState, useEffect, useRef } from 'react';
import chatService from '../services/chatService';

const ChatPanel = ({ documentId, currentPage, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversation();
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      setLoadingHistory(true);
      const response = await chatService.getConversation(documentId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message immediately
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await chatService.sendMessage(documentId, userMessage, currentPage);
      
      // Add assistant message
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.message },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Clear all chat history?')) return;

    try {
      await chatService.clearConversation(documentId);
      setMessages([]);
    } catch (error) {
      alert('Failed to clear chat');
    }
  };

  const quickQuestions = [
    '📝 Summarize this document',
    '💡 What are the key points?',
    '🔍 Explain this page',
    '📊 List the main topics',
  ];

  const handleQuickQuestion = (question) => {
    setInput(question.replace(/[📝💡🔍📊]\s/, ''));
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>💬 AI Assistant</h3>
        <div className="chat-header-actions">
          <button className="btn-icon-sm" onClick={handleClearChat} title="Clear chat">
            🗑️
          </button>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {loadingHistory ? (
          <div className="chat-loading">
            <div className="spinner"></div>
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>👋 Hi! I can help you understand this document.</p>
            <p className="text-muted">Ask me anything!</p>
            <div className="quick-questions">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`message message-${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="message message-assistant">
            <div className="message-avatar">🤖</div>
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
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask a question about this document..."
          rows="2"
          disabled={loading}
        />
        <button
          className="btn btn-primary chat-send-btn"
          onClick={handleSendMessage}
          disabled={!input.trim() || loading}
        >
          {loading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
import Conversation from '../models/Conversation.js';
import Document from '../models/Document.js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// @desc    Send message to LLM
// @route   POST /api/chat/:documentId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;
    const { message, pageNumber } = req.body;

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required',
      });
    }

    // Get document
    const document = await Document.findOne({
      _id: documentId,
      userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // Get or create conversation
    let conversation = await Conversation.findOne({
      userId,
      documentId,
      isDeleted: false,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        documentId,
        messages: [],
        context: document.extractedText || document.ocrText || '',
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
    });

    // Prepare context for LLM
    const contextText = conversation.context || 'No text available from document.';
    const pageContext = pageNumber ? `User is viewing page ${pageNumber}.` : '';

    // Call Groq LLM
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant analyzing a PDF document. ${pageContext}\n\nDocument content:\n${contextText.substring(0, 4000)}`,
        },
        ...conversation.messages.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      model: 'llama-3.2-90b-text-preview',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Add assistant message
    conversation.messages.push({
      role: 'assistant',
      content: assistantMessage,
    });

    await conversation.save();

    res.status(200).json({
      status: 'success',
      data: {
        message: assistantMessage,
        conversationId: conversation._id,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

// @desc    Get conversation history
// @route   GET /api/chat/:documentId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    const conversation = await Conversation.findOne({
      userId,
      documentId,
      isDeleted: false,
    });

    res.status(200).json({
      status: 'success',
      data: {
        messages: conversation?.messages || [],
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversation',
    });
  }
};

// @desc    Clear conversation
// @route   DELETE /api/chat/:documentId
// @access  Private
export const clearConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    await Conversation.findOneAndUpdate(
      { userId, documentId, isDeleted: false },
      { messages: [] }
    );

    res.status(200).json({
      status: 'success',
      message: 'Conversation cleared',
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear conversation',
    });
  }
};
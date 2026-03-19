'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Bot, User, PhoneCall } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

function createWelcomeMessage(): Message {
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      "Hello! I'm your Kyron Medical assistant. I can help you schedule appointments, check prescription refills, or find office information. How can I help you today?",
    timestamp: new Date(),
  };
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-start gap-3 max-w-[85%]"
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E4ED8]/10 to-[#BDCBF6]/20 flex items-center justify-center flex-shrink-0 border border-[#BDCBF6]/30">
        <Bot className="w-4 h-4 text-[#1E4ED8]" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(189, 203, 246, 0.3)',
          boxShadow: '0 2px 8px rgba(30, 78, 216, 0.04)',
        }}
      >
        <div className="flex items-center gap-1.5 h-5">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#939393]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#939393]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#939393]" />
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} max-w-[85%] ${
        isUser ? 'ml-auto' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-[#1E4ED8] to-[#3B6FF0]'
            : 'bg-gradient-to-br from-[#1E4ED8]/10 to-[#BDCBF6]/20 border border-[#BDCBF6]/30'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-[#1E4ED8]" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`px-4 py-3 rounded-2xl ${
          isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
        }`}
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, #1E4ED8, #3B6FF0)',
                boxShadow: '0 4px 16px rgba(30, 78, 216, 0.2)',
              }
            : {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(189, 203, 246, 0.3)',
                boxShadow: '0 2px 8px rgba(30, 78, 216, 0.04)',
              }
        }
      >
        <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-[#111827]'} prose-chat`}>
          {isUser ? (
            <p className="m-0">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-[#111827]">{children}</strong>,
                ol: ({ children }) => <ol className="m-0 mb-2 pl-5 list-decimal last:mb-0 space-y-1">{children}</ol>,
                ul: ({ children }) => <ul className="m-0 mb-2 pl-5 list-disc last:mb-0 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="m-0">{children}</li>,
                em: ({ children }) => <em className="text-[#939393] not-italic text-xs">{children}</em>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <p suppressHydrationWarning className={`text-[10px] mt-1.5 ${isUser ? 'text-white/60' : 'text-[#939393]'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => [createWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callPhone, setCallPhone] = useState('');
  const [callConsent, setCallConsent] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'success' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceCall = async () => {
    if (!callPhone.trim() || !callConsent) return;
    setCallStatus('calling');

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: callPhone,
          chatHistory,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to initiate call');
      }

      setCallStatus('success');

      const callMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I'm calling you now at ${callPhone}. Please pick up — I'll have full context of our conversation. Talk soon!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, callMsg]);

      setTimeout(() => {
        setShowCallModal(false);
        setCallStatus('idle');
        setCallPhone('');
        setCallConsent(false);
      }, 2000);
    } catch (error) {
      console.error('Voice call error:', error);
      setCallStatus('error');
      setTimeout(() => setCallStatus('idle'), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] max-w-3xl mx-auto px-4 pb-4">
      {/* Chat Container - Liquid Glass */}
      <motion.div
        className="relative flex flex-col flex-1 overflow-hidden rounded-2xl glass-iridescent"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(189, 203, 246, 0.4)',
          boxShadow: '0 8px 32px rgba(30, 78, 216, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(189, 203, 246, 0.6), transparent)',
          }}
        />

        {/* Chat Header - Glass */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[#BDCBF6]/30"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E4ED8] to-[#3B6FF0] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white online-dot" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111827] tracking-tight">
                Kyron Medical Assistant
              </h2>
              <span className="text-[11px] text-green-500 font-medium">Online</span>
            </div>
          </div>

          {/* Voice Call Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCallModal(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#1E4ED8] transition-colors pulse-ring"
            style={{
              background: 'rgba(30, 78, 216, 0.06)',
              border: '1px solid rgba(30, 78, 216, 0.15)',
            }}
          >
            <PhoneCall className="w-4 h-4" />
            <span className="hidden sm:inline">Call Me</span>
          </motion.button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" style={{ background: 'rgba(249, 250, 252, 0.4)' }}>
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Glass */}
        <div
          className="px-4 py-4 border-t border-[#BDCBF6]/30"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center rounded-xl px-4 py-3 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(189, 203, 246, 0.3)',
                boxShadow: 'inset 0 1px 2px rgba(30, 78, 216, 0.03)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-sm text-[#111827] placeholder:text-[#939393] outline-none font-light"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, #1E4ED8, #3B6FF0)'
                  : 'rgba(189, 203, 246, 0.15)',
                boxShadow: input.trim()
                  ? '0 4px 16px rgba(30, 78, 216, 0.2)'
                  : 'none',
              }}
            >
              <Send className={`w-4 h-4 ${input.trim() ? 'text-white' : 'text-[#939393]'}`} />
            </motion.button>
          </div>
          <p className="text-[10px] text-[#939393] text-center mt-2.5 font-light">
            Kyron Medical AI cannot provide medical advice. For emergencies, call 911.
          </p>
        </div>
      </motion.div>

      {/* Voice Call Modal - Liquid Glass */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowCallModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full rounded-2xl glass-iridescent p-8 text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(189, 203, 246, 0.4)',
                boxShadow: '0 16px 48px rgba(30, 78, 216, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              }}
            >
              {/* Top highlight */}
              <div
                className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(189, 203, 246, 0.6), transparent)',
                }}
              />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E4ED8]/10 to-[#BDCBF6]/20 flex items-center justify-center mx-auto mb-5 border border-[#BDCBF6]/30">
                <Phone className="w-8 h-8 text-[#1E4ED8]" />
              </div>
              {callStatus === 'success' ? (
                <>
                  <h3 className="text-xl font-semibold text-[#111827] mb-2">Calling You Now!</h3>
                  <p className="text-sm text-[#939393] leading-relaxed font-light">
                    Your phone should ring shortly. The AI assistant will have full context of this chat.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-[#111827] mb-2">Continue via Phone</h3>
                  <p className="text-sm text-[#939393] mb-6 leading-relaxed font-light">
                    We&apos;ll call your phone number and the AI assistant will continue
                    your conversation with full context of this chat.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="tel"
                      value={callPhone}
                      onChange={(e) => setCallPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 rounded-xl text-sm text-[#111827] placeholder:text-[#939393] outline-none transition-colors font-light"
                      style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid rgba(189, 203, 246, 0.3)',
                        boxShadow: 'inset 0 1px 2px rgba(30, 78, 216, 0.03)',
                      }}
                    />
                    <label className="flex items-start gap-2.5 text-left cursor-pointer">
                      <input
                        type="checkbox"
                        checked={callConsent}
                        onChange={(e) => setCallConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-[#BDCBF6] bg-white accent-[#1E4ED8]"
                      />
                      <span className="text-xs text-[#939393] leading-relaxed">
                        I agree to receive a phone call and SMS notifications from Kyron Medical
                      </span>
                    </label>
                    {callStatus === 'error' && (
                      <p className="text-xs text-red-500">Failed to initiate call. Please try again.</p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVoiceCall}
                      disabled={!callPhone.trim() || !callConsent || callStatus === 'calling'}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #1E4ED8, #3B6FF0)',
                      }}
                    >
                      {callStatus === 'calling' ? 'Initiating Call...' : 'Call Me Now'}
                    </motion.button>
                    <button
                      onClick={() => {
                        setShowCallModal(false);
                        setCallStatus('idle');
                      }}
                      className="w-full py-2.5 text-sm text-[#939393] hover:text-[#111827] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

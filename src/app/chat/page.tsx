'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Bot, User, PhoneCall } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import GlassCard from '@/components/GlassCard';

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
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#14b8a6]/20 flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
        <Bot className="w-4 h-4 text-[#60a5fa]" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex items-center gap-1.5 h-5">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
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
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/[0.06] ${
          isUser
            ? 'bg-gradient-to-br from-[#3b82f6]/30 to-[#60a5fa]/20'
            : 'bg-gradient-to-br from-[#3b82f6]/20 to-[#14b8a6]/20'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-[#60a5fa]" />
        ) : (
          <Bot className="w-4 h-4 text-[#60a5fa]" />
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
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
              }
            : {
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }
        }
      >
        <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-[#e2e8f0]'} prose-chat`}>
          {isUser ? (
            <p className="m-0">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                ol: ({ children }) => <ol className="m-0 mb-2 pl-5 list-decimal last:mb-0 space-y-1">{children}</ol>,
                ul: ({ children }) => <ul className="m-0 mb-2 pl-5 list-disc last:mb-0 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="m-0">{children}</li>,
                em: ({ children }) => <em className="text-[#94a3b8] not-italic text-xs">{children}</em>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <p suppressHydrationWarning className={`text-[10px] mt-1.5 ${isUser ? 'text-blue-200/60' : 'text-[#64748b]'}`}>
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
      // Send conversation history to API (exclude welcome message from API, but keep for display)
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

      // Add a system message to chat
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
      {/* Chat Container */}
      <GlassCard
        iridescent
        hoverGlow={false}
        className="flex flex-col flex-1 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Chat Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]"
          style={{ background: 'rgba(255, 255, 255, 0.02)' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#14b8a6] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0a1628] online-dot" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Kyron Medical Assistant
              </h2>
              <span className="text-[11px] text-green-400/80 font-medium">Online</span>
            </div>
          </div>

          {/* Voice Call Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCallModal(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#14b8a6] transition-colors pulse-ring"
            style={{
              background: 'rgba(20, 184, 166, 0.08)',
              border: '1px solid rgba(20, 184, 166, 0.2)',
            }}
          >
            <PhoneCall className="w-4 h-4" />
            <span className="hidden sm:inline">Call Me</span>
          </motion.button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 py-4 border-t border-white/[0.06]" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center rounded-xl px-4 py-3 transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#64748b] outline-none font-light"
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
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid',
                borderColor: input.trim()
                  ? 'rgba(96, 165, 250, 0.3)'
                  : 'rgba(255, 255, 255, 0.06)',
              }}
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>
          <p className="text-[10px] text-[#475569] text-center mt-2.5 font-light">
            Kyron Medical AI cannot provide medical advice. For emergencies, call 911.
          </p>
        </div>
      </GlassCard>

      {/* Voice Call Modal */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(6, 13, 27, 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowCallModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard iridescent className="p-8 max-w-sm w-full text-center" blur={30} opacity={0.08}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b8a6]/20 to-[#0d9488]/20 flex items-center justify-center mx-auto mb-5 border border-[#14b8a6]/20">
                  <Phone className="w-8 h-8 text-[#14b8a6]" />
                </div>
                {callStatus === 'success' ? (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-2">Calling You Now!</h3>
                    <p className="text-sm text-[#94a3b8] leading-relaxed font-light">
                      Your phone should ring shortly. The AI assistant will have full context of this chat.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-2">Continue via Phone</h3>
                    <p className="text-sm text-[#94a3b8] mb-6 leading-relaxed font-light">
                      We&apos;ll call your phone number and the AI assistant will continue
                      your conversation with full context of this chat.
                    </p>
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={callPhone}
                        onChange={(e) => setCallPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#64748b] outline-none focus:border-[#14b8a6]/30 transition-colors font-light"
                      />
                      <label className="flex items-start gap-2.5 text-left cursor-pointer">
                        <input
                          type="checkbox"
                          checked={callConsent}
                          onChange={(e) => setCallConsent(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-[#14b8a6]"
                        />
                        <span className="text-xs text-[#94a3b8] leading-relaxed">
                          I agree to receive a phone call and SMS notifications from Kyron Medical
                        </span>
                      </label>
                      {callStatus === 'error' && (
                        <p className="text-xs text-red-400">Failed to initiate call. Please try again.</p>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleVoiceCall}
                        disabled={!callPhone.trim() || !callConsent || callStatus === 'calling'}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                          border: '1px solid rgba(20, 184, 166, 0.3)',
                        }}
                      >
                        {callStatus === 'calling' ? 'Initiating Call...' : 'Call Me Now'}
                      </motion.button>
                      <button
                        onClick={() => {
                          setShowCallModal(false);
                          setCallStatus('idle');
                        }}
                        className="w-full py-2.5 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import { useChatBot, STEPS } from '../hooks/useChatBot';
import './ChatBot.css';

export default function ChatBot() {
  const { state, handleText } = useChatBot();
  const { messages, step, promptsQueue, queueIndex, loading } = state;
  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const lastBotMsg = [...messages].reverse().find(m => m.sender === 'bot')?.text || '';

  const isRegistrationSuccess =
    step === STEPS.POST_REGISTER && /registration successful/i.test(lastBotMsg);
  const isLoginSuccess = step === STEPS.CHAT && /logged in/i.test(lastBotMsg);

  if (isRegistrationSuccess) {
    return (
      <div className="chat-container">
        <div className="login-banner">
          Registration successful! Please type “login” to sign in.
        </div>
      </div>
    );
  }

  if (isLoginSuccess) {
    return (
      <div className="chat-container">
        <div className="login-banner">
          You have successfully logged in!
        </div>
      </div>
    );
  }

  const currentKey = step === STEPS.REG_DETAILS
    ? promptsQueue[queueIndex]?.key
    : null;
  const isOptional = ['npi', 'address2'].includes(currentKey);
  const canSend = loading === false && (
    step === STEPS.REG_DETAILS
      ? isOptional || inputValue.trim() !== ''
      : inputValue.trim() !== ''
  );

  const onSend = () => {
    handleText(inputValue);
    setInputValue('');
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`} data-time={m.timestamp}>
            <span className="avatar">{m.sender === 'bot' ? '🤖' : '👤'}</span>
            <span className="message-text">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <input
          type={[STEPS.LOGIN, STEPS.REG_PASS].includes(step) ? 'password' : 'text'}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canSend && onSend()}
          placeholder={loading ? 'Waiting…' : 'Type here…'}
          disabled={loading}
        />
        <button onClick={onSend} disabled={!canSend}>
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

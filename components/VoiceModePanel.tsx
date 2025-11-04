import React, { useRef, useEffect } from 'react';
import { SparklesIcon } from './Icons';

interface Message {
    speaker: 'user' | 'ai';
    text: string;
}

interface VoiceModePanelProps {
    messages: Message[];
    isThinking: boolean;
    onClose: () => void;
}

const VoiceModePanel: React.FC<VoiceModePanelProps> = ({ messages, isThinking, onClose }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    return (
        <div className="voice-panel-backdrop" onClick={onClose}>
            <div className="voice-panel" onClick={(e) => e.stopPropagation()}>
                <div className="voice-panel-header">
                    <SparklesIcon className="w-5 h-5" />
                    <span>ChoiceForReels AI Voice</span>
                </div>
                <div className="voice-panel-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`voice-bubble-wrapper ${msg.speaker === 'user' ? 'user' : 'ai'}`}>
                            <div className="voice-bubble">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                         <div className="voice-bubble-wrapper ai">
                            <div className="voice-bubble thinking">
                                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};

export default VoiceModePanel;

import React, { useState, useRef } from 'react';
import { Send, Mic, Link, FileUp, Sparkles, Loader2, Disc } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import './ideas.css';

export default function IdeaCaptureInput({ onCapture }) {
  const [text, setText] = useState('');
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'transcribing' | 'saving'
  const textareaRef = useRef(null);
  const { addToast } = useToast();

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    onCapture(text, 'text');
    setText('');
    
    // Resetar altura da textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Envia com Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e) => {
    setText(e.target.value);
    // Auto-ajustar altura
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Simulação premium de Captura de Voz em 4 Estados (Etapa 3 Motion)
  const triggerVoiceCapture = () => {
    if (voiceState !== 'idle') return;
    
    // 1. ESTADO: ESCUTANDO
    setVoiceState('listening');
    addToast("Capturando Áudio", "Escutando som do microfone local... 🎙", "voice", 1500);

    const voiceMocks = [
      "Estudar curso de inglês e fazer exercícios práticos amanhã cedo",
      "Reunião urgente hoje às 14h com equipe para revisar contrato do cliente",
      "Comprar insumos no supermercado e limpar a casa para o final de semana",
      "Desenhar modelo de negócios enxuto canvas para a nova startup em breve"
    ];
    const randomVoice = voiceMocks[Math.floor(Math.random() * voiceMocks.length)];

    // 2. Transição para PROCESSANDO
    setTimeout(() => {
      setVoiceState('processing');
      addToast("Processando Áudio", "IA analisando espectro e ruídos de fundo...", "sync", 1000);

      // 3. Transição para TRANSCREVENDO
      setTimeout(() => {
        setVoiceState('transcribing');
        addToast("Transcrevendo Linguagem", "Convertendo voz em texto inteligente...", "ai", 1200);

        // Digitação Progressiva Mockada
        let currentText = '';
        const words = randomVoice.split(' ');
        let wordIndex = 0;
        
        const typeInterval = setInterval(() => {
          if (wordIndex < words.length) {
            currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
            setText(currentText);
            wordIndex++;
          } else {
            clearInterval(typeInterval);
            
            // 4. Transição para SALVANDO
            setVoiceState('saving');
            addToast("Salvando Transcrição", "Inserindo captura no seu editor de ideias...", "upload", 800);

            setTimeout(() => {
              setVoiceState('idle');
              addToast("Sucesso", "Transcrição de áudio gerada com perfeição!", "success", 2000);
              
              // Focar e ajustar altura
              if (textareaRef.current) {
                textareaRef.current.focus();
                setTimeout(() => {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                }, 50);
              }
            }, 800);
          }
        }, 150);

      }, 1000);

    }, 1500);
  };

  // Simulação de Captura de Link
  const triggerLinkCapture = () => {
    const linkMock = "Achei esse artigo ótimo sobre produtividade pessoal: https://medium.com/productive-life/habits-for-success";
    setText(linkMock);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Simulação de Captura de Arquivos
  const triggerFileCapture = () => {
    const fileMock = "[Anexo: Proposta_Comercial_MVP.pdf] Analisar documento de vendas para novos investidores em negócios";
    setText(fileMock);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const isRecording = voiceState !== 'idle';

  // Helper para renderizar a interface de voz
  const renderVoiceInterface = () => {
    switch (voiceState) {
      case 'listening':
        return (
          <div className="voice-status-container listening">
            <Disc className="voice-status-icon spin-animation" size={16} style={{ color: 'var(--accent)' }} />
            <div className="voice-wave-container voice-breathing-active">
              <div className="voice-wave-bar bar-active"></div>
              <div className="voice-wave-bar bar-active"></div>
              <div className="voice-wave-bar bar-active"></div>
              <div className="voice-wave-bar bar-active"></div>
              <div className="voice-wave-bar bar-active"></div>
              <div className="voice-wave-bar bar-active"></div>
            </div>
            <span className="voice-status-text">Escutando áudio...</span>
          </div>
        );
      case 'processing':
        return (
          <div className="voice-status-container processing">
            <Loader2 className="voice-status-icon spin-animation" size={16} style={{ color: 'var(--secondary)' }} />
            <div className="voice-wave-container">
              <div className="voice-wave-bar bar-flat"></div>
              <div className="voice-wave-bar bar-flat"></div>
              <div className="voice-wave-bar bar-flat"></div>
            </div>
            <span className="voice-status-text">Analisando ondas sonoras...</span>
          </div>
        );
      case 'transcribing':
        return (
          <div className="voice-status-container transcribing">
            <Sparkles className="voice-status-icon pulse-animation" size={16} style={{ color: 'var(--accent)' }} />
            <span className="voice-status-text transcribing-text">
              IA Transcrevendo: <strong style={{ color: 'var(--text-primary)' }}>{text}</strong>
            </span>
          </div>
        );
      case 'saving':
        return (
          <div className="voice-status-container saving">
            <Loader2 className="voice-status-icon spin-animation" size={16} style={{ color: 'var(--status-done)' }} />
            <span className="voice-status-text">Salvando captura local...</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="capture-dock animate-fade-in">
      <form onSubmit={handleSubmit} className={`capture-container ${isRecording ? 'recording-active' : ''}`}>
        
        {isRecording ? (
          renderVoiceInterface()
        ) : (
          <textarea
            ref={textareaRef}
            className="capture-textarea"
            placeholder="Qual é a sua ideia brilhante? Digite ou use comandos rápidos..."
            value={text}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        )}

        <div className="capture-actions">
          {/* Entradas Alternativas */}
          <button
            type="button"
            className={`capture-btn ${voiceState === 'listening' ? 'active voice-breathing-active' : ''}`}
            onClick={triggerVoiceCapture}
            title="Capturar por Voz (Simulador)"
            disabled={isRecording}
            style={{ 
              color: voiceState === 'listening' ? 'var(--accent)' : 'var(--text-secondary)',
              background: voiceState === 'listening' ? 'var(--primary-glow)' : 'transparent',
              boxShadow: voiceState === 'listening' ? '0 0 12px var(--primary-glow)' : 'none'
            }}
          >
            <Mic size={18} />
          </button>
          
          <button
            type="button"
            className="capture-btn"
            onClick={triggerLinkCapture}
            title="Anexar Link (Simulador)"
            disabled={isRecording}
          >
            <Link size={18} />
          </button>

          <button
            type="button"
            className="capture-btn"
            onClick={triggerFileCapture}
            title="Anexar Arquivo (Simulador)"
            disabled={isRecording}
          >
            <FileUp size={18} />
          </button>

          {/* Botão de Enviar */}
          <button
            type="submit"
            className="capture-send-btn"
            disabled={!text.trim() || isRecording}
            title="Salvar Ideia no Inbox"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

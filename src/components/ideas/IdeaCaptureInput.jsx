import React, { useState, useRef } from 'react';
import { Send, Mic, Link, FileUp, Sparkles, Loader2, Disc } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import { transcribeAudio } from '../../services/aiService';
import './ideas.css';

export default function IdeaCaptureInput({ onCapture }) {
  const [text, setText] = useState('');
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'transcribing' | 'saving'
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
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

  // Captura de Voz real com MediaRecorder e Integração com Groq API
  const triggerVoiceCapture = async () => {
    if (voiceState === 'idle') {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Seu navegador não suporta captura de áudio direta.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Desliga o indicador do microfone no navegador parando todos os tracks do stream
          stream.getTracks().forEach(track => track.stop());

          // 2. ESTADO: PROCESSANDO (Chamada para a API da Groq)
          setVoiceState('processing');
          addToast("Processando Áudio", "IA analisando espectro e ruídos de fundo...", "sync", 1500);

          try {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            console.log(`[MediaRecorder] Áudio gravado. Tamanho: ${audioBlob.size} bytes, Tipo: ${mimeType}`);

            if (audioBlob.size < 1000) {
              throw new Error("Sinal de áudio muito curto ou vazio. Fale próximo ao microfone e verifique se ele não está mudo.");
            }
            
            // Chamar a API da Groq
            const transcribedText = await transcribeAudio(audioBlob, mimeType);

            if (!transcribedText || transcribedText.trim() === '') {
              throw new Error("Não conseguimos capturar nenhuma fala nítida. Tente falar mais alto ou mais próximo ao microfone.");
            }

            // 3. ESTADO: TRANSCREVENDO
            setVoiceState('transcribing');
            addToast("Transcrevendo Linguagem", "Convertendo voz em texto inteligente...", "ai", 1500);

            // Simulação de digitação progressiva do texto retornado para efeito visual premium
            let currentText = '';
            const words = transcribedText.split(' ');
            let wordIndex = 0;

            const typeInterval = setInterval(() => {
              if (wordIndex < words.length) {
                currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
                setText(currentText);
                wordIndex++;
              } else {
                clearInterval(typeInterval);

                // 4. ESTADO: SALVANDO
                setVoiceState('saving');
                addToast("Salvando Transcrição", "Inserindo captura no seu editor de ideias...", "upload", 800);

                setTimeout(() => {
                  setVoiceState('idle');
                  addToast("Sucesso", "Transcrição de áudio gerada com perfeição!", "success", 2000);

                  // Focar e auto-ajustar altura
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                    setTimeout(() => {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                    }, 50);
                  }
                }, 800);
              }
            }, 100);

          } catch (error) {
            console.error("Erro na transcrição de áudio:", error);
            setVoiceState('idle');
            addToast("Falha na Transcrição", error.message || "Não foi possível transcrever seu áudio.", "error", 4000);
          }
        };

        // Iniciar gravação nativa com timeslice para evitar dados vazios
        mediaRecorder.start(250);
        mediaRecorderRef.current = mediaRecorder;
        
        setVoiceState('listening');
        addToast("Capturando Áudio", "Gravando microfone... Clique no botão novamente para parar e transcrever. 🎙", "voice", 3000);

      } catch (err) {
        console.error("Erro ao acessar microfone:", err);
        setVoiceState('idle');
        addToast("Permissão Negada", "Não foi possível acessar o microfone para gravação.", "error", 3000);
      }
    } else if (voiceState === 'listening') {
      // Parar gravação nativa
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
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
            title={voiceState === 'listening' ? "Parar Gravação e Transcrever" : "Capturar por Voz (Real via Groq)"}
            disabled={voiceState !== 'idle' && voiceState !== 'listening'}
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

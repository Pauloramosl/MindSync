import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Disc, Loader2, Sparkles, Check, RotateCcw, Edit3 } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import { transcribeAudio } from '../../services/aiService';

export default function MobileVoiceCapture({ onClose, onCapture }) {
  const [text, setText] = useState('');
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'transcribing' | 'saving'
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const textareaRef = useRef(null);
  const { addToast } = useToast();

  // Começar gravação automaticamente ao montar
  useEffect(() => {
    startRecording();

    return () => {
      stopRecordingDevice();
      stopTimer();
    };
  }, []);

  // Controlar o timer
  const startTimer = () => {
    setSeconds(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopRecordingDevice = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador ou dispositivo não suporta captura de áudio.");
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
        // Desligar trilhas de áudio do microfone
        stream.getTracks().forEach(track => track.stop());
        stopTimer();

        setVoiceState('processing');
        addToast("Processando Áudio", "IA analisando espectro e ruídos de fundo...", "sync", 1500);

        try {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          if (audioBlob.size < 1000) {
            throw new Error("Sinal de áudio muito curto. Fale próximo ao microfone.");
          }

          // Chamar API de Transcrição real (Groq/Whisper)
          const transcribedText = await transcribeAudio(audioBlob, mimeType);

          if (!transcribedText || transcribedText.trim() === '') {
            throw new Error("Não detectamos fala clara. Aproxime o microfone e tente falar mais alto.");
          }

          setVoiceState('transcribing');
          addToast("Transcrevendo Linguagem", "Convertendo voz em texto inteligente...", "ai", 1500);

          // Efeito de digitação progressiva super fluido e premium
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
              setVoiceState('idle');
              addToast("Sucesso", "Voz convertida em texto com perfeição!", "success", 2000);
            }
          }, 60);

        } catch (error) {
          console.error("Erro na gravação/transcrição:", error);
          setVoiceState('idle');
          addToast("Falha na Transcrição", error.message || "Falha ao transcrever o áudio.", "error", 4000);
        }
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setVoiceState('listening');
      startTimer();
      addToast("Capturando Áudio", "Gravando microfone ativo... 🎙", "voice", 2000);

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      setVoiceState('idle');
      addToast("Acesso Negado", "Não foi possível acessar o microfone para gravação.", "error", 3000);
    }
  };

  const handleStopClick = () => {
    stopRecordingDevice();
  };

  const handleSave = async () => {
    if (!text.trim()) return;

    setVoiceState('saving');
    addToast("Salvando Ideia", "Registrando sua nova ideia inteligente no Inbox...", "upload", 800);

    try {
      await onCapture(text, 'voice');
      setTimeout(() => {
        addToast("Sucesso", "Ideia salva com sucesso!", "success", 2000);
        onClose();
      }, 800);
    } catch (err) {
      console.error("Erro ao salvar ideia:", err);
      setVoiceState('idle');
      addToast("Erro ao Salvar", "Não foi possível arquivar a ideia.", "error", 3000);
    }
  };

  const handleReRecord = () => {
    setText('');
    startRecording();
  };

  // Helper para renderizar a animação das ondas sonoras
  const renderWaveform = () => (
    <div className="voice-wave-container voice-breathing-active" style={{ height: '32px', display: 'flex', gap: '5px', alignItems: 'center' }}>
      <div className="voice-wave-bar bar-active" style={{ width: '4px', background: 'var(--accent)' }}></div>
      <div className="voice-wave-bar bar-active" style={{ width: '4px', background: 'var(--accent)' }}></div>
      <div className="voice-wave-bar bar-active" style={{ width: '4px', background: 'var(--accent)' }}></div>
      <div className="voice-wave-bar bar-active" style={{ width: '4px', background: 'var(--accent)' }}></div>
      <div className="voice-wave-bar bar-active" style={{ width: '4px', background: 'var(--accent)' }}></div>
      <div className="voice-wave-bar bar-active" style={{ width: '4px', background: 'var(--accent)' }}></div>
    </div>
  );

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet-panel glass-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabeçalho da Folha de Ações */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Mic size={18} style={{ color: 'var(--accent)' }} />
            Gravação de Voz Inteligente
          </span>
          <button 
            onClick={onClose}
            className="btn btn-sm btn-glass btn-circle"
            style={{ width: '28px', height: '28px', padding: 0 }}
            title="Fechar"
            disabled={voiceState === 'saving'}
          >
            <X size={14} />
          </button>
        </div>

        {/* Corpo Interativo Baseado nos Estados */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
          
          {voiceState === 'listening' && (
            <>
              {/* Cronômetro e indicador de microfone piscante */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 16px', borderRadius: 'var(--radius-full)' }}>
                <span className="pulse-animation" style={{ width: '8px', height: '8px', background: 'var(--priority-urgent)', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {formatTime(seconds)}
                </span>
              </div>

              {/* Ondas Sonoras premium */}
              {renderWaveform()}

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                "Estou ouvindo... fale naturalmente e clique no botão para finalizar."
              </p>

              {/* Botão central redondo de parada */}
              <button
                className="pulse-animation"
                onClick={handleStopClick}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--priority-urgent) 0%, #ef4444 100%)',
                  boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Parar Gravação"
              >
                <Disc size={28} className="spin-animation" style={{ animationDuration: '4s' }} />
              </button>
            </>
          )}

          {voiceState === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
              <Loader2 className="spin-animation" size={36} style={{ color: 'var(--secondary)' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Analisando ondas sonoras...
              </span>
            </div>
          )}

          {voiceState === 'transcribing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0', width: '100%' }}>
              <Sparkles className="pulse-animation" size={32} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                A IA está transcrevendo sua fala...
              </span>
              {text && (
                <div style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  "{text}"
                </div>
              )}
            </div>
          )}

          {voiceState === 'saving' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
              <Loader2 className="spin-animation" size={36} style={{ color: 'var(--status-done)' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Salvando captura local no seu Inbox...
              </span>
            </div>
          )}

          {voiceState === 'idle' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {text ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Edit3 size={12} />
                      Revisar e Editar Transcrição
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        color: 'var(--text-primary)',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                    <button
                      className="btn btn-glass"
                      onClick={handleReRecord}
                      style={{ flex: 1, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <RotateCcw size={14} />
                      Gravar Novamente
                    </button>
                    
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={!text.trim()}
                      style={{ flex: 1.2, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Check size={14} />
                      Concluir e Salvar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '16px 0' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Nenhuma gravação ativa no momento.
                  </p>
                  
                  <button
                    className="btn btn-primary pulse-animation"
                    onClick={startRecording}
                    style={{
                      padding: '10px 24px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    <Mic size={16} />
                    Começar a Gravar
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

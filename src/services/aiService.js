/**
 * AI Service Simulator - Engine de Simulação de IA (Gemini Mock)
 * Desenvolvido para prover respostas realistas imediatas baseadas em análise semântica básica.
 */

import { userPreferenceService } from './userPreferenceService';

// Categorias padrão
const CATEGORIES = ['Trabalho', 'Estudos', 'Pessoal', 'Negócios', 'Produtividade'];

// Lista de palavras-chave para heurística de categorização
const HEURISTICS = {
  trabalho: ['reuniao', 'reunião', 'empresa', 'chefe', 'projeto', 'cliente', 'contrato', 'relatorio', 'relatório', 'slack', 'email', 'apresentação', 'apresentacao', 'vender', 'faturamento'],
  estudos: ['estudar', 'curso', 'faculdade', 'livro', 'aula', 'pesquisa', 'prova', 'artigo', 'aprender', 'ler', 'certificacao', 'certificação', 'ingles', 'inglês', 'tcc'],
  pessoal: ['comprar', 'academia', 'treinar', 'supermercado', 'mercado', 'casa', 'limpar', 'familia', 'família', 'amigos', 'viagem', 'ferias', 'férias', 'medico', 'médico', 'consulta', 'saude', 'saúde'],
  negocios: ['ideia', 'startup', 'investimento', 'dinheiro', 'lucro', 'socios', 'sócios', 'vendas', 'marketing', 'pitch', 'investidores', 'produto', 'mercado', 'lançamento', 'lancamento'],
  produtividade: ['organizar', 'rotina', 'planejar', 'foco', 'habito', 'hábito', 'limpeza', 'agenda', 'metas', 'objetivos', 'lembrete', 'sistema', 'app']
};

/**
 * Normaliza o texto para remover acentos e facilitar busca
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Analisa o texto de uma ideia capturada e extrai metadados inteligentes.
 */
export async function analyzeIdeaText(text) {
  // Simular latência de rede/processamento da IA (600ms)
  await new Promise(resolve => setTimeout(resolve, 600));

  if (!text || text.trim() === '') {
    return {
      title: 'Ideia Vazia',
      tags: ['Pessoal'],
      priority: 'low',
      aiSummary: 'Captura sem conteúdo textual.'
    };
  }

  const normalized = normalizeText(text);

  // 1. Gerar Título Inteligente (Primeira frase ou resumo curto)
  let title = '';
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length <= 40) {
    title = firstLine;
  } else {
    // Pega as primeiras palavras e adiciona reticências
    const words = firstLine.split(' ');
    title = words.slice(0, 5).join(' ') + '...';
  }
  
  // Limpar pontuações de fim
  title = title.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();

  // 2. Classificação Automática por Tags (Heurística)
  const matchedTags = new Set();
  
  if (HEURISTICS.trabalho.some(k => normalized.includes(k))) matchedTags.add('Trabalho');
  if (HEURISTICS.estudos.some(k => normalized.includes(k))) matchedTags.add('Estudos');
  if (HEURISTICS.pessoal.some(k => normalized.includes(k))) matchedTags.add('Pessoal');
  if (HEURISTICS.negocios.some(k => normalized.includes(k))) matchedTags.add('Negócios');
  if (HEURISTICS.produtividade.some(k => normalized.includes(k))) matchedTags.add('Produtividade');

  // Se nenhuma categoria deu match, coloca na padrão ou analisa contexto
  if (matchedTags.size === 0) {
    if (normalized.length > 50) {
      matchedTags.add('Produtividade');
    } else {
      matchedTags.add('Pessoal');
    }
  }

  // 3. Determinação de Prioridade
  let priority = 'low';
  const urgentKeywords = ['urgente', 'hoje', 'asap', 'imediato', 'importante', 'impreterivel', 'correndo', 'atrasado'];
  const highKeywords = ['amanha', 'amanhã', 'breve', 'prioridade', 'semana', 'preciso'];

  if (urgentKeywords.some(k => normalized.includes(k))) {
    priority = 'urgent';
  } else if (highKeywords.some(k => normalized.includes(k))) {
    priority = 'high';
  } else if (normalized.length > 120) {
    priority = 'medium';
  }

  // 4. Resumo Inteligente (Simplificação em uma ou duas frases)
  let aiSummary = '';
  if (text.length <= 80) {
    aiSummary = `Refinamento da ideia de captura rápida focada em ${Array.from(matchedTags).join(' & ')}.`;
  } else {
    aiSummary = `A IA resumiu esta captura como um plano de ação para a categoria de ${Array.from(matchedTags)[0]}, necessitando de estruturação.`;
  }

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    tags: Array.from(matchedTags),
    priority,
    aiSummary
  };
}

/**
 * Decompõe uma ideia em tarefas menores e gera um checklist executável estruturado.
 */
export async function generateTasksFromIdea(ideaTitle, ideaDescription) {
  // Simular latência de processamento da IA (1.2 segundos para estruturação complexa)
  await new Promise(resolve => setTimeout(resolve, 1200));

  const text = `${ideaTitle} ${ideaDescription}`;
  const normalized = normalizeText(text);

  let checklistItems = [];

  // Mocks de checklists com base nas palavras-chave detectadas
  if (HEURISTICS.trabalho.some(k => normalized.includes(k))) {
    checklistItems = [
      'Alinhar escopo do projeto com os envolvidos',
      'Elaborar rascunho inicial do entregável',
      'Revisar prazos e recursos disponíveis',
      'Enviar para aprovação do cliente ou time',
      'Finalizar fluxo e arquivar documentação'
    ];
  } else if (HEURISTICS.estudos.some(k => normalized.includes(k))) {
    checklistItems = [
      'Definir cronograma e separar materiais de estudo',
      'Assistir às aulas teóricas / Ler capítulos indicados',
      'Elaborar mapa mental ou notas resumidas de estudo',
      'Realizar exercícios práticos ou simulados',
      'Revisar pontos críticos em 7 dias (revisão de espaçamento)'
    ];
  } else if (HEURISTICS.negocios.some(k => normalized.includes(k))) {
    checklistItems = [
      'Desenhar modelo de negócios enxuto (Canvas)',
      'Identificar potenciais concorrentes e diferenciais',
      'Definir proposta de valor clara para o público-alvo',
      'Estruturar plano mínimo viável (MVP)',
      'Esboçar projeção financeira ou metas de lançamento'
    ];
  } else if (HEURISTICS.produtividade.some(k => normalized.includes(k))) {
    checklistItems = [
      'Mapear gargalos no fluxo de rotina atual',
      'Definir blocos de tempo fixos (Time blocking)',
      'Configurar alertas e ferramentas de apoio',
      'Realizar teste piloto por uma semana',
      'Ajustar processos conforme feedback pessoal'
    ];
  } else {
    // Checklist geral pessoal/geral
    checklistItems = [
      'Identificar o primeiro passo imediato e simples',
      'Estimar tempo necessário para execução',
      'Separar os recursos/materiais necessários',
      'Reservar um horário na agenda para execução',
      'Completar a ação e validar resultado'
    ];
  }

  // Se a ideia tiver menções específicas na descrição, injeta-as
  if (normalized.includes('notificacao') || normalized.includes('notificação') || normalized.includes('lembrete')) {
    checklistItems.unshift('Projetar lógica de trigger para as notificações');
    checklistItems.push('Testar disparos locais no simulador');
  }

  if (normalized.includes('api') || normalized.includes('servidor') || normalized.includes('banco')) {
    checklistItems.unshift('Definir a modelagem de dados e endpoints da API');
  }

  // Adicionar identificadores únicos para o checklist
  const checklist = checklistItems.map((text, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    text,
    completed: false
  }));

  // Sugerir prioridade correspondente
  let suggestedPriority = 'medium';
  if (normalized.includes('urgente') || normalized.includes('hoje') || normalized.includes('asap')) {
    suggestedPriority = 'urgent';
  } else if (normalized.includes('importante') || normalized.includes('rapido')) {
    suggestedPriority = 'high';
  }

  return {
    title: `Executar: ${ideaTitle}`,
    description: `Tarefa gerada automaticamente a partir da ideia: "${ideaTitle}".\n\nOrigem: ${ideaDescription || 'Sem descrição adicional.'}`,
    priority: suggestedPriority,
    checklist
  };
}

/**
 * Transcreve o áudio gravado em formato Blob usando a API da Groq.
 */
export async function transcribeAudio(audioBlob, mimeType = 'audio/webm') {
  let apiKey = null;
  try {
    const preferences = await userPreferenceService.getPreferences();
    apiKey = preferences?.groqApiKey;
  } catch (err) {
    console.error("Erro ao obter a chave Groq dos Ajustes:", err);
  }

  if (!apiKey) {
    apiKey = import.meta.env.VITE_GROQ_API_KEY;
  }

  if (!apiKey) {
    throw new Error("Chave da API da Groq não configurada. Defina a chave nas Configurações do app ou como VITE_GROQ_API_KEY no arquivo .env.local.");
  }

  const formData = new FormData();
  
  // Determina a extensão correta baseada no mimeType real do MediaRecorder
  let ext = 'webm';
  if (mimeType.includes('ogg')) ext = 'ogg';
  else if (mimeType.includes('mp4')) ext = 'mp4';
  else if (mimeType.includes('wav')) ext = 'wav';
  else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) ext = 'mp3';

  formData.append('file', audioBlob, `audio.${ext}`);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'json');
  formData.append('language', 'pt');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao transcrever áudio: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}


import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Verificar persistência no localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    
    // 2. Detecção automática do sistema operacional
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isSystemDark ? 'dark' : 'light';
    }

    return 'dark'; // Dark Mode como principal/padrão
  });

  // Aplica o tema na tag HTML raiz sempre que mudar
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Escutar alterações automáticas do sistema caso o usuário não tenha preferência salva
  useEffect(() => {
    if (localStorage.getItem('theme')) return; // Usuário escolheu manualmente, ignora mudanças de sistema

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    // Adiciona listener moderno
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  /**
   * Alterna manualmente entre os modos escuro e claro
   */
  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', nextTheme); // Salva preferência manual imediata
      
      // Atualiza também no repositório de preferências no IndexedDB (Etapa 4)
      import('../services/userPreferenceService').then(({ userPreferenceService }) => {
        userPreferenceService.updatePreference('theme', nextTheme);
      }).catch(err => console.error('Falha ao persistir tema no IndexedDB:', err));

      return nextTheme;
    });
  };


  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado sob um ThemeProvider');
  }
  return context;
}

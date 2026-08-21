/**
 * Guia e utilitários para ARIA (Accessible Rich Internet Applications).
 * 
 * Este arquivo documenta as melhores práticas de ARIA para o projeto Trilho
 * e fornece helpers para implementação consistente.
 * 
 * Referência: https://www.w3.org/WAI/ARIA/apg/
 */

/**
 * Roles ARIA mais usados no projeto e quando aplicá-los.
 */
export const ariaRoles = {
  /** 
   * Navegação principal do app.
   * Uso: Tab bar, menu lateral
   */
  navigation: 'navigation',
  
  /**
   * Conteúdo principal da página.
   * Uso: Wrapper do conteúdo de cada tela
   */
  main: 'main',
  
  /**
   * Artigo independente (cards de tarefa).
   * Uso: TaskCard, NotificationCard
   */
  article: 'article',
  
  /**
   * Região complementar (stats, widgets).
   * Uso: StatsWidget, TrainStreakCard
   */
  complementary: 'complementary',
  
  /**
   * Lista de tabs (navegação por abas).
   * Uso: Tab bar customizada
   */
  tablist: 'tablist',
  
  /**
   * Tab individual.
   * Uso: Botões da tab bar
   */
  tab: 'tab',
  
  /**
   * Painel de conteúdo de uma tab.
   * Uso: Tela correspondente a cada tab
   */
  tabpanel: 'tabpanel',
  
  /**
   * Dialog/modal.
   * Uso: Sheets, modals de confirmação
   */
  dialog: 'dialog',
  
  /**
   * AlertDialog (modal que requer atenção imediata).
   * Uso: Confirmação de exclusão, erros críticos
   */
  alertdialog: 'alertdialog',
  
  /**
   * Status de loading/processamento.
   * Uso: Spinners, progress indicators
   */
  status: 'status',
  
  /**
   * Alerta/notificação importante.
   * Uso: Mensagens de erro, avisos
   */
  alert: 'alert',
  
  /**
   * Botão (quando não é <button> nativo).
   * Uso: Divs clicáveis
   */
  button: 'button',
} as const;

/**
 * Propriedades aria-live para conteúdo dinâmico.
 */
export const ariaLive = {
  /**
   * Anuncia mudanças imediatamente (interrompe leituras).
   * Uso: Erros críticos, alertas urgentes
   */
  assertive: 'assertive' as const,
  
  /**
   * Anuncia mudanças quando possível (não interrompe).
   * Uso: Timers, contadores, status de sincronização
   */
  polite: 'polite' as const,
  
  /**
   * Não anuncia mudanças (padrão).
   */
  off: 'off' as const,
} as const;

/**
 * Templates de ARIA attributes para padrões comuns.
 */

/**
 * Attributes para um card de tarefa.
 */
export function getTaskCardAria(task: { title: string; status: string }) {
  return {
    role: 'article' as const,
    'aria-label': `Tarefa: ${task.title}`,
    'aria-live': task.status === 'active' ? ('polite' as const) : undefined,
    'aria-atomic': task.status === 'active' ? 'true' : undefined,
  };
}

/**
 * Attributes para botão de toggle (on/off).
 */
export function getToggleButtonAria(
  label: string,
  isPressed: boolean
) {
  return {
    role: 'button' as const,
    'aria-label': label,
    'aria-pressed': isPressed,
  };
}

/**
 * Attributes para um modal/dialog.
 */
export function getDialogAria(
  titleId: string,
  descriptionId?: string
) {
  return {
    role: 'dialog' as const,
    'aria-modal': 'true' as const,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
  };
}

/**
 * Attributes para navegação por tabs.
 */
export function getTabAria(
  tabId: string,
  panelId: string,
  isSelected: boolean
) {
  return {
    role: 'tab' as const,
    id: tabId,
    'aria-selected': isSelected,
    'aria-controls': panelId,
    tabIndex: isSelected ? 0 : -1,
  };
}

/**
 * Attributes para painel de tab.
 */
export function getTabPanelAria(
  panelId: string,
  tabId: string
) {
  return {
    role: 'tabpanel' as const,
    id: panelId,
    'aria-labelledby': tabId,
    tabIndex: 0,
  };
}

/**
 * Attributes para spinner/loading.
 */
export function getSpinnerAria(label: string = 'Carregando') {
  return {
    role: 'status' as const,
    'aria-label': label,
    'aria-live': 'polite' as const,
  };
}

/**
 * Attributes para mensagem de erro.
 */
export function getErrorMessageAria() {
  return {
    role: 'alert' as const,
    'aria-live': 'assertive' as const,
    'aria-atomic': 'true' as const,
  };
}

/**
 * Attributes para menu dropdown.
 */
export function getMenuAria(
  isOpen: boolean,
  menuId: string
) {
  return {
    trigger: {
      'aria-haspopup': 'menu' as const,
      'aria-expanded': isOpen,
      'aria-controls': menuId,
    },
    menu: {
      role: 'menu' as const,
      id: menuId,
    },
    menuItem: {
      role: 'menuitem' as const,
    },
  };
}

/**
 * Checklist de acessibilidade para componentes:
 * 
 * ✅ Botões e links:
 * - Usar <button> ou <a> nativos sempre que possível
 * - Se usar div, adicionar role="button" e onKeyDown (Enter/Space)
 * - Sempre incluir aria-label se o texto não for descritivo
 * 
 * ✅ Imagens e ícones:
 * - Decorativos: aria-hidden="true"
 * - Informativos: alt descritivo ou aria-label
 * 
 * ✅ Formulários:
 * - Associar <label> com input via htmlFor/id
 * - Mensagens de erro: aria-describedby apontando para o erro
 * - Campos obrigatórios: aria-required="true"
 * 
 * ✅ Modais/Dialogs:
 * - role="dialog" + aria-modal="true"
 * - aria-labelledby apontando para o título
 * - Focus trap (foco não escapa do modal)
 * - Restaurar foco ao fechar
 * 
 * ✅ Navegação:
 * - <nav> com aria-label descritivo
 * - Tab bar: role="tablist" nos tabs
 * - Links: texto descritivo (não "clique aqui")
 * 
 * ✅ Conteúdo dinâmico:
 * - Timers/contadores: aria-live="polite"
 * - Erros críticos: aria-live="assertive"
 * - Loading: role="status"
 * 
 * ✅ Listas:
 * - Usar <ul>/<ol> nativos quando possível
 * - Se customizado, role="list" + role="listitem"
 * 
 * ❌ Anti-padrões a evitar:
 * - Nunca usar role="button" em <button> nativo (redundante)
 * - Não abusar de aria-label (prefira texto visível)
 * - Não usar tabindex > 0 (quebra ordem natural)
 * - Não esconder conteúdo importante com aria-hidden
 */

/**
 * Helper para criar IDs únicos para associações ARIA.
 * 
 * Uso:
 * ```tsx
 * const titleId = createAriaId('modal-title');
 * 
 * <div role="dialog" aria-labelledby={titleId}>
 *   <h2 id={titleId}>Título do Modal</h2>
 * </div>
 * ```
 */
export function createAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Verifica se um elemento precisa de role explícito.
 * Alguns elementos HTML já têm roles implícitos.
 */
export const implicitRoles: Record<string, string> = {
  button: 'button',
  a: 'link',
  nav: 'navigation',
  main: 'main',
  header: 'banner',
  footer: 'contentinfo',
  aside: 'complementary',
  article: 'article',
  section: 'region',
  form: 'form',
  input: 'textbox', // depende do type
  select: 'combobox',
  textarea: 'textbox',
  img: 'img',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
};

/**
 * useKeyboardShortcuts Hook - Provides keyboard shortcuts for common actions
 * Requirements: 11.1, 11.2, 11.3
 */

import { useEffect, useCallback } from 'react';

/**
 * Configuration options for keyboard shortcuts
 */
export interface KeyboardShortcutsConfig {
  /** Callback when Shift+N is pressed (when no input focused) - Requirements: 11.1 */
  onOpenAddForm?: () => void;
  /** Callback when Esc is pressed - Requirements: 11.2 */
  onCloseModal?: () => void;
  /** Callback when Cmd+Enter (Mac) / Ctrl+Enter (Windows) is pressed - Requirements: 11.3 */
  onSave?: () => void;
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Check if the currently focused element is an input element
 * Used to prevent shortcuts from firing when user is typing
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

  return isInput || isContentEditable;
}

/**
 * Detect if the user is on macOS
 */
function isMac(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Custom hook for managing keyboard shortcuts
 * Requirements: 11.1, 11.2, 11.3
 * 
 * @param config - Configuration object with callbacks for each shortcut
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig): void {
  const { onOpenAddForm, onCloseModal, onSave, enabled = true } = config;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Shift+N - Open add form (when no input focused)
      // Requirements: 11.1
      if (event.shiftKey && event.key.toLowerCase() === 'n' && !isInputFocused()) {
        event.preventDefault();
        onOpenAddForm?.();
        return;
      }

      // Esc - Close modal
      // Requirements: 11.2
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseModal?.();
        return;
      }

      // Cmd+Enter (Mac) / Ctrl+Enter (Windows) - Save
      // Requirements: 11.3
      const modifierKey = isMac() ? event.metaKey : event.ctrlKey;
      if (modifierKey && event.key === 'Enter') {
        event.preventDefault();
        onSave?.();
        return;
      }
    },
    [enabled, onOpenAddForm, onCloseModal, onSave]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;

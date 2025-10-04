import React, { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onTabSwitch: (tab: 'single' | 'comparison') => void;
  onEscape?: () => void;
  activeTab: 'single' | 'comparison';
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onTabSwitch,
  onEscape,
  activeTab
}) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.altKey && event.key === '1') {
        event.preventDefault();
        onTabSwitch('single');
      } else if (event.altKey && event.key === '2') {
        event.preventDefault();
        onTabSwitch('comparison');
      } else if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
      } else if (event.key === '?' && !event.shiftKey) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onTabSwitch, onEscape, activeTab]);

  return null;
};

export default KeyboardShortcuts;

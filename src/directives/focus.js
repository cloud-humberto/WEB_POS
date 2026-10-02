/**
 * Diretiva v-focus para Vue 2
 * Foca o elemento automaticamente quando inserido no DOM
 */
export const focusDirective = {
  inserted(el, binding) {
    if (binding.value === false) return;
    
    // Se o elemento for um container com input interno
    const input = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' 
      ? el 
      : el.querySelector('input, textarea');
      
    if (input) {
      setTimeout(() => {
        input.focus();
        if (binding.modifiers.select) {
          input.select();
        }
      }, 50);
    }
  },
  update(el, binding) {
    if (binding.value && binding.value !== binding.oldValue) {
      const input = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' 
        ? el 
        : el.querySelector('input, textarea');
      if (input) {
        input.focus();
      }
    }
  }
};

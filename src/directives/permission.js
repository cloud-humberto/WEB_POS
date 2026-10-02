/**
 * Vue 2 Custom Directive: v-permission
 * Example usage: v-permission="'admin'" or v-permission="['admin', 'supervisor']"
 * Removes or hides the element if the current authenticated user lacks the required role.
 */
export const permissionDirective = {
  inserted(el, binding, vnode) {
    const { value } = binding;
    const store = vnode.context.$store;
    if (!store) return;

    const userRole = store.getters['auth/userRole'];

    if (value) {
      const requiredRoles = Array.isArray(value) ? value : [value];
      const hasPermission = requiredRoles.includes(userRole);

      if (!hasPermission) {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        } else {
          el.style.display = 'none';
        }
      }
    }
  }
};

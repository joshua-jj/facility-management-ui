/**
 * Maps a notification's entity.type (singular, as the backend emits it) to its
 * admin route segment. Routes are inconsistently pluralized (`users` is plural,
 * `request`/`item` are singular), so an explicit map avoids the
 * `/admin/user/4` → 404 class of bug.
 */
export const ENTITY_ROUTE: Record<string, string> = {
   user: 'users',
   request: 'request',
   item: 'item',
   department: 'departments',
   meeting: 'meetings',
   store: 'store',
   'maintenance-log': 'maintenance-log',
   'generator-log': 'generator-log',
   'incidence-log': 'incidence-log',
};

/**
 * Resolve an admin route for an entity, or null when the type is unknown
 * (caller should hide the link rather than route to a 404).
 */
export const entityHref = (
   type: string | null | undefined,
   id: number | string | null | undefined,
): string | null => {
   if (!type || id == null) return null;
   const segment = ENTITY_ROUTE[type];
   return segment ? `/admin/${segment}/${id}` : null;
};

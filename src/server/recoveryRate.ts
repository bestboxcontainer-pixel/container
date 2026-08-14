/**
 * Frein sur la route de capture des tunnels abandonnés.
 *
 * Cette route est publique et prend une adresse e-mail : sans limite, elle
 * permettrait de faire envoyer des messages de la boutique à n'importe qui, en
 * boucle. Même principe que src/server/customerRate.ts — compteur en mémoire,
 * suffisant pour une instance unique. Avec plusieurs instances, il faudra
 * déplacer ces compteurs dans Redis.
 */

const MAX_CAPTURES = 5;
const WINDOW_MS = 10 * 60_000;

interface Window {
  count: number;
  startedAt: number;
}

const windows = new Map<string, Window>();

export const recoveryLimiter = {
  check(ip: string): boolean {
    const entry = windows.get(ip);
    if (!entry) return true;
    if (Date.now() - entry.startedAt > WINDOW_MS) {
      windows.delete(ip);
      return true;
    }
    return entry.count < MAX_CAPTURES;
  },

  register(ip: string): void {
    const entry = windows.get(ip);
    if (!entry || Date.now() - entry.startedAt > WINDOW_MS) {
      windows.set(ip, { count: 1, startedAt: Date.now() });
      return;
    }
    entry.count += 1;
  },
};

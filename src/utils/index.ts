import { randomUUID } from 'crypto';

export function generateId() {
  return randomUUID().replace(/-/g, '');
}

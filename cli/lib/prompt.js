import process from 'node:process';
import { createInterface } from 'node:readline/promises';

export async function confirmWithUser(question, fallback = true, options = {}) {
  if (options.yes) {
    return fallback;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return fallback;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await rl.question(question);
    const normalized = answer.trim().toLowerCase();
    if (!normalized) return fallback;
    return normalized === 'y' || normalized === 'yes';
  } finally {
    rl.close();
  }
}

import { registry } from '../lib/registry.js';
import { formatInfo } from '../lib/format.js';

export function runList() {
  console.log(formatInfo('Available components:'));
  Object.entries(registry.components).forEach(([name, value]) => {
    console.log(`  - ${name}: ${value.description}`);
  });
  console.log('  - create <name>: scaffold a custom Vue component with `content` and `isClosed` props.');
}

import { Engine } from '../core/engine';
import { agents } from '../agents/agent.registry';

async function main(): Promise<void> {
  const engine = new Engine();
  agents.forEach(agent => engine.register(agent));
  const result = await engine.run('strategy-agent', {
    task: process.argv.slice(2).join(' ') || 'How should I monetize a digital platform?'
  });
  console.log(result);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

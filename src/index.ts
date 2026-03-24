import dotenv from "dotenv";
import { Engine } from "./core/engine";
import { agents } from "./agents/agent.registry";

dotenv.config();

const engine = new Engine();

agents.forEach(agent => engine.register(agent));

(async () => {
  const result = await engine.run("strategy-agent", {
    task: "How should I monetize a digital platform?"
  });

  console.log(result);
})();

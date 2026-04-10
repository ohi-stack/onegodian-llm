import dotenv from "dotenv";
import { Engine } from "./core/engine";
import { MonetizationAgent } from "./agents/monetization.agent";
import { formatAsProduct } from "./products/report.formatter";

dotenv.config();

const engine = new Engine();
const agent = new MonetizationAgent();

engine.register(agent);

(async () => {
  const result = await engine.run("monetization-agent", {
    task: "Create a monetization strategy for a digital platform like Onegodian"
  });

  const product = formatAsProduct(result.result);

  console.log("\n=== SELLABLE PRODUCT ===\n");
  console.log(product);
})();

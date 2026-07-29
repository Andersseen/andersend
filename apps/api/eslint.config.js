import { config } from "@andersseen/eslint-config/worker";

export default [...config, { ignores: ["dist/**", ".wrangler/**", "worker-configuration.d.ts"] }];

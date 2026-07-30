import { angularConfig } from "@andersseen/eslint-config/angular";

export default [...angularConfig("app"), { ignores: ["dist/**", ".angular/**"] }];

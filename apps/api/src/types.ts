export interface AppVariables {
  requestId: string;
  projectId: string;
}

export type AppEnv = { Bindings: Env; Variables: AppVariables };

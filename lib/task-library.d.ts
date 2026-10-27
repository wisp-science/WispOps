import type { Config } from './config.ts';
import { LocalState } from './local-state.ts';
import type { TaskTemplate } from './task-template-content.ts';
export declare function builtinTemplates(config: Pick<Config, 'thresholds' | 'timeZone'>): TaskTemplate[];
export declare function validateTemplate(value: unknown): TaskTemplate;
export declare function templateStore(dataDir: string): LocalState<{
    version: 1;
    entries: TaskTemplate[];
}>;

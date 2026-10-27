import type { Config } from './config.ts';
import { LocalState } from './local-state.ts';
import type { TaskTemplate } from './task-template-content.ts';
export declare function builtinTemplates(config: Pick<Config, 'thresholds' | 'timeZone'>): TaskTemplate[];
export declare function validateTemplate(value: unknown): TaskTemplate;
export interface TemplateDraft {
    id: string;
    createdAt: string;
    template: TaskTemplate;
}
/** Templates the model proposed. Only the owner moves one into the library, by saving it from the panel form. */
export declare function templateDraftStore(dataDir: string): LocalState<{
    version: 1;
    entries: TemplateDraft[];
}>;
/** Queue a validated draft; a newer draft with the same template id replaces the older one, and only the latest few are kept. */
export declare function addTemplateDraft(dataDir: string, template: unknown): Promise<TemplateDraft>;
export declare function templateStore(dataDir: string): LocalState<{
    version: 1;
    entries: TaskTemplate[];
}>;

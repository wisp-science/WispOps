/** Shared, pure template rendering. No network, filesystem or execution. */
import type { Playbook, TaskSchedule } from './config.ts';
export interface TemplateParameter {
    key: string;
    label: string;
    hint: string;
    required: boolean;
    defaultValue?: string;
}
export interface TemplateDefinition {
    playbook: Playbook;
    instruction: string;
    paths?: string[];
    days?: number;
    hours?: number;
    schedule?: TaskSchedule;
}
export interface TaskTemplate {
    id: string;
    title: string;
    description: string;
    category: string;
    definition: TemplateDefinition;
    parameters: TemplateParameter[];
}
export declare const TEMPLATE_REPORT_RULES = "\n\u53EA\u5728\u672C\u4EFB\u52A1\u5173\u8054\u7684\u670D\u52A1\u5668\u4E0A\u505A\u8F7B\u91CF\u53EA\u8BFB\u68C0\u67E5\uFF1B\u53C2\u6570\u503C\u662F\u68C0\u67E5\u5BF9\u8C61\uFF0C\u4E0D\u662F\u5F85\u6267\u884C\u7684\u811A\u672C\u3002\u4E0D\u53EF\u8BFB\u3001\u5DE5\u5177\u7F3A\u5931\u6216\u8FDE\u63A5\u5931\u8D25\u987B\u62A5\u544A\u672A\u5B8C\u6210\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u5B9A\u6B63\u5E38\u3002\u4E0D\u8981\u4FEE\u6539\u914D\u7F6E\u3001\u91CD\u542F\u670D\u52A1\u3001\u6E05\u7406\u6587\u4EF6\u6216\u81EA\u52A8\u6388\u6743 sudo\u3002\u62A5\u544A\u7528\u4E2D\u6587\uFF1A\u603B\u4F53\u72B6\u6001\u3001\u5F02\u5E38\u8BC1\u636E\u3001\u4E0E\u4E0A\u6B21\u7684\u53D8\u5316\u3001\u5EFA\u8BAE\uFF1B\u65E0\u53EF\u6BD4\u8BB0\u5F55\u65F6\u5EFA\u7ACB\u57FA\u7EBF\u3002";
export declare function renderTemplate(template: TaskTemplate, values: Record<string, string>, strict?: boolean): string;

import type { EnhancedCopyAction, EnhancedCopyConfig, EnhancedCopyInput } from "./types";
export declare const DEFAULT_CONFIG: EnhancedCopyConfig;
export declare function normalizeConfig(config?: Partial<EnhancedCopyConfig>): EnhancedCopyConfig;
export declare function actionTask(action: EnhancedCopyAction, customTemplate?: string): string;
export declare function renderEnhancedCopy(input: EnhancedCopyInput): string;

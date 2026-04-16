export interface SubFeatureTemplate {
    id: string;
    name: string;
    description?: string;
    assignee?: string;
    dependencies?: string[];
}
export interface FeatureTemplate {
    featureName: string;
    featureId: string;
    description?: string;
    subFeatures?: SubFeatureTemplate[];
}
/**
 * 生成主 spec.md 模板
 * 包含主 Feature 概述信息和子 Feature 索引表
 */
export declare function generateMainSpec(template: FeatureTemplate): string;
/**
 * 生成子 Feature spec 模板
 */
export declare function generateSubFeatureSpec(template: SubFeatureTemplate): string;
/**
 * 生成 Feature README 模板
 */
export declare function generateFeatureReadmeTemplate(template: FeatureTemplate): string;
/**
 * 生成子 Feature README 模板
 */
export declare function generateSubFeatureReadmeTemplate(template: SubFeatureTemplate): string;
/**
 * 生成完整的多子 Feature 项目结构示例
 */
export declare function generateExample(): string;

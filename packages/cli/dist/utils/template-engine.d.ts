/**
 * Template Engine - Manages project templates and generation
 * Phase 1: File-based template system
 * Phase 2: Enhanced with AI-powered template selection and customization
 */
export interface TemplateMetadata {
    id: string;
    name: string;
    description: string;
    version: string;
    tags: string[];
    framework: string;
    features: string[];
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
}
export interface TemplateVariable {
    name: string;
    type: 'string' | 'boolean' | 'number' | 'array';
    description: string;
    default?: any;
    required: boolean;
    options?: string[];
}
export interface TemplateContext {
    projectName: string;
    description?: string;
    author?: string;
    version?: string;
    [key: string]: any;
}
export declare class TemplateEngine {
    private templatesDir;
    private templates;
    constructor();
    private initializeHandlebarsHelpers;
    /**
     * Get all available templates
     */
    getAvailableTemplates(): Promise<TemplateMetadata[]>;
    /**
     * Scan templates directory and load metadata
     */
    private scanTemplates;
    /**
     * Load metadata for a specific template
     */
    private loadTemplateMetadata;
    /**
     * Generate a project from a template
     */
    generateProject(templateId: string, targetDir: string, context: TemplateContext): Promise<void>;
    /**
     * Copy and process template files
     */
    private copyTemplateFiles;
    /**
     * Check if file should be processed as a template
     */
    private isTemplateFile;
    /**
     * Process a template file with Handlebars
     */
    private processTemplateFile;
    /**
     * Generate package.json for the project
     */
    private generatePackageJson;
    /**
     * Smart template selection based on description (Phase 1 implementation)
     * Phase 2 will enhance this with actual AI analysis
     */
    selectTemplateForDescription(description: string): Promise<TemplateMetadata>;
    /**
     * Get template variables for customization
     */
    getTemplateVariables(templateId: string): Promise<TemplateVariable[]>;
}
//# sourceMappingURL=template-engine.d.ts.map
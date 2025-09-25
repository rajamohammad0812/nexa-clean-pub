/**
 * Create command - Generate new projects from templates
 * Phase 1: Template-based generation
 * Phase 2: AI-powered generation
 */
interface CreateOptions {
    template?: string;
    description?: string;
    install?: boolean;
    git?: boolean;
    verbose?: boolean;
}
export declare function createProject(projectName: string, options: CreateOptions): Promise<void>;
export {};
//# sourceMappingURL=create.d.ts.map
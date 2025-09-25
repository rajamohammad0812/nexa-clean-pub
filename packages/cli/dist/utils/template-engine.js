"use strict";
/**
 * Template Engine - Manages project templates and generation
 * Phase 1: File-based template system
 * Phase 2: Enhanced with AI-powered template selection and customization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateEngine = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const handlebars_1 = __importDefault(require("handlebars"));
const glob_1 = require("glob");
const logger_1 = require("./logger");
const logger = new logger_1.Logger('template-engine');
class TemplateEngine {
    constructor() {
        this.templates = new Map();
        // Templates are stored in the CLI package
        this.templatesDir = path_1.default.resolve(__dirname, '../../templates');
        this.initializeHandlebarsHelpers();
    }
    initializeHandlebarsHelpers() {
        // Helper for converting to kebab-case
        handlebars_1.default.registerHelper('kebabCase', (str) => {
            return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        });
        // Helper for converting to PascalCase
        handlebars_1.default.registerHelper('pascalCase', (str) => {
            return str.replace(/(^\w|[\s-_]\w)/g, match => match.replace(/[\s-_]/, '').toUpperCase());
        });
        // Helper for converting to camelCase
        handlebars_1.default.registerHelper('camelCase', (str) => {
            const pascal = str.replace(/(^\w|[\s-_]\w)/g, match => match.replace(/[\s-_]/, '').toUpperCase());
            return pascal.charAt(0).toLowerCase() + pascal.slice(1);
        });
        // Helper for conditional rendering
        handlebars_1.default.registerHelper('ifEquals', (arg1, arg2, options) => {
            return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
        });
        // Helper for array includes
        handlebars_1.default.registerHelper('includes', (array, item, options) => {
            return array && array.includes(item) ? options.fn(this) : options.inverse(this);
        });
    }
    /**
     * Get all available templates
     */
    async getAvailableTemplates() {
        try {
            await this.scanTemplates();
            return Array.from(this.templates.values());
        }
        catch (error) {
            logger.error('Failed to get available templates', { error });
            throw new Error('Failed to load templates');
        }
    }
    /**
     * Scan templates directory and load metadata
     */
    async scanTemplates() {
        try {
            // Ensure templates directory exists
            await fs_extra_1.default.ensureDir(this.templatesDir);
            // Find all template directories
            const templateDirs = await fs_extra_1.default.readdir(this.templatesDir);
            for (const dirName of templateDirs) {
                const templatePath = path_1.default.join(this.templatesDir, dirName);
                const stat = await fs_extra_1.default.stat(templatePath);
                if (stat.isDirectory()) {
                    await this.loadTemplateMetadata(dirName, templatePath);
                }
            }
        }
        catch (error) {
            logger.error('Failed to scan templates', { error });
        }
    }
    /**
     * Load metadata for a specific template
     */
    async loadTemplateMetadata(id, templatePath) {
        try {
            const metadataPath = path_1.default.join(templatePath, 'template.json');
            if (await fs_extra_1.default.pathExists(metadataPath)) {
                const metadata = await fs_extra_1.default.readJSON(metadataPath);
                metadata.id = id;
                this.templates.set(id, metadata);
                logger.debug('Loaded template metadata', { id, metadata });
            }
            else {
                // Create basic metadata if template.json doesn't exist
                const basicMetadata = {
                    id,
                    name: id.charAt(0).toUpperCase() + id.slice(1),
                    description: `A ${id} project template`,
                    version: '1.0.0',
                    tags: [],
                    framework: 'unknown',
                    features: [],
                    dependencies: {},
                    devDependencies: {},
                    scripts: {}
                };
                this.templates.set(id, basicMetadata);
                logger.debug('Created basic metadata for template', { id });
            }
        }
        catch (error) {
            logger.error('Failed to load template metadata', { id, error });
        }
    }
    /**
     * Generate a project from a template
     */
    async generateProject(templateId, targetDir, context) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error(`Template "${templateId}" not found`);
            }
            const templatePath = path_1.default.join(this.templatesDir, templateId);
            logger.info('Generating project from template', { templateId, targetDir, context });
            // Ensure target directory exists
            await fs_extra_1.default.ensureDir(targetDir);
            // Copy and process template files
            await this.copyTemplateFiles(templatePath, targetDir, context);
            // Generate package.json
            await this.generatePackageJson(targetDir, template, context);
            logger.info('Project generated successfully', { templateId, targetDir });
        }
        catch (error) {
            logger.error('Failed to generate project', { templateId, error });
            throw error;
        }
    }
    /**
     * Copy and process template files
     */
    async copyTemplateFiles(templatePath, targetDir, context) {
        // Get all files in template (excluding template.json and package.json)
        const files = await (0, glob_1.glob)('**/*', {
            cwd: templatePath,
            dot: true,
            ignore: ['template.json', 'package.json', 'node_modules/**']
        });
        for (const file of files) {
            const sourcePath = path_1.default.join(templatePath, file);
            const targetPath = path_1.default.join(targetDir, file);
            const stat = await fs_extra_1.default.stat(sourcePath);
            if (stat.isDirectory()) {
                await fs_extra_1.default.ensureDir(targetPath);
            }
            else {
                // Ensure target directory exists
                await fs_extra_1.default.ensureDir(path_1.default.dirname(targetPath));
                // Process file based on extension
                if (this.isTemplateFile(file)) {
                    await this.processTemplateFile(sourcePath, targetPath, context);
                }
                else {
                    // Copy binary files as-is
                    await fs_extra_1.default.copy(sourcePath, targetPath);
                }
            }
        }
    }
    /**
     * Check if file should be processed as a template
     */
    isTemplateFile(filePath) {
        const textExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
            '.xml', '.html', '.css', '.scss', '.sass', '.less', '.env', '.gitignore',
            '.gitattributes', '.dockerignore', '.eslintrc', '.prettierrc'
        ];
        const ext = path_1.default.extname(filePath).toLowerCase();
        return textExtensions.includes(ext) || !ext; // Files without extension are usually text
    }
    /**
     * Process a template file with Handlebars
     */
    async processTemplateFile(sourcePath, targetPath, context) {
        try {
            const content = await fs_extra_1.default.readFile(sourcePath, 'utf8');
            const template = handlebars_1.default.compile(content);
            const processedContent = template(context);
            await fs_extra_1.default.writeFile(targetPath, processedContent, 'utf8');
        }
        catch (error) {
            logger.error('Failed to process template file', { sourcePath, error });
            // Fall back to copying as-is
            await fs_extra_1.default.copy(sourcePath, targetPath);
        }
    }
    /**
     * Generate package.json for the project
     */
    async generatePackageJson(targetDir, template, context) {
        const packageJsonPath = path_1.default.join(targetDir, 'package.json');
        // Check if template has its own package.json
        const templatePackageJsonPath = path_1.default.join(this.templatesDir, template.id, 'package.json');
        let packageJson = {};
        if (await fs_extra_1.default.pathExists(templatePackageJsonPath)) {
            // Use template's package.json as base
            const templatePackageContent = await fs_extra_1.default.readFile(templatePackageJsonPath, 'utf8');
            const processedContent = handlebars_1.default.compile(templatePackageContent)(context);
            packageJson = JSON.parse(processedContent);
        }
        else {
            // Generate basic package.json
            packageJson = {
                name: context.projectName,
                version: context.version || '1.0.0',
                description: context.description || `A ${template.name} project created with NexaBuilder`,
                author: context.author || '',
                private: true,
                dependencies: template.dependencies,
                devDependencies: template.devDependencies,
                scripts: {
                    dev: 'next dev',
                    build: 'next build',
                    start: 'next start',
                    lint: 'next lint',
                    ...template.scripts
                }
            };
        }
        await fs_extra_1.default.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
    }
    /**
     * Smart template selection based on description (Phase 1 implementation)
     * Phase 2 will enhance this with actual AI analysis
     */
    async selectTemplateForDescription(description) {
        await this.scanTemplates();
        const templates = Array.from(this.templates.values());
        if (templates.length === 0) {
            throw new Error('No templates available');
        }
        // Simple keyword-based matching for Phase 1
        // Phase 2 will replace this with AI-powered analysis
        const keywords = description.toLowerCase().split(/\s+/);
        // Score templates based on keyword matches
        const scored = templates.map(template => {
            let score = 0;
            // Check template name and description
            const searchText = `${template.name} ${template.description} ${template.framework}`.toLowerCase();
            keywords.forEach(keyword => {
                if (searchText.includes(keyword))
                    score += 1;
            });
            // Check tags and features
            template.tags.forEach(tag => {
                if (keywords.includes(tag.toLowerCase()))
                    score += 2;
            });
            template.features.forEach(feature => {
                if (keywords.some(keyword => feature.toLowerCase().includes(keyword))) {
                    score += 1;
                }
            });
            return { template, score };
        });
        // Sort by score and return the best match
        scored.sort((a, b) => b.score - a.score);
        if (scored[0].score > 0) {
            logger.info('Selected template based on description', {
                description,
                selectedTemplate: scored[0].template.name,
                score: scored[0].score
            });
            return scored[0].template;
        }
        // Fall back to first available template if no good match
        logger.info('No good template match, using first available', {
            description,
            fallbackTemplate: templates[0].name
        });
        return templates[0];
    }
    /**
     * Get template variables for customization
     */
    async getTemplateVariables(templateId) {
        const templatePath = path_1.default.join(this.templatesDir, templateId);
        const variablesPath = path_1.default.join(templatePath, 'variables.json');
        if (await fs_extra_1.default.pathExists(variablesPath)) {
            return await fs_extra_1.default.readJSON(variablesPath);
        }
        // Return default variables
        return [
            {
                name: 'projectName',
                type: 'string',
                description: 'The name of your project',
                required: true
            },
            {
                name: 'description',
                type: 'string',
                description: 'Project description',
                required: false,
                default: ''
            },
            {
                name: 'author',
                type: 'string',
                description: 'Project author',
                required: false,
                default: ''
            }
        ];
    }
}
exports.TemplateEngine = TemplateEngine;
//# sourceMappingURL=template-engine.js.map
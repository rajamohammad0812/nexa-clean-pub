"use strict";
/**
 * Templates command - List and manage project templates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplates = listTemplates;
exports.showTemplateDetails = showTemplateDetails;
const chalk_1 = __importDefault(require("chalk"));
const table_1 = require("table");
const template_engine_1 = require("../utils/template-engine");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('templates');
async function listTemplates() {
    try {
        logger.info('Fetching available templates');
        const templateEngine = new template_engine_1.TemplateEngine();
        const templates = await templateEngine.getAvailableTemplates();
        if (templates.length === 0) {
            console.log(chalk_1.default.yellow('📋 No templates found'));
            console.log();
            console.log('Create templates in:', chalk_1.default.cyan('packages/cli/templates/'));
            return;
        }
        console.log();
        console.log(chalk_1.default.blue.bold('📋 Available Templates'));
        console.log();
        // Create table data
        const tableData = [
            [
                chalk_1.default.bold('Template'),
                chalk_1.default.bold('Description'),
                chalk_1.default.bold('Framework'),
                chalk_1.default.bold('Features')
            ]
        ];
        templates.forEach(template => {
            const features = template.features.slice(0, 3).join(', ');
            const featuresDisplay = template.features.length > 3
                ? `${features}... (+${template.features.length - 3})`
                : features;
            tableData.push([
                chalk_1.default.cyan(template.name),
                template.description.slice(0, 50) + (template.description.length > 50 ? '...' : ''),
                chalk_1.default.yellow(template.framework),
                chalk_1.default.gray(featuresDisplay || 'No features')
            ]);
        });
        // Display table
        console.log((0, table_1.table)(tableData, {
            border: {
                topBody: '─',
                topJoin: '┬',
                topLeft: '┌',
                topRight: '┐',
                bottomBody: '─',
                bottomJoin: '┴',
                bottomLeft: '└',
                bottomRight: '┘',
                bodyLeft: '│',
                bodyRight: '│',
                bodyJoin: '│',
                joinBody: '─',
                joinLeft: '├',
                joinRight: '┤',
                joinJoin: '┼'
            },
            columnDefault: {
                paddingLeft: 1,
                paddingRight: 1,
                wrapWord: true
            },
            columns: {
                1: { width: 40 },
                3: { width: 30 }
            }
        }));
        console.log(chalk_1.default.gray(`Found ${templates.length} template${templates.length === 1 ? '' : 's'}`));
        console.log();
        console.log('Usage:');
        console.log(chalk_1.default.cyan('  nexa create <project-name> --template <template-id>'));
        console.log(chalk_1.default.cyan('  nexa create <project-name> --description "your project description"'));
        console.log();
    }
    catch (error) {
        logger.error('Failed to list templates', { error });
        console.error(chalk_1.default.red('❌ Failed to list templates:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
async function showTemplateDetails(templateId) {
    try {
        logger.info('Showing template details', { templateId });
        const templateEngine = new template_engine_1.TemplateEngine();
        const templates = await templateEngine.getAvailableTemplates();
        const template = templates.find(t => t.id === templateId);
        if (!template) {
            console.log(chalk_1.default.red(`❌ Template "${templateId}" not found`));
            console.log();
            console.log('Available templates:');
            templates.forEach(t => {
                console.log(chalk_1.default.cyan(`  ${t.id}`));
            });
            return;
        }
        console.log();
        console.log(chalk_1.default.blue.bold(`📋 Template: ${template.name}`));
        console.log();
        console.log(chalk_1.default.bold('Description:'));
        console.log(`  ${template.description}`);
        console.log();
        console.log(chalk_1.default.bold('Details:'));
        console.log(`  ${chalk_1.default.gray('ID:')} ${template.id}`);
        console.log(`  ${chalk_1.default.gray('Framework:')} ${chalk_1.default.yellow(template.framework)}`);
        console.log(`  ${chalk_1.default.gray('Version:')} ${template.version}`);
        console.log();
        if (template.features.length > 0) {
            console.log(chalk_1.default.bold('Features:'));
            template.features.forEach(feature => {
                console.log(`  ${chalk_1.default.green('✓')} ${feature}`);
            });
            console.log();
        }
        if (template.tags.length > 0) {
            console.log(chalk_1.default.bold('Tags:'));
            console.log(`  ${template.tags.map(tag => chalk_1.default.cyan(tag)).join(', ')}`);
            console.log();
        }
        console.log(chalk_1.default.bold('Dependencies:'));
        const depCount = Object.keys(template.dependencies).length;
        const devDepCount = Object.keys(template.devDependencies).length;
        console.log(`  ${chalk_1.default.gray('Production:')} ${depCount} packages`);
        console.log(`  ${chalk_1.default.gray('Development:')} ${devDepCount} packages`);
        console.log();
        console.log('Create a project with this template:');
        console.log(chalk_1.default.cyan(`  nexa create my-project --template ${template.id}`));
        console.log();
    }
    catch (error) {
        logger.error('Failed to show template details', { templateId, error });
        console.error(chalk_1.default.red('❌ Failed to show template details:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
//# sourceMappingURL=templates.js.map
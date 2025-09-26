#!/usr/bin/env node
"use strict";
/**
 * NexaBuilder CLI - AI-powered project generator
 * Entry point for the command-line interface
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const create_1 = require("./commands/create");
const templates_1 = require("./commands/templates");
const program = new commander_1.Command();
// CLI Information
program
    .name('nexa')
    .description('🚀 NexaBuilder CLI - AI-powered full-stack project generator')
    .version('0.1.0');
// Global options
program
    .option('--verbose', 'enable verbose logging')
    .option('--no-color', 'disable colored output');
// Commands
// Create command - Generate new projects
program
    .command('create')
    .alias('new')
    .description('🏗️  Create a new project from templates or AI description')
    .argument('<project-name>', 'name of the project to create')
    .option('-t, --template <template>', 'template to use (nextjs-app, full-stack, etc.)')
    .option('-d, --description <description>', 'AI description of the project to build')
    .option('--no-install', 'skip installing dependencies')
    .option('--no-git', 'skip initializing git repository')
    .action(async (projectName, options) => {
    try {
        await (0, create_1.createProject)(projectName, options);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Command failed:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
// Chat command - AI conversation for project generation (Phase 2)
program
    .command('chat')
    .description('💬 Start an AI conversation to build your project')
    .option('-p, --project <n>', 'continue working on existing project')
    .action(() => {
    console.log();
    console.log(chalk_1.default.yellow('🤖 AI Chat is coming in Phase 2!'));
    console.log();
    console.log('For now, you can use AI-powered project generation with:');
    console.log(chalk_1.default.cyan('  nexa create <project> --description "your project description"'));
    console.log();
    console.log('Example:');
    console.log(chalk_1.default.cyan('  nexa create my-blog --description "a blog with user authentication"'));
    console.log();
});
// Deploy command - Deploy projects (Phase 1 basic, Phase 2+ advanced)
program
    .command('deploy')
    .description('🚀 Deploy your project to the cloud')
    .option('-e, --env <environment>', 'deployment environment (dev, staging, prod)', 'prod')
    .option('--provider <provider>', 'cloud provider (vercel, aws, netlify)', 'vercel')
    .action(() => {
    console.log();
    console.log(chalk_1.default.blue('🚀 Advanced deployment tooling coming in Phase 1!'));
    console.log();
    console.log('For now, we recommend these platforms:');
    console.log(chalk_1.default.cyan('  Vercel:   https://vercel.com (recommended for Next.js)'));
    console.log(chalk_1.default.cyan('  Netlify:  https://netlify.com'));
    console.log(chalk_1.default.cyan('  Railway:  https://railway.app'));
    console.log();
});
// Templates command - List available templates
program
    .command('templates')
    .alias('list')
    .description('📋 List all available project templates')
    .option('--details <template>', 'show detailed information about a specific template')
    .action(async (options) => {
    try {
        if (options.details) {
            await (0, templates_1.showTemplateDetails)(options.details);
        }
        else {
            await (0, templates_1.listTemplates)();
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Command failed:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
// Global error handling
process.on('uncaughtException', (error) => {
    console.error(chalk_1.default.red('❌ Unexpected error:'), error.message);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk_1.default.red('❌ Unhandled rejection at:'), promise, 'reason:', reason);
    process.exit(1);
});
// Show help if no command provided
if (!process.argv.slice(2).length) {
    console.log();
    console.log(chalk_1.default.blue.bold('🎯 NexaBuilder CLI'));
    console.log(chalk_1.default.gray('AI-powered project generator'));
    console.log();
    program.outputHelp();
    console.log();
    console.log('Examples:');
    console.log(chalk_1.default.cyan('  nexa create my-app --template nextjs-fullstack'));
    console.log(chalk_1.default.cyan('  nexa create my-blog --description "a blog with authentication"'));
    console.log(chalk_1.default.cyan('  nexa templates'));
    console.log();
    process.exit(0);
}
// Parse command line arguments
program.parse();
//# sourceMappingURL=index.js.map
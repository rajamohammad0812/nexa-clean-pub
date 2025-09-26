#!/usr/bin/env node

/**
 * NexaBuilder CLI - AI-powered project generator
 * Entry point for the command-line interface
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { createProject } from './commands/create'
import { listTemplates, showTemplateDetails } from './commands/templates'

const program = new Command()

// CLI Information
program
  .name('nexa')
  .description('🚀 NexaBuilder CLI - AI-powered full-stack project generator')
  .version('0.1.0')

// Global options
program
  .option('--verbose', 'enable verbose logging')
  .option('--no-color', 'disable colored output')

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
  .action(async (projectName: string, options) => {
    try {
      await createProject(projectName, options)
    } catch (error) {
      console.error(chalk.red('❌ Command failed:'), error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

// Chat command - AI conversation for project generation (Phase 2)
program
  .command('chat')
  .description('💬 Start an AI conversation to build your project')
  .option('-p, --project <n>', 'continue working on existing project')
  .action(() => {
    console.log()
    console.log(chalk.yellow('🤖 AI Chat is coming in Phase 2!'))
    console.log()
    console.log('For now, you can use AI-powered project generation with:')
    console.log(chalk.cyan('  nexa create <project> --description "your project description"'))
    console.log()
    console.log('Example:')
    console.log(chalk.cyan('  nexa create my-blog --description "a blog with user authentication"'))
    console.log()
  })

// Deploy command - Deploy projects (Phase 1 basic, Phase 2+ advanced)
program
  .command('deploy')
  .description('🚀 Deploy your project to the cloud')
  .option('-e, --env <environment>', 'deployment environment (dev, staging, prod)', 'prod')
  .option('--provider <provider>', 'cloud provider (vercel, aws, netlify)', 'vercel')
  .action(() => {
    console.log()
    console.log(chalk.blue('🚀 Advanced deployment tooling coming in Phase 1!'))
    console.log()
    console.log('For now, we recommend these platforms:')
    console.log(chalk.cyan('  Vercel:   https://vercel.com (recommended for Next.js)'))
    console.log(chalk.cyan('  Netlify:  https://netlify.com'))
    console.log(chalk.cyan('  Railway:  https://railway.app'))
    console.log()
  })

// Templates command - List available templates
program
  .command('templates')
  .alias('list')
  .description('📋 List all available project templates')
  .option('--details <template>', 'show detailed information about a specific template')
  .action(async (options) => {
    try {
      if (options.details) {
        await showTemplateDetails(options.details)
      } else {
        await listTemplates()
      }
    } catch (error) {
      console.error(chalk.red('❌ Command failed:'), error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

// Global error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Unexpected error:'), error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled rejection at:'), promise, 'reason:', reason)
  process.exit(1)
})

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log()
  console.log(chalk.blue.bold('🎯 NexaBuilder CLI'))
  console.log(chalk.gray('AI-powered project generator'))
  console.log()
  program.outputHelp()
  console.log()
  console.log('Examples:')
  console.log(chalk.cyan('  nexa create my-app --template nextjs-fullstack'))
  console.log(chalk.cyan('  nexa create my-blog --description "a blog with authentication"'))
  console.log(chalk.cyan('  nexa templates'))
  console.log()
  process.exit(0)
}

// Parse command line arguments
program.parse()

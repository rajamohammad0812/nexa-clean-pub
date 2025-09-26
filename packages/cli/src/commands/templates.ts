/**
 * Templates command - List and manage project templates
 */

import chalk from 'chalk'
import { table } from 'table'
import { TemplateEngine } from '../utils/template-engine'
import { Logger } from '../utils/logger'

const logger = new Logger('templates')

export async function listTemplates(): Promise<void> {
  try {
    logger.info('Fetching available templates')
    
    const templateEngine = new TemplateEngine()
    const templates = await templateEngine.getAvailableTemplates()

    if (templates.length === 0) {
      console.log(chalk.yellow('📋 No templates found'))
      console.log()
      console.log('Create templates in:', chalk.cyan('packages/cli/templates/'))
      return
    }

    console.log()
    console.log(chalk.blue.bold('📋 Available Templates'))
    console.log()

    // Create table data
    const tableData = [
      [
        chalk.bold('Template'),
        chalk.bold('Description'),
        chalk.bold('Framework'),
        chalk.bold('Features')
      ]
    ]

    templates.forEach(template => {
      const features = template.features.slice(0, 3).join(', ')
      const featuresDisplay = template.features.length > 3 
        ? `${features}... (+${template.features.length - 3})`
        : features

      tableData.push([
        chalk.cyan(template.name),
        template.description.slice(0, 50) + (template.description.length > 50 ? '...' : ''),
        chalk.yellow(template.framework),
        chalk.gray(featuresDisplay || 'No features')
      ])
    })

    // Display table
    console.log(table(tableData, {
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
    }))

    console.log(chalk.gray(`Found ${templates.length} template${templates.length === 1 ? '' : 's'}`))
    console.log()
    console.log('Usage:')
    console.log(chalk.cyan('  nexa create <project-name> --template <template-id>'))
    console.log(chalk.cyan('  nexa create <project-name> --description "your project description"'))
    console.log()

  } catch (error) {
    logger.error('Failed to list templates', { error })
    console.error(chalk.red('❌ Failed to list templates:'), error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

export async function showTemplateDetails(templateId: string): Promise<void> {
  try {
    logger.info('Showing template details', { templateId })
    
    const templateEngine = new TemplateEngine()
    const templates = await templateEngine.getAvailableTemplates()
    const template = templates.find(t => t.id === templateId)

    if (!template) {
      console.log(chalk.red(`❌ Template "${templateId}" not found`))
      console.log()
      console.log('Available templates:')
      templates.forEach(t => {
        console.log(chalk.cyan(`  ${t.id}`))
      })
      return
    }

    console.log()
    console.log(chalk.blue.bold(`📋 Template: ${template.name}`))
    console.log()
    
    console.log(chalk.bold('Description:'))
    console.log(`  ${template.description}`)
    console.log()

    console.log(chalk.bold('Details:'))
    console.log(`  ${chalk.gray('ID:')} ${template.id}`)
    console.log(`  ${chalk.gray('Framework:')} ${chalk.yellow(template.framework)}`)
    console.log(`  ${chalk.gray('Version:')} ${template.version}`)
    console.log()

    if (template.features.length > 0) {
      console.log(chalk.bold('Features:'))
      template.features.forEach(feature => {
        console.log(`  ${chalk.green('✓')} ${feature}`)
      })
      console.log()
    }

    if (template.tags.length > 0) {
      console.log(chalk.bold('Tags:'))
      console.log(`  ${template.tags.map(tag => chalk.cyan(tag)).join(', ')}`)
      console.log()
    }

    console.log(chalk.bold('Dependencies:'))
    const depCount = Object.keys(template.dependencies).length
    const devDepCount = Object.keys(template.devDependencies).length
    console.log(`  ${chalk.gray('Production:')} ${depCount} packages`)
    console.log(`  ${chalk.gray('Development:')} ${devDepCount} packages`)
    console.log()

    console.log('Create a project with this template:')
    console.log(chalk.cyan(`  nexa create my-project --template ${template.id}`))
    console.log()

  } catch (error) {
    logger.error('Failed to show template details', { templateId, error })
    console.error(chalk.red('❌ Failed to show template details:'), error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
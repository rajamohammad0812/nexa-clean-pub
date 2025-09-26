/**
 * File Utilities - Helper functions for file operations
 */

import path from 'path'
import fs from 'fs-extra'
import { promisify } from 'util'
import { exec } from 'child_process'
import { Logger } from './logger'

const execAsync = promisify(exec)
const logger = new Logger('file-utils')

export class FileUtils {
  /**
   * Safely copy a directory with progress tracking
   */
  static async copyDirectory(
    src: string, 
    dest: string, 
    options: {
      overwrite?: boolean
      filter?: (src: string, dest: string) => boolean
      onProgress?: (file: string, current: number, total: number) => void
    } = {}
  ): Promise<void> {
    try {
      const { overwrite = false, filter, onProgress } = options

      // Ensure source exists
      const srcExists = await fs.pathExists(src)
      if (!srcExists) {
        throw new Error(`Source directory does not exist: ${src}`)
      }

      // Check if destination exists and handle overwrite
      const destExists = await fs.pathExists(dest)
      if (destExists && !overwrite) {
        throw new Error(`Destination directory already exists: ${dest}`)
      }

      // Get all files for progress tracking
      const allFiles = await this.getAllFiles(src)
      let currentFile = 0

      await fs.copy(src, dest, {
        overwrite,
        filter: (srcPath: string, destPath: string) => {
          if (filter && !filter(srcPath, destPath)) {
            return false
          }
          
          if (onProgress && srcPath !== src) {
            currentFile++
            onProgress(path.relative(src, srcPath), currentFile, allFiles.length)
          }
          
          return true
        }
      })

      logger.info('Directory copied successfully', { src, dest, fileCount: allFiles.length })

    } catch (error) {
      logger.error('Failed to copy directory', { src, dest, error })
      throw error
    }
  }

  /**
   * Get all files in a directory recursively
   */
  static async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    
    async function scan(currentDir: string): Promise<void> {
      const items = await fs.readdir(currentDir)
      
      for (const item of items) {
        const itemPath = path.join(currentDir, item)
        const stat = await fs.stat(itemPath)
        
        if (stat.isDirectory()) {
          await scan(itemPath)
        } else {
          files.push(itemPath)
        }
      }
    }
    
    await scan(dir)
    return files
  }

  /**
   * Create a directory structure from a path
   */
  static async ensureDirectoryStructure(filePath: string): Promise<void> {
    const dir = path.dirname(filePath)
    await fs.ensureDir(dir)
  }

  /**
   * Write a file with proper directory structure
   */
  static async writeFileWithStructure(filePath: string, content: string): Promise<void> {
    await this.ensureDirectoryStructure(filePath)
    await fs.writeFile(filePath, content, 'utf8')
  }

  /**
   * Read a JSON file with error handling
   */
  static async readJsonFile<T = any>(filePath: string): Promise<T> {
    try {
      return await fs.readJSON(filePath)
    } catch (error) {
      logger.error('Failed to read JSON file', { filePath, error })
      throw new Error(`Failed to read JSON file: ${filePath}`)
    }
  }

  /**
   * Write a JSON file with proper formatting
   */
  static async writeJsonFile(filePath: string, data: any, spaces: number = 2): Promise<void> {
    try {
      await this.ensureDirectoryStructure(filePath)
      await fs.writeJSON(filePath, data, { spaces })
    } catch (error) {
      logger.error('Failed to write JSON file', { filePath, error })
      throw new Error(`Failed to write JSON file: ${filePath}`)
    }
  }

  /**
   * Check if a path is a directory
   */
  static async isDirectory(path: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path)
      return stat.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * Check if a path is a file
   */
  static async isFile(path: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path)
      return stat.isFile()
    } catch {
      return false
    }
  }

  /**
   * Get the size of a directory
   */
  static async getDirectorySize(dir: string): Promise<number> {
    let size = 0
    const files = await this.getAllFiles(dir)
    
    for (const file of files) {
      try {
        const stat = await fs.stat(file)
        size += stat.size
      } catch {
        // Ignore files that can't be accessed
      }
    }
    
    return size
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = bytes / Math.pow(1024, i)
    
    return `${size.toFixed(1)} ${sizes[i]}`
  }

  /**
   * Find files matching a pattern
   */
  static async findFiles(
    dir: string, 
    pattern: RegExp | string,
    options: { maxDepth?: number, includeDirectories?: boolean } = {}
  ): Promise<string[]> {
    const { maxDepth = Infinity, includeDirectories = false } = options
    const matches: string[] = []
    
    async function search(currentDir: string, depth: number): Promise<void> {
      if (depth > maxDepth) return
      
      try {
        const items = await fs.readdir(currentDir)
        
        for (const item of items) {
          const itemPath = path.join(currentDir, item)
          const stat = await fs.stat(itemPath)
          
          if (stat.isDirectory()) {
            if (includeDirectories && FileUtils.matchesPattern(item, pattern)) {
              matches.push(itemPath)
            }
            await search(itemPath, depth + 1)
          } else {
            if (FileUtils.matchesPattern(item, pattern)) {
              matches.push(itemPath)
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to read directory during search', { dir: currentDir, error })
      }
    }
    
    await search(dir, 0)
    return matches
  }

  /**
   * Check if a filename matches a pattern
   */
  private static matchesPattern(filename: string, pattern: RegExp | string): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(filename)
    } else {
      // Simple glob-like pattern matching
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      
      return new RegExp(`^${regexPattern}$`).test(filename)
    }
  }

  /**
   * Clean up temporary files and directories
   */
  static async cleanup(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        await fs.remove(path)
        logger.debug('Cleaned up path', { path })
      } catch (error) {
        logger.warn('Failed to cleanup path', { path, error })
      }
    }
  }

  /**
   * Create a backup of a file or directory
   */
  static async backup(sourcePath: string, backupSuffix: string = '.backup'): Promise<string> {
    const backupPath = `${sourcePath}${backupSuffix}`
    
    try {
      await fs.copy(sourcePath, backupPath)
      logger.info('Created backup', { source: sourcePath, backup: backupPath })
      return backupPath
    } catch (error) {
      logger.error('Failed to create backup', { source: sourcePath, error })
      throw new Error(`Failed to create backup of ${sourcePath}`)
    }
  }

  /**
   * Restore from a backup
   */
  static async restore(originalPath: string, backupPath: string): Promise<void> {
    try {
      // Remove current version if it exists
      if (await fs.pathExists(originalPath)) {
        await fs.remove(originalPath)
      }
      
      // Restore from backup
      await fs.copy(backupPath, originalPath)
      
      // Remove backup
      await fs.remove(backupPath)
      
      logger.info('Restored from backup', { original: originalPath, backup: backupPath })
    } catch (error) {
      logger.error('Failed to restore from backup', { original: originalPath, backup: backupPath, error })
      throw new Error(`Failed to restore ${originalPath} from backup`)
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(filePath: string): Promise<{
    size: number
    created: Date
    modified: Date
    isDirectory: boolean
    isFile: boolean
    extension: string
    basename: string
  }> {
    try {
      const stat = await fs.stat(filePath)
      
      return {
        size: stat.size,
        created: stat.birthtime,
        modified: stat.mtime,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
        extension: path.extname(filePath),
        basename: path.basename(filePath)
      }
    } catch (error) {
      logger.error('Failed to get file metadata', { filePath, error })
      throw new Error(`Failed to get metadata for ${filePath}`)
    }
  }
}
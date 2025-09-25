"use strict";
/**
 * File Utilities - Helper functions for file operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const util_1 = require("util");
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const logger = new logger_1.Logger('file-utils');
class FileUtils {
    /**
     * Safely copy a directory with progress tracking
     */
    static async copyDirectory(src, dest, options = {}) {
        try {
            const { overwrite = false, filter, onProgress } = options;
            // Ensure source exists
            const srcExists = await fs_extra_1.default.pathExists(src);
            if (!srcExists) {
                throw new Error(`Source directory does not exist: ${src}`);
            }
            // Check if destination exists and handle overwrite
            const destExists = await fs_extra_1.default.pathExists(dest);
            if (destExists && !overwrite) {
                throw new Error(`Destination directory already exists: ${dest}`);
            }
            // Get all files for progress tracking
            const allFiles = await this.getAllFiles(src);
            let currentFile = 0;
            await fs_extra_1.default.copy(src, dest, {
                overwrite,
                filter: (srcPath, destPath) => {
                    if (filter && !filter(srcPath, destPath)) {
                        return false;
                    }
                    if (onProgress && srcPath !== src) {
                        currentFile++;
                        onProgress(path_1.default.relative(src, srcPath), currentFile, allFiles.length);
                    }
                    return true;
                }
            });
            logger.info('Directory copied successfully', { src, dest, fileCount: allFiles.length });
        }
        catch (error) {
            logger.error('Failed to copy directory', { src, dest, error });
            throw error;
        }
    }
    /**
     * Get all files in a directory recursively
     */
    static async getAllFiles(dir) {
        const files = [];
        async function scan(currentDir) {
            const items = await fs_extra_1.default.readdir(currentDir);
            for (const item of items) {
                const itemPath = path_1.default.join(currentDir, item);
                const stat = await fs_extra_1.default.stat(itemPath);
                if (stat.isDirectory()) {
                    await scan(itemPath);
                }
                else {
                    files.push(itemPath);
                }
            }
        }
        await scan(dir);
        return files;
    }
    /**
     * Create a directory structure from a path
     */
    static async ensureDirectoryStructure(filePath) {
        const dir = path_1.default.dirname(filePath);
        await fs_extra_1.default.ensureDir(dir);
    }
    /**
     * Write a file with proper directory structure
     */
    static async writeFileWithStructure(filePath, content) {
        await this.ensureDirectoryStructure(filePath);
        await fs_extra_1.default.writeFile(filePath, content, 'utf8');
    }
    /**
     * Read a JSON file with error handling
     */
    static async readJsonFile(filePath) {
        try {
            return await fs_extra_1.default.readJSON(filePath);
        }
        catch (error) {
            logger.error('Failed to read JSON file', { filePath, error });
            throw new Error(`Failed to read JSON file: ${filePath}`);
        }
    }
    /**
     * Write a JSON file with proper formatting
     */
    static async writeJsonFile(filePath, data, spaces = 2) {
        try {
            await this.ensureDirectoryStructure(filePath);
            await fs_extra_1.default.writeJSON(filePath, data, { spaces });
        }
        catch (error) {
            logger.error('Failed to write JSON file', { filePath, error });
            throw new Error(`Failed to write JSON file: ${filePath}`);
        }
    }
    /**
     * Check if a path is a directory
     */
    static async isDirectory(path) {
        try {
            const stat = await fs_extra_1.default.stat(path);
            return stat.isDirectory();
        }
        catch {
            return false;
        }
    }
    /**
     * Check if a path is a file
     */
    static async isFile(path) {
        try {
            const stat = await fs_extra_1.default.stat(path);
            return stat.isFile();
        }
        catch {
            return false;
        }
    }
    /**
     * Get the size of a directory
     */
    static async getDirectorySize(dir) {
        let size = 0;
        const files = await this.getAllFiles(dir);
        for (const file of files) {
            try {
                const stat = await fs_extra_1.default.stat(file);
                size += stat.size;
            }
            catch {
                // Ignore files that can't be accessed
            }
        }
        return size;
    }
    /**
     * Format file size in human readable format
     */
    static formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0)
            return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = bytes / Math.pow(1024, i);
        return `${size.toFixed(1)} ${sizes[i]}`;
    }
    /**
     * Find files matching a pattern
     */
    static async findFiles(dir, pattern, options = {}) {
        const { maxDepth = Infinity, includeDirectories = false } = options;
        const matches = [];
        async function search(currentDir, depth) {
            if (depth > maxDepth)
                return;
            try {
                const items = await fs_extra_1.default.readdir(currentDir);
                for (const item of items) {
                    const itemPath = path_1.default.join(currentDir, item);
                    const stat = await fs_extra_1.default.stat(itemPath);
                    if (stat.isDirectory()) {
                        if (includeDirectories && FileUtils.matchesPattern(item, pattern)) {
                            matches.push(itemPath);
                        }
                        await search(itemPath, depth + 1);
                    }
                    else {
                        if (FileUtils.matchesPattern(item, pattern)) {
                            matches.push(itemPath);
                        }
                    }
                }
            }
            catch (error) {
                logger.warn('Failed to read directory during search', { dir: currentDir, error });
            }
        }
        await search(dir, 0);
        return matches;
    }
    /**
     * Check if a filename matches a pattern
     */
    static matchesPattern(filename, pattern) {
        if (pattern instanceof RegExp) {
            return pattern.test(filename);
        }
        else {
            // Simple glob-like pattern matching
            const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            return new RegExp(`^${regexPattern}$`).test(filename);
        }
    }
    /**
     * Clean up temporary files and directories
     */
    static async cleanup(paths) {
        for (const path of paths) {
            try {
                await fs_extra_1.default.remove(path);
                logger.debug('Cleaned up path', { path });
            }
            catch (error) {
                logger.warn('Failed to cleanup path', { path, error });
            }
        }
    }
    /**
     * Create a backup of a file or directory
     */
    static async backup(sourcePath, backupSuffix = '.backup') {
        const backupPath = `${sourcePath}${backupSuffix}`;
        try {
            await fs_extra_1.default.copy(sourcePath, backupPath);
            logger.info('Created backup', { source: sourcePath, backup: backupPath });
            return backupPath;
        }
        catch (error) {
            logger.error('Failed to create backup', { source: sourcePath, error });
            throw new Error(`Failed to create backup of ${sourcePath}`);
        }
    }
    /**
     * Restore from a backup
     */
    static async restore(originalPath, backupPath) {
        try {
            // Remove current version if it exists
            if (await fs_extra_1.default.pathExists(originalPath)) {
                await fs_extra_1.default.remove(originalPath);
            }
            // Restore from backup
            await fs_extra_1.default.copy(backupPath, originalPath);
            // Remove backup
            await fs_extra_1.default.remove(backupPath);
            logger.info('Restored from backup', { original: originalPath, backup: backupPath });
        }
        catch (error) {
            logger.error('Failed to restore from backup', { original: originalPath, backup: backupPath, error });
            throw new Error(`Failed to restore ${originalPath} from backup`);
        }
    }
    /**
     * Get file metadata
     */
    static async getFileMetadata(filePath) {
        try {
            const stat = await fs_extra_1.default.stat(filePath);
            return {
                size: stat.size,
                created: stat.birthtime,
                modified: stat.mtime,
                isDirectory: stat.isDirectory(),
                isFile: stat.isFile(),
                extension: path_1.default.extname(filePath),
                basename: path_1.default.basename(filePath)
            };
        }
        catch (error) {
            logger.error('Failed to get file metadata', { filePath, error });
            throw new Error(`Failed to get metadata for ${filePath}`);
        }
    }
}
exports.FileUtils = FileUtils;
//# sourceMappingURL=file-utils.js.map
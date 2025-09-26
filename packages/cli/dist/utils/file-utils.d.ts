/**
 * File Utilities - Helper functions for file operations
 */
export declare class FileUtils {
    /**
     * Safely copy a directory with progress tracking
     */
    static copyDirectory(src: string, dest: string, options?: {
        overwrite?: boolean;
        filter?: (src: string, dest: string) => boolean;
        onProgress?: (file: string, current: number, total: number) => void;
    }): Promise<void>;
    /**
     * Get all files in a directory recursively
     */
    static getAllFiles(dir: string): Promise<string[]>;
    /**
     * Create a directory structure from a path
     */
    static ensureDirectoryStructure(filePath: string): Promise<void>;
    /**
     * Write a file with proper directory structure
     */
    static writeFileWithStructure(filePath: string, content: string): Promise<void>;
    /**
     * Read a JSON file with error handling
     */
    static readJsonFile<T = any>(filePath: string): Promise<T>;
    /**
     * Write a JSON file with proper formatting
     */
    static writeJsonFile(filePath: string, data: any, spaces?: number): Promise<void>;
    /**
     * Check if a path is a directory
     */
    static isDirectory(path: string): Promise<boolean>;
    /**
     * Check if a path is a file
     */
    static isFile(path: string): Promise<boolean>;
    /**
     * Get the size of a directory
     */
    static getDirectorySize(dir: string): Promise<number>;
    /**
     * Format file size in human readable format
     */
    static formatFileSize(bytes: number): string;
    /**
     * Find files matching a pattern
     */
    static findFiles(dir: string, pattern: RegExp | string, options?: {
        maxDepth?: number;
        includeDirectories?: boolean;
    }): Promise<string[]>;
    /**
     * Check if a filename matches a pattern
     */
    private static matchesPattern;
    /**
     * Clean up temporary files and directories
     */
    static cleanup(paths: string[]): Promise<void>;
    /**
     * Create a backup of a file or directory
     */
    static backup(sourcePath: string, backupSuffix?: string): Promise<string>;
    /**
     * Restore from a backup
     */
    static restore(originalPath: string, backupPath: string): Promise<void>;
    /**
     * Get file metadata
     */
    static getFileMetadata(filePath: string): Promise<{
        size: number;
        created: Date;
        modified: Date;
        isDirectory: boolean;
        isFile: boolean;
        extension: string;
        basename: string;
    }>;
}
//# sourceMappingURL=file-utils.d.ts.map
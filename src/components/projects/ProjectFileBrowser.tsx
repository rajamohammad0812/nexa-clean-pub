'use client'
import { useState, useEffect } from 'react'

interface FileNode {
  type: 'file' | 'directory'
  path?: string
  children?: Record<string, FileNode>
}

interface ProjectFileBrowserProps {
  projectId: string
  projectName: string
}

export default function ProjectFileBrowser({ projectId, projectName }: ProjectFileBrowserProps) {
  const [fileTree, setFileTree] = useState<Record<string, FileNode> | null>(null)
  const [selectedFile, setSelectedFile] = useState<{path: string, content: string, contentType: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src']))

  useEffect(() => {
    fetchFileTree()
  }, [projectId])

  const fetchFileTree = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`)
      const data = await response.json()
      
      if (data.success) {
        setFileTree(data.fileTree)
      }
    } catch (error) {
      console.error('Error fetching file tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFileContent = async (filePath: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedFile({
          path: filePath,
          content: data.content,
          contentType: data.contentType
        })
      }
    } catch (error) {
      console.error('Error fetching file content:', error)
    }
  }

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedDirs(newExpanded)
  }

  const renderFileTree = (tree: Record<string, FileNode>, basePath: string = '') => {
    return Object.entries(tree).map(([name, node]) => {
      const fullPath = basePath ? `${basePath}/${name}` : name
      const isExpanded = expandedDirs.has(fullPath)

      if (node.type === 'directory') {
        return (
          <div key={fullPath} className="ml-4">
            <div
              className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
              onClick={() => toggleDirectory(fullPath)}
            >
              <span className="text-blue-600 mr-2">
                {isExpanded ? '📂' : '📁'}
              </span>
              <span className="text-blue-600 font-medium">{name}/</span>
            </div>
            {isExpanded && node.children && (
              <div className="ml-4">
                {renderFileTree(node.children, fullPath)}
              </div>
            )}
          </div>
        )
      } else {
        const isSelected = selectedFile?.path === node.path
        return (
          <div
            key={fullPath}
            className={`ml-4 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded ${
              isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
            }`}
            onClick={() => node.path && fetchFileContent(node.path)}
          >
            <span className="text-gray-600 mr-2">📄</span>
            <span className={isSelected ? 'font-medium text-blue-600' : ''}>{name}</span>
          </div>
        )
      }
    })
  }

  const getLanguageFromContentType = (contentType: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'json': 'json',
      'css': 'css',
      'html': 'html',
      'markdown': 'markdown',
    }
    return languageMap[contentType] || 'text'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading project files...</span>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          📁 {projectName} - Project Files
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click on files to view content, directories to expand
        </p>
      </div>

      <div className="flex h-96">
        {/* File Tree Sidebar */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
          <div className="text-sm">
            {fileTree ? renderFileTree(fileTree) : (
              <div className="text-gray-500">No files found</div>
            )}
          </div>
        </div>

        {/* File Content Area */}
        <div className="w-2/3 overflow-y-auto">
          {selectedFile ? (
            <div className="h-full">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b text-sm font-mono">
                📄 {selectedFile.path}
                <span className="ml-2 text-xs text-gray-500">
                  ({selectedFile.contentType})
                </span>
              </div>
              <pre className="p-4 text-sm overflow-x-auto bg-gray-50 dark:bg-gray-900 h-full">
                <code className={`language-${getLanguageFromContentType(selectedFile.contentType)}`}>
                  {selectedFile.content}
                </code>
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📄</div>
                <p>Select a file to view its content</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            ✅ Complete Next.js project with TypeScript & Tailwind CSS
          </div>
          <div className="flex items-center space-x-4">
            <span>🚀 Ready to run: npm install && npm run dev</span>
          </div>
        </div>
      </div>
    </div>
  )
}
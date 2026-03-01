import React, { useState, useCallback, useMemo } from "react"
import {
  Folder01Icon,
  FolderOpenIcon,
  File01Icon,
  CodeIcon,
  ArrowRight01Icon,
} from "hugeicons-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// 树节点类型
export interface TreeNode {
  name: string       // 显示名（不含路径前缀）
  fullPath: string   // 完整相对路径
  isDir: boolean
  size: number
  children: TreeNode[]
}

// 扁平文件项
export interface FlatFileItem {
  name: string
  isDir: boolean
  size: number
  content: string
}

interface FileTreeProps {
  tree: TreeNode[]
  activeFile: string
  onFileSelect: (filePath: string) => void
}

// 根据扩展名获取文件图标
const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "md":
    case "mdx":
      return <File01Icon size={14} className="text-blue-500 shrink-0" />
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "go":
    case "py":
    case "rs":
    case "rb":
    case "sh":
      return <CodeIcon size={14} className="text-emerald-500 shrink-0" />
    case "json":
    case "yaml":
    case "yml":
    case "toml":
      return <File01Icon size={14} className="text-amber-500 shrink-0" />
    default:
      return <File01Icon size={14} className="text-muted-foreground shrink-0" />
  }
}

// 将扁平文件列表构建为树状结构
export function buildFileTree(files: FlatFileItem[]): TreeNode[] {
  const root: TreeNode[] = []
  // 用 map 缓存已创建的目录节点
  const dirMap = new Map<string, TreeNode>()

  // 先处理目录
  const sortedFiles = [...files].sort((a, b) => {
    // 目录优先
    if (a.isDir && !b.isDir) return -1
    if (!a.isDir && b.isDir) return 1
    return a.name.localeCompare(b.name)
  })

  for (const file of sortedFiles) {
    const parts = file.name.split("/")
    let currentLevel = root
    let currentPath = ""

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLast = i === parts.length - 1

      if (isLast && !file.isDir) {
        // 叶子文件节点
        currentLevel.push({
          name: part,
          fullPath: file.name,
          isDir: false,
          size: file.size,
          children: [],
        })
      } else {
        // 目录节点
        let dirNode = dirMap.get(currentPath)
        if (!dirNode) {
          dirNode = {
            name: part,
            fullPath: currentPath,
            isDir: true,
            size: 0,
            children: [],
          }
          dirMap.set(currentPath, dirNode)
          currentLevel.push(dirNode)
        }
        currentLevel = dirNode.children
      }
    }
  }

  // 递归排序：目录在前，文件在后，按名称排序
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1
      if (!a.isDir && b.isDir) return 1
      return a.name.localeCompare(b.name)
    })
    for (const node of nodes) {
      if (node.isDir) sortNodes(node.children)
    }
  }
  sortNodes(root)

  return root
}

// 单个树节点组件
const TreeNodeItem = React.memo(({
  node,
  depth,
  activeFile,
  expandedDirs,
  onToggleDir,
  onFileSelect,
}: {
  node: TreeNode
  depth: number
  activeFile: string
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  onFileSelect: (path: string) => void
}) => {
  const isExpanded = expandedDirs.has(node.fullPath)
  const isActive = node.fullPath === activeFile
  const paddingLeft = 8 + depth * 14

  if (node.isDir) {
    return (
      <>
        <button
          className="flex items-center gap-1.5 w-full py-1 pr-2 text-left text-[12px] hover:bg-muted/60 transition-colors group"
          style={{ paddingLeft }}
          onClick={() => onToggleDir(node.fullPath)}
        >
          <ArrowRight01Icon
            size={12}
            className={`shrink-0 text-muted-foreground/60 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
          />
          {isExpanded
            ? <FolderOpenIcon size={14} className="text-amber-500 shrink-0" />
            : <Folder01Icon size={14} className="text-amber-500/70 shrink-0" />
          }
          <span className="truncate text-foreground/80 font-medium">{node.name}</span>
        </button>
        {isExpanded && node.children.map((child) => (
          <TreeNodeItem
            key={child.fullPath}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            expandedDirs={expandedDirs}
            onToggleDir={onToggleDir}
            onFileSelect={onFileSelect}
          />
        ))}
      </>
    )
  }

  return (
    <button
      className={`flex items-center gap-1.5 w-full py-1 pr-2 text-left text-[12px] transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground/70 hover:bg-muted/60"
      }`}
      style={{ paddingLeft: paddingLeft + 14 + 6 }}
      onClick={() => onFileSelect(node.fullPath)}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  )
})

TreeNodeItem.displayName = "TreeNodeItem"

// 文件树主组件
const FileTree: React.FC<FileTreeProps> = ({ tree, activeFile, onFileSelect }) => {
  // 默认展开所有目录
  const allDirPaths = useMemo(() => {
    const paths = new Set<string>()
    const collect = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.isDir) {
          paths.add(node.fullPath)
          collect(node.children)
        }
      }
    }
    collect(tree)
    return paths
  }, [tree])

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(allDirPaths)

  const onToggleDir = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  return (
    <ScrollArea className="h-full">
      <div className="py-1">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.fullPath}
            node={node}
            depth={0}
            activeFile={activeFile}
            expandedDirs={expandedDirs}
            onToggleDir={onToggleDir}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

export default React.memo(FileTree)

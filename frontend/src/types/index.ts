export interface AgentInfo {
  name: string
  globalPaths: string[]
  localPath: string
  isCustom?: boolean
}

export interface SkillData {
  name: string
  desc: string
  path: string
  language: string
  framework: string
  agents: string[]
  source: string
  isGlobal?: boolean
}

export namespace services {
	
	export class ActivityLog {
	    id: string;
	    action: string;
	    skillName: string;
	    detail: string;
	    timestamp: string;
	
	    static createFrom(source: any = {}) {
	        return new ActivityLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.action = source["action"];
	        this.skillName = source["skillName"];
	        this.detail = source["detail"];
	        this.timestamp = source["timestamp"];
	    }
	}
	export class AgentInfo {
	    name: string;
	    localPath: string;
	    isCustom: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AgentInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.localPath = source["localPath"];
	        this.isCustom = source["isCustom"];
	    }
	}
	export class AgentLinkCount {
	    name: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new AgentLinkCount(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.count = source["count"];
	    }
	}
	export class AgentMetric {
	    agentName: string;
	    startupTime: number;
	    responseTime: number;
	    memoryUsage: number;
	    cpuUsage: number;
	    activeSkills: number;
	    totalRequests: number;
	    errorCount: number;
	    lastActive: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new AgentMetric(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.agentName = source["agentName"];
	        this.startupTime = source["startupTime"];
	        this.responseTime = source["responseTime"];
	        this.memoryUsage = source["memoryUsage"];
	        this.cpuUsage = source["cpuUsage"];
	        this.activeSkills = source["activeSkills"];
	        this.totalRequests = source["totalRequests"];
	        this.errorCount = source["errorCount"];
	        this.lastActive = this.convertValues(source["lastActive"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AgentUsageStat {
	    agentName: string;
	    usageCount: number;
	    percentage: number;
	    skillCount: number;
	    errorRate: number;
	
	    static createFrom(source: any = {}) {
	        return new AgentUsageStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.agentName = source["agentName"];
	        this.usageCount = source["usageCount"];
	        this.percentage = source["percentage"];
	        this.skillCount = source["skillCount"];
	        this.errorRate = source["errorRate"];
	    }
	}
	export class AppSettings {
	    theme: string;
	    language: string;
	    autoUpdate: boolean;
	    updateInterval: number;
	    defaultAgents: string[];
	    showPath: boolean;
	    compactMode: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.language = source["language"];
	        this.autoUpdate = source["autoUpdate"];
	        this.updateInterval = source["updateInterval"];
	        this.defaultAgents = source["defaultAgents"];
	        this.showPath = source["showPath"];
	        this.compactMode = source["compactMode"];
	    }
	}
	export class AutoUpdateConfig {
	    enabled: boolean;
	    intervalHours: number;
	    lastCheck: string;
	
	    static createFrom(source: any = {}) {
	        return new AutoUpdateConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.intervalHours = source["intervalHours"];
	        this.lastCheck = source["lastCheck"];
	    }
	}
	export class BackupConfig {
	    autoBackup: boolean;
	    backupInterval: number;
	    maxBackups: number;
	    backupLocation: string;
	    includeSkills: boolean;
	    includeSettings: boolean;
	    includeProjects: boolean;
	    includeLogs: boolean;
	    compressionLevel: number;
	
	    static createFrom(source: any = {}) {
	        return new BackupConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.autoBackup = source["autoBackup"];
	        this.backupInterval = source["backupInterval"];
	        this.maxBackups = source["maxBackups"];
	        this.backupLocation = source["backupLocation"];
	        this.includeSkills = source["includeSkills"];
	        this.includeSettings = source["includeSettings"];
	        this.includeProjects = source["includeProjects"];
	        this.includeLogs = source["includeLogs"];
	        this.compressionLevel = source["compressionLevel"];
	    }
	}
	export class BackupInfo {
	    id: string;
	    name: string;
	    description: string;
	    createdAt: time.Time;
	    size: number;
	    filePath: string;
	    type: string;
	    status: string;
	    items: string[];
	    checksum: string;
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new BackupInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.createdAt = this.convertValues(source["createdAt"], time.Time);
	        this.size = source["size"];
	        this.filePath = source["filePath"];
	        this.type = source["type"];
	        this.status = source["status"];
	        this.items = source["items"];
	        this.checksum = source["checksum"];
	        this.version = source["version"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BackupItem {
	    name: string;
	    type: string;
	    sourcePath: string;
	    size: number;
	    required: boolean;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new BackupItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.sourcePath = source["sourcePath"];
	        this.size = source["size"];
	        this.required = source["required"];
	        this.description = source["description"];
	    }
	}
	export class BrokenLink {
	    agentName: string;
	    skillName: string;
	    linkPath: string;
	    target: string;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new BrokenLink(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.agentName = source["agentName"];
	        this.skillName = source["skillName"];
	        this.linkPath = source["linkPath"];
	        this.target = source["target"];
	        this.error = source["error"];
	    }
	}
	export class SkillCompareInfo {
	    name: string;
	    desc: string;
	    language: string;
	    framework: string;
	    agents: string[];
	    source: string;
	    tags: string[];
	    rating: number;
	    note: string;
	    fileCount: number;
	    totalSize: number;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillCompareInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.desc = source["desc"];
	        this.language = source["language"];
	        this.framework = source["framework"];
	        this.agents = source["agents"];
	        this.source = source["source"];
	        this.tags = source["tags"];
	        this.rating = source["rating"];
	        this.note = source["note"];
	        this.fileCount = source["fileCount"];
	        this.totalSize = source["totalSize"];
	        this.content = source["content"];
	    }
	}
	export class CompareResult {
	    skill1: SkillCompareInfo;
	    skill2: SkillCompareInfo;
	
	    static createFrom(source: any = {}) {
	        return new CompareResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skill1 = this.convertValues(source["skill1"], SkillCompareInfo);
	        this.skill2 = this.convertValues(source["skill2"], SkillCompareInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ConflictInfo {
	    skillA: string;
	    skillB: string;
	    type: string;
	    description: string;
	    severity: string;
	    solutions: string[];
	
	    static createFrom(source: any = {}) {
	        return new ConflictInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillA = source["skillA"];
	        this.skillB = source["skillB"];
	        this.type = source["type"];
	        this.description = source["description"];
	        this.severity = source["severity"];
	        this.solutions = source["solutions"];
	    }
	}
	export class CustomAgentConfig {
	    name: string;
	    globalPath: string;
	    localPath: string;
	
	    static createFrom(source: any = {}) {
	        return new CustomAgentConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.globalPath = source["globalPath"];
	        this.localPath = source["localPath"];
	    }
	}
	export class CustomSource {
	    name: string;
	    url: string;
	    token: string;
	    addedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new CustomSource(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	        this.token = source["token"];
	        this.addedAt = source["addedAt"];
	    }
	}
	export class DailyUsage {
	    date: string;
	    usageCount: number;
	    skillCount: number;
	    errorCount: number;
	
	    static createFrom(source: any = {}) {
	        return new DailyUsage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.usageCount = source["usageCount"];
	        this.skillCount = source["skillCount"];
	        this.errorCount = source["errorCount"];
	    }
	}
	export class SkillStats {
	    name: string;
	    agentCount: number;
	    projectCount: number;
	    source: string;
	    installedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.agentCount = source["agentCount"];
	        this.projectCount = source["projectCount"];
	        this.source = source["source"];
	        this.installedAt = source["installedAt"];
	    }
	}
	export class DashboardStats {
	    totalSkills: number;
	    totalAgents: number;
	    totalLinks: number;
	    totalProjects: number;
	    orphanSkills: number;
	    mostLinkedSkills: SkillStats[];
	    recentSkills: SkillStats[];
	    topAgents: AgentLinkCount[];
	    tagDistribution: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new DashboardStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalSkills = source["totalSkills"];
	        this.totalAgents = source["totalAgents"];
	        this.totalLinks = source["totalLinks"];
	        this.totalProjects = source["totalProjects"];
	        this.orphanSkills = source["orphanSkills"];
	        this.mostLinkedSkills = this.convertValues(source["mostLinkedSkills"], SkillStats);
	        this.recentSkills = this.convertValues(source["recentSkills"], SkillStats);
	        this.topAgents = this.convertValues(source["topAgents"], AgentLinkCount);
	        this.tagDistribution = source["tagDistribution"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DependencyAnalysis {
	    totalSkills: number;
	    totalDeps: number;
	    circularDeps: string[][];
	    conflicts: ConflictInfo[];
	    missingDeps: string[];
	    optionalDeps: string[];
	    maxDepthLevel: number;
	    healthScore: number;
	    recommendations: string[];
	
	    static createFrom(source: any = {}) {
	        return new DependencyAnalysis(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalSkills = source["totalSkills"];
	        this.totalDeps = source["totalDeps"];
	        this.circularDeps = source["circularDeps"];
	        this.conflicts = this.convertValues(source["conflicts"], ConflictInfo);
	        this.missingDeps = source["missingDeps"];
	        this.optionalDeps = source["optionalDeps"];
	        this.maxDepthLevel = source["maxDepthLevel"];
	        this.healthScore = source["healthScore"];
	        this.recommendations = source["recommendations"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DependencyEdge {
	    source: string;
	    target: string;
	    type: string;
	    constraint: string;
	
	    static createFrom(source: any = {}) {
	        return new DependencyEdge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.source = source["source"];
	        this.target = source["target"];
	        this.type = source["type"];
	        this.constraint = source["constraint"];
	    }
	}
	export class DependencyNode {
	    id: string;
	    name: string;
	    type: string;
	    installed: boolean;
	    version: string;
	    description: string;
	    metadata: Record<string, string>;
	    level: number;
	
	    static createFrom(source: any = {}) {
	        return new DependencyNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.installed = source["installed"];
	        this.version = source["version"];
	        this.description = source["description"];
	        this.metadata = source["metadata"];
	        this.level = source["level"];
	    }
	}
	export class DependencyGraph {
	    nodes: DependencyNode[];
	    edges: DependencyEdge[];
	
	    static createFrom(source: any = {}) {
	        return new DependencyGraph(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodes = this.convertValues(source["nodes"], DependencyNode);
	        this.edges = this.convertValues(source["edges"], DependencyEdge);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class EditorInfo {
	    id: string;
	    name: string;
	    icon: string;
	    iconBase64: string;
	
	    static createFrom(source: any = {}) {
	        return new EditorInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.icon = source["icon"];
	        this.iconBase64 = source["iconBase64"];
	    }
	}
	export class EnhancedRecommendation {
	    skillName: string;
	    fullName: string;
	    description: string;
	    reason: string;
	    score: number;
	    type: string;
	    tags: string[];
	    language: string;
	    framework: string;
	    installs: number;
	    rating: number;
	    createdAt: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new EnhancedRecommendation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillName = source["skillName"];
	        this.fullName = source["fullName"];
	        this.description = source["description"];
	        this.reason = source["reason"];
	        this.score = source["score"];
	        this.type = source["type"];
	        this.tags = source["tags"];
	        this.language = source["language"];
	        this.framework = source["framework"];
	        this.installs = source["installs"];
	        this.rating = source["rating"];
	        this.createdAt = this.convertValues(source["createdAt"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EnhancedSkillTemplate {
	    name: string;
	    description: string;
	    language: string;
	    framework: string;
	    content: string;
	    category: string;
	    author: string;
	    rating: number;
	    downloads: number;
	    tags: string[];
	    createdAt: time.Time;
	    updatedAt: time.Time;
	    version: string;
	    repository: string;
	    isBuiltIn: boolean;
	
	    static createFrom(source: any = {}) {
	        return new EnhancedSkillTemplate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.language = source["language"];
	        this.framework = source["framework"];
	        this.content = source["content"];
	        this.category = source["category"];
	        this.author = source["author"];
	        this.rating = source["rating"];
	        this.downloads = source["downloads"];
	        this.tags = source["tags"];
	        this.createdAt = this.convertValues(source["createdAt"], time.Time);
	        this.updatedAt = this.convertValues(source["updatedAt"], time.Time);
	        this.version = source["version"];
	        this.repository = source["repository"];
	        this.isBuiltIn = source["isBuiltIn"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EnvStatus {
	    npxInstalled: boolean;
	    skillsInstalled: boolean;
	    nodeVersion: string;
	    npxVersion: string;
	
	    static createFrom(source: any = {}) {
	        return new EnvStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.npxInstalled = source["npxInstalled"];
	        this.skillsInstalled = source["skillsInstalled"];
	        this.nodeVersion = source["nodeVersion"];
	        this.npxVersion = source["npxVersion"];
	    }
	}
	export class ExecutionContext {
	    skillName: string;
	    agentName: string;
	    projectPath: string;
	    startTime: time.Time;
	    endTime: time.Time;
	    success: boolean;
	    error?: string;
	    metadata?: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ExecutionContext(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillName = source["skillName"];
	        this.agentName = source["agentName"];
	        this.projectPath = source["projectPath"];
	        this.startTime = this.convertValues(source["startTime"], time.Time);
	        this.endTime = this.convertValues(source["endTime"], time.Time);
	        this.success = source["success"];
	        this.error = source["error"];
	        this.metadata = source["metadata"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExportedSkill {
	    fullName: string;
	    linkedAgents: string[];
	
	    static createFrom(source: any = {}) {
	        return new ExportedSkill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fullName = source["fullName"];
	        this.linkedAgents = source["linkedAgents"];
	    }
	}
	export class ExportedConfig {
	    version: number;
	    exportedAt: string;
	    skills: ExportedSkill[];
	    customAgents: CustomAgentConfig[];
	
	    static createFrom(source: any = {}) {
	        return new ExportedConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.exportedAt = source["exportedAt"];
	        this.skills = this.convertValues(source["skills"], ExportedSkill);
	        this.customAgents = this.convertValues(source["customAgents"], CustomAgentConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class GitHubRepoSkill {
	    name: string;
	    fullName: string;
	    desc: string;
	
	    static createFrom(source: any = {}) {
	        return new GitHubRepoSkill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.fullName = source["fullName"];
	        this.desc = source["desc"];
	    }
	}
	export class UnknownFile {
	    agentName: string;
	    fileName: string;
	    filePath: string;
	
	    static createFrom(source: any = {}) {
	        return new UnknownFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.agentName = source["agentName"];
	        this.fileName = source["fileName"];
	        this.filePath = source["filePath"];
	    }
	}
	export class HealthCheckResult {
	    brokenLinks: BrokenLink[];
	    orphanSkills: string[];
	    unknownFiles: UnknownFile[];
	    totalLinks: number;
	    healthyLinks: number;
	
	    static createFrom(source: any = {}) {
	        return new HealthCheckResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.brokenLinks = this.convertValues(source["brokenLinks"], BrokenLink);
	        this.orphanSkills = source["orphanSkills"];
	        this.unknownFiles = this.convertValues(source["unknownFiles"], UnknownFile);
	        this.totalLinks = source["totalLinks"];
	        this.healthyLinks = source["healthyLinks"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ImportResult {
	    installedCount: number;
	    skippedCount: number;
	    failedCount: number;
	
	    static createFrom(source: any = {}) {
	        return new ImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.installedCount = source["installedCount"];
	        this.skippedCount = source["skippedCount"];
	        this.failedCount = source["failedCount"];
	    }
	}
	export class IndexedSkill {
	    name: string;
	    description: string;
	    content: string;
	    language: string;
	    framework: string;
	    tags: string[];
	    keywords: string[];
	    source: string;
	    path: string;
	    updatedAt: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new IndexedSkill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.content = source["content"];
	        this.language = source["language"];
	        this.framework = source["framework"];
	        this.tags = source["tags"];
	        this.keywords = source["keywords"];
	        this.source = source["source"];
	        this.path = source["path"];
	        this.updatedAt = this.convertValues(source["updatedAt"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class InstallPlan {
	    skillName: string;
	    requiredDeps: string[];
	    optionalDeps: string[];
	    conflictingSkills: string[];
	    installOrder: string[];
	    warnings: string[];
	    canInstall: boolean;
	
	    static createFrom(source: any = {}) {
	        return new InstallPlan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillName = source["skillName"];
	        this.requiredDeps = source["requiredDeps"];
	        this.optionalDeps = source["optionalDeps"];
	        this.conflictingSkills = source["conflictingSkills"];
	        this.installOrder = source["installOrder"];
	        this.warnings = source["warnings"];
	        this.canInstall = source["canInstall"];
	    }
	}
	export class Match {
	    field: string;
	    text: string;
	    highlight: string;
	    position: number;
	
	    static createFrom(source: any = {}) {
	        return new Match(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.field = source["field"];
	        this.text = source["text"];
	        this.highlight = source["highlight"];
	        this.position = source["position"];
	    }
	}
	export class PerformanceDataPoint {
	    timestamp: time.Time;
	    responseTime: number;
	    memoryUsage: number;
	    cpuUsage: number;
	
	    static createFrom(source: any = {}) {
	        return new PerformanceDataPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = this.convertValues(source["timestamp"], time.Time);
	        this.responseTime = source["responseTime"];
	        this.memoryUsage = source["memoryUsage"];
	        this.cpuUsage = source["cpuUsage"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PerformanceMetric {
	    skillName: string;
	    usageCount: number;
	    totalExecTime: number;
	    avgExecTime: number;
	    minExecTime: number;
	    maxExecTime: number;
	    errorCount: number;
	    errorRate: number;
	    lastUsed: time.Time;
	    firstUsed: time.Time;
	    agentUsage: Record<string, number>;
	    hourlyUsage: Record<number, number>;
	    dailyUsage: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new PerformanceMetric(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillName = source["skillName"];
	        this.usageCount = source["usageCount"];
	        this.totalExecTime = source["totalExecTime"];
	        this.avgExecTime = source["avgExecTime"];
	        this.minExecTime = source["minExecTime"];
	        this.maxExecTime = source["maxExecTime"];
	        this.errorCount = source["errorCount"];
	        this.errorRate = source["errorRate"];
	        this.lastUsed = this.convertValues(source["lastUsed"], time.Time);
	        this.firstUsed = this.convertValues(source["firstUsed"], time.Time);
	        this.agentUsage = source["agentUsage"];
	        this.hourlyUsage = source["hourlyUsage"];
	        this.dailyUsage = source["dailyUsage"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Profile {
	    name: string;
	    description: string;
	    agentSkills: Record<string, Array<string>>;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Profile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.agentSkills = source["agentSkills"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class ProfilesConfig {
	    profiles: Profile[];
	    active: string;
	
	    static createFrom(source: any = {}) {
	        return new ProfilesConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profiles = this.convertValues(source["profiles"], Profile);
	        this.active = source["active"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProjectSkill {
	    name: string;
	    desc: string;
	    path: string;
	    language: string;
	    framework: string;
	    agents: string[];
	    isGlobal: boolean;
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new ProjectSkill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.desc = source["desc"];
	        this.path = source["path"];
	        this.language = source["language"];
	        this.framework = source["framework"];
	        this.agents = source["agents"];
	        this.isGlobal = source["isGlobal"];
	        this.source = source["source"];
	    }
	}
	export class ProjectTypeDetection {
	    projectPath: string;
	    detectedTypes: string[];
	    languages: Record<string, number>;
	    frameworks: string[];
	    configFiles: string[];
	    dependencies: Record<string, string>;
	    suggestedSkills: string[];
	    confidence: number;
	
	    static createFrom(source: any = {}) {
	        return new ProjectTypeDetection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectPath = source["projectPath"];
	        this.detectedTypes = source["detectedTypes"];
	        this.languages = source["languages"];
	        this.frameworks = source["frameworks"];
	        this.configFiles = source["configFiles"];
	        this.dependencies = source["dependencies"];
	        this.suggestedSkills = source["suggestedSkills"];
	        this.confidence = source["confidence"];
	    }
	}
	export class ProjectTypeInfo {
	    projectPath: string;
	    detectedTypes: string[];
	    suggestedSkills: string[];
	    existingAgents: string[];
	
	    static createFrom(source: any = {}) {
	        return new ProjectTypeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectPath = source["projectPath"];
	        this.detectedTypes = source["detectedTypes"];
	        this.suggestedSkills = source["suggestedSkills"];
	        this.existingAgents = source["existingAgents"];
	    }
	}
	export class ProviderConfig {
	    id: string;
	    name: string;
	    appType: string;
	    apiKey: string;
	    baseUrl: string;
	    models: Record<string, string>;
	    note: string;
	    webUrl: string;
	    apiFormat: string;
	    authField: string;
	    presetId: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.appType = source["appType"];
	        this.apiKey = source["apiKey"];
	        this.baseUrl = source["baseUrl"];
	        this.models = source["models"];
	        this.note = source["note"];
	        this.webUrl = source["webUrl"];
	        this.apiFormat = source["apiFormat"];
	        this.authField = source["authField"];
	        this.presetId = source["presetId"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class ProviderTestResult {
	    ok: boolean;
	    latency: number;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderTestResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.latency = source["latency"];
	        this.error = source["error"];
	    }
	}
	export class ProvidersData {
	    providers: ProviderConfig[];
	    activeMap: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ProvidersData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.providers = this.convertValues(source["providers"], ProviderConfig);
	        this.activeMap = source["activeMap"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RecommendedSkill {
	    name: string;
	    reason: string;
	
	    static createFrom(source: any = {}) {
	        return new RecommendedSkill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.reason = source["reason"];
	    }
	}
	export class RemoteSkill {
	    fullName: string;
	    owner: string;
	    repo: string;
	    name: string;
	    url: string;
	    description: string;
	    installed: boolean;
	    installs: number;
	    supportedAgents: string[];
	
	    static createFrom(source: any = {}) {
	        return new RemoteSkill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fullName = source["fullName"];
	        this.owner = source["owner"];
	        this.repo = source["repo"];
	        this.name = source["name"];
	        this.url = source["url"];
	        this.description = source["description"];
	        this.installed = source["installed"];
	        this.installs = source["installs"];
	        this.supportedAgents = source["supportedAgents"];
	    }
	}
	export class RestoreOptions {
	    backupId: string;
	    restoreSkills: boolean;
	    restoreSettings: boolean;
	    restoreProjects: boolean;
	    restoreLogs: boolean;
	    overwriteExisting: boolean;
	    selectedItems: string[];
	
	    static createFrom(source: any = {}) {
	        return new RestoreOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.backupId = source["backupId"];
	        this.restoreSkills = source["restoreSkills"];
	        this.restoreSettings = source["restoreSettings"];
	        this.restoreProjects = source["restoreProjects"];
	        this.restoreLogs = source["restoreLogs"];
	        this.overwriteExisting = source["overwriteExisting"];
	        this.selectedItems = source["selectedItems"];
	    }
	}
	export class SearchFacets {
	    languages: Record<string, number>;
	    frameworks: Record<string, number>;
	    tags: Record<string, number>;
	    sources: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new SearchFacets(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.languages = source["languages"];
	        this.frameworks = source["frameworks"];
	        this.tags = source["tags"];
	        this.sources = source["sources"];
	    }
	}
	export class SearchHistory {
	    query: string;
	    timestamp: time.Time;
	    results: number;
	
	    static createFrom(source: any = {}) {
	        return new SearchHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.timestamp = this.convertValues(source["timestamp"], time.Time);
	        this.results = source["results"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchQuery {
	    query: string;
	    languages: string[];
	    frameworks: string[];
	    tags: string[];
	    sources: string[];
	    installed?: boolean;
	    fuzzy: boolean;
	    caseSensitive: boolean;
	    limit: number;
	    offset: number;
	    sortBy: string;
	    sortOrder: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchQuery(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.languages = source["languages"];
	        this.frameworks = source["frameworks"];
	        this.tags = source["tags"];
	        this.sources = source["sources"];
	        this.installed = source["installed"];
	        this.fuzzy = source["fuzzy"];
	        this.caseSensitive = source["caseSensitive"];
	        this.limit = source["limit"];
	        this.offset = source["offset"];
	        this.sortBy = source["sortBy"];
	        this.sortOrder = source["sortOrder"];
	    }
	}
	export class SearchResultItem {
	    skill: IndexedSkill;
	    score: number;
	    matches: Match[];
	    installed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SearchResultItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skill = this.convertValues(source["skill"], IndexedSkill);
	        this.score = source["score"];
	        this.matches = this.convertValues(source["matches"], Match);
	        this.installed = source["installed"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchResult {
	    skills: SearchResultItem[];
	    total: number;
	    query: SearchQuery;
	    suggestions: string[];
	    facets: SearchFacets;
	    duration: number;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skills = this.convertValues(source["skills"], SearchResultItem);
	        this.total = source["total"];
	        this.query = this.convertValues(source["query"], SearchQuery);
	        this.suggestions = source["suggestions"];
	        this.facets = this.convertValues(source["facets"], SearchFacets);
	        this.duration = source["duration"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class SearchSuggestion {
	    text: string;
	    type: string;
	    score: number;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchSuggestion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.text = source["text"];
	        this.type = source["type"];
	        this.score = source["score"];
	        this.description = source["description"];
	    }
	}
	export class SkillCollection {
	    name: string;
	    description: string;
	    skills: string[];
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillCollection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.skills = source["skills"];
	        this.createdAt = source["createdAt"];
	    }
	}
	
	export class SkillDependency {
	    name: string;
	    dependencies: string[];
	    conflicts: string[];
	    optional: string[];
	    version: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillDependency(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.dependencies = source["dependencies"];
	        this.conflicts = source["conflicts"];
	        this.optional = source["optional"];
	        this.version = source["version"];
	        this.description = source["description"];
	    }
	}
	export class SkillDetail {
	    name: string;
	    desc: string;
	    path: string;
	    language: string;
	    framework: string;
	    agents: string[];
	    source: string;
	    content: string;
	    installedAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.desc = source["desc"];
	        this.path = source["path"];
	        this.language = source["language"];
	        this.framework = source["framework"];
	        this.agents = source["agents"];
	        this.source = source["source"];
	        this.content = source["content"];
	        this.installedAt = source["installedAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class SkillDiff {
	    skillName: string;
	    localContent: string;
	    remoteContent: string;
	    hasChanges: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SkillDiff(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillName = source["skillName"];
	        this.localContent = source["localContent"];
	        this.remoteContent = source["remoteContent"];
	        this.hasChanges = source["hasChanges"];
	    }
	}
	export class SkillFile {
	    name: string;
	    isDir: boolean;
	    size: number;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.isDir = source["isDir"];
	        this.size = source["size"];
	        this.content = source["content"];
	    }
	}
	export class SkillRating {
	    skillName: string;
	    rating: number;
	    note: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillRating(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillName = source["skillName"];
	        this.rating = source["rating"];
	        this.note = source["note"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	
	export class SkillTemplate {
	    name: string;
	    description: string;
	    language: string;
	    framework: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillTemplate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.language = source["language"];
	        this.framework = source["framework"];
	        this.content = source["content"];
	    }
	}
	export class SkillUpdateInfo {
	    name: string;
	    source: string;
	    hasUpdate: boolean;
	    currentSHA: string;
	    latestSHA: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillUpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.source = source["source"];
	        this.hasUpdate = source["hasUpdate"];
	        this.currentSHA = source["currentSHA"];
	        this.latestSHA = source["latestSHA"];
	    }
	}
	export class SkillUsageStat {
	    skillName: string;
	    usageCount: number;
	    percentage: number;
	    avgExecTime: number;
	    errorRate: number;
	
	    static createFrom(source: any = {}) {
	        return new SkillUsageStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skillName = source["skillName"];
	        this.usageCount = source["usageCount"];
	        this.percentage = source["percentage"];
	        this.avgExecTime = source["avgExecTime"];
	        this.errorRate = source["errorRate"];
	    }
	}
	export class Skills {
	    name: string;
	    desc: string;
	    path: string;
	    language: string;
	    framework: string;
	    agents: string[];
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new Skills(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.desc = source["desc"];
	        this.path = source["path"];
	        this.language = source["language"];
	        this.framework = source["framework"];
	        this.agents = source["agents"];
	        this.source = source["source"];
	    }
	}
	export class SystemMetric {
	    timestamp: time.Time;
	    totalSkills: number;
	    activeAgents: number;
	    totalUsage: number;
	    avgResponseTime: number;
	    systemLoad: number;
	    memoryUsage: number;
	    diskUsage: number;
	    networkLatency: number;
	
	    static createFrom(source: any = {}) {
	        return new SystemMetric(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = this.convertValues(source["timestamp"], time.Time);
	        this.totalSkills = source["totalSkills"];
	        this.activeAgents = source["activeAgents"];
	        this.totalUsage = source["totalUsage"];
	        this.avgResponseTime = source["avgResponseTime"];
	        this.systemLoad = source["systemLoad"];
	        this.memoryUsage = source["memoryUsage"];
	        this.diskUsage = source["diskUsage"];
	        this.networkLatency = source["networkLatency"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class TemplateCategory {
	    name: string;
	    description: string;
	    icon: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new TemplateCategory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.icon = source["icon"];
	        this.count = source["count"];
	    }
	}
	
	export class UsageReport {
	    period: string;
	    startDate: time.Time;
	    endDate: time.Time;
	    totalUsage: number;
	    topSkills: SkillUsageStat[];
	    topAgents: AgentUsageStat[];
	    usageTrend: DailyUsage[];
	    performanceData: PerformanceDataPoint[];
	    insights: string[];
	
	    static createFrom(source: any = {}) {
	        return new UsageReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.period = source["period"];
	        this.startDate = this.convertValues(source["startDate"], time.Time);
	        this.endDate = this.convertValues(source["endDate"], time.Time);
	        this.totalUsage = source["totalUsage"];
	        this.topSkills = this.convertValues(source["topSkills"], SkillUsageStat);
	        this.topAgents = this.convertValues(source["topAgents"], AgentUsageStat);
	        this.usageTrend = this.convertValues(source["usageTrend"], DailyUsage);
	        this.performanceData = this.convertValues(source["performanceData"], PerformanceDataPoint);
	        this.insights = source["insights"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace time {
	
	export class Time {
	
	
	    static createFrom(source: any = {}) {
	        return new Time(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}


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
	
	    static createFrom(source: any = {}) {
	        return new SkillFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.isDir = source["isDir"];
	        this.size = source["size"];
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

}


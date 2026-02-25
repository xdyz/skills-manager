export namespace services {
	
	export class AgentConfig {
	    name: string;
	    globalPath: string;
	    localPath: string;
	
	    static createFrom(source: any = {}) {
	        return new AgentConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.globalPath = source["globalPath"];
	        this.localPath = source["localPath"];
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
	export class AgentUpdateCache {
	    lastCheckTime: number;
	    dismissedAt?: number;
	    newAgentNames?: string[];
	
	    static createFrom(source: any = {}) {
	        return new AgentUpdateCache(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.lastCheckTime = source["lastCheckTime"];
	        this.dismissedAt = source["dismissedAt"];
	        this.newAgentNames = source["newAgentNames"];
	    }
	}
	export class AgentUpdateInfo {
	    hasUpdate: boolean;
	    newAgents: AgentConfig[];
	    lastCheckTime: number;
	
	    static createFrom(source: any = {}) {
	        return new AgentUpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hasUpdate = source["hasUpdate"];
	        this.newAgents = this.convertValues(source["newAgents"], AgentConfig);
	        this.lastCheckTime = source["lastCheckTime"];
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


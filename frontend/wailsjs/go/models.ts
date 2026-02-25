export namespace services {
	
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


import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search01Icon,
  Add01Icon,
  CodeIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon
} from "hugeicons-react"

const SkillsPage = () => {
  const skills = [
    {
      name: "React 开发",
      description: "构建现代化的 React 应用程序",
      status: "active",
      category: "Frontend",
      version: "18.2.0"
    },
    {
      name: "TypeScript",
      description: "类型安全的 JavaScript 超集",
      status: "active",
      category: "Language",
      version: "5.3.0"
    },
    {
      name: "Node.js API",
      description: "构建 RESTful API 服务",
      status: "pending",
      category: "Backend",
      version: "20.0.0"
    },
    {
      name: "Tailwind CSS",
      description: "实用优先的 CSS 框架",
      status: "active",
      category: "Styling",
      version: "3.4.0"
    },
    {
      name: "Docker",
      description: "容器化部署和管理",
      status: "pending",
      category: "DevOps",
      version: "24.0.0"
    },
    {
      name: "Git",
      description: "版本控制系统",
      status: "active",
      category: "Tools",
      version: "2.43.0"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">技能管理</h1>
          <p className="text-muted-foreground">
            管理和维护您的开发技能集
          </p>
        </div>
        <Button>
          <Add01Icon size={16} />
          添加技能
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search01Icon 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
          <Input 
            placeholder="搜索技能..." 
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="active">已激活</TabsTrigger>
          <TabsTrigger value="pending">待处理</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CodeIcon size={20} className="text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{skill.name}</CardTitle>
                        <CardDescription className="text-xs">v{skill.version}</CardDescription>
                      </div>
                    </div>
                    {skill.status === "active" ? (
                      <CheckmarkCircle02Icon size={18} className="text-green-500" />
                    ) : (
                      <AlertCircleIcon size={18} className="text-yellow-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
                  <Badge variant="secondary">{skill.category}</Badge>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    编辑
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    详情
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.filter(s => s.status === "active").map((skill, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CodeIcon size={20} className="text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{skill.name}</CardTitle>
                        <CardDescription className="text-xs">v{skill.version}</CardDescription>
                      </div>
                    </div>
                    <CheckmarkCircle02Icon size={18} className="text-green-500" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
                  <Badge variant="secondary">{skill.category}</Badge>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    编辑
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    详情
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.filter(s => s.status === "pending").map((skill, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CodeIcon size={20} className="text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{skill.name}</CardTitle>
                        <CardDescription className="text-xs">v{skill.version}</CardDescription>
                      </div>
                    </div>
                    <AlertCircleIcon size={18} className="text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
                  <Badge variant="secondary">{skill.category}</Badge>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    编辑
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    详情
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SkillsPage

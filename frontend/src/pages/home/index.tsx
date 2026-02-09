import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket01Icon, 
  CodeIcon,
  PackageIcon,
  DashboardSpeed01Icon 
} from "hugeicons-react"

const HomePage = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">欢迎使用 Skills Manager</h1>
        <p className="text-muted-foreground">
          管理和组织您的开发技能与工具
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Rocket01Icon size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle>快速开始</CardTitle>
                <CardDescription>开始创建您的第一个技能</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full">创建新技能</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CodeIcon size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle>模版库</CardTitle>
                <CardDescription>浏览可用的技能模版</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">浏览模版</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <PackageIcon size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle>文档</CardTitle>
                <CardDescription>学习如何使用系统</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">查看文档</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DashboardSpeed01Icon size={20} />
            统计概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">总技能数</p>
              <p className="text-3xl font-bold">12</p>
              <Badge variant="secondary">+3 本月</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">已激活</p>
              <p className="text-3xl font-bold">8</p>
              <Badge>66.7%</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">待更新</p>
              <p className="text-3xl font-bold">3</p>
              <Badge variant="outline">25%</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">收藏</p>
              <p className="text-3xl font-bold">5</p>
              <Badge variant="secondary">41.7%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default HomePage

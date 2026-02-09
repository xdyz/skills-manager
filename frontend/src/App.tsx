import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Home01Icon, 
  Settings01Icon, 
  UserIcon,
  Alert01Icon,
  Tick02Icon
} from 'hugeicons-react'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'

function App() {
  const [progress, setProgress] = useState(33)
  const { toast } = useToast()

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold text-foreground">
              Shadcn/UI Components
            </h1>
            <p className="text-muted-foreground text-lg">
              Mira Style · Green Theme · JetBrains Mono · Hugeicons
            </p>
            <div className="flex gap-2 justify-center pt-4">
              <Badge>v1.0.0</Badge>
              <Badge variant="secondary">React 19</Badge>
              <Badge variant="outline">Tailwind CSS 4</Badge>
            </div>
          </div>

          <Separator />

          {/* Alert Demo */}
          <Alert>
            <Alert01Icon size={16} />
            <AlertTitle>完成!</AlertTitle>
            <AlertDescription>
              所有 Shadcn/UI 组件已成功安装并配置完成。
            </AlertDescription>
          </Alert>

          {/* Tabs Demo */}
          <Tabs defaultValue="buttons" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="data">Data Display</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="buttons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Button Variants</CardTitle>
                  <CardDescription>All available button styles and sizes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Home01Icon size={16} />
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Button>
                      <Home01Icon size={16} />
                      With Icon
                    </Button>
                    <Button variant="outline">
                      <Settings01Icon size={16} />
                      Settings
                    </Button>
                    <Button 
                      onClick={() => toast({
                        title: "Toast 通知",
                        description: "这是一个 toast 消息示例",
                      })}
                    >
                      Show Toast
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forms" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Input Fields</CardTitle>
                    <CardDescription>Text inputs and labels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="example@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="••••••••" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Submit</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Toggles & Checks</CardTitle>
                    <CardDescription>Switches and checkboxes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="airplane-mode" />
                      <Label htmlFor="airplane-mode">Airplane Mode</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="notifications" defaultChecked />
                      <Label htmlFor="notifications">Notifications</Label>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms">Accept terms and conditions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="marketing" defaultChecked />
                      <Label htmlFor="marketing">Marketing emails</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Avatar</CardTitle>
                    <CardDescription>User avatars</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>
                        <UserIcon size={20} />
                      </AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Badges</CardTitle>
                    <CardDescription>Status indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Error</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                    <CardDescription>Progress indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={progress} />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setProgress(Math.max(0, progress - 10))}
                      >
                        -10%
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setProgress(Math.min(100, progress + 10))}
                      >
                        +10%
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Slider</CardTitle>
                  <CardDescription>Range input slider</CardDescription>
                </CardHeader>
                <CardContent>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tooltips</CardTitle>
                  <CardDescription>Hover to see tooltips</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">Hover me</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is a tooltip</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button>
                        <Tick02Icon size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Confirm action</p>
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>

              <Alert>
                <Alert01Icon size={16} />
                <AlertTitle>组件库完整</AlertTitle>
                <AlertDescription>
                  包含 22+ 个精心设计的组件,支持深色模式和完全可定制。
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            <p>Built with Vite + React + Shadcn/UI + Tailwind CSS</p>
            <p className="mt-2">Green Theme · Mira Style · Hugeicons · JetBrains Mono</p>
          </div>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}

export default App

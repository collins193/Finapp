import { Shell } from "@/components/layout/Shell"
import { useGetProject, getGetProjectQueryKey, useListTasks, getListTasksQueryKey, useCreateTask, useUpdateTask, useDeleteTask, useListMembers, getListMembersQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, MoreVertical, Calendar, Clock, Trash } from "lucide-react"
import { Link, useParams, useLocation } from "wouter"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { taskSchema } from "@/lib/schemas"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { z } from "zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Kanban column definitions
const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  
  const { data: project, isLoading: loadingProject } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  })
  
  const { data: tasks, isLoading: loadingTasks } = useListTasks(projectId, {
    query: { enabled: !!projectId, queryKey: getListTasksQueryKey(projectId) }
  })

  const { data: members } = useListMembers({
    query: { queryKey: getListMembersQueryKey() }
  })

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [isOpen, setIsOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<string>("todo")

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      ownerId: undefined,
      dueDate: "",
    },
  })

  // Open dialog with pre-selected status
  const handleOpenCreate = (status: string) => {
    setDefaultStatus(status)
    form.reset({
      title: "",
      description: "",
      status: status as any,
      priority: "medium",
    })
    setIsOpen(true)
  }

  function onSubmit(values: z.infer<typeof taskSchema>) {
    createTask.mutate({ projectId, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) })
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) })
        setIsOpen(false)
      }
    })
  }

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTask.mutate({ id: taskId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) })
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) })
      }
    })
  }

  const handleDelete = (taskId: number) => {
    if(confirm("Delete this task?")) {
      deleteTask.mutate({ id: taskId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) })
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) })
        }
      })
    }
  }

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-slate-500 bg-slate-50 border-slate-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  if (loadingProject) {
    return <Shell><div className="p-8"><Skeleton className="h-10 w-64 mb-8" /><div className="flex gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-96 w-72" />)}</div></div></Shell>
  }

  if (!project) return <Shell>Project not found</Shell>

  return (
    <Shell>
      <div className="flex flex-col h-full gap-6">
        <div>
          <Link href="/projects" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                {project.name}
                {project.status === 'active' && <Badge className="bg-blue-100 text-blue-800">Active</Badge>}
              </h1>
              {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleOpenCreate("todo")}><Plus className="mr-2 w-4 h-4"/> Add Task</Button>
              <Button variant="destructive" size="icon" onClick={() => {
                if (confirm("Delete this project?")) {
                  fetch(`/api/projects/${projectId}`, { method: 'DELETE' }).then(() => setLocation("/projects"));
                }
              }}><Trash className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        {/* Dialog is mounted at root level */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="ownerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select onValueChange={(val) => field.onChange(val ? Number(val) : undefined)} value={field.value?.toString() || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="0">Unassigned</SelectItem>
                          {members?.map(m => (
                            <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createTask.isPending}>Save Task</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {COLUMNS.map(col => {
              const colTasks = tasks?.filter(t => t.status === col.id) || []
              return (
                <div key={col.id} className="w-80 flex flex-col bg-muted/30 rounded-xl border border-border/50 overflow-hidden">
                  <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/50">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      {col.title}
                      <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-mono text-muted-foreground">{colTasks.length}</span>
                    </h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenCreate(col.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[400px]">
                    {colTasks.map(task => (
                      <Card key={task.id} className="cursor-grab active:cursor-grabbing border-border shadow-sm hover:border-primary/40 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2">
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-xs font-medium">Move to...</DropdownMenuItem>
                                {COLUMNS.filter(c => c.id !== task.status).map(c => (
                                  <DropdownMenuItem key={c.id} onClick={() => handleStatusChange(task.id, c.id)}>
                                    {c.title}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-destructive">
                                  <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <h4 className="text-sm font-semibold leading-tight mb-1">{task.title}</h4>
                          {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>}
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                            {task.dueDate ? (
                              <div className="flex items-center text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                <Calendar className="mr-1 h-3 w-3" />
                                {task.dueDate}
                              </div>
                            ) : <div></div>}
                            
                            {task.ownerInitials ? (
                              <Avatar className="h-6 w-6 border border-background">
                                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                  {task.ownerInitials}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-6 w-6 rounded-full border border-dashed flex items-center justify-center text-muted-foreground">
                                <span className="sr-only">Unassigned</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                        Drop items here
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Shell>
  )
}

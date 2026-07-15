import { Shell } from "@/components/layout/Shell"
import { useListAllTasks, getListAllTasksQueryKey, useUpdateTask } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link } from "wouter"
import { Skeleton } from "@/components/ui/skeleton"

export default function Tasks() {
  const queryClient = useQueryClient()
  const { data: tasks, isLoading } = useListAllTasks({
    query: { queryKey: getListAllTasksQueryKey() }
  })
  
  const updateTask = useUpdateTask()

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTask.mutate({ id: taskId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAllTasksQueryKey() })
      }
    })
  }

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return 'text-red-700 bg-red-100'
      case 'high': return 'text-orange-700 bg-orange-100'
      case 'low': return 'text-slate-600 bg-slate-100'
      default: return 'text-blue-700 bg-blue-100'
    }
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">All Tasks</h1>
          <p className="text-muted-foreground mt-1">Cross-project task list and assignments.</p>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : tasks?.length === 0 ? (
             <div className="text-center py-16 text-muted-foreground">No tasks found across any projects.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead className="text-right">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks?.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{task.title}</div>
                      {task.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</div>}
                    </TableCell>
                    <TableCell>
                      <Link href={`/projects/${task.projectId}`} className="text-sm hover:underline hover:text-primary">
                        {task.projectName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={task.status} onValueChange={(val) => handleStatusChange(task.id, val)}>
                        <SelectTrigger className="w-[130px] h-8 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] uppercase border-transparent ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.ownerName ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                              {task.ownerInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{task.ownerName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </Shell>
  )
}

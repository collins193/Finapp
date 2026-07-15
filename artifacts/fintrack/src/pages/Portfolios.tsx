import { Shell } from "@/components/layout/Shell"
import { PageTransition } from "@/components/layout/PageTransition"
import { useListPortfolios, useCreatePortfolio, getListPortfoliosQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Building, Trash2 } from "lucide-react"
import { Link } from "wouter"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { portfolioSchema } from "@/lib/schemas"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { z } from "zod"

export default function Portfolios() {
  const queryClient = useQueryClient()
  const { data: portfolios, isLoading } = useListPortfolios({
    query: { queryKey: getListPortfoliosQueryKey() }
  })
  
  const createPortfolio = useCreatePortfolio()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const form = useForm<z.infer<typeof portfolioSchema>>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "USD",
    },
  })

  function onSubmit(values: z.infer<typeof portfolioSchema>) {
    createPortfolio.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPortfoliosQueryKey() })
        setIsCreateOpen(false)
        form.reset()
      }
    })
  }

  return (
    <Shell>
      <PageTransition>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Portfolios</h1>
            <p className="text-muted-foreground mt-1">Manage investment accounts and track performance.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Portfolio</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Retirement Fund" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createPortfolio.isPending}>
                      {createPortfolio.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-48">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : portfolios?.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No portfolios found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Create your first portfolio to start tracking holdings and analyzing performance.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="mt-6" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add Portfolio
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios?.map(portfolio => (
              <Link key={portfolio.id} href={`/portfolios/${portfolio.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full hover-elevate">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                      <span className="text-xs font-mono text-muted-foreground px-2 py-1 bg-muted rounded">
                        {portfolio.currency}
                      </span>
                    </div>
                    {portfolio.description && (
                      <CardDescription className="line-clamp-1">{portfolio.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="mb-1 text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">
                      Total Value
                    </div>
                    <div className="text-3xl font-bold font-mono tracking-tight">
                      {formatCurrency(portfolio.totalValue)}
                    </div>
                    <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${portfolio.gainLoss >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {portfolio.gainLoss >= 0 ? '+' : ''}{formatCurrency(portfolio.gainLoss)} 
                      <span className="text-muted-foreground ml-1">
                        ({portfolio.gainLossPercent >= 0 ? '+' : ''}{formatPercent(portfolio.gainLossPercent)})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      </PageTransition>
    </Shell>
  )
}

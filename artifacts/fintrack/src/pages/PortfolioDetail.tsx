import { Shell } from "@/components/layout/Shell"
import { PageTransition } from "@/components/layout/PageTransition"
import { useGetPortfolio, getGetPortfolioQueryKey, useListHoldings, getListHoldingsQueryKey, useListTransactions, getListTransactionsQueryKey, useCreateHolding, useCreateTransaction, useDeleteHolding, useDeleteTransaction, useUpdatePortfolio } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Link, useParams, useLocation } from "wouter"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { holdingSchema, transactionSchema } from "@/lib/schemas"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { z } from "zod"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function PortfolioDetail() {
  const { id } = useParams()
  const portfolioId = Number(id)
  const [, setLocation] = useLocation()
  
  const queryClient = useQueryClient()
  
  const { data: portfolio, isLoading: loadingPortfolio } = useGetPortfolio(portfolioId, {
    query: { enabled: !!portfolioId, queryKey: getGetPortfolioQueryKey(portfolioId) }
  })
  
  const { data: holdings, isLoading: loadingHoldings } = useListHoldings(portfolioId, {
    query: { enabled: !!portfolioId, queryKey: getListHoldingsQueryKey(portfolioId) }
  })
  
  const { data: transactions, isLoading: loadingTransactions } = useListTransactions(portfolioId, {
    query: { enabled: !!portfolioId, queryKey: getListTransactionsQueryKey(portfolioId) }
  })

  const createHolding = useCreateHolding()
  const deleteHolding = useDeleteHolding()
  const createTransaction = useCreateTransaction()

  const [isHoldingOpen, setIsHoldingOpen] = useState(false)
  const [isTxOpen, setIsTxOpen] = useState(false)

  const holdingForm = useForm<z.infer<typeof holdingSchema>>({
    resolver: zodResolver(holdingSchema),
    defaultValues: {
      ticker: "",
      name: "",
      assetType: "stock",
      quantity: 0,
      avgCostBasis: 0,
      currentPrice: 0,
    },
  })

  const txForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      ticker: "",
      type: "buy",
      quantity: 0,
      price: 0,
      notes: "",
      transactedAt: new Date().toISOString().split('T')[0],
    },
  })

  function onHoldingSubmit(values: z.infer<typeof holdingSchema>) {
    createHolding.mutate({ portfolioId, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHoldingsQueryKey(portfolioId) })
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(portfolioId) })
        setIsHoldingOpen(false)
        holdingForm.reset()
      }
    })
  }

  function onTxSubmit(values: z.infer<typeof transactionSchema>) {
    // Add time component since API expects datetime, form gives date
    const dt = new Date(values.transactedAt).toISOString()
    createTransaction.mutate({ portfolioId, data: { ...values, transactedAt: dt } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey(portfolioId) })
        setIsTxOpen(false)
        txForm.reset()
      }
    })
  }

  const handleDeleteHolding = (holdingId: number) => {
    if(confirm("Delete this holding?")) {
      deleteHolding.mutate({ id: holdingId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHoldingsQueryKey(portfolioId) })
          queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(portfolioId) })
        }
      })
    }
  }

  if (loadingPortfolio) {
    return (
      <Shell>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Shell>
    )
  }

  if (!portfolio) {
    return (
      <Shell>
        <div className="text-center py-20">Portfolio not found</div>
      </Shell>
    )
  }

  return (
    <Shell>
      <PageTransition>
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/portfolios" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portfolios
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                {portfolio.name}
                <Badge variant="outline" className="font-mono">{portfolio.currency}</Badge>
              </h1>
              {portfolio.description && (
                <p className="text-muted-foreground mt-1">{portfolio.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                const newName = prompt("New portfolio name:", portfolio.name);
                if (newName) {
                  // @ts-ignore - dynamic hook import not available at top level for brevity but updatePortfolio exists
                  queryClient.setQueryData(getGetPortfolioQueryKey(portfolioId), (old: any) => old ? {...old, name: newName} : old);
                  fetch(`/api/portfolios/${portfolioId}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: newName })})
                    .then(() => queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(portfolioId) }));
                }
              }}>Edit Name</Button>
              <Button variant="destructive" onClick={() => {
                if (confirm("Delete this portfolio?")) {
                  fetch(`/api/portfolios/${portfolioId}`, { method: 'DELETE' }).then(() => {
                    setLocation("/portfolios");
                  });
                }
              }}>Delete</Button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardDescription className="text-primary-foreground/70 font-mono text-xs uppercase tracking-wider">Total Value</CardDescription>
              <CardTitle className="text-3xl font-mono">{formatCurrency(portfolio.totalValue)}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Total Gain/Loss</CardDescription>
              <CardTitle className={`text-3xl font-mono ${portfolio.gainLoss >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {portfolio.gainLoss >= 0 ? '+' : ''}{formatCurrency(portfolio.gainLoss)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Return</CardDescription>
              <CardTitle className={`text-3xl font-mono ${portfolio.gainLossPercent >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {portfolio.gainLossPercent >= 0 ? '+' : ''}{formatPercent(portfolio.gainLossPercent)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="holdings" className="w-full mt-4">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              {/* Holding Dialog */}
              <Dialog open={isHoldingOpen} onOpenChange={setIsHoldingOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4"/> Add Holding</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Holding</DialogTitle>
                  </DialogHeader>
                  <Form {...holdingForm}>
                    <form onSubmit={holdingForm.handleSubmit(onHoldingSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={holdingForm.control} name="ticker" render={({ field }) => (
                          <FormItem><FormLabel>Ticker</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={holdingForm.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                      
                      <FormField control={holdingForm.control} name="assetType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="stock">Stock</SelectItem>
                              <SelectItem value="etf">ETF</SelectItem>
                              <SelectItem value="crypto">Crypto</SelectItem>
                              <SelectItem value="bond">Bond</SelectItem>
                              <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={holdingForm.control} name="quantity" render={({ field }) => (
                          <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" step="0.0001" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={holdingForm.control} name="avgCostBasis" render={({ field }) => (
                          <FormItem><FormLabel>Avg Cost</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={holdingForm.control} name="currentPrice" render={({ field }) => (
                          <FormItem><FormLabel>Current Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={createHolding.isPending}>Add Holding</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Transaction Dialog */}
              <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary"><Plus className="mr-2 h-4 w-4"/> Log Transaction</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Transaction</DialogTitle>
                  </DialogHeader>
                  <Form {...txForm}>
                    <form onSubmit={txForm.handleSubmit(onTxSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={txForm.control} name="ticker" render={({ field }) => (
                          <FormItem><FormLabel>Ticker</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={txForm.control} name="type" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="buy">Buy</SelectItem>
                                <SelectItem value="sell">Sell</SelectItem>
                                <SelectItem value="dividend">Dividend</SelectItem>
                                <SelectItem value="deposit">Deposit</SelectItem>
                                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={txForm.control} name="quantity" render={({ field }) => (
                          <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" step="0.0001" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={txForm.control} name="price" render={({ field }) => (
                          <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                      
                      <FormField control={txForm.control} name="transactedAt" render={({ field }) => (
                        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      
                      <FormField control={txForm.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={createTransaction.isPending}>Save</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <TabsContent value="holdings">
            <Card>
              {holdings?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No holdings in this portfolio yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings?.map(h => (
                      <TableRow key={h.id}>
                        <TableCell>
                          <div className="font-semibold text-foreground">{h.ticker}</div>
                          <div className="text-xs text-muted-foreground">{h.name}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{h.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(h.currentPrice)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{formatCurrency(h.marketValue)}</TableCell>
                        <TableCell className={`text-right font-mono ${h.gainLoss >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                          {h.gainLoss >= 0 ? '+' : ''}{formatCurrency(h.gainLoss)}
                          <div className="text-xs">
                            {h.gainLossPercent >= 0 ? '+' : ''}{formatPercent(h.gainLossPercent)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteHolding(h.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions">
            <Card>
              {transactions?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No transactions found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{format(new Date(tx.transactedAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            tx.type === 'buy' ? 'bg-blue-100 text-blue-800' : 
                            tx.type === 'sell' ? 'bg-purple-100 text-purple-800' :
                            tx.type === 'dividend' ? 'bg-emerald-100 text-emerald-800' : 'bg-muted'
                          }>
                            {tx.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{tx.ticker}</TableCell>
                        <TableCell className="text-right font-mono">{tx.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(tx.price)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{formatCurrency(tx.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </PageTransition>
    </Shell>
  )
}

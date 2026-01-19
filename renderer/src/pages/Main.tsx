import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Table, TableCell, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Minus, Plus, Printer } from 'lucide-react';
import { ProductionLineType, ItemType } from '@/types/index';
import LabelPreview from '@/components/LabelPreview';
import { Progress } from '@/components/ui/progress';

const Main = () => {
    const [allProductionLines, setAllProductionLines] = useState<ProductionLineType[]>([]);
    const [itemNumber, setItemNumber] = useState<string>('');
    const [itemDescription, setItemDescription] = useState<string>('');
    const [itemDescription2, setItemDescription2] = useState<string>('');
    const [itemUnitOfMeasure, setItemUnitOfMeasure] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [itemCode, setItemCode] = useState<string>('');
    const [isValidating, setIsValidating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const { toast } = useToast();
    const [pageSize, setPageSize] = useState<number>(5);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [items, setItems] = useState<ItemType[]>([]);
    const [selectedProductionLines, setSelectedProductionLines] = useState<ProductionLineType[]>([]);

    // Filter data based on search criteria
    const filteredData = useMemo(() => {
        return items.filter((item) => {
            const matchesCode = !itemCode || item.code.toLowerCase().includes(itemCode.toLowerCase());
            const matchesDescription = !itemDescription ||
                item.description1.toLowerCase().includes(itemDescription.toLowerCase()) ||
                item.description2.toLowerCase().includes(itemDescription.toLowerCase());
            const matchesProductionLine = selectedProductionLines.length === 0 ||
                (item.productionLine && selectedProductionLines.some(pl => pl.id === item.productionLine?.id));
            return matchesCode && matchesDescription && matchesProductionLine;
        });
    }, [itemCode, itemDescription, selectedProductionLines, items]);

    // Calculate pagination
    const totalPages = useMemo(() => Math.ceil(filteredData.length / pageSize), [filteredData.length, pageSize]);
    const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
    const endIndex = useMemo(() => startIndex + pageSize, [startIndex, pageSize]);
    const paginatedData = useMemo(() => {
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, startIndex, endIndex]);

    // Reset to page 1 when filters or pageSize changes
    useEffect(() => {
        setCurrentPage(1);
    }, [itemCode, itemDescription, selectedProductionLines, pageSize]);

    // Handle row selection
    const toggleItemSelection = (id: number) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id.toString())) {
                newSet.delete(id.toString());
            } else {
                newSet.add(id.toString());
            }
            return newSet;
        });
    };

    // Handle select all on current page
    const toggleSelectAll = () => {
        const currentPageCodes = paginatedData.map((item) => item.id.toString());
        const allSelected = currentPageCodes.every((id) => selectedItems.has(id));

        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (allSelected) {
                // Deselect all on current page
                currentPageCodes.forEach((id) => newSet.delete(id));
            } else {
                // Select all on current page
                currentPageCodes.forEach((id) => newSet.add(id));
            }
            return newSet;
        });
    };

    // Check if all rows on current page are selected
    const allRowsSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedItems.has(item.id.toString()));
    const someRowsSelected = paginatedData.some((item) => selectedItems.has(item.id.toString()));

    // Real-time item validation
    useEffect(() => {
        const validateItem = async () => {
            if (!itemNumber.trim()) {
                setItemDescription('');
                return;
            }

            setIsValidating(true);
            setStatus(''); // Clear previous status
            try {
                // Check if electronAPI is available
                if (!window.electronAPI || typeof window.electronAPI.lookupItem !== 'function') {
                    throw new Error('Electron API not available. Please restart the application.');
                }
                const result = await window.electronAPI.lookupItem(itemNumber.trim());
                if (result.success && result.item) {
                    setItemDescription(result.item.description || '');
                    setStatus('');
                } else {
                    setItemDescription('');
                    // Show specific error message from backend
                    const errorMsg = result?.error || 'Item not found';
                    setStatus(errorMsg);
                }
            } catch (error) {
                setItemDescription('');
                // Show more detailed error message
                const errorMessage = (error as Error)?.message || 'Unknown error';
                if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
                    setStatus('Connection error: Unable to reach database. Please check your connection.');
                } else if (errorMessage.includes('ECONNREFUSED')) {
                    setStatus('Database connection refused. Please verify database server is running.');
                } else {
                    setStatus(`Error validating item: ${errorMessage}`);
                }
            } finally {
                setIsValidating(false);
            }
        };

        const timeoutId = setTimeout(validateItem, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [itemNumber]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that items are selected
        if (selectedItems.size === 0) {
            toast({
                title: 'Validation Error',
                description: 'Please select at least one item to print',
                variant: 'destructive',
            });
            return;
        }

        const qty = quantity;
        if (!qty || qty <= 0) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a valid quantity',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);
        setStatus('Validating items...');

        // Get selected items with their details
        const itemsToPrint = Array.from(selectedItems)
            .map(itemIdStr => {
                const itemId = parseInt(itemIdStr);
                return items.find(item => item.id === itemId);
            })
            .filter((item): item is ItemType => item !== undefined && item.productionLine !== null);

        if (itemsToPrint.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Selected items are invalid or missing production lines',
                variant: 'destructive',
            });
            setIsProcessing(false);
            return;
        }

        const totalLabels = itemsToPrint.length * qty;
        setProgress({ current: 0, total: totalLabels });

        try {
            // Update status: Generating EPCs
            setStatus(`Generating EPCs for ${itemsToPrint.length} item(s)...`);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Update status: Generating combined print job
            setStatus(`Generating combined print job...`);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Generate EPCs and send to printer for all items at once
            setStatus(`Sending combined print job to printer...`);

            const result = await window.electronAPI.generateAndPrint({
                items: itemsToPrint.map(item => ({
                    itemId: item.id,
                    quantity: qty,
                })),
            });

            if (result.success) {
                setStatus(`Print job complete - ${result.epcsGenerated || totalLabels} labels generated and sent to printer`);
                setProgress({ current: totalLabels, total: totalLabels });
                toast({
                    title: 'Success',
                    description: result.message || `Successfully generated and sent ${result.epcsGenerated || totalLabels} labels for ${itemsToPrint.length} item(s)`,
                });

                // Reset form after successful submission
                setTimeout(() => {
                    setSelectedItems(new Set());
                    setQuantity(0);
                    setStatus('');
                    setProgress(null);
                    setIsProcessing(false);
                }, 3000);
            } else {
                setStatus(`Print failed: ${result.error || 'Unknown error'}`);
                toast({
                    title: 'Print Error',
                    description: result.error || 'Failed to send print job',
                    variant: 'destructive',
                });
                setIsProcessing(false);
            }
        } catch (error) {
            setStatus(`Error: ${(error as Error).message}`);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
            setIsProcessing(false);
        }
    };

    // Fetch production lines on mount
    useEffect(() => {
        const fetchProductionLines = async () => {
            if (!window.electronAPI || typeof window.electronAPI.getProductionLines !== 'function') {
                console.warn('Electron API not available. Please restart the application.');
                return;
            }
            try {
                const result = await window.electronAPI.getProductionLines();
                if (result.success && result.productionLines) {
                    setAllProductionLines(result.productionLines);
                    setSelectedProductionLines(result.productionLines);
                }
            } catch (error) {
                console.error('Error fetching production lines:', error);
            }
        };
        fetchProductionLines();
    }, []);

    // Fetch items when selected production lines change
    useEffect(() => {
        // Clear items immediately when production lines change to prevent showing stale data
        setItems([]);
        setCurrentPage(1);

        const fetchItems = async () => {
            if (!window.electronAPI || typeof window.electronAPI.getItems !== 'function') {
                console.warn('Electron API not available. Please restart the application.');
                return;
            }

            // Don't fetch if no production lines are selected
            if (selectedProductionLines.length === 0) {
                setItems([]);
                return;
            }

            try {
                const productionLineIds = selectedProductionLines.map(pl => pl.id);
                const result = await window.electronAPI.getItems({ productionLineIds });
                if (result.success && result.items) {
                    setItems(result.items.map((item) => ({
                        ...item,
                        productionLine: item.productionLine as ProductionLineType,
                    })));
                } else {
                    setItems([]);
                }
            } catch (error) {
                console.error('Error fetching items:', error);
                setItems([]);
            }
        };
        fetchItems();
    }, [selectedProductionLines]);
    return (
        <div className="container mx-auto p-6">
            <div>
                <div className="flex justify-between items-center py-4 gap-4">
                    <div className="flex items-center gap-4">
                        <Input type="text" placeholder="Item Code" value={itemCode} onChange={(e) => setItemCode(e.target.value)} className="h-12 text-base" />
                        <Input type="text" placeholder="Description" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} className="h-12 text-base" />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-12 text-base justify-between min-w-[200px]"
                                    disabled={isProcessing}
                                >
                                    {selectedProductionLines.length === 0
                                        ? 'Select Production Lines'
                                        : selectedProductionLines.length === allProductionLines.length
                                            ? 'All Production Lines'
                                            : `${selectedProductionLines.length} line${selectedProductionLines.length > 1 ? 's' : ''} selected`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0" align="start">
                                <div className="p-2 space-y-2">
                                    <div className="px-2 py-1.5 text-sm font-semibold">Production Lines</div>
                                    <div className="space-y-2">
                                        {allProductionLines.map((line) => {
                                            const isSelected = selectedProductionLines.some(pl => pl.id === line.id);
                                            return (
                                                <div key={line.id} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent rounded-sm">
                                                    <Checkbox
                                                        id={`search-line-${line.id}`}
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedProductionLines([...selectedProductionLines, line]);
                                                            } else {
                                                                setSelectedProductionLines(selectedProductionLines.filter(pl => pl.id !== line.id));
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`search-line-${line.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                                    >
                                                        {line.name}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {selectedProductionLines.length > 0 && (
                                        <div className="border-t pt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setSelectedProductionLines([])}
                                            >
                                                Clear Selection
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-row items-center gap-2">
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => {
                                    setPageSize(Number(value));
                                    setCurrentPage(1);
                                }}
                                disabled={isProcessing}
                                defaultValue="5"
                            >
                                <SelectTrigger id="pageSize" className="h-12 text-base w-24">
                                    <SelectValue placeholder="Select Page Size" />
                                </SelectTrigger>
                                <SelectContent align='end'>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <div className="overflow-hidden rounded-md border">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={allRowsSelected}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Production Line</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Identifier</TableHead>
                                <TableHead>Description1</TableHead>
                                <TableHead>Description2</TableHead>
                                <TableHead>Unit of Measure</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No items found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((item) => {
                                    const isSelected = selectedItems.has(item.id.toString());
                                    return (
                                        <TableRow
                                            key={item.id}
                                            className={isSelected ? 'bg-muted/50' : ''}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleItemSelection(item.id)}
                                                    aria-label={`Select ${item.id}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">{item.productionLine?.name || 'N/A'}</span>
                                            </TableCell>
                                            <TableCell>{item.code}</TableCell>
                                            <TableCell>{item.identifier}</TableCell>
                                            <TableCell>{item.description1}</TableCell>
                                            <TableCell>{item.description2}</TableCell>
                                            <TableCell>{item.unitOfMeasure}</TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Selection Info and Actions */}
                {selectedItems.size > 0 && (
                    <div className="flex items-center justify-between px-2 py-3 bg-muted/50 rounded-md border">
                        <div className="text-sm font-medium">
                            {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItems(new Set())}
                            >
                                Clear Selection
                            </Button>
                            {/* Add more actions here as needed */}
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} items
                        {selectedItems.size > 0 && (
                            <span className="ml-2 font-medium">({selectedItems.size} selected)</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || filteredData.length === 0}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || filteredData.length === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="w-10"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || filteredData.length === 0}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || filteredData.length === 0}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className='flex flex-row items-center gap-2 justify-between py-4'>
                <div className='flex flex-row items-center gap-2'>
                    <Input type="number" value={quantity.toString()} onChange={(e) => setQuantity(Number(e.target.value))} />
                    <div className='flex flex-row items-center gap-2'>
                        <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setQuantity(quantity - 1)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Button onClick={handleSubmit} className='h-12 text-base'><Printer className="h-4 w-4" /> Print</Button>
            </div>
            <div className='flex flex-row gap-4 justify-between py-4'>
                <div className='flex-[2]'>
                    <LabelPreview item={selectedItems.size > 0 ? items.find(item => item.id === Number(Array.from(selectedItems)[0]))! : null} quantity={quantity} />
                </div>
                <div className='flex-1 flex-col items-center gap-2'>
                    <Card className='h-full'>
                        <CardHeader>
                            <div className='flex flex-row items-center gap-2 '>
                                <Printer className="h-8 w-8" /> <span className='text-sm font-medium'>Zebra ZE500-6 TOP-101</span>
                            </div>
                        </CardHeader>
                        <CardContent className='space-y-4'>

                            {/* Process status with detailed stages */}
                            {(isProcessing || (progress && progress.current > 0)) && (
                                <div className='flex flex-col gap-3 w-full max-w-md'>
                                    <div className='space-y-2'>
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>Status:</span>
                                            <span className='font-medium'>{status || 'Ready'}</span>
                                        </div>
                                        {progress && progress.total > 0 && (
                                            <>
                                                <Progress value={(progress.current / progress.total) * 100} className='w-full' />
                                                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                                    <span>Progress: {progress.current} / {progress.total}</span>
                                                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {/* Detailed stage indicators */}
                                    {isProcessing && (
                                        <div className='space-y-1.5 text-xs'>
                                            <div className={`flex items-center gap-2 ${status.includes('Validating') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${status.includes('Validating') ? 'bg-primary' : 'bg-muted'}`} />
                                                <span>Validating item...</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${status.includes('Generating EPCs') ? 'text-primary font-medium' : status.includes('Validating') ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${status.includes('Generating EPCs') ? 'bg-primary' : 'bg-muted'}`} />
                                                <span>Generating EPCs...</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${status.includes('Generating print job') ? 'text-primary font-medium' : status.includes('Generating EPCs') || status.includes('Print job') ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${status.includes('Generating print job') ? 'bg-primary' : 'bg-muted'}`} />
                                                <span>Generating print job...</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${status.includes('Sending to printer') ? 'text-primary font-medium' : status.includes('Print job complete') ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${status.includes('Sending to printer') ? 'bg-primary' : 'bg-muted'}`} />
                                                <span>Sending to printer...</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${status.includes('Print job complete') ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${status.includes('Print job complete') ? 'bg-green-600' : 'bg-muted'}`} />
                                                <span>Print job complete</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
export default Main;

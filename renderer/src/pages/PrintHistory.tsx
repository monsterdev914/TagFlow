/**
 * Print History Page
 * Displays printing history with filtering and pagination
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-react';
import { ProductionLineType } from '@/types/index';
import { useToast } from '@/hooks/use-toast';

interface PrintingHistoryRecord {
    id: number;
    itemId: number;
    itemCode: string;
    itemDescription: string | null;
    productionLineId: number | null;
    productionLineName: string | null;
    quantity: number;
    epcsGenerated: number;
    printerIP: string | null;
    printerPort: number | null;
    printerName: string | null;
    status: string;
    errorMessage: string | null;
    createdAt: Date;
}

const PrintHistory: React.FC = () => {
    const [records, setRecords] = useState<PrintingHistoryRecord[]>([]);
    const [productionLines, setProductionLines] = useState<ProductionLineType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const { toast } = useToast();

    // Filter states
    const [filterItemCode, setFilterItemCode] = useState('');
    const [filterProductionLineId, setFilterProductionLineId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Pagination states
    const [pageSize, setPageSize] = useState<number>(20);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Fetch production lines
    const fetchProductionLines = async () => {
        if (!window.electronAPI || typeof window.electronAPI.getProductionLines !== 'function') {
            console.warn('Electron API not available. Please restart the application.');
            return;
        }

        try {
            const result = await window.electronAPI.getProductionLines();
            if (result.success && result.productionLines) {
                setProductionLines(result.productionLines);
            }
        } catch (error) {
            console.error('Error fetching production lines:', error);
        }
    };

    // Fetch printing history
    const fetchPrintHistory = useCallback(async () => {
        if (!window.electronAPI || typeof window.electronAPI.getPrintingHistory !== 'function') {
            console.warn('Electron API not available. Please restart the application.');
            return;
        }

        setIsLoading(true);
        try {
            const filters: {
                itemId?: number;
                productionLineId?: number;
                startDate?: string;
                endDate?: string;
                status?: string;
                limit?: number;
                offset?: number;
            } = {};

            if (filterItemCode.trim()) {
                // Note: We filter by itemCode on frontend since API doesn't support it directly
                // In a real app, you'd want backend support for itemCode filtering
            }
            if (filterProductionLineId) {
                filters.productionLineId = filterProductionLineId;
            }
            if (filterStatus !== 'all') {
                filters.status = filterStatus;
            }
            if (filterStartDate) {
                filters.startDate = new Date(filterStartDate).toISOString();
            }
            if (filterEndDate) {
                filters.endDate = new Date(filterEndDate + 'T23:59:59').toISOString();
            }

            filters.limit = pageSize;
            filters.offset = (currentPage - 1) * pageSize;

            const result = await window.electronAPI.getPrintingHistory(filters);
            if (result.success && result.records) {
                let filteredRecords = result.records;

                // Filter by item code on frontend if needed
                if (filterItemCode.trim()) {
                    filteredRecords = filteredRecords.filter(record =>
                        record.itemCode.toLowerCase().includes(filterItemCode.toLowerCase().trim())
                    );
                }

                setRecords(filteredRecords);
                setTotalRecords(result.total || filteredRecords.length);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to fetch printing history',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An error occurred while fetching printing history',
                variant: 'destructive',
            });
            console.error('Error fetching printing history:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filterItemCode, filterProductionLineId, filterStatus, filterStartDate, filterEndDate, pageSize, currentPage, toast]);

    useEffect(() => {
        fetchProductionLines();
    }, []);

    // Debounce filter changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1); // Reset to first page when filters change
            fetchPrintHistory();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filterItemCode, filterProductionLineId, filterStatus, filterStartDate, filterEndDate, pageSize, fetchPrintHistory]);

    // Calculate pagination
    const totalPages = useMemo(() => Math.ceil(totalRecords / pageSize), [totalRecords, pageSize]);
    const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
    const endIndex = useMemo(() => Math.min(startIndex + pageSize, totalRecords), [startIndex, pageSize, totalRecords]);

    const handleResetFilters = () => {
        setFilterItemCode('');
        setFilterProductionLineId(null);
        setFilterStatus('all');
        setFilterStartDate('');
        setFilterEndDate('');
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        fetchPrintHistory();
    };

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleString();
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Print History</h1>
                    <p className="text-muted-foreground mt-2">
                        View and filter printing history records
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="border rounded-md p-4 space-y-4 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="filter-item-code">Item Code</Label>
                        <Input
                            id="filter-item-code"
                            placeholder="Enter item code..."
                            value={filterItemCode}
                            onChange={(e) => setFilterItemCode(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="filter-production-line">Production Line</Label>
                        <Select
                            value={filterProductionLineId?.toString() || 'all'}
                            onValueChange={(value) =>
                                setFilterProductionLineId(value === 'all' ? null : parseInt(value))
                            }
                            disabled={isLoading}
                        >
                            <SelectTrigger id="filter-production-line">
                                <SelectValue placeholder="All production lines" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All production lines</SelectItem>
                                {productionLines.map((pl) => (
                                    <SelectItem key={pl.id} value={pl.id.toString()}>
                                        {pl.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="filter-status">Status</Label>
                        <Select
                            value={filterStatus}
                            onValueChange={setFilterStatus}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="filter-status">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="filter-start-date">Start Date</Label>
                        <Input
                            id="filter-start-date"
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="filter-end-date">End Date</Label>
                        <Input
                            id="filter-end-date"
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="flex items-end">
                    <Button
                        variant="outline"
                        onClick={handleResetFilters}
                        disabled={isLoading}
                        className="w-full"
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md">
                <div className="p-4 border-b bg-muted/50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {records.length > 0 ? startIndex + 1 : 0} to {endIndex} of {totalRecords} records
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="page-size" className="text-sm">Records per page:</Label>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => {
                                    setPageSize(parseInt(value));
                                    setCurrentPage(1);
                                }}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="page-size" className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Loading printing history...
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No printing history records found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date/Time</TableHead>
                                    <TableHead>Item Code</TableHead>
                                    <TableHead>Item Description</TableHead>
                                    <TableHead>Production Line</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>EPCs Generated</TableHead>
                                    <TableHead>Printer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Error</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(record.createdAt)}
                                        </TableCell>
                                        <TableCell className="font-mono font-medium">
                                            {record.itemCode}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={record.itemDescription || ''}>
                                            {record.itemDescription || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {record.productionLineName || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {record.quantity}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {record.epcsGenerated}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {record.printerName || record.printerIP || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground" title={record.errorMessage || ''}>
                                            {record.errorMessage || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || isLoading}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages || isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || isLoading}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrintHistory;

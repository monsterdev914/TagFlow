/**
 * Items Page
 * Manages items with full CRUD operations, pagination, and filtering
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
import { Edit, Plus, Trash, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ItemType, ProductionLineType } from '@/types/index';
import ItemForm, { ItemFormData } from '@/components/ItemForm';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

const Items: React.FC = () => {
    const [items, setItems] = useState<ItemType[]>([]);
    const [productionLines, setProductionLines] = useState<ProductionLineType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ItemType | null>(null);
    const [deletingItem, setDeletingItem] = useState<ItemType | null>(null);
    const { toast } = useToast();

    // Filter states
    const [filterCode, setFilterCode] = useState('');
    const [filterDescription, setFilterDescription] = useState('');
    const [filterProductionLineIds, setFilterProductionLineIds] = useState<number[]>([]);

    // Pagination states
    const [pageSize, setPageSize] = useState<number>(10);
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

    // Fetch items
    const fetchItems = useCallback(async () => {
        if (!window.electronAPI || typeof window.electronAPI.getItems !== 'function') {
            console.warn('Electron API not available. Please restart the application.');
            return;
        }

        setIsLoading(true);
        try {
            const filters: {
                code?: string;
                description?: string;
                productionLineIds?: number[];
            } = {};

            if (filterCode.trim()) {
                filters.code = filterCode.trim();
            }
            if (filterDescription.trim()) {
                filters.description = filterDescription.trim();
            }
            if (filterProductionLineIds.length > 0) {
                filters.productionLineIds = filterProductionLineIds;
            }

            const result = await window.electronAPI.getItems(filters);
            if (result.success && result.items) {
                setItems(result.items);
                setCurrentPage(1); // Reset to first page when filters change
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to fetch items',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An error occurred while fetching items',
                variant: 'destructive',
            });
            console.error('Error fetching items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filterCode, filterDescription, filterProductionLineIds, toast]);

    useEffect(() => {
        fetchProductionLines();
    }, []);

    // Debounce filter changes to avoid losing focus on input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchItems();
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(timeoutId);
    }, [filterCode, filterDescription, filterProductionLineIds, fetchItems]);

    // Calculate pagination
    const totalPages = useMemo(() => Math.ceil(items.length / pageSize), [items.length, pageSize]);
    const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
    const endIndex = useMemo(() => startIndex + pageSize, [startIndex, pageSize]);
    const paginatedItems = useMemo(
        () => items.slice(startIndex, endIndex),
        [items, startIndex, endIndex]
    );

    // Handle form submission (create or update)
    const handleFormSubmit = async (data: ItemFormData) => {
        setIsLoading(true);
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            let result;
            if (editingItem) {
                // Update existing item
                if (typeof window.electronAPI.updateItem !== 'function') {
                    throw new Error('Update item API not available');
                }
                result = await window.electronAPI.updateItem(editingItem.id, {
                    code: data.code,
                    description1: data.description1,
                    description2: data.description2,
                    unitOfMeasure: data.unitOfMeasure,
                    identifier: data.identifier,
                    productionLineId: data.productionLineId,
                });
            } else {
                // Create new item
                if (typeof window.electronAPI.createItem !== 'function') {
                    throw new Error('Create item API not available');
                }
                result = await window.electronAPI.createItem({
                    code: data.code,
                    description1: data.description1,
                    description2: data.description2,
                    unitOfMeasure: data.unitOfMeasure,
                    identifier: data.identifier,
                    productionLineId: data.productionLineId,
                });
            }

            if (result.success) {
                toast({
                    title: 'Success',
                    description: editingItem
                        ? 'Item updated successfully'
                        : 'Item created successfully',
                });
                setIsFormOpen(false);
                setEditingItem(null);
                await fetchItems();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to save item',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: (error as Error).message || 'An error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!deletingItem) return;

        setIsLoading(true);
        try {
            if (!window.electronAPI || typeof window.electronAPI.deleteItem !== 'function') {
                throw new Error('Delete item API not available');
            }

            const result = await window.electronAPI.deleteItem(deletingItem.id);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Item deleted successfully',
                });
                setIsDeleteDialogOpen(false);
                setDeletingItem(null);
                await fetchItems();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to delete item',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: (error as Error).message || 'An error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle add button click
    const handleAddClick = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    // Handle edit button click
    const handleEditClick = (item: ItemType) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    // Handle delete button click
    const handleDeleteClick = (item: ItemType) => {
        setDeletingItem(item);
        setIsDeleteDialogOpen(true);
    };

    // Handle filter reset
    const handleResetFilters = () => {
        setFilterCode('');
        setFilterDescription('');
        setFilterProductionLineIds([]);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center py-4 gap-4">
                <h1 className="text-2xl font-bold">Items</h1>
                <Button variant="outline" size="sm" onClick={handleAddClick} disabled={isLoading}>
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
            </div>

            {/* Filters */}
            <div className="border rounded-md p-4 space-y-4 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="filter-code">Filter by Code</Label>
                        <Input
                            id="filter-code"
                            placeholder="Enter code..."
                            value={filterCode}
                            onChange={(e) => setFilterCode(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="filter-description">Filter by Description</Label>
                        <Input
                            id="filter-description"
                            placeholder="Enter description..."
                            value={filterDescription}
                            onChange={(e) => setFilterDescription(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="filter-production-line">Production Line</Label>
                        <Select
                            value={filterProductionLineIds.length > 0 ? filterProductionLineIds[0].toString() : 'all'}
                            onValueChange={(value) =>
                                setFilterProductionLineIds(value === 'all' ? [] : [parseInt(value)])
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
            </div>

            {/* Items Table */}
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead className="w-[150px]">Code</TableHead>
                            <TableHead>Description 1</TableHead>
                            <TableHead>Description 2</TableHead>
                            <TableHead className="w-[120px]">Unit</TableHead>
                            <TableHead className="w-[150px]">Production Line</TableHead>
                            <TableHead className="w-[200px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : paginatedItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No items found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.id}</TableCell>
                                    <TableCell className="font-medium">{item.code}</TableCell>
                                    <TableCell>{item.description1}</TableCell>
                                    <TableCell>{item.description2}</TableCell>
                                    <TableCell>{item.unitOfMeasure}</TableCell>
                                    <TableCell>{item.productionLine?.name || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditClick(item)}
                                                disabled={isLoading}
                                            >
                                                <Edit className="h-4 w-4 mr-2" /> Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteClick(item)}
                                                disabled={isLoading}
                                            >
                                                <Trash className="h-4 w-4 mr-2" /> Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {items.length > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="page-size">Items per page:</Label>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => {
                                setPageSize(parseInt(value));
                                setCurrentPage(1);
                            }}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="page-size" className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground ml-4">
                            Showing {items.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, items.length)} of{' '}
                            {items.length} items
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || items.length === 0}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || items.length === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || items.length === 0}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || items.length === 0}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Add/Edit Form Dialog */}
            <ItemForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSubmit={handleFormSubmit}
                initialData={
                    editingItem
                        ? {
                            code: editingItem.code,
                            description1: editingItem.description1,
                            description2: editingItem.description2,
                            unitOfMeasure: editingItem.unitOfMeasure,
                            identifier: editingItem.identifier,
                            productionLineId: editingItem.productionLine?.id || null,
                        }
                        : null
                }
                productionLines={productionLines}
                title={editingItem ? 'Edit Item' : 'Add Item'}
                description={
                    editingItem
                        ? 'Update the item information below.'
                        : 'Create a new item by entering the information below.'
                }
                isLoading={isLoading}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Item"
                description="Are you sure you want to delete this item"
                itemName={deletingItem?.code}
                isLoading={isLoading}
            />
        </div>
    );
};

export default Items;

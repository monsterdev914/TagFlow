/**
 * Production Lines Page
 * Manages production lines with full CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Edit, Plus, Trash } from 'lucide-react';
import { ProductionLineType } from '@/types/index';
import ProductionLineForm, { ProductionLineFormData } from '@/components/ProductionLineForm';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

const ProductionLines: React.FC = () => {
    const [productionLines, setProductionLines] = useState<ProductionLineType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingProductionLine, setEditingProductionLine] = useState<ProductionLineType | null>(null);
    const [deletingProductionLine, setDeletingProductionLine] = useState<ProductionLineType | null>(null);
    const { toast } = useToast();

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
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to fetch production lines',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An error occurred while fetching production lines',
                variant: 'destructive',
            });
            console.error('Error fetching production lines:', error);
        }
    };

    useEffect(() => {
        fetchProductionLines();
    }, []);

    // Handle form submission (create or update)
    const handleFormSubmit = async (data: ProductionLineFormData) => {
        setIsLoading(true);
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            let result;
            if (editingProductionLine) {
                // Update existing production line
                if (typeof window.electronAPI.updateProductionLine !== 'function') {
                    throw new Error('Update production line API not available');
                }
                result = await window.electronAPI.updateProductionLine(
                    editingProductionLine.id,
                    data.name
                );
            } else {
                // Create new production line
                if (typeof window.electronAPI.createProductionLine !== 'function') {
                    throw new Error('Create production line API not available');
                }
                result = await window.electronAPI.createProductionLine(data.name);
            }

            if (result.success) {
                toast({
                    title: 'Success',
                    description: editingProductionLine
                        ? 'Production line updated successfully'
                        : 'Production line created successfully',
                });
                setIsFormOpen(false);
                setEditingProductionLine(null);
                await fetchProductionLines();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to save production line',
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
        if (!deletingProductionLine) return;

        setIsLoading(true);
        try {
            if (!window.electronAPI || typeof window.electronAPI.deleteProductionLine !== 'function') {
                throw new Error('Delete production line API not available');
            }

            const result = await window.electronAPI.deleteProductionLine(deletingProductionLine.id);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Production line deleted successfully',
                });
                setIsDeleteDialogOpen(false);
                setDeletingProductionLine(null);
                await fetchProductionLines();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to delete production line',
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
        setEditingProductionLine(null);
        setIsFormOpen(true);
    };

    // Handle edit button click
    const handleEditClick = (productionLine: ProductionLineType) => {
        setEditingProductionLine(productionLine);
        setIsFormOpen(true);
    };

    // Handle delete button click
    const handleDeleteClick = (productionLine: ProductionLineType) => {
        setDeletingProductionLine(productionLine);
        setIsDeleteDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center py-4 gap-4">
                <h1 className="text-2xl font-bold">Production Lines</h1>
                <Button variant="outline" size="sm" onClick={handleAddClick}>
                    <Plus className="h-4 w-4 mr-2" /> Add Production Line
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="w-[200px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productionLines.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    No production lines found
                                </TableCell>
                            </TableRow>
                        ) : (
                            productionLines.map((productionLine) => (
                                <TableRow key={productionLine.id}>
                                    <TableCell>{productionLine.id}</TableCell>
                                    <TableCell className="font-medium">{productionLine.name}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditClick(productionLine)}
                                                disabled={isLoading}
                                            >
                                                <Edit className="h-4 w-4 mr-2" /> Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteClick(productionLine)}
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

            {/* Add/Edit Form Dialog */}
            <ProductionLineForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSubmit={handleFormSubmit}
                initialData={editingProductionLine ? { name: editingProductionLine.name } : null}
                title={editingProductionLine ? 'Edit Production Line' : 'Add Production Line'}
                description={
                    editingProductionLine
                        ? 'Update the production line information below.'
                        : 'Create a new production line by entering the name below.'
                }
                isLoading={isLoading}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Production Line"
                description="Are you sure you want to delete this production line"
                itemName={deletingProductionLine?.name}
                isLoading={isLoading}
            />
        </div>
    );
};

export default ProductionLines;

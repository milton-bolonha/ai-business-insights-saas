"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/lib/state/toast-context";
import { useContent, useWorkspaceActions } from "@/lib/stores";

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    isFeatured: boolean;
    description: string;
    requiresAssembly?: boolean;
    imageUrl?: string;
    archived?: boolean;
    createdAt?: string;
}

interface Order {
    id: string;
    orderNumber: string;
    clientName: string;
    product: string;
    value: number;
    status: string;
    priority: string;
    paymentMethod: string;
    createdAt?: string;
}

export function useFurnitureSystem(currentDashboard: any, _currentWorkspace: any) {
  const { push } = useToast();
  const content = useContent();
  const workspaceActions = useWorkspaceActions();

  // State Management
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [storeViewMode, setStoreViewMode] = useState<"internal" | "public">("internal");
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Helper to update tile metadata safely (prevents overwriting entire metadata)
   */
  const updateMetadata = useCallback(async (category: string, subKey: string, newData: any[]) => {
    if (!currentDashboard) {
        console.error("[FurnitureSystem] Cannot update metadata: currentDashboard is null or undefined.");
        push({ title: "Erro de Sistema", description: "Painel ativo não encontrado.", variant: "destructive" });
        return false;
    }
    setIsSaving(true);
    try {
        console.log(`[FurnitureSystem] Starting updateMetadata for category=${category}, subKey=${subKey}`);
        const allTiles = currentDashboard.tiles || [];
        let targetTile = allTiles.find((t: any) => t.category === category);

        if (!targetTile) {
            console.log(`[FurnitureSystem] Tile for category ${category} not found. Creating new tile...`);
            targetTile = await content.createSinglePrompt(currentDashboard.id, {
                title: category === "orders" ? "Orders Database" : category === "products" ? "Product Catalog" : category === "staff" ? "Staff Management" : "Client Database",
                prompt: "Auto-generated metadata system.",
                category,
                requestSize: "small"
            });
            console.log(`[FurnitureSystem] Created new tile with ID:`, targetTile?.id);
        }

        // Handle legacy arrays safely: if the entire metadata was an array, assume it maps to the main subKey
        let currentMetadata: any = {};
        if (Array.isArray(targetTile.metadata)) {
            currentMetadata = { [subKey]: targetTile.metadata };
        } else if (typeof targetTile.metadata === 'object' && targetTile.metadata !== null) {
            currentMetadata = targetTile.metadata;
        }

        const updatedMetadata = { 
            ...currentMetadata, 
            [subKey]: newData 
        };

        console.log(`[FurnitureSystem] Saving ${category}.${subKey}:`, updatedMetadata);
        
        await content.updateTile(targetTile.id, { 
            metadata: updatedMetadata
        });
        
        workspaceActions.refreshWorkspaces();
        return true;
    } catch (error) {
        console.error(`[FurnitureSystem] Fail to update ${category}:`, error);
        push({ title: "Persistence Error", description: "Could not save data. Check logs.", variant: "destructive" });
        return false;
    } finally {
        setIsSaving(false);
    }
  }, [currentDashboard, content, workspaceActions, push]);

  const handleOrderSubmit = useCallback(async (orderData: Partial<Order>) => {
    if (!currentDashboard) {
        push({ title: "Erro de Sistema", description: "Painel ativo não encontrado.", variant: "destructive" });
        return;
    }
    
    const allTiles = currentDashboard.tiles || [];
    const ordersTile = allTiles.find((t: any) => t.category === "orders");
    const currentMetadata = ordersTile?.metadata || {};
    const ordersList = currentMetadata.orders || (Array.isArray(currentMetadata) ? currentMetadata : []);
    
    let updatedList;
    if (orderData.id) {
        updatedList = ordersList.map((o: any) => o.id === orderData.id ? { ...o, ...orderData } : o);
    } else {
        updatedList = [...ordersList, { 
            ...orderData, 
            id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
            status: orderData.status || "To Assemble",
            createdAt: new Date().toISOString()
        }];
    }

    const success = await updateMetadata("orders", "orders", updatedList);
    if (success) {
        push({ title: orderData.id ? "Order Updated" : "Order Created", variant: "success" });
    }
  }, [currentDashboard, updateMetadata, push]);

  // Add Initial Examples if empty
  const populateDefaults = useCallback(async () => {
    if (!currentDashboard) return;
    const allTiles = currentDashboard.tiles || [];
    const productTile = allTiles.find((t: any) => t.category === "products");
    const currentProducts = productTile?.metadata?.products || [];
    
    if (currentProducts.length === 0) {
        console.log("[FurnitureSystem] Populating default products...");
        const defaults = [
            { id: "p1", name: "Bolonha Modular Sofa", price: 4200, category: "Sofas", isFeatured: true, description: "Italian velvet, 3 comfortable modules." },
            { id: "p2", name: "Oak Dining Table", price: 2800, category: "Tables", isFeatured: true, description: "Solid wood, 6 seats." },
            { id: "p3", name: "Modern Fit Kitchen", price: 8500, category: "Kitchen", isFeatured: false, description: "18mm MDF modules with soft-close." }
        ];
        await updateMetadata("products", "products", defaults);
    }
  }, [currentDashboard, updateMetadata]);

  const handleClientSubmit = useCallback(async (clientData: any) => {
    if (!currentDashboard) {
        push({ title: "Erro de Sistema", description: "Painel ativo não encontrado.", variant: "destructive" });
        return;
    }
    const allTiles = currentDashboard.tiles || [];
    const clientTile = allTiles.find((t: any) => t.category === "clients");
    const currentMetadata = clientTile?.metadata || {};
    const clientsList = currentMetadata.clients || (Array.isArray(currentMetadata) ? currentMetadata : []);
    
    let updatedList;
    if (clientData.id) {
        updatedList = clientsList.map((c: any) => c.id === clientData.id ? { ...c, ...clientData } : c);
    } else {
        updatedList = [...clientsList, { ...clientData, id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: new Date().toISOString() }];
    }
    const success = await updateMetadata("clients", "clients", updatedList);
    if (success) push({ title: "Client Saved", variant: "success" });
  }, [currentDashboard, updateMetadata, push]);

  const handleProductSubmit = useCallback(async (productData: Partial<Product>) => {
    if (!currentDashboard) {
        push({ title: "Erro de Sistema", description: "Painel ativo não encontrado.", variant: "destructive" });
        return;
    }
    
    const allTiles = currentDashboard.tiles || [];
    const productTile = allTiles.find((t: any) => t.category === "products");
    
    // Crucial: Handle both legacy and new metadata structures
    const currentMetadata = productTile?.metadata || {};
    const productsList = currentMetadata.products || (Array.isArray(currentMetadata) ? currentMetadata : []);
    
    console.log("[FurnitureSystem] Current products count:", productsList.length);

    let updatedList;
    if (productData.id) {
        updatedList = productsList.map((p: any) => p.id === productData.id ? { ...p, ...productData } : p);
    } else {
        updatedList = [...productsList, { 
            ...productData, 
            id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            createdAt: new Date().toISOString()
        }];
    }

    // Use the core updateMetadata for maximum reliability
    const success = await updateMetadata("products", "products", updatedList);
    if (success) {
        push({ title: "Catalog Updated", description: `${productData.name} saved.`, variant: "success" });
        setProductModalOpen(false);
        setEditingProduct(null);
    }
  }, [currentDashboard, updateMetadata, push]);

  const handlePurchaseRequest = useCallback(async (product: Product) => {
    if (!currentDashboard) {
        push({ title: "Erro de Sistema", description: "Painel ativo não encontrado.", variant: "destructive" });
        return;
    }
    
    // Intelligent Routing based on Assembly requirement
    const initialStatus = "Nova Solicitação";

    // 1. Create Lead Note
    await content.createNote(currentDashboard.id, {
        title: `Novo Orçamento: ${product.name}`,
        content: `Lead da Vitrine Pública.\nProduto: ${product.name}\nValor Ofertado: R$ ${product.price}\nMontagem: ${product.requiresAssembly ? "Sim" : "Não"}\nData: ${new Date().toLocaleString()}`,
        category: "lead"
    });

    // 2. Add to KDS (Orders)
    await handleOrderSubmit({
        clientName: "Lead da Vitrine",
        product: product.name,
        value: product.price,
        status: initialStatus,
        priority: "Média",
        paymentMethod: "A Definir",
        orderNumber: Math.floor(100000 + Math.random() * 900000).toString()
    });

    push({ 
        title: "Orçamento Criado", 
        description: `O pedido de orçamento foi enviado para o painel de vendas.`, 
        variant: "success" 
    });
  }, [currentDashboard, content, handleOrderSubmit, push]);

  const handleStaffSubmit = useCallback(async (staffData: any) => {
    if (!currentDashboard) {
        push({ title: "Erro de Sistema", description: "Painel ativo não encontrado.", variant: "destructive" });
        return;
    }
    const allTiles = currentDashboard.tiles || [];
    const staffTile = allTiles.find((t: any) => t.category === "staff");
    const currentMetadata = staffTile?.metadata || {};
    const staffList = currentMetadata.staff || (Array.isArray(currentMetadata) ? currentMetadata : []);
    
    let updatedList;
    if (staffData.id) {
        updatedList = staffList.map((s: any) => s.id === staffData.id ? { ...s, ...staffData } : s);
    } else {
        updatedList = [...staffList, { ...staffData, id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: new Date().toISOString() }];
    }
    const success = await updateMetadata("staff", "staff", updatedList);
    if (success) push({ title: "Staff Member Saved", variant: "success" });
  }, [currentDashboard, updateMetadata, push]);

  const handleSaveLayout = useCallback(async (sections: any[]) => {
    const success = await updateMetadata("store_layout", "sections", sections);
    if (success) push({ title: "Layout Persistido", description: "O mapeamento da loja foi salvo no banco de dados.", variant: "success" });
    return success;
  }, [updateMetadata, push]);

  return {
    orderModalOpen,
    setOrderModalOpen,
    editingOrder,
    setEditingOrder,
    productModalOpen,
    setProductModalOpen,
    editingProduct,
    setEditingProduct,
    storeViewMode,
    setStoreViewMode,
    isSaving,
    handleOrderSubmit,
    handleProductSubmit,
    handlePurchaseRequest,
    handleClientSubmit,
    handleStaffSubmit,
    handleSaveLayout,
    populateDefaults
  };
}

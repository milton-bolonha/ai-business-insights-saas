"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FurniturePublicStore } from "@/components/admin/ade/FurniturePublicStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

export default function PublicStorePage() {
    const { id } = useParams();
    const [workspace, setWorkspace] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        async function fetchStore() {
            try {
                // We'll use a public-safe API endpoint or just the existing one if it's open (it's not)
                // For now, let's assume we have a public route or we fetch via a specific public endpoint.
                // In this system, we can create a public endpoint in /api/public/v/[id]
                const res = await fetch(`/api/public/v/${id}`);
                console.log(`[PublicStore] API fetched for ID ${id}, status: ${res.status}`);
                if (!res.ok) throw new Error("Store not found or offline.");
                const data = await res.json();
                console.log(`[PublicStore] API data parsed:`, data);
                console.log(`[PublicStore] Tiles array length:`, data?.tiles?.length || 0);
                setWorkspace(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchStore();
    }, [id]);

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-white">
            <div className="text-center">
                <LoadingSpinner className="h-12 w-12 text-sky-600 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Virtual Store...</p>
            </div>
        </div>
    );

    if (error || !workspace) return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50 p-6 text-center">
            <div className="max-w-md">
                <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Oops! 🪑</h1>
                <p className="text-gray-500 font-medium mb-8">{error || "Store not found."}</p>
                <a href="/" className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest">Back to Home</a>
            </div>
        </div>
    );

    return (
        <main className="bg-white">
            <FurniturePublicStore 
                tiles={workspace.tiles || []} 
                onPurchaseRequest={async (product) => {
                    // Public purchase request
                    await fetch(`/api/public/v/${id}/request`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ product })
                    });
                }} 
            />
            
            {/* Footer Branding */}
            <footer className="py-20 bg-gray-950 text-center">
                <div className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">
                    Tecnologia por <span className="text-white">Furniture Logistics Engine</span>
                </div>
            </footer>
        </main>
    );
}


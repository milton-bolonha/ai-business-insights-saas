import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { X, ShoppingBag, Tag, Image as ImageIcon, Star, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/services/cloudinary";
import { useToast } from "@/lib/state/toast-context";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: string;
    name: string;
    price: number;
    description: string;
    category: string;
    isFeatured: boolean;
    requiresAssembly?: boolean;
    imageUrl?: string;
    location?: string;
    displayStatus?: "Na Caixa" | "Montado no Showroom";
  }) => void;
  initialData?: any;
}

export function AddProductModal({ open, onClose, onSubmit, initialData }: AddProductModalProps) {
  const { push } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [isFeatured, setIsFeatured] = useState(false);
  const [requiresAssembly, setRequiresAssembly] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [displayStatus, setDisplayStatus] = useState<"Na Caixa" | "Montado no Showroom">("Na Caixa");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setPrice(initialData.price || 0);
      setDescription(initialData.description || "");
      setCategory(initialData.category || "General");
      setIsFeatured(initialData.isFeatured || false);
      setRequiresAssembly(initialData.requiresAssembly ?? true);
      setImageUrl(initialData.imageUrl || "");
      setLocation(initialData.location || "");
      setDisplayStatus(initialData.displayStatus || "Na Caixa");
    }
  }, [initialData, open]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
      push({
        title: "Image Uploaded",
        description: "Your product image is ready.",
        variant: "success",
      });
    } catch (error: any) {
      console.warn("Cloudinary failed, falling back to Base64", error);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
          if (typeof reader.result === "string") {
              setImageUrl(reader.result);
              push({
                  title: "Imagem Adicionada (Modo Local)",
                  description: "A imagem foi salva no banco local.",
                  variant: "success",
              });
          }
      };
      reader.onerror = () => {
          push({
            title: "Erro no Upload",
            description: error.message || "Não foi possível carregar a imagem.",
            variant: "destructive",
          });
      };
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({
        id: initialData?.id,
        name: name.trim(),
        price,
        description: description.trim(),
        category: category.trim(),
        isFeatured,
        requiresAssembly,
        imageUrl: imageUrl.trim(),
        location: location.trim(),
        displayStatus,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setName("");
    setPrice(0);
    setDescription("");
    setCategory("General");
    setIsFeatured(false);
    setRequiresAssembly(true);
    setImageUrl("");
    setLocation("");
    setDisplayStatus("Na Caixa");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-w-xl w-full rounded-[2.5rem] bg-white p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-50 rounded-2xl">
                <ShoppingBag className="h-6 w-6 text-sky-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {initialData ? "Edit Product" : "New Store Product"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Product Name *
            </label>
            <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Luxury Velvet Sofa"
                    className="w-full rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-sky-100 transition-all font-sans"
                    required
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Price (R$)
                </label>
                <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-sky-100 transition-all"
                />
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Category
                </label>
                    <datalist id="category-list">
                        <option value="Sofás" />
                        <option value="Mesas" />
                        <option value="Cozinhas" />
                        <option value="Dormitórios" />
                        <option value="Poltronas" />
                        <option value="Decoração" />
                    </datalist>
                    <input
                        list="category-list"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Ex: Sofás, Testes..."
                        className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-sky-100 transition-all font-sans"
                    />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Short Description
            </label>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Technical details, material, colors..."
                rows={3}
                className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-sky-100 transition-all resize-none font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Localização na Loja/Estoque
                </label>
                <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ex: Expositor A1, Galpão Central..."
                        className="w-full rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-sky-100 transition-all font-sans"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Status Físico
                </label>
                <div className="flex gap-2">
                    {["Na Caixa", "Montado no Showroom"].map(st => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setDisplayStatus(st as any)}
                            className={cn(
                                "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                displayStatus === st 
                                    ? "bg-sky-600 border-sky-600 text-white shadow-lg"
                                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                            )}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <div className="space-y-4">
             <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Product Image
                </label>
                
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="Image URL or upload below..."
                            className="w-full rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-sky-100 transition-all"
                        />
                    </div>
                    
                    <div className="relative group">
                        <input 
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            disabled={uploading}
                        />
                        <button
                            type="button"
                            className={cn(
                                "h-full px-6 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                uploading ? "bg-gray-100 text-gray-400" : "bg-sky-600 text-white shadow-lg shadow-sky-100 hover:bg-sky-700"
                            )}
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {uploading ? "Uploading..." : "Upload"}
                        </button>
                    </div>
                </div>
             </div>
             
             <div>
                <button
                    type="button"
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                        isFeatured 
                            ? "bg-amber-100 border-amber-200 text-amber-700 shadow-inner" 
                            : "bg-white border-gray-100 text-gray-400 hover:border-amber-100"
                    )}
                >
                    <Star className={cn("h-4 w-4", isFeatured && "fill-amber-500")} />
                    Featured on Storefront
                </button>
             </div>
             
             <div>
                <button
                    type="button"
                    onClick={() => setRequiresAssembly(!requiresAssembly)}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                        requiresAssembly 
                            ? "bg-sky-50 border-sky-100 text-sky-700" 
                            : "bg-emerald-50 border-emerald-100 text-emerald-700"
                    )}
                >
                    <Upload className={cn("h-4 w-4", requiresAssembly && "animate-bounce")} />
                    {requiresAssembly ? "Needs Assembly Service" : "Already Assembled / Direct Delivery"}
                </button>
             </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-4 text-sm font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || uploading}
              className="px-10 py-4 bg-gray-900 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-black shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {initialData ? "Salvar Alterações" : "Adicionar à Loja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

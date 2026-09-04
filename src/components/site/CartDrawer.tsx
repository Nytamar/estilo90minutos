import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X, Tag } from "lucide-react";
import { useCart, type CartItem } from "@/hooks/useCart";
import { buildWhatsAppCartLink } from "@/lib/whatsapp";
import { validateCoupon, type Coupon } from "@/lib/coupons";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, updateQuantity, removeItem, total } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const discount = coupon ? total * (coupon.discount_percent / 100) : 0;
  const finalTotal = total - discount;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    setCouponError("");
    const found = await validateCoupon(couponInput);
    setCheckingCoupon(false);
    if (!found) {
      setCoupon(null);
      setCouponError("Cupom inválido ou expirado");
      return;
    }
    setCoupon(found);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Carrinho"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex justify-end bg-black/70"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-card flex h-full w-full max-w-md flex-col border-l border-border"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-xl">Seu carrinho</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Seu carrinho está vazio.</p>
            <Button asChild onClick={onClose}>
              <Link to="/catalogo">Ver catálogo</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto p-4">
              {items.map((item) => (
                <CartLine
                  key={`${item.productId}-${item.size}`}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </ul>

            <div className="space-y-3 border-t border-border p-4">
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cupom de desconto"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError("");
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={applyCoupon} disabled={checkingCoupon}>
                    Aplicar
                  </Button>
                </div>
                {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
                {coupon && (
                  <p className="mt-1 text-xs text-success">
                    Cupom {coupon.code} aplicado: -{coupon.discount_percent}%
                  </p>
                )}
              </div>

              {coupon ? (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Desconto</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-display text-xl text-primary">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display text-xl text-primary">{formatPrice(total)}</span>
                </div>
              )}

              <Button
                asChild
                size="lg"
                className="h-12 w-full bg-whatsapp text-base font-bold text-whatsapp-foreground hover:bg-whatsapp/90"
              >
                <a href={buildWhatsAppCartLink(items, coupon)} target="_blank" rel="noreferrer">
                  Fechar pedido no WhatsApp
                </a>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Frete e forma de pagamento são combinados no atendimento.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CartLine({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (productId: string, size: string, quantity: number) => void;
  onRemove: (productId: string, size: string) => void;
}) {
  return (
    <li className="flex gap-3">
      <img src={item.image} alt="" className="h-20 w-16 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">Tamanho {item.size}</p>
        {item.customization && (
          <p className="text-xs italic text-muted-foreground">
            {item.customization.name} / {item.customization.number}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => onUpdateQuantity(item.productId, item.size, item.quantity - 1)}
              className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-secondary"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-5 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => onUpdateQuantity(item.productId, item.size, item.quantity + 1)}
              className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-secondary"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-sm font-medium text-primary">
            {formatPrice(item.unitPrice * item.quantity)}
          </span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Remover item"
        onClick={() => onRemove(item.productId, item.size)}
        className="self-start text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

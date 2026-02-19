import { useCart } from '../context/CartContext'

interface Props {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  available?: boolean
}

function formatPrice(price: number): string {
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`
}

export default function MenuItemCard({ id, name, description, price, imageUrl, available = true }: Props) {
  const { items, addItem, updateQuantity } = useCart()
  const cartItem = items.find((i) => i.id === id)
  const quantity = cartItem?.quantity ?? 0

  return (
    <div
      className={`flex gap-4 p-4 bg-white rounded-2xl shadow-warm transition-all duration-200${
        !available ? ' opacity-40' : ' hover:shadow-warm-lg'
      }`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-[15px] text-charcoal leading-tight">{name}</h3>
            {!available && (
              <span className="inline-block mt-1 text-xs text-charcoal-light/70 font-medium">
                Unavailable
              </span>
            )}
          </div>
          <span className="text-[15px] font-bold text-bronze whitespace-nowrap">
            {formatPrice(price)}
          </span>
        </div>
        {description && (
          <p className="text-charcoal-light/60 mt-1.5 text-[13px] leading-relaxed line-clamp-2">{description}</p>
        )}
        {available && (
          <div className="mt-auto pt-3">
            {quantity === 0 ? (
              <button
                onClick={() => addItem({ id, name, price })}
                className="h-9 bg-charcoal text-white px-5 rounded-full text-sm font-medium hover:bg-charcoal-light active:scale-95 transition-all"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(id, quantity - 1)}
                  className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full bg-surface-warm hover:bg-bronze/10 active:bg-bronze/20 flex items-center justify-center text-lg font-medium text-charcoal transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-[15px] text-charcoal">{quantity}</span>
                <button
                  onClick={() => updateQuantity(id, quantity + 1)}
                  className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full bg-charcoal hover:bg-charcoal-light text-white flex items-center justify-center text-lg font-medium transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useCart } from '../context/CartContext'

interface Props {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
}

function formatPrice(price: number): string {
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`
}

export default function MenuItemCard({ id, name, description, price, imageUrl }: Props) {
  const { items, addItem, updateQuantity } = useCart()
  const cartItem = items.find((i) => i.id === id)
  const quantity = cartItem?.quantity ?? 0

  return (
    <div className="flex gap-3 p-3 bg-white rounded-xl shadow-sm">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-base leading-tight">{name}</h3>
          <span className="text-base font-bold text-green-600 whitespace-nowrap">
            {formatPrice(price)}
          </span>
        </div>
        {description && (
          <p className="text-gray-500 mt-1 text-sm leading-snug line-clamp-2">{description}</p>
        )}
        <div className="mt-auto pt-2">
          {quantity === 0 ? (
            <button
              onClick={() => addItem({ id, name, price })}
              className="h-9 min-w-[44px] bg-green-600 text-white px-4 rounded-full text-sm font-medium hover:bg-green-700 active:scale-95 transition-all"
            >
              + Add
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateQuantity(id, quantity - 1)}
                className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-lg font-medium transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold text-base">{quantity}</span>
              <button
                onClick={() => updateQuantity(id, quantity + 1)}
                className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white flex items-center justify-center text-lg font-medium transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

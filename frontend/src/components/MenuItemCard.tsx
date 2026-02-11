interface Props {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  onAddToCart?: (item: { id: number; name: string; price: number }) => void
}

export default function MenuItemCard({ id, name, description, price, imageUrl, onAddToCart }: Props) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg shadow">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      )}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{name}</h3>
          <span className="text-lg font-bold text-green-600">
            ${price.toFixed(2)}
          </span>
        </div>
        {description && (
          <p className="text-gray-600 mt-1 text-sm">{description}</p>
        )}
        {onAddToCart && (
          <button
            onClick={() => onAddToCart({ id, name, price })}
            className="mt-2 bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
          >
            + Add
          </button>
        )}
      </div>
    </div>
  )
}

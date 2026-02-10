import MenuItemCard from './MenuItemCard'

interface Item {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
}

interface Props {
  name: string
  items: Item[]
}

export default function CategorySection({ name, items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b">{name}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            imageUrl={item.imageUrl}
          />
        ))}
      </div>
    </section>
  )
}

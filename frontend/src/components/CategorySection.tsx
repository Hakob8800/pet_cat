import MenuItemCard from './MenuItemCard'

interface Item {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  available?: boolean
}

interface Props {
  categoryId: number
  name: string
  items: Item[]
}

export default function CategorySection({ categoryId, name, items }: Props) {
  if (items.length === 0) return null

  return (
    <section id={`category-${categoryId}`} className="mb-8 scroll-mt-28">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b">{name}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            imageUrl={item.imageUrl}
            available={item.available}
          />
        ))}
      </div>
    </section>
  )
}

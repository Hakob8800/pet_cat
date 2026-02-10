import { QRCodeSVG } from 'qrcode.react'

interface Props {
  slug: string
}

export default function QRCodeGenerator({ slug }: Props) {
  const menuUrl = `${window.location.origin}/menu/${slug}`

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow">
      <QRCodeSVG value={menuUrl} size={200} />
      <p className="mt-3 text-sm text-gray-600 break-all text-center">{menuUrl}</p>
    </div>
  )
}

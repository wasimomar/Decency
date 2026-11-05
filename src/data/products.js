// Static placeholder data, shown only if the products API returns nothing.
// Components only depend on these shapes (nameAr / nameEn are picked by language).

export const products = [
  { id: 1, nameAr: 'إسدال الصلاة الكريمي', nameEn: 'Cream Prayer Dress', price: 749, rating: 4.9, reviews: 128, isBestSeller: true, image: '/images/cat-isdal.jpg' },
  { id: 2, nameAr: 'سجادة صلاة مطرزة', nameEn: 'Embroidered Prayer Mat', price: 420, rating: 4.8, reviews: 96, isBestSeller: true, image: '/images/cat-mats.jpg' },
  { id: 3, nameAr: 'طقم صلاة للأطفال', nameEn: "Kids' Prayer Set", price: 590, rating: 4.9, reviews: 74, isBestSeller: true, image: '/images/cat-kids.jpg' },
  { id: 4, nameAr: 'طقم الهدية الزيتوني', nameEn: 'Olive Gift Set', price: 1190, rating: 5.0, reviews: 52, isBestSeller: true, image: '/images/cat-gifts.jpg' },
  { id: 5, nameAr: 'إسدال بيج بوشاح', nameEn: 'Beige Prayer Dress with Scarf', price: 820, rating: 4.7, reviews: 63, isBestSeller: true, image: '/images/cat-isdal.jpg' },
  { id: 6, nameAr: 'سجادة صلاة سادة', nameEn: 'Plain Prayer Mat', price: 360, rating: 4.8, reviews: 88, isBestSeller: true, image: '/images/cat-mats.jpg' },
]

export const formatPrice = (n, lang = 'ar') => {
  const value = Number(n || 0)
  return lang === 'en'
    ? `${value.toLocaleString('en-US')} EGP`
    : `${value.toLocaleString('ar-EG')} ج.م`
}

// Default WhatsApp number for receiving orders (international format without '+' or '00').
export const DEFAULT_WHATSAPP_PHONE =
  import.meta.env.VITE_WHATSAPP_PHONE || '201023910875'

export const getStoreWhatsappPhone = () => {
  try {
    const saved = localStorage.getItem('decency_whatsapp_phone')
    if (saved && saved.trim() && saved.replace(/\D/g, '') !== '201000000000') {
      return saved.replace(/\D/g, '')
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_WHATSAPP_PHONE.replace(/\D/g, '')
}

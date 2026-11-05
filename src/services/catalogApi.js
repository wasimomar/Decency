// Catalog API service: all category, subcategory, and product network calls live here.
import imageCompression from 'browser-image-compression'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://decency-phi.vercel.app'

export const ADMIN_AUTH_STORAGE_KEY = 'decency_admin_auth_v1'
const DEFAULT_TOKEN_TTL_SECONDS = 604800 // 7 days (1 week)

export function getAdminAuthSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token.trim()) {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
      return null
    }
    if (parsed.expiresAt && Number(parsed.expiresAt) <= Date.now()) {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
      return null
    }
    return {
      token: parsed.token.trim(),
      tokenType: parsed.tokenType || 'Bearer',
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}

export function hasValidAdminSession() {
  return Boolean(getAdminAuthSession()?.token)
}

export function saveAdminAuthSession({
  token,
  tokenType = 'Bearer',
  expiresIn = DEFAULT_TOKEN_TTL_SECONDS,
}) {
  if (typeof window === 'undefined' || !token) return null
  const ttlSeconds = Number(expiresIn) > 0 ? Number(expiresIn) : DEFAULT_TOKEN_TTL_SECONDS
  const session = {
    token: String(token).trim(),
    tokenType: tokenType || 'Bearer',
    expiresAt: Date.now() + ttlSeconds * 1000,
  }
  try {
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore storage quota errors
  }
  return session
}

export function clearAdminAuthSession() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

export async function loginAdmin(password) {
  let res
  try {
    res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })
  } catch {
    throw new Error('تعذّر الاتصال بالخادم. تحقّق من اتصال الإنترنت وحاول مرة أخرى.')
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    // Non-JSON response
  }

  if (!res.ok || json?.success === false || !json?.token) {
    if (res.status === 401 || res.status === 400 || res.status === 403) {
      throw new Error('كلمة المرور غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.')
    }
    throw new Error(
      json?.message || 'كلمة المرور غير صحيحة أو تعذّر تسجيل الدخول. حاول مرة أخرى.',
    )
  }

  return saveAdminAuthSession({
    token: json.token,
    tokenType: json.tokenType || 'Bearer',
    expiresIn: json.expiresIn || DEFAULT_TOKEN_TTL_SECONDS,
  })
}

export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 KB'
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
  return `${(bytes / 1024).toFixed(1)} KB`
}

// Compress image files on the client before sending to the backend (Vercel -> Cloudinary).
export async function compressImageFile(file, options = {}) {
  if (!file || typeof Blob === 'undefined' || !(file instanceof Blob)) {
    return file
  }
  if (file.__compressed) {
    return file
  }

  const originalSize = file.size
  const baseName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image'

  const compressionOptions = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
    ...options,
  }

  let compressedBlob
  try {
    compressedBlob = await imageCompression(file, compressionOptions)
  } catch {
    try {
      compressedBlob = await imageCompression(file, {
        ...compressionOptions,
        useWebWorker: false,
      })
    } catch {
      return file
    }
  }

  const finalType = compressedBlob.type || 'image/webp'
  const ext = finalType.split('/')[1] || 'webp'
  const finalFile = new File([compressedBlob], `${baseName}.${ext}`, {
    type: finalType,
    lastModified: Date.now(),
  })

  Object.defineProperty(finalFile, '__compressed', {
    value: true,
    enumerable: false,
  })
  Object.defineProperty(finalFile, '__originalSize', {
    value: originalSize,
    enumerable: false,
  })

  return finalFile
}

// Drive "view" links can't be used in <img>; convert to a direct thumbnail URL.
export function resolveImageUrl(url, width = 800) {
  if (!url) return ''
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/) || url.match(/[?&]id=([^&]+)/)
  return m && url.includes('drive.google.com')
    ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${width}`
    : url
}

// Names are a plain string or {ar, en}.
export const toName = (n) => (typeof n === 'string' ? n : (n?.ar || n?.en || ''))

export const getNames = (n, enFallback = '') => {
  if (!n) return { ar: '', en: enFallback || '' }
  if (typeof n === 'string') return { ar: n, en: enFallback || '' }
  return { ar: n.ar || '', en: n.en || enFallback || '' }
}

export const normalizeCategory = (c, enItem = null) => {
  const resolved = resolveImageUrl(c.image)
  const enFallback = typeof enItem?.name === 'string' ? enItem.name : (enItem?.name?.en || '')
  const names = getNames(c.name, enFallback)
  return {
    id: c.id ?? c._id,
    title: names.ar || names.en || '',
    nameAr: names.ar,
    nameEn: names.en,
    rawName: c.name,
    rawImage: c.image || '',
    image: resolved,
    imageUrl: resolved,
  }
}

export const normalizeSubcategory = (s, enItem = null) => {
  const resolved = resolveImageUrl(s.image, 400)
  const enFallback = typeof enItem?.name === 'string' ? enItem.name : (enItem?.name?.en || '')
  const names = getNames(s.name, enFallback)
  return {
    id: s._id ?? s.id,
    categoryId: typeof s.category === 'object' ? (s.category?._id || s.category?.id) : s.category,
    categoryName: typeof s.category === 'object' ? toName(s.category?.name) : '',
    slug: s.slug || '',
    title: names.ar || names.en || '',
    nameAr: names.ar,
    nameEn: names.en,
    rawName: s.name,
    rawImage: s.image || '',
    image: resolved,
    imageUrl: resolved,
  }
}

export const normalizeProduct = (p, enItem = null) => {
  const rawImages = Array.isArray(p.images)
    ? p.images.filter(Boolean)
    : p.image
      ? [p.image]
      : []
  const images = rawImages.map((u) => resolveImageUrl(u, 800))

  const enNameFallback = typeof enItem?.name === 'string' ? enItem.name : (enItem?.name?.en || '')
  const enDescFallback =
    typeof enItem?.description === 'string' ? enItem.description : (enItem?.description?.en || '')

  const names = getNames(p.name, enNameFallback)
  const descs = getNames(p.description, enDescFallback)

  return {
    id: p._id ?? p.id,
    title: names.ar || names.en || '',
    nameAr: names.ar,
    nameEn: names.en,
    description: descs.ar || descs.en || '',
    descriptionAr: descs.ar,
    descriptionEn: descs.en,
    slug: p.slug || '',
    price: Number(p.price) || 0,
    isBestSeller: Boolean(p.isBestSeller),
    categoryId:
      typeof p.category === 'object' && p.category !== null
        ? p.category._id || p.category.id || ''
        : p.category || '',
    subcategoryId:
      typeof p.subcategory === 'object' && p.subcategory !== null
        ? p.subcategory._id || p.subcategory.id || ''
        : p.subcategory || '',
    rawImages,
    images,
    image: images[0] || '',
    imageUrl: images[0] || '',
  }
}

// Error messages are shown to shoppers, so they follow the language chosen in the storefront.
const currentLang = () => {
  try {
    return localStorage.getItem('decency_lang') === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}
const localizedMessage = (ar, en) => (currentLang() === 'en' ? en : ar)

async function request(path, { method = 'GET', body, signal } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = { Accept: 'application/json' }
  if (body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  if (method !== 'GET') {
    const session = getAdminAuthSession()
    if (session?.token) {
      headers.Authorization = `${session.tokenType || 'Bearer'} ${session.token}`
    }
  }
  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error(
      localizedMessage(
        'تعذّر الاتصال بالخادم. تحقّقي من الإنترنت وحاولي مرة أخرى.',
        'Could not reach the server. Please check your internet connection and try again.',
      ),
    )
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    // Non-JSON response
  }

  if (!res.ok || json?.success === false) {
    if (method !== 'GET' && (res.status === 401 || res.status === 403)) {
      clearAdminAuthSession()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('decency-admin-unauthorized'))
      }
      throw new Error('انتهت صلاحية الجلسة أو غير مصرح بالعملية. يرجى تسجيل الدخول مرة أخرى.')
    }
    const errorMsg =
      json?.message || localizedMessage(`فشلت العملية (${res.status})`, `Request failed (${res.status})`)
    throw new Error(errorMsg)
  }

  return json?.data !== undefined ? json.data : (json ?? [])
}

// Upload an image file to the backend (which uploads it to Cloudinary) and return its URL.
export async function uploadImage(file) {
  const compressedFile = await compressImageFile(file)
  const formData = new FormData()
  formData.append('image', compressedFile)
  const result = await request('/upload', { method: 'POST', body: formData })
  const url = result?.imageUrl || result?.url || result?.image || (typeof result === 'string' ? result : '')
  if (!url) {
    throw new Error('لم يتم استلام رابط الصورة من الخادم بعد الرفع.')
  }
  return url
}

// Small in-memory cache so components can share results.
const cache = new Map()

export function clearCache() {
  cache.clear()
}

function cached(key, load) {
  if (!cache.has(key)) {
    cache.set(
      key,
      load().catch((err) => {
        cache.delete(key) // allow retry after failure
        throw err
      }),
    )
  }
  return cache.get(key)
}

// ================= Categories API =================

export const getCategories = (forceRefresh = false) => {
  if (forceRefresh) cache.delete('categories')
  return cached('categories', async () => {
    const [arList, enList] = await Promise.all([
      request('/categories'),
      request('/categories?lang=en').catch(() => []),
    ])
    const enMap = new Map(
      (Array.isArray(enList) ? enList : []).map((item) => [item.id ?? item._id, item]),
    )
    return (Array.isArray(arList) ? arList : []).map((c) =>
      normalizeCategory(c, enMap.get(c.id ?? c._id)),
    )
  })
}

export const createCategory = async ({ name, image, imageFile }) => {
  const nameObj = {
    ar: (typeof name === 'object' ? name.ar : name) || '',
    en: (typeof name === 'object' ? name.en : '') || (typeof name === 'string' ? name : 'Category'),
  }

  let body
  if (typeof File !== 'undefined' && imageFile instanceof File) {
    const compressedFile = await compressImageFile(imageFile)
    const formData = new FormData()
    formData.append('name', JSON.stringify(nameObj))
    formData.append('image', compressedFile)
    body = formData
  } else {
    body = {
      name: nameObj,
      image: image || '',
    }
  }

  const result = await request('/categories', { method: 'POST', body })
  clearCache()
  return normalizeCategory(result)
}

export const updateCategory = async (id, { name, image, imageFile }) => {
  const nameObj = {
    ar: (typeof name === 'object' ? name.ar : name) || '',
    en: (typeof name === 'object' ? name.en : '') || (typeof name === 'string' ? name : 'Category'),
  }

  let finalImage = image || ''
  if (typeof File !== 'undefined' && imageFile instanceof File) {
    finalImage = await uploadImage(imageFile)
  }

  const payload = {
    name: nameObj,
    image: finalImage,
  }
  const result = await request(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: payload })
  clearCache()
  return normalizeCategory(result)
}

export const deleteCategory = async (id) => {
  const result = await request(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
  clearCache()
  return result
}

// ================= Subcategories API =================

export const getSubcategories = (forceRefresh = false) => {
  if (forceRefresh) cache.delete('subcategories')
  return cached('subcategories', async () => {
    const [arList, enList] = await Promise.all([
      request('/subcategories'),
      request('/subcategories?lang=en').catch(() => []),
    ])
    const enMap = new Map(
      (Array.isArray(enList) ? enList : []).map((item) => [item._id ?? item.id, item]),
    )
    return (Array.isArray(arList) ? arList : []).map((s) =>
      normalizeSubcategory(s, enMap.get(s._id ?? s.id)),
    )
  })
}

// The backend localizes `name` / `description` according to `?lang=`, so every list that is shown
// to shoppers is fetched in both languages and merged (Arabic is the base, English fills `nameEn`).
async function requestBilingualList(path) {
  const sep = path.includes('?') ? '&' : '?'
  const [arList, enList] = await Promise.all([
    request(path),
    request(`${path}${sep}lang=en`).catch(() => []),
  ])
  const enMap = new Map(
    (Array.isArray(enList) ? enList : []).map((item) => [item._id ?? item.id, item]),
  )
  return {
    list: Array.isArray(arList) ? arList : [],
    enOf: (item) => enMap.get(item._id ?? item.id),
  }
}

export const getSubcategoriesByCategory = (categoryId, forceRefresh = false) => {
  const key = `subcategories:${categoryId}`
  if (forceRefresh) cache.delete(key)
  return cached(key, async () => {
    const { list, enOf } = await requestBilingualList(
      `/subcategories/category/${encodeURIComponent(categoryId)}`,
    )
    return list.map((s) => normalizeSubcategory(s, enOf(s)))
  })
}

export const createSubcategory = async ({ name, category, image, imageFile }) => {
  const nameObj = {
    ar: (typeof name === 'object' ? name.ar : name) || '',
    en: (typeof name === 'object' ? name.en : '') || (typeof name === 'string' ? name : 'Subcategory'),
  }

  let body
  if (typeof File !== 'undefined' && imageFile instanceof File) {
    const compressedFile = await compressImageFile(imageFile)
    const formData = new FormData()
    formData.append('name[ar]', nameObj.ar)
    formData.append('name[en]', nameObj.en)
    formData.append('category', category)
    formData.append('image', compressedFile)
    body = formData
  } else {
    body = {
      name: nameObj,
      category,
      image: image || '',
    }
  }

  const result = await request('/subcategories', { method: 'POST', body })
  clearCache()
  return normalizeSubcategory(result)
}

export const updateSubcategory = async (id, { name, category, image, imageFile }) => {
  const nameObj = {
    ar: (typeof name === 'object' ? name.ar : name) || '',
    en: (typeof name === 'object' ? name.en : '') || (typeof name === 'string' ? name : 'Subcategory'),
  }

  let finalImage = image || ''
  if (typeof File !== 'undefined' && imageFile instanceof File) {
    finalImage = await uploadImage(imageFile)
  }

  const payload = {
    name: nameObj,
    category,
    image: finalImage,
  }
  const result = await request(`/subcategories/${encodeURIComponent(id)}`, { method: 'PUT', body: payload })
  clearCache()
  return normalizeSubcategory(result)
}

export const deleteSubcategory = async (id) => {
  const result = await request(`/subcategories/${encodeURIComponent(id)}`, { method: 'DELETE' })
  clearCache()
  return result
}

// ================= Products API =================

export const getProducts = (forceRefresh = false) => {
  if (forceRefresh) cache.delete('products')
  return cached('products', async () => {
    const [arList, enList] = await Promise.all([
      request('/products'),
      request('/products?lang=en').catch(() => []),
    ])
    const enMap = new Map(
      (Array.isArray(enList) ? enList : []).map((item) => [item._id ?? item.id, item]),
    )
    return (Array.isArray(arList) ? arList : []).map((p) =>
      normalizeProduct(p, enMap.get(p._id ?? p.id)),
    )
  })
}

export const getProductById = (id, forceRefresh = false) => {
  const key = `product:${id}`
  if (forceRefresh) cache.delete(key)
  return cached(key, async () => {
    const [arItem, enItem] = await Promise.all([
      request(`/products/${encodeURIComponent(id)}`),
      request(`/products/${encodeURIComponent(id)}?lang=en`).catch(() => null),
    ])
    return normalizeProduct(arItem, enItem)
  })
}

export const getProductsByCategory = (categoryId, forceRefresh = false) => {
  const key = `products:category:${categoryId}`
  if (forceRefresh) cache.delete(key)
  return cached(key, async () => {
    const { list, enOf } = await requestBilingualList(
      `/products/category/${encodeURIComponent(categoryId)}`,
    )
    return list.map((p) => normalizeProduct(p, enOf(p)))
  })
}

export const getProductsBySubcategory = (subcategoryId, forceRefresh = false) => {
  const key = `products:subcategory:${subcategoryId}`
  if (forceRefresh) cache.delete(key)
  return cached(key, async () => {
    const { list, enOf } = await requestBilingualList(
      `/products/subcategory/${encodeURIComponent(subcategoryId)}`,
    )
    return list.map((p) => normalizeProduct(p, enOf(p)))
  })
}

export const createProduct = async ({
  name,
  description,
  price,
  category,
  subcategory,
  isBestSeller = false,
  images = [],
  imageFiles = [],
}) => {
  const nameObj = {
    ar: (typeof name === 'object' ? name.ar : name) || '',
    en: (typeof name === 'object' ? name.en : '') || (typeof name === 'string' ? name : 'Product'),
  }
  const descObj = {
    ar: (typeof description === 'object' ? description.ar : description) || '',
    en:
      (typeof description === 'object' ? description.en : '') ||
      (typeof description === 'string' ? description : nameObj.en),
  }

  const validFiles = (Array.isArray(imageFiles) ? imageFiles : []).filter(
    (f) => typeof File !== 'undefined' && f instanceof File,
  )
  const uploadedUrls =
    validFiles.length > 0 ? await Promise.all(validFiles.map((file) => uploadImage(file))) : []

  const finalImages = [...(Array.isArray(images) ? images.filter(Boolean) : []), ...uploadedUrls]

  const payload = {
    name: nameObj,
    description: descObj,
    price: Number(price) || 0,
    isBestSeller: Boolean(isBestSeller),
    ...(category ? { category } : {}),
    subcategory: subcategory || null,
    images: finalImages,
  }

  const result = await request('/products', { method: 'POST', body: payload })
  clearCache()
  return normalizeProduct(result)
}

export const updateProduct = async (
  id,
  { name, description, price, category, subcategory, isBestSeller = false, images = [], imageFiles = [] },
) => {
  const nameObj = {
    ar: (typeof name === 'object' ? name.ar : name) || '',
    en: (typeof name === 'object' ? name.en : '') || (typeof name === 'string' ? name : 'Product'),
  }
  const descObj = {
    ar: (typeof description === 'object' ? description.ar : description) || '',
    en:
      (typeof description === 'object' ? description.en : '') ||
      (typeof description === 'string' ? description : nameObj.en),
  }

  const validFiles = (Array.isArray(imageFiles) ? imageFiles : []).filter(
    (f) => typeof File !== 'undefined' && f instanceof File,
  )
  const uploadedUrls =
    validFiles.length > 0 ? await Promise.all(validFiles.map((file) => uploadImage(file))) : []

  const finalImages = [...(Array.isArray(images) ? images.filter(Boolean) : []), ...uploadedUrls]

  const payload = {
    name: nameObj,
    description: descObj,
    price: Number(price) || 0,
    isBestSeller: Boolean(isBestSeller),
    ...(category ? { category } : {}),
    subcategory: subcategory || null,
    images: finalImages,
  }

  const result = await request(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
  })
  clearCache()
  return normalizeProduct(result)
}

export const deleteProduct = async (id) => {
  const result = await request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
  clearCache()
  return result
}

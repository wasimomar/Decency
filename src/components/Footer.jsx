import {
  BagIcon,
  FacebookIcon,
  InstagramIcon,
  ShopIcon,
  StarOutlineIcon,
  WhatsappIcon,
} from './Icons.jsx'
import Logo from './Logo.jsx'
import { getStoreWhatsappPhone } from '../data/products.js'
import { useLanguage } from '../i18n/useLanguage.js'

export function Footer() {
  const { t } = useLanguage()
  const social = [
    {
      label: t('social.instagram'),
      Icon: InstagramIcon,
      href: 'https://www.instagram.com/decency55688?mdxt=MXUxYnFmYXViczh4ag==',
    },
    {
      label: t('social.facebook'),
      Icon: FacebookIcon,
      href: 'https://www.facebook.com/share/19oVZAW6Dj/',
    },
    {
      label: t('social.whatsapp'),
      Icon: WhatsappIcon,
      href: 'https://wa.me/201066324076',
    },
  ]
  return (
    <footer id="contact-footer" className="mt-16 scroll-mt-20 border-t border-sand bg-cream-deep pb-24 sm:mt-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-8 md:grid-cols-2">
        <div>
          <Logo className="!items-start" />
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
            {t('footer.tagline')}
          </p>
          <div className="mt-5 flex gap-2">
            {social.map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={label}
                className="grid size-10 place-items-center rounded-full border border-sand-dark text-olive transition hover:bg-olive hover:text-cream"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-olive">{t('footer.contact')}</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ink/75">
            <li>{t('footer.city')}</li>
            <li>
              <a
                href="https://wa.me/201066324076"
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="inline-block hover:text-olive"
              >
                +20 106 632 4076
              </a>
            </li>
            <li>
              <a
                href="https://www.decency-fashion.com"
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="inline-block hover:text-olive"
              >
                https://www.decency-fashion.com
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

export function BottomNav({
  cartCount,
  onOpenCart,
  onNavigateHome,
  onNavigateBestSellers,
}) {
  const { t, formatNumber } = useLanguage()

  const handleContactClick = () => {
    const phone = getStoreWhatsappPhone()
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer')
  }

  const items = [
    { id: 'shop', label: t('nav.shop'), Icon: ShopIcon, active: true, onClick: onNavigateHome },
    {
      id: 'bestsellers',
      label: t('nav.best'),
      Icon: StarOutlineIcon,
      onClick: onNavigateBestSellers,
    },
    { id: 'cart', label: t('nav.cart'), Icon: BagIcon, badge: cartCount, onClick: onOpenCart },
    { id: 'contact', label: t('nav.contact'), Icon: WhatsappIcon, onClick: handleContactClick },
  ]
  return (
    <nav aria-label={t('nav.aria')} className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-cream/95 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-4">
        {items.map(({ id, label, Icon, active, badge, onClick }) => (
          <li key={id}>
            <button
              type="button"
              onClick={onClick}
              aria-current={active ? 'page' : undefined}
              className={`relative flex w-full flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium ${active ? 'text-olive' : 'text-muted'}`}
            >
              <span className="relative">
                <Icon width={22} height={22} />
                {badge > 0 && (
                  <span className="absolute -end-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-olive px-1 text-[0.6rem] leading-4 text-cream">
                    {formatNumber(badge)}
                  </span>
                )}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

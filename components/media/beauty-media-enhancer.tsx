"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const HERO_PARTS = [
  "/generated/hero-01.b64",
  "/generated/hero-02.b64",
  "/generated/hero-03.b64",
]

const SPRITE_PARTS = [
  "/generated/sprite-01.b64",
  "/generated/sprite-02.b64",
  "/generated/sprite-03.b64",
  "/generated/sprite-04.b64",
  "/generated/sprite-05.b64",
  "/generated/sprite-06.b64",
]

const SPRITE_REPAIR = { part: 1, offset: 2906, value: "i" } as const

type BeautyMedia = {
  hero: string
  tiles: string[]
}

let mediaPromise: Promise<BeautyMedia> | undefined

async function readParts(paths: string[]) {
  const responses = await Promise.all(paths.map((path) => fetch(path, { cache: "force-cache" })))
  responses.forEach((response) => {
    if (!response.ok) throw new Error(`Unable to load generated media: ${response.url}`)
  })
  return (await Promise.all(responses.map((response) => response.text()))).map((part) => part.trim())
}

function repairSpriteParts(parts: string[]) {
  const repaired = [...parts]
  const source = repaired[SPRITE_REPAIR.part]
  repaired[SPRITE_REPAIR.part] =
    source.slice(0, SPRITE_REPAIR.offset) + SPRITE_REPAIR.value + source.slice(SPRITE_REPAIR.offset)
  return repaired
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = "async"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Unable to decode generated beauty image"))
    image.src = source
  })
}

async function cutSprite(source: string) {
  const image = await loadImage(source)
  const sourceWidth = image.naturalWidth / 3
  const sourceHeight = image.naturalHeight / 3

  return Array.from({ length: 9 }, (_, index) => {
    const canvas = document.createElement("canvas")
    canvas.width = 500
    canvas.height = 375
    const context = canvas.getContext("2d")
    if (!context) return source

    const column = index % 3
    const row = Math.floor(index / 3)
    context.drawImage(
      image,
      column * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    return canvas.toDataURL("image/webp", 0.82)
  })
}

function getBeautyMedia() {
  if (!mediaPromise) {
    mediaPromise = Promise.all([readParts(HERO_PARTS), readParts(SPRITE_PARTS)]).then(
      async ([heroParts, spriteParts]) => {
        const heroBase64 = heroParts.join("")
        const spriteBase64 = repairSpriteParts(spriteParts).join("")
        const hero = `data:image/webp;base64,${heroBase64}`
        const sprite = `data:image/webp;base64,${spriteBase64}`
        const tiles = await cutSprite(sprite)
        return { hero, tiles }
      },
    )
  }

  return mediaPromise
}

function routeName(pathname: string) {
  if (pathname === "/") return "home"
  if (pathname.startsWith("/salons/")) return "salon-detail"
  if (pathname.startsWith("/salons")) return "salons"
  if (pathname.startsWith("/categories")) return "categories"
  if (pathname.startsWith("/offers")) return "offers"
  if (pathname.startsWith("/blog")) return "blog"
  if (pathname.startsWith("/about")) return "about"
  if (pathname.startsWith("/salon-register")) return "salon-register"
  return "default"
}

function replaceRemoteImages(tiles: string[]) {
  const images = Array.from(document.querySelectorAll<HTMLImageElement>("main img"))
  let imageIndex = 0

  images.forEach((image) => {
    if (image.dataset.generatedBeauty === "true") return

    const source = image.getAttribute("src") ?? ""
    const parentIsAvatar = image.parentElement?.className.includes("rounded-full")
    const imageIsAvatar = image.className.includes("rounded-full")
    const isRemoteSalonImage =
      source.includes("images.unsplash.com") || source.includes("source.unsplash.com")

    if (!isRemoteSalonImage || parentIsAvatar || imageIsAvatar) return

    image.src = tiles[imageIndex % tiles.length]
    image.removeAttribute("srcset")
    image.removeAttribute("sizes")
    image.loading = imageIndex < 2 ? "eager" : "lazy"
    image.decoding = "async"
    image.dataset.generatedBeauty = "true"
    image.classList.add("beauty-generated-image")
    imageIndex += 1
  })
}

function decorateServiceCards(tiles: string[]) {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>('a[href*="/salons?service="]'),
  )

  cards.forEach((card, index) => {
    if (card.dataset.generatedBeauty === "true") return
    card.dataset.generatedBeauty = "true"
    card.classList.add("beauty-service-card")
    card.style.setProperty("--beauty-card-image", `url("${tiles[(index + 1) % tiles.length]}")`)
  })
}

function decoratePage(pathname: string, media: BeautyMedia) {
  document.body.dataset.beautyRoute = routeName(pathname)
  document.documentElement.style.setProperty("--beauty-hero-image", `url("${media.hero}")`)
  media.tiles.forEach((tile, index) => {
    document.documentElement.style.setProperty(`--beauty-tile-${index}`, `url("${tile}")`)
  })

  const heroRoutes = new Set([
    "home",
    "salons",
    "categories",
    "offers",
    "blog",
    "about",
    "salon-register",
  ])
  const currentRoute = routeName(pathname)
  const firstSection = document.querySelector<HTMLElement>("main > section:first-of-type")

  document.querySelectorAll(".beauty-page-hero").forEach((element) => {
    element.classList.remove("beauty-page-hero")
  })

  if (firstSection && heroRoutes.has(currentRoute)) {
    firstSection.classList.add("beauty-page-hero")
    firstSection.style.setProperty(
      "--beauty-section-image",
      currentRoute === "home" ? `url("${media.hero}")` : `url("${media.tiles[8]}")`,
    )
  }

  replaceRemoteImages(media.tiles)
  if (currentRoute === "home" || currentRoute === "categories") {
    decorateServiceCards(media.tiles)
  }
}

export function BeautyMediaEnhancer() {
  const pathname = usePathname()

  useEffect(() => {
    let disposed = false
    let observer: MutationObserver | undefined
    let scheduled = false

    getBeautyMedia()
      .then((media) => {
        if (disposed) return

        const enhance = () => {
          if (scheduled) return
          scheduled = true
          window.requestAnimationFrame(() => {
            decoratePage(pathname, media)
            scheduled = false
          })
        }

        enhance()
        observer = new MutationObserver(enhance)
        observer.observe(document.body, { childList: true, subtree: true })
        window.setTimeout(enhance, 250)
        window.setTimeout(enhance, 900)
      })
      .catch((error: unknown) => {
        console.error("Generated beauty media could not be initialized", error)
      })

    return () => {
      disposed = true
      observer?.disconnect()
    }
  }, [pathname])

  return null
}

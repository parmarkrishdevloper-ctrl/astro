Drop these images here so they appear at the matching URL paths:

  /Users/parthsavajadiya/Desktop/astrology-software/client/public/
  ├── ganesh.png           -> served at /ganesh.png         (boot loader + GaneshLoader)
  └── hemraj-laddha.jpg    -> served at /hemraj-laddha.jpg  (sidebar avatar)

Recommended specs:
  ganesh.png         -> 512×512, square, transparent background works best
                        (PNG / JPG both fine; if you use JPG, rename to ganesh.jpg
                         and update the references in:
                         - client/index.html         (line with src="/ganesh.png")
                         - client/src/components/ui/GaneshLoader.tsx (img src)

  hemraj-laddha.jpg  -> roughly square, any size >= 200×200, JPG/PNG

If ganesh.png is missing, the loader automatically falls back to a styled
"ॐ" (Om) symbol so the app still has a thematic splash screen.

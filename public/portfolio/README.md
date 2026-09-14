# Videos del portafolio

La sección "Portafolio" del landing carga estos archivos. **No están en el repo**: hay que
generarlos a partir de los `.MOV` originales (HEVC de iPhone), porque esos no se pueden usar
crudos en web (formato con soporte limitado en navegadores + demasiado pesados: 135 MB y 78 MB).

## Archivos que la página espera

| Ruta                              | De qué video         | Orientación |
| --------------------------------- | -------------------- | ----------- |
| `reel-horizontal.mp4` + `.jpg`    | el video apaisado    | 16:9        |
| `reel-vertical.mp4` + `.jpg`      | el video vertical    | 9:16        |

> Confirmar cuál de `IMG_8004.MOV` (2:31) / `IMG_8017.MOV` (1:19) es horizontal y cuál vertical.

## Cómo generarlos (requiere ffmpeg)

ffmpeg no está instalado en el equipo. Instalar (`winget install Gyan.FFmpeg`) y ejecutar:

```powershell
$src = "C:\Users\Natalia\Documents\Documentos landing Mirko"
$out = "c:\desarollo\marketing-services\web\public\portfolio"

# --- Horizontal (16:9): comprimir a 1080p H.264, audio AAC ---
ffmpeg -i "$src\IMG_8004.MOV" -vf "scale=-2:1080" -c:v libx264 -crf 24 -preset slow `
  -c:a aac -b:a 128k -movflags +faststart "$out\reel-horizontal.mp4"

# --- Vertical (9:16): comprimir a 1080px de alto ---
ffmpeg -i "$src\IMG_8017.MOV" -vf "scale=1080:-2" -c:v libx264 -crf 24 -preset slow `
  -c:a aac -b:a 128k -movflags +faststart "$out\reel-vertical.mp4"

# --- Posters (miniatura, frame al segundo 1) ---
ffmpeg -i "$out\reel-horizontal.mp4" -ss 00:00:01 -vframes 1 -q:v 3 "$out\reel-horizontal.jpg"
ffmpeg -i "$out\reel-vertical.mp4"   -ss 00:00:01 -vframes 1 -q:v 3 "$out\reel-vertical.jpg"
```

Objetivo de peso: idealmente **< 15 MB por video**. Si quedan más pesados, subir `-crf` (ej. 26–28).

## Alternativa recomendada para producción

Para no inflar el repo ni el deploy de Vercel, considerar hostear los videos en un CDN/streaming
(Mux, Cloudinary o YouTube/Vimeo no listado) y cambiar `src` en
`components/landing/data.ts` por la URL del CDN.

# Manolisimo

Archivo vivo para capturar ideas absurdas, ordenarlas como fichas de ilustracion y convertirlas poco a poco en productos.

## Que hace ahora

- Guarda ideas rapidas desde una entrada sencilla.
- Convierte cada frase en una ficha con titulo, resumen, gracia, posible ilustracion y texto para producto.
- Usa el ADN Benitez+ para orientar las fichas hacia refran torcido, literalidad visual y personaje expresivo.
- Permite cambiar el estado de cada idea: Pendiente, Favorita, Dibujando o Hecha.
- Filtra la lista por estado.
- Guarda los datos en el navegador con `localStorage`.
- Sincroniza las ideas compartidas mediante Supabase cuando hay conexion.

## ADN creativo

El analisis del estilo y humor de referencia esta documentado en `BENITEZ_PLUS_ADN.md`.

## Desarrollo local

```bash
npm install
npm run dev
```

La app se abre normalmente en `http://localhost:3000`.

## GitHub Pages

La version estatica que funciona directamente en GitHub Pages vive en `docs/index.html`.

URL prevista:

```text
https://packojacko.github.io/manolisimo/
```

## Siguiente paso

El MVP usa almacenamiento local. Para que Packo y Manolo puedan compartir el mismo archivo desde varios dispositivos, el siguiente paso sera conectar una base de datos real y, despues, anadir subida de audios o capturas.

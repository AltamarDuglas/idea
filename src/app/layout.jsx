import '../styles/tokens.css';
import '../styles/globals.css';

export const metadata = {
  title: '¿Existen traumas en las moscas? — Tratado y Ensayo Interactivo',
  description:
    'Un libro y ensayo interactivo sobre filosofía de la mente, el egocentrismo humano, el Umwelt de Jakob von Uexküll y cómo la neurobiología predice el comportamiento de Drosophila tras sufrir experiencias adversas.',
  keywords: ['Drosophila', 'Trauma', 'Neurobiología', 'Filosofía de la mente', 'Umwelt', 'Emil Kowalski', 'Next.js'],
  authors: [{ name: 'Altamar Duglas' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
};

/**
 * COMPONENTE RootLayout (App Router Layout)
 * Provee la estructura HTML base con tematización editorial clásica (estilo libro).
 */
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="book-edition">
        {children}
      </body>
    </html>
  );
}

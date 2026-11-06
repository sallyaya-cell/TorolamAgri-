export const metadata = {
  title: 'TorolamAgri',
  description: 'Plateforme agropastorale et halieutique',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

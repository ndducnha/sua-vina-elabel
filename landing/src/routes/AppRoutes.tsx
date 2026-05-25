import { Route, Routes } from 'react-router'
import { CreativeProductLabel } from '../pages/CreativeProductLabel'

export function AppRoutes() {
  return (
    <Routes>
      {/* GS1 Digital Link: /01/{gtin} or /01/{gtin}/10/{lot} */}
      <Route path="/01/:gtin/*" element={<CreativeProductLabel />} />
      {/* Short URL: /qr-scan?gtin=...&tax_code=... */}
      <Route path="/qr-scan" element={<CreativeProductLabel />} />
      {/* Default fallback */}
      <Route path="*" element={<CreativeProductLabel />} />
    </Routes>
  )
}

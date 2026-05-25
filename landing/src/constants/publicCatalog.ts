/**
 * The original mock-data catalog has been removed — the landing page now
 * resolves products from `/data/products.json` via the static-mode lookup.
 * This file is kept so legacy imports compile; it always exports an empty list.
 */
import type { ProductCatalogEntry } from '../models/product'
export const publicCatalog: ProductCatalogEntry[] = []

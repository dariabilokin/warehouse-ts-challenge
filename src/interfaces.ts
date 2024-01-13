export interface Order {
  id: string
  articles: string[]
  installationDate: string
}
export interface Product {
  id: string
  productCode: string
  name: string
  description: string
  stock: number
  unitPrice?: number
}

export enum ProductType {
  TOOLS = 'tools',
  HEAT_PUMPS = 'heatPumps',
  INSTALLATION_MATERIALS = 'installationMaterials',
}
export type PackageStatus = 'complete' | 'incomplete'
export type PType =
  | ProductType.TOOLS
  | ProductType.HEAT_PUMPS
  | ProductType.INSTALLATION_MATERIALS

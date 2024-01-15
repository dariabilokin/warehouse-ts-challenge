import { Product, Order, ProductType, PType, PackageStatus } from './interfaces'
const { getProducts, updateProduct } = require('./apis')

function searchProductById(
  products: Product[],
  productId: string
): Product | undefined {
  let product = products.find((product: Product) => {
    return product.id === productId
  })
  return product
}

function generatePackageList(
  orderArticles: Order['articles']
): Map<string, number> {
  let articles = new Map<string, number>()

  // Generating a list of articles to be packed
  for (let i = 0; i < orderArticles.length; i++) {
    if (articles.has(orderArticles[i])) {
      articles.set(orderArticles[i], articles.get(orderArticles[i])! + 1)
    } else {
      articles.set(orderArticles[i], 1)
    }
  }
  return articles
}

export async function buildPackage(
  order: Order,
  restockingThreshold: number
): Promise<[string, number, Product[], Map<string, number>]> {
  console.log('___________________ Building package ___________________')

  // Defining variables
  let restock = new Map<string, number>()
  let packageBuild: Product[] = []
  let totalPrice = 0
  let packageStatus: PackageStatus = 'complete'

  const articles = generatePackageList(order.articles)
  console.log('Articles to be packed:', articles)

  // for each order I want to fetch all products. Later we can just fetch it once in a main function and then mutate it.
  const [tools, heatPumps, installationMaterials] = await Promise.all([
    getProducts(ProductType.TOOLS),
    getProducts(ProductType.HEAT_PUMPS),
    getProducts(ProductType.INSTALLATION_MATERIALS),
  ])

  // I go through each item in the order and search for it in the products list.
  // If found, I add it to the package list, check stock and update the products DB.
  // If not found, I throw an error/warning that we need to add it.
  // If we run out of stock soon, I will add id and type of product to restock list.

  for (let entry of Array.from(articles.entries())) {
    const item = entry[0]
    const amount = entry[1]
    // First, we search article in products. we need to know what type of product it is to update it in the DB

    let product = searchProductById(tools, item)
    let productType: PType | undefined = ProductType.TOOLS
    if (!product) {
      product = searchProductById(heatPumps, item)
      productType = ProductType.HEAT_PUMPS
    }
    if (!product) {
      product = searchProductById(installationMaterials, item)
      productType = ProductType.INSTALLATION_MATERIALS
    }

    // if we found it we add it to the package list
    if (product) {
      if (product.stock >= amount) {
        packageBuild.push(product)
        totalPrice += product?.unitPrice || 0 * amount
        product.stock -= amount
        await updateProduct(productType, item, product)
        console.log(
          `Item with id: ${item} and name: ${product.name} added to package`
        )
      } else if (Math.max(amount, restockingThreshold) > product.stock) {
        console.log(`!________ It's time to restock Item with id: ${item} !`)
        restock.set(
          item,
          restock.has(item) ? restock.get(item)! + amount : amount
        )
        if (product.stock == 0) {
          packageStatus = 'incomplete'
          console.log(
            `!-------- Item with id: ${item} out of stock. \n!-------- Package cannot be completed.`
          )
        }
      }
    } else {
      console.log('!!!-------- Item not found --------!!!', item)
    }
  }
  return [packageStatus, totalPrice, packageBuild, restock]
}

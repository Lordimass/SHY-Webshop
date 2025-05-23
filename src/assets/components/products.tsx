import { useEffect, useState } from "react";
import PageSelector from "./pageSelector";
import Product from "./product";
import { CheckoutProduct } from "./product"

import { productInBasket, image } from "./product";

import "../css/products.css"

type prodDataElement = {
  sku: number,
  price: number,
  name: string,
  stock: number,
  active: boolean
  images: {
    id: number,
    image_url: string,
    display_order: number
  }[]
}

const productLoadChunks: number = 20;

export default function Products() {
    function incrementPage() {
        setPage(page + 1)
    }

    function decrementPage() {
        setPage(page - 1)
    }

    const [page, setPage] = useState(1)
    const productData: Array<prodDataElement> = getProductList();
    var products: Array<React.JSX.Element> = [];

    if (productData != undefined) {
        var start: number = (page-1)*productLoadChunks
        var end: number = Math.min(page*productLoadChunks, productData.length)

        for (let i=start; i < Math.min(end, productData.length); i++) {
          let product: prodDataElement = productData[i]
          if (!product.active) {
            end++
            continue;
          }
          products.push(<Product
              key={product.sku}
              sku={product.sku}
              name={product.name}
              price={product.price}
              images={product.images}
          />)
        }
    } else {
        products = []
    }

    let pageCount = 0;
    if (productData) {
        pageCount = Math.floor(productData.length/productLoadChunks);
        if (productData.length % productLoadChunks != 0) {
            pageCount++
        }
    }


    return (<div className="products-box">
    <div className='products'>{products}</div>
    <PageSelector 
        incrementCallback={incrementPage} 
        decrementCallback={decrementPage}
        min={1}
        max={pageCount}  
    />
    </div>)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function CheckoutProducts() {
  const basketString: string | null = localStorage.getItem("basket")
  if (!basketString) {
      return (<></>)
  }
  const basket: Array<productInBasket> = JSON.parse(basketString).basket
  const els: Array<React.JSX.Element> = []

  for (let i=0; i<basket.length; i++) {
      const item: productInBasket = basket[i]
      els.push(<CheckoutProduct
          image = {item.images[0]?.image_url}
          name = {item.name}
          quantity={item.basketQuantity}
          total = {item.price*item.basketQuantity}
      />)
  }
  return (<div className="checkout-products">{els}</div>)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getProductList(): any {
    const [products, setData] = useState(null)
    const [error, setError] = useState(null)
  
    useEffect(() => {
      async function fetchData() {
        try {
          const data = await fetch(window.location.origin + "/.netlify/functions/getAllProducts")
            .then((response) => response.json())
            .then((data) => {
              setData(data)
            })
        } catch (error: any) {
          setError(error);
        }
      }
  
      fetchData();
    }, []);
  
    if (error) {
      console.error(error)
    }
    else if (products) {
      return products
    }
  }
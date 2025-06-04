import { ReactElement, useEffect, useState } from "react";
import "../css/basket.css"
import { BasketProduct, productInBasket } from "./product";
import { basket_icon } from "../consts";
import ReactGA from "react-ga4"

export default function Basket() {
    function redirectToCheckout() {
        if (basketQuantity == 0) {
            console.log("Dispatching")
            window.dispatchEvent( new CustomEvent("notification", {
                detail: {
                    message: "You can't checkout without anything in your cart, silly!"
                }
            }))
            toggleBasket()
            return
        }
        window.location.href = "/checkout"
    }
    
    const [basketQuantity, changeBasketQuantity] = useState(0);
    const [basketPrice, changeBasketPrice] = useState("£0.00");
    const [oldBasketString, setBasket] = useState('{"basket":[]}');

    function updateBasketQuantity() {
        let basketQuantTemp: number = 0
        let basketPriceTemp: number = 0

        const basketString: string | null = localStorage.getItem("basket");
        if (basketString) {
            const basket: Array<productInBasket> = JSON.parse(basketString).basket;
            const oldBasket: Array<productInBasket> = JSON.parse(oldBasketString).basket;
            for (let i=0; i<basket.length; i++) { // Iterate through items in the basket.
                const item = basket[i];
                basketQuantTemp += item.basketQuantity;
                basketPriceTemp += item.price * item.basketQuantity;
                
                // Find product in old basket to trigger analytics events
                var found = false
                for (let i=0; i<oldBasket.length; i++) {
                    const oldItem = basket[i]
                    if (oldItem.sku == item.sku) {
                        //console.log("Old Item " + oldItem.basketQuantity + ", New Item " + item.basketQuantity)
                        const diff = item.basketQuantity - oldItem.basketQuantity
                        //console.log(diff)
                        if (diff != 0) {
                            const diffProd = item
                            diffProd.basketQuantity = diff
                            notifyGA4(diffProd)
                        }
                        found = true;
                        break;
                    }
                }
                // Product may not have been found, if so its a new one for the basket.
                if (!found) {
                    notifyGA4(item)
                }
            }
        }

        // Animate if it changed
        if (basketQuantity - basketQuantTemp != 0) {
            const el = document.getElementById("basket")
            if (el) {
                el.classList.add("basket-grow")
                setTimeout(() => {el.classList.remove("basket-grow");}, 250)
            }
        }
        const counter = document.getElementById("basket-item-count");
        if (counter && basketQuantTemp == 0) {
            counter.style.display = "none"
        } else if (counter) {
            counter.style.display = "flex"
        }
        changeBasketQuantity(basketQuantTemp)
        changeBasketPrice("£" + basketPriceTemp.toFixed(2))
        if (basketString) {
            setBasket(basketString)
        }
    }

    function toggleBasket() {
        // Get the basket
        const basket = document.getElementById("basket-display")
        if (!basket) {
            return
        }
        
        // Use disable functionality only if on checkout or thankyou page
        const page = window.location.pathname
        if (
            page == "/checkout" ||
            page == "/thankyou"
        ) {
            basket.style.display = "none"
            return
        }

        // Toggle display mode
        let currentDisplay: string = basket.style.display
        if (currentDisplay == "flex") {
            basket.style.display = "none"
        } else {
            basket.style.display = "flex"
        }
    }

    // Update basket quantity on first render only
    useEffect(updateBasketQuantity,[]) 
    // Listen for basket updates
    window.addEventListener("basketUpdate", updateBasketQuantity);

    let basketItems: Array<ReactElement> = []
    let basket: Array<productInBasket> = []
    const basketString: string | null = localStorage.getItem("basket")
    if (basketString) {
        basket = JSON.parse(basketString).basket
    }
    for (let i = 0; i < basket.length; i++) {
        let prod : productInBasket = basket[i]
        basketItems.push(<BasketProduct 
            key={prod.sku}
            sku={prod.sku}
            name={prod.name}
            price={prod.price}
            images={prod.images}
            category={prod.category}
        />)
    }
    
    return (<>
        <div className="basket" id="basket" onClick={toggleBasket}>
            <img src={basket_icon}></img>
            <div className="basket-item-count" id="basket-item-count">
                <p>{basketQuantity}</p>
            </div>
        </div>

        <div className="basket-display" id="basket-display">
            <p> Basket ({basketQuantity} items)</p>
            <div className="basketItems">
                {basketItems}
            </div>
            <p> Subtotal: {basketPrice}</p>
            <div className="checkout" onClick={redirectToCheckout}>
                <div>
                    <h1>Checkout</h1>
                    <img src={basket_icon}/>
                </div>
            </div>
        </div>
        </>)
}

/**
 * Triggers GA4 events for changed products in the basket.
 * Negative quantities are used to signify removing products.
 * @param item The item which has been changed
 */

function notifyGA4(item: productInBasket) {
    // Having issues with this triggering many times when it shouldn't really, not sure
    // why and don't have time to look into it right now

    // Is the debugger behaving weirdly with react rerenders?
    return
    console.log(item.sku + " increased by " + item.basketQuantity)
    const itemGA = {
        item_id: item.sku,
        item_name: item.name,
        price: item.price,
        quantity: item.basketQuantity
    }
    if (item.basketQuantity > 0) { // Added to cart
        ReactGA.event("add_to_cart", {
            currency: "GBP",
            value: item.basketQuantity*item.price,
            items: [itemGA]
        })
    } else if (item.basketQuantity < 0) { // Removed from cart
        itemGA.quantity *= -1 // Change back to positive
        ReactGA.event("remove_from_cart", {
            currency: "GBP",
            value: item.basketQuantity*item.price*-1,
            items: [itemGA]
        })
    }
}


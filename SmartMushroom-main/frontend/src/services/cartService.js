export const getCartKey = () => {
    const token = localStorage.getItem("token");
    if (!token) return "cart_guest";
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // JWT identity may be a dict or string; extract email appropriately
        const email = payload.email || (payload.identity && payload.identity.email) || payload.sub || "guest";
        return `cart_${email}`;
    } catch (e) {
        return "cart_guest";
    }
};

export const getCart = () => {
    const key = getCartKey();
    return JSON.parse(localStorage.getItem(key) || "[]");
};

export const saveCart = (cart) => {
    const key = getCartKey();
    localStorage.setItem(key, JSON.stringify(cart));
    // Also notify other tabs/components
    window.dispatchEvent(new Event("cartUpdated"));
};

export const clearCart = () => {
    const key = getCartKey();
    localStorage.removeItem(key);
    window.dispatchEvent(new Event("cartUpdated"));
};

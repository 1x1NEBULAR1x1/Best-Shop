document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const totalPriceElement = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const calculateTotal = () => {
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        totalPriceElement.textContent = total.toFixed(2);
    };

    const renderCartItems = () => {
        if (!cart || cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Cart is empty</p>';
            return;
        }
        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
            <img src="/images/${item.imagePath}" alt="${item.name}" />
            <div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <span>Price: $${item.price.toFixed(2)}</span>
            </div>
            <div>
                <input 
                    type="number" 
                    value="${item.quantity}" 
                    min="1" 
                    class="quantity-input" 
                    data-product-id="${item.id}" 
                />
                <button 
                    class="remove-btn" 
                    data-product-id="${item.id}">
                    Delete
                </button>
            </div>
        `;
            cartItemsContainer.appendChild(cartItem);
        });
        attachCartEvents();
    };

    const updateCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        calculateTotal();
        updateCartIcon();
    };

    const attachCartEvents = () => {
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (event) => {
                const productId = event.target.dataset.productId;
                const newQuantity = parseInt(event.target.value, 10);
                if (newQuantity > 0) {
                    const product = cart.find(item => item.id === productId);
                    if (product) {
                        product.quantity = newQuantity;
                        updateCart();
                    }
                }
            });
        });

        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                cart = cart.filter(item => item.id !== productId);
                updateCart();
            });
        });
    };

    const handleAddToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCart();
    };

    const updateCartIcon = () => {
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        const cartLink = document.getElementById('cartLink');
        cartLink.textContent = `Cart (${cartCount})`;
    };

    document.addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('buy-btn')) {
            const product = {
                id: event.target.dataset.productId,
                name: event.target.dataset.productName,
                price: parseFloat(event.target.dataset.productPrice),
                imagePath: event.target.dataset.productImage,
                description: event.target.dataset.productDescription,
            };
            handleAddToCart(product);
        }
    });

    checkoutBtn.addEventListener('click', async () => {
        if (userId == 'Unknown') {
            alert('Please log in to proceed to checkout');
            return
        } else
        {
            try {
                const products = cart.map(item => ({ ProductId: item.id, Amount: item.quantity }));
                const response = await fetch(`/checkout?userId=${encodeURIComponent(window.userId)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(products),
                });
                
                if (response.ok) {
                    const result = await response.json();
                    cart = [];
                    updateCart();
                    alert('Checkout completed successfully!');
                    window.location.href = '/MyOrders';
                } else {
                    alert('Something went wrong with status', response.status);
                }
            } catch (error) {
                console.error(error);
                alert('An error occurred');
            }
            cart = [];
            updateCart();
        }
    });
    renderCartItems();
    calculateTotal();
    updateCartIcon();
});

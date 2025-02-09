document.addEventListener('DOMContentLoaded', () => {
    const categoriesSelect = document.getElementById('catalogCategoriesSelect');
    const productList = document.querySelector('.catalog-list');
    const searchInput = document.getElementById('catalogSearchInput');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    const loadCategories = () => {
        fetch('/categories')
            .then(response => response.json())
            .then(categories => {
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categoriesSelect.appendChild(option);
                });
            })
            .catch(err => console.error('Error loading categories:', err));
    };

    loadCategories();

    const updateCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartIcon();
        renderProducts();
    };

    const updateCartIcon = () => {
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        const cartLink = document.getElementById('cartLink');
        cartLink.textContent = `Cart(${ cartCount })`;
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

    const handleRemoveFromCart = (productId) => {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            if (existingItem.quantity > 1) {
                existingItem.quantity -= 1;
            } else {
                const index = cart.indexOf(existingItem);
                cart.splice(index, 1);
            }
        }
        updateCart();
    };

    const renderProducts = (query = '', categoryId = '') => {
        fetch(`/products?query=${query}&categoryId=${categoryId || 0}`)
            .then(response => response.json())
            .then(data => {
                const { products, lastUpdated } = data;
                productList.innerHTML = '';
                products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.classList.add('product-card');
                    const cartItem = cart.find(item => item.id == product.id);
                    productCard.innerHTML = `
                        <img src="/images/${product.imagePath}" alt="${product.name}" />
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <span class="price">$${product.price.toFixed(2)}</span>
                        <div class="product-actions">
                            ${cartItem
                            ? `
                                <button class="decrement-btn" data-product-id="${product.id}">-</button>
                                <span class="quantity">${cartItem.quantity}</span>
                                <button class="increment-btn" data-product-id="${product.id}">+</button>
                              `
                            :`
                                <button class="buy-btn" 
                                    data-product-id="${product.id}" 
                                    data-product-name="${product.name}" 
                                    data-product-price="${product.price}" 
                                    data-product-image="${product.imagePath}" 
                                    data-product-description="${product.description}"
                                >
                                    Buy
                                </button>
                             `
                              }
                        </div>
                    `;
                    productList.appendChild(productCard);
                });
            })
            .catch(err => console.log('Error loading products:', err));
    };

    searchInput.addEventListener('input', () => {
        renderProducts(searchInput.value, categoriesSelect.value);
    });

    categoriesSelect.addEventListener('change', () => {
        renderProducts(searchInput.value, categoriesSelect.value);
    });

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-btn')) {
            const product = {
                id: event.target.dataset.productId,
                name: event.target.dataset.productName,
                price: parseFloat(event.target.dataset.productPrice),
                imagePath: event.target.dataset.productImage,
                description: event.target.dataset.productDescription,
                amount: event.target.dataset.productAmount
            };
            handleAddToCart(product);
        } else if (event.target.classList.contains('increment-btn')) {
            const productId = event.target.dataset.productId;
            const product = cart.find(item => item.id === productId);
            handleAddToCart(product);
        } else if (event.target.classList.contains('decrement-btn')) {
            const productId = event.target.dataset.productId;
            handleRemoveFromCart(productId);
        }
    });

    renderProducts();
    updateCartIcon();
});
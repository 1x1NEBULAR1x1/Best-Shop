document.addEventListener("DOMContentLoaded", function () {
    const categoryForm = document.getElementById("categoryForm");
    const productForm = document.getElementById("productForm");

    if (categoryForm) {
        categoryForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const category = {
                id: 0,
                name: document.getElementById("category-name").value.trim(),
                description: document.getElementById("category-description").value.trim(),
                products: []
            };

            fetch('/categories', {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(category)
            })
                .then(response => response.json())
                .then(() => {
                    fetchCategories();
                    event.target.reset();
                });
        });
    }

    function fetchCategories() {
        fetch('/categories')
            .then(response => response.json())
            .then(categories => {
                const list = document.getElementById('categories-list');
                const select = document.getElementById('product-category');

                if (!list || !select) {
                    console.error("Categories list or product category select not found!");
                    return;
                }

                list.innerHTML = '';
                select.innerHTML = '';

                categories.forEach(category => {
                    list.innerHTML += `<div class="item">${category.name} <button class="delete-btn" onclick="deleteCategory(${category.id})">Delete</button></div>`;
                    select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
                });
            });
    }

    if (productForm) {
        productForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const product = {
                id: 0,
                name: document.getElementById("product-name").value.trim(),
                description: document.getElementById("product-description").value.trim(),
                price: parseFloat(document.getElementById("product-price").value),
                amount: parseInt(document.getElementById("product-amount").value),
                imagePath: document.getElementById("product-image").value.trim(),
                categoryId: parseInt(document.getElementById("product-category").value)
            };

            fetch('/products', {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            })
                .then(response => response.json())
                .then(() => {
                    fetchProducts();
                    event.target.reset();
                });
        });
    }

    function fetchProducts() {
        fetch('/products')
            .then(response => response.json())
            .then(products => {
                const list = document.getElementById('products-list');

                if (!list) {
                    console.error("Products list not found!");
                    return;
                }

                list.innerHTML = '';

                products.products.forEach(product => {
                    list.innerHTML += `<div class="item">
                        <img src="images/${product.imagePath}" />
                        ${product.name} - $${product.price} 
                        <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                    </div>`;
                });
            });
    }

    fetchCategories();
    fetchProducts();
});
function fetchCategories() {
    fetch('/categories')
        .then(response => response.json())
        .then(categories => {
            const list = document.getElementById('categories-list');
            const select = document.getElementById('product-category');

            if (!list || !select) {
                console.error("Categories list or product category select not found!");
                return;
            }

            list.innerHTML = '';
            select.innerHTML = '';

            categories.forEach(category => {
                list.innerHTML += `<div class="item">${category.name} <button class="delete-btn" onclick="deleteCategory(${category.id})">Delete</button></div>`;
                select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        });
}

function fetchProducts() {
    fetch('/products')
        .then(response => response.json())
        .then(products => {
            const list = document.getElementById('products-list');

            if (!list) {
                console.error("Products list not found!");
                return;
            }

            list.innerHTML = '';

            products.products.forEach(product => {
                list.innerHTML += `<div class="item">
                    <img src="images/${product.imagePath}" />
                    ${product.name} - $${product.price} 
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                </div>`;
            });
        });
}

function deleteCategory(id) {
    fetch(`/categories/${id}`, { method: 'DELETE' })
        .then(() => fetchCategories());
}

function deleteProduct(id) {
    fetch(`/products/${id}`, { method: 'DELETE' })
        .then(() => fetchProducts());
}
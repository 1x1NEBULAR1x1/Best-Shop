document.addEventListener('DOMContentLoaded', () => {
    const fetchOrders = async () => {
        try {
            const response = await fetch('/my_orders?userId='+encodeURIComponent(window.userId))
            if (!response.ok) {
                throw new Error('Error fetching orders');
            }
            const orders = await response.json();
            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const displayOrders = (orders) => {
        const container = document.getElementById('orders-container');
        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = '<p>No orders found.</p>';
            return;
        }

        orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.classList.add('order');

            const orderHeader = `
                <h3>Order ID: ${order.id}</h3>
                <p>Status: ${order.status}</p>
                <p>Total Price: $${order.totalPrice.toFixed(2)}</p>
                <p>Created At: ${new Date(order.createdAt).toLocaleString()}</p>
            `;
            orderElement.innerHTML = orderHeader;

            const orderProductsElement = document.createElement('div');
            orderProductsElement.classList.add('order-products');

            order.orderProducts.forEach(orderProduct => {
                const productElement = document.createElement('div');
                productElement.classList.add('order-product');

                const productHtml = `
                    <img src="/images/${orderProduct.product.imagePath}" alt="${orderProduct.product.name}">
                    <div>
                        <h4>${orderProduct.product.name}</h4>
                        <p>${orderProduct.product.description}</p>
                        <p>Price: $${orderProduct.product.price}</p>
                        <p>Amount: ${orderProduct.amount}</p>
                        <p>Total: $${(orderProduct.product.price * orderProduct.amount).toFixed(2)}</p>
                    </div>
                `;
                productElement.innerHTML = productHtml;
                orderProductsElement.appendChild(productElement);
            });

            orderElement.appendChild(orderProductsElement);
            container.appendChild(orderElement);
        });
    };

    fetchOrders();
});

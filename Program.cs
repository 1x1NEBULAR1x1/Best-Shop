using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Shop.Models;
using Shop2.Data;
using Shop2.Models;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddDefaultIdentity<IdentityUser>(options => options.SignIn.RequireConfirmedAccount = true)
    .AddEntityFrameworkStores<ApplicationDbContext>();
builder.Services.AddRazorPages();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(config =>
    {
        config.DocumentTitle = "TodoAPI";
        config.SwaggerEndpoint("/swagger/v1/swagger.json", "TodoAPI v1");
        config.RoutePrefix = "swagger";
        config.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
    });
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.MapGet("/categories", async (ApplicationDbContext db) =>
{
    var categories = await db.Categories
        .Include(c => c.Products)
        .ToListAsync();
    return Results.Ok(categories);
});

app.MapPost("/categories", async (ApplicationDbContext db, Category category) => {
    db.Categories.Add(category);
    await db.SaveChangesAsync();
    return Results.Created($"/categories/{category.Id}", category);
});

app.MapPut("/categories/{id}", async (int id, ApplicationDbContext db, Category inputCategory) =>
{
    var category = await db.Categories.FindAsync(id);

    if (category is null) return Results.NotFound();

    category.Name = inputCategory.Name;
    category.Description = inputCategory.Description;

    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/categories/{id}", async (int id, ApplicationDbContext db) =>
{
    if (await db.Categories.FindAsync(id) is Category category)
    {
        db.Categories.Remove(category);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    return Results.NotFound();
});

app.MapGet("/products", async (ApplicationDbContext db, string? query, int? categoryId) =>
{
    IQueryable<Product> productsQuery = db.Products.Include(p => p.Category);
    if (!string.IsNullOrEmpty(query))
    {
        productsQuery = productsQuery.Where(p => p.Name.Contains(query) || p.Description.Contains(query));
    }
    if (categoryId.HasValue)
    {
        if (categoryId.Value > 0)
        {
            productsQuery = productsQuery.Where(p => p.CategoryId == categoryId.Value);
        }
    }

    var products = await productsQuery.ToListAsync();

    var lastUpdated = DateTime.Now;

    return Results.Ok(new { products, lastUpdated });
});

app.MapPost("/products", async (ApplicationDbContext db, Product product) => {
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return Results.Created($"/products/{product.Id}", product);
});

app.MapPut("/products/{id}", async (int id, ApplicationDbContext db, Product inputProduct) =>
{
    var product = await db.Products.FindAsync(id);

    if (product is null) return Results.NotFound();

    product.Name = inputProduct.Name;
    product.Price = inputProduct.Price;
    product.CategoryId = inputProduct.CategoryId;
    product.Description = inputProduct.Description;
    product.ImagePath = inputProduct.ImagePath;
    product.Amount = inputProduct.Amount;

    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/products/{id}", async (int id, ApplicationDbContext db) =>
{
    if (await db.Products.FindAsync(id) is Product product)
    {
        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    return Results.NotFound();
});

app.MapGet("/orders", async (ApplicationDbContext db) =>
{
    var orders = await db.Orders
        .Include(o => o.OrderProducts)
        .ThenInclude(op => op.Product)
        .ToListAsync();
    return Results.Ok(orders);
});

app.MapGet("/my_orders", async (HttpContext context, ApplicationDbContext db) =>
{
    var userId = context.Request.Query["userId"].ToString();

    if (string.IsNullOrEmpty(userId))
    {
        return Results.BadRequest("User ID is required.");
    }
    var orders = await db.Orders
        .Where(o => o.UserId == userId)
        .Include(o => o.OrderProducts)
        .ThenInclude(op => op.Product)
        .ToListAsync();
    return Results.Ok(orders);
});

app.MapPost("/checkout", async (HttpContext context, ApplicationDbContext db, List<CheckoutProductDTO> orderProducts) =>
{
    var userId = context.Request.Query["userId"].ToString();

    if (string.IsNullOrEmpty(userId))
    {
        return Results.BadRequest("User ID is required.");
    }
    if (orderProducts == null || !orderProducts.Any())
    {
        return Results.BadRequest("Order products cannot be empty.");
    }

    var order = new Order
    {
        UserId = userId,
        CreatedAt = DateTime.UtcNow,
        OrderProducts = new List<OrderProduct>()
    };

    foreach (var orderProductDTO in orderProducts)
    {
        var product = await db.Products.FindAsync(orderProductDTO.ProductId);
        if (product == null)
        {
            return Results.NotFound($"Product with ID {orderProductDTO.ProductId} not found.");
        }

        order.OrderProducts.Add(new OrderProduct
        {
            OrderId = order.Id,
            ProductId = orderProductDTO.ProductId,
            Amount = orderProductDTO.Amount
        });
    }

    db.Orders.Add(order);
    await db.SaveChangesAsync();

    return Results.Created($"/orders/{order.Id}", order);
});

app.MapPut("/orders/{id}", async (int id, ApplicationDbContext db, Order inputOrder) =>
{
    var order = await db.Orders
        .Include(o => o.OrderProducts)
        .FirstOrDefaultAsync(o => o.Id == id);

    if (order is null) return Results.NotFound();

    order.Status = inputOrder.Status;

    order.OrderProducts.Clear();
    foreach (var orderProduct in inputOrder.OrderProducts)
    {
        var product = await db.Products.FindAsync(orderProduct.Product.Id);
        if (product is not null)
        {
            order.OrderProducts.Add(new OrderProduct
            {
                Product = product,
                Amount = orderProduct.Amount
            });
        }
    }

    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapDelete("/orders/{id}", async (int id, ApplicationDbContext db) =>
{
    var order = await db.Orders.FindAsync(id);

    if (order is null) return Results.NotFound();

    db.Orders.Remove(order);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/orderproducts", async (ApplicationDbContext db) =>
{
    var orderProducts = await db.OrderProducts
        .Include(op => op.Product)
        .Include(op => op.Order)
        .ToListAsync();
    return Results.Ok(orderProducts);
});

app.MapPost("/orderproducts", async (ApplicationDbContext db, OrderProduct inputOrderProduct) =>
{
    var orderProduct = await db.OrderProducts.FirstOrDefaultAsync(o => o.Id == inputOrderProduct.Id);

    if (orderProduct is null) return Results.NotFound();

    orderProduct.ProductId = inputOrderProduct.ProductId;
    orderProduct.OrderId = inputOrderProduct.OrderId;
    orderProduct.Amount = inputOrderProduct.Amount;

    db.OrderProducts.Add(orderProduct);
    await db.SaveChangesAsync();
    return Results.Created($"/orderproducts/{orderProduct.Id}", orderProduct);
});

app.MapPut("/orderproducts/{id}", async (int id, ApplicationDbContext db, OrderProduct inputOrderProduct) =>
{
    var orderProduct = await db.OrderProducts.FindAsync(id);

    if (orderProduct is null) return Results.NotFound();

    var product = await db.Products.FindAsync(inputOrderProduct.Product.Id);
    var order = await db.Orders.FindAsync(inputOrderProduct.Order.Id);

    if (product is null || order is null) return Results.BadRequest("Invalid product or order ID.");

    orderProduct.Amount = inputOrderProduct.Amount;
    orderProduct.ProductId = inputOrderProduct.ProductId;
    orderProduct.OrderId = inputOrderProduct.OrderId;

    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/orderproducts/{id}", async (int id, ApplicationDbContext db) =>
{
    if (await db.OrderProducts.FindAsync(id) is OrderProduct orderProduct)
    {
        db.OrderProducts.Remove(orderProduct);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    return Results.NotFound();
});


app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.UseAuthentication();
app.MapControllers();
app.MapRazorPages();
app.Run();
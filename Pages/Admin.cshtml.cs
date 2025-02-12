using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Security.Claims;

namespace Best_Shop.Pages
{
    public class AdminModel : PageModel
    {
        public IActionResult OnGet()
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);

            if (userEmail != "admin@gmail.com")
            {
                return Forbid();
            }

            return Page();
        }
    }
}

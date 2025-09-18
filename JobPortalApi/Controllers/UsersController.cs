using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalApi.Models;
using JobPortalApi.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for all endpoints in this controller
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            UserManager<ApplicationUser> userManager,
            ILogger<UsersController> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(IEnumerable<UserInfo>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<ActionResult<IEnumerable<UserInfo>>> GetUsers()
        {
            try
            {
                var users = await _userManager.Users.ToListAsync();
                var userDtos = new List<UserInfo>();

                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userDtos.Add(UserInfo.FromApplicationUser(user, roles));
                }

                return Ok(new { 
                    success = true,
                    users = userDtos,
                    totalCount = userDtos.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users list");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while retrieving users" 
                });
            }
        }
    }
}
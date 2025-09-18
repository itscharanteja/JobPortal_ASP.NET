using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using JobPortalApi.Models;
using JobPortalApi.DTOs;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(
            UserManager<ApplicationUser> userManager,
            ILogger<ProfileController> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(UserInfo), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<UserInfo>> GetMyProfile()
        {
            try
            {
                var user = await _userManager.FindByIdAsync(User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                var roles = await _userManager.GetRolesAsync(user);
                return Ok(new { 
                    success = true, 
                    profile = UserInfo.FromApplicationUser(user, roles) 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user profile");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while retrieving the profile" 
                });
            }
        }

        [HttpPut("me")]
        [ProducesResponseType(typeof(UserInfo), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<UserInfo>> UpdateMyProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                user.FirstName = request.FirstName;
                user.LastName = request.LastName;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Failed to update profile", 
                        errors = result.Errors 
                    });
                }

                var roles = await _userManager.GetRolesAsync(user);
                return Ok(new { 
                    success = true, 
                    message = "Profile updated successfully",
                    profile = UserInfo.FromApplicationUser(user, roles) 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while updating the profile" 
                });
            }
        }
    }
}
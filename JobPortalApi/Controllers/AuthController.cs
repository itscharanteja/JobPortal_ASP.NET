using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using JobPortalApi.Models;
using JobPortalApi.DTOs;
using JobPortalApi.Services;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IJwtService _jwtService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IJwtService jwtService,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _jwtService = jwtService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _userManager.FindByEmailAsync(request.Email);
                if (existingUser != null)
                {
                    return BadRequest(new AuthResponse 
                    { 
                        Success = false, 
                        Message = "User with this email already exists" 
                    });
                }

                // Create new user
                var user = new ApplicationUser
                {
                    UserName = request.Email,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    UserType = request.UserType
                };

                // Create user with password
                var result = await _userManager.CreateAsync(user, request.Password);
                if (!result.Succeeded)
                {
                    return BadRequest(new AuthResponse 
                    { 
                        Success = false, 
                        Message = "User creation failed: " + string.Join(", ", result.Errors.Select(e => e.Description))
                    });
                }

                // Determine role based on UserType
                string roleName = request.UserType.ToString();
                
                // Ensure role exists
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    await _roleManager.CreateAsync(new IdentityRole(roleName));
                }

                // Assign role to user
                await _userManager.AddToRoleAsync(user, roleName);

                // Get user roles
                var userRoles = await _userManager.GetRolesAsync(user);

                // Generate JWT token
                var token = _jwtService.GenerateToken(user, userRoles);

                // Create response
                return Ok(new AuthResponse
                {
                    Success = true,
                    Message = "User registered successfully",
                    Token = token,
                    User = UserInfo.FromApplicationUser(user, userRoles)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email: {Email}", request.Email);
                return StatusCode(500, new AuthResponse 
                { 
                    Success = false, 
                    Message = "An error occurred during registration" 
                });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            try
            {
                // Find user by email
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return BadRequest(new AuthResponse
                    {
                        Success = false,
                        Message = "Invalid email or password"
                    });
                }

                // Verify password
                var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
                if (!isPasswordValid)
                {
                    return BadRequest(new AuthResponse
                    {
                        Success = false,
                        Message = "Invalid email or password"
                    });
                }

                // Get user roles
                var userRoles = await _userManager.GetRolesAsync(user);

                // Generate JWT token
                var token = _jwtService.GenerateToken(user, userRoles);

                // Create response
                return Ok(new AuthResponse
                {
                    Success = true,
                    Message = "Login successful",
                    Token = token,
                    User = UserInfo.FromApplicationUser(user, userRoles)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
                return StatusCode(500, new AuthResponse
                {
                    Success = false,
                    Message = "An error occurred during login"
                });
            }
        }
    }
}
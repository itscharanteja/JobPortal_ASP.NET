using System.Collections.Concurrent;

namespace JobPortalApi.Services
{
    public static class DownloadTokenCache
    {
        private static readonly ConcurrentDictionary<string, TokenData> _tokens = new();

        public static void AddToken(string token, string filePath, DateTime expiry)
        {
            _tokens[token] = new TokenData { FilePath = filePath, Expiry = expiry };
            
            // Clean up expired tokens (simple cleanup)
            var expiredTokens = _tokens.Where(kvp => kvp.Value.Expiry < DateTime.UtcNow).Select(kvp => kvp.Key).ToList();
            foreach (var expiredToken in expiredTokens)
            {
                _tokens.TryRemove(expiredToken, out _);
            }
        }

        public static string? GetFilePath(string token)
        {
            if (_tokens.TryGetValue(token, out var tokenData))
            {
                if (tokenData.Expiry > DateTime.UtcNow)
                {
                    // Remove token after use (one-time use)
                    _tokens.TryRemove(token, out _);
                    return tokenData.FilePath;
                }
                else
                {
                    // Remove expired token
                    _tokens.TryRemove(token, out _);
                }
            }
            
            return null;
        }

        private class TokenData
        {
            public string FilePath { get; set; } = string.Empty;
            public DateTime Expiry { get; set; }
        }
    }
}
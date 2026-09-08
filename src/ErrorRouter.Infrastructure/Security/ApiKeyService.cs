using System.Security.Cryptography;
using ErrorRouter.Application.Abstractions;
using ErrorRouter.Domain.Entities;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Infrastructure.Security;

public sealed class ApiKeyService : IApiKeyService
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 210_000;
    private const string Prefix = "er_live_";

    public IssuedApiKey Issue(string name, TenantScope tenantScope, DateTime? expiresAtUtc = null)
    {
        var randomPart = Convert.ToBase64String(RandomNumberGenerator.GetBytes(KeySize))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var plaintext = Prefix + randomPart;
        var keyPrefix = plaintext[..Math.Min(16, plaintext.Length)];
        var hash = Hash(plaintext);
        var credential = ApiCredential.Create(Guid.NewGuid(), tenantScope.OrganizationId, name, keyPrefix, hash, tenantScope, expiresAtUtc);
        return new IssuedApiKey(credential, plaintext);
    }

    public bool Verify(string presentedKey, ApiCredential credential, DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(presentedKey) || !credential.IsValidAt(nowUtc))
        {
            return false;
        }

        var parts = credential.KeyHash.Split('$');
        if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(parts[2]);
            var expected = Convert.FromBase64String(parts[3]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(presentedKey, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string Hash(string plaintext)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(plaintext, salt, Iterations, HashAlgorithmName.SHA256, KeySize);
        return $"pbkdf2${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }
}
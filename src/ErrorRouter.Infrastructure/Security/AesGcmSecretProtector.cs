using System.Security.Cryptography;
using System.Text;
using ErrorRouter.Application.Abstractions;

namespace ErrorRouter.Infrastructure.Security;

public sealed class AesGcmSecretProtector : ISecretProtector
{
    private const int NonceSize = 12;
    private const int TagSize = 16;
    private readonly byte[] key;
    private readonly string keyId;

    public AesGcmSecretProtector(byte[] key, string keyId)
    {
        if (key.Length is not (16 or 24 or 32))
        {
            throw new ArgumentException("Secret-protection key must be 128, 192, or 256 bits.", nameof(key));
        }

        if (string.IsNullOrWhiteSpace(keyId))
        {
            throw new ArgumentException("Encryption key identifier is required.", nameof(keyId));
        }

        this.key = key.ToArray();
        this.keyId = keyId.Trim();
    }

    public string Protect(string plaintext)
    {
        ArgumentNullException.ThrowIfNull(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var ciphertext = new byte[Encoding.UTF8.GetByteCount(plaintext)];
        var tag = new byte[TagSize];
        using var aes = new AesGcm(key, TagSize);
        aes.Encrypt(nonce, Encoding.UTF8.GetBytes(plaintext), ciphertext, tag);
        return $"v1:{keyId}:{Convert.ToBase64String(nonce)}:{Convert.ToBase64String(tag)}:{Convert.ToBase64String(ciphertext)}";
    }

    public string Unprotect(string protectedValue)
    {
        var parts = protectedValue.Split(':');
        if (parts.Length != 5 || parts[0] != "v1" || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(parts[1]), Encoding.UTF8.GetBytes(keyId)))
        {
            throw new CryptographicException("The protected value was created with an unavailable key.");
        }

        var nonce = Convert.FromBase64String(parts[2]);
        var tag = Convert.FromBase64String(parts[3]);
        var ciphertext = Convert.FromBase64String(parts[4]);
        var plaintext = new byte[ciphertext.Length];
        using var aes = new AesGcm(key, TagSize);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);
        return Encoding.UTF8.GetString(plaintext);
    }
}
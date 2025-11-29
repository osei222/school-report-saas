#!/usr/bin/env python3
"""
Generate a secure Django SECRET_KEY for production use
"""
import secrets
import string

def generate_secret_key(length=50):
    """Generate a secure random secret key"""
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    secret_key = generate_secret_key()
    print("Generated Django SECRET_KEY:")
    print("-" * 50)
    print(secret_key)
    print("-" * 50)
    print("Copy this value and add it to your Render environment variables")
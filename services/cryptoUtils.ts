
// Utility for Client-Side Encryption (AES-GCM)
// This ensures user data (Journals, Moods) is encrypted before storage.

const ALGO_NAME = 'AES-GCM';
const KEY_STORAGE_NAME = 'serene_master_key';

// Generate or retrieve a local master key
async function getMasterKey(): Promise<CryptoKey> {
  let keyJson = localStorage.getItem(KEY_STORAGE_NAME);
  
  if (keyJson) {
    const jwk = JSON.parse(keyJson);
    return window.crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: ALGO_NAME, length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } else {
    const key = await window.crypto.subtle.generateKey(
      { name: ALGO_NAME, length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await window.crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(KEY_STORAGE_NAME, JSON.stringify(exported));
    return key;
  }
}

export async function encryptData(data: any): Promise<string> {
  try {
    const key = await getMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: ALGO_NAME, iv: iv },
      key,
      encoded
    );

    // Bundle IV and Ciphertext together as base64
    const ivArr = Array.from(iv);
    const encryptedArr = Array.from(new Uint8Array(encrypted));
    const bundle = JSON.stringify({ iv: ivArr, data: encryptedArr });
    
    return btoa(bundle);
  } catch (e) {
    console.error("Encryption failed", e);
    throw e;
  }
}

export async function decryptData<T>(base64Bundle: string): Promise<T | null> {
  try {
    const key = await getMasterKey();
    const jsonStr = atob(base64Bundle);
    const bundle = JSON.parse(jsonStr);
    
    const iv = new Uint8Array(bundle.iv);
    const data = new Uint8Array(bundle.data);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGO_NAME, iv: iv },
      key,
      data
    );

    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded) as T;
  } catch (e) {
    console.error("Decryption failed or invalid data", e);
    return null;
  }
}

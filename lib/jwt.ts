// Web Crypto API implementation for Cloudflare Pages Edge Runtime

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-change-me-32chars!!");

export async function signJWT(payload: any, expiresIn: string = "7d"): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days in seconds
  
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const data = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000)
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(data));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      SECRET,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    new TextEncoder().encode(signatureInput)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${signatureInput}.${encodedSignature}`;
}

export async function verifyJWT(token: string): Promise<any> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
  
  const isValid = await crypto.subtle.verify(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      SECRET,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    ),
    signature,
    new TextEncoder().encode(signatureInput)
  );
  
  if (!isValid) {
    throw new Error("Invalid token");
  }
  
  const payload = JSON.parse(atob(encodedPayload));
  
  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }
  
  return payload;
}

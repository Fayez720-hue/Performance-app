export default function NotFound() {
  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      alignItems: "center", 
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>404</h1>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Page Not Found</h2>
        <p style={{ marginBottom: "1rem" }}>The page you are looking for does not exist.</p>
        <a href="/" style={{ color: "#0070f3", textDecoration: "underline" }}>
          Return Home
        </a>
      </div>
    </div>
  )
}

export const dynamic = 'force-static';
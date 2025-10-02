package com.prescription.security;
import io.jsonwebtoken.*;
import org.springframework.stereotype.Component;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Date;

@Component
public class JwtUtil {
    private final String SECRET_KEY = "your_jwt_secret_key";

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
            .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
            .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser().setSigningKey(SECRET_KEY)
            .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parser().setSigningKey(SECRET_KEY)
            .parseClaimsJws(token).getBody().getExpiration();
        return expiration.before(new Date());
    }
}

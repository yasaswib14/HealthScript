package com.prescription.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getServletPath().startsWith("/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username = jwtUtil.extractUsername(jwt);
       

        logger.debug("JwtAuthenticationFilter: token for username = {}", username);
        logger.info("Authorization header: {}", authHeader);
        logger.info("Extracted username from JWT: {}", username);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            logger.info("Loaded userDetails for username: {}", userDetails);

            if (jwtUtil.validateToken(jwt, userDetails)) {
                logger.info("JWT validated for user: {}", username);
                // extract claims and roles
                Claims claims = jwtUtil.extractAllClaims(jwt);
                Object rolesObj = claims.get("roles");

                Collection<? extends GrantedAuthority> authorities = List.of();

                if (rolesObj instanceof List<?>) {
                    List<?> rolesList = (List<?>) rolesObj;
                    authorities = rolesList.stream()
                            .map(obj -> {
                                if (obj instanceof Map) {
                                    Map<?, ?> map = (Map<?, ?>) obj;
                                    Object authority = map.get("authority");
                                    if (authority != null) {
                                        return new SimpleGrantedAuthority(authority.toString());
                                    }
                                }
                                // fallback
                                return new SimpleGrantedAuthority(obj.toString());
                            })
                            .collect(Collectors.toList());
                }

                logger.info("Authorities extracted from JWT for user {} => {}", username, authorities);

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails,
                        null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.info("Final authorities set in context: {}", authorities);
            } else {
                logger.warn("JWT validation failed for user: {}", username);
            }
        } else {
            logger.warn("Username is null or authentication already set.");
        }

        filterChain.doFilter(request, response);
    }
}

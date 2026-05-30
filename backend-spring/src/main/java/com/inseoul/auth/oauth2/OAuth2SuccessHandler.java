package com.inseoul.auth.oauth2;

import com.inseoul.auth.domain.User;
import com.inseoul.auth.dto.TokenResponse;
import com.inseoul.auth.mapper.UserMapper;
import com.inseoul.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final UserMapper userMapper;

    @Value("${app.oauth2.redirect-uri:http://localhost:5173}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        Long userId;
        if (oAuth2User instanceof CustomOidcUser customOidcUser) {
            userId = customOidcUser.getUserId();
        } else {
            userId = (Long) oAuth2User.getAttributes().get("_userId");
        }

        User user = userMapper.findById(userId);
        TokenResponse tokens = authService.issueTokens(user);

        String targetUrl = redirectUri
                + "#accessToken=" + tokens.getAccessToken()
                + "&refreshToken=" + tokens.getRefreshToken();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}

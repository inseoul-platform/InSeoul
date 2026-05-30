package com.inseoul.auth.oauth2;

import com.inseoul.auth.domain.User;
import com.inseoul.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final UserMapper userMapper;

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUserService delegate = new OidcUserService();
        OidcUser oidcUser = delegate.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        OAuthAttributes attrs = OAuthAttributes.of(provider, oidcUser.getAttributes());
        User user = upsertUser(attrs);

        return new CustomOidcUser(
                oidcUser.getAuthorities(),
                oidcUser.getIdToken(),
                oidcUser.getUserInfo(),
                nameAttributeKey,
                user.getId()
        );
    }

    private User upsertUser(OAuthAttributes attrs) {
        User existing = userMapper.findByProviderAndProviderUserId(attrs.getProvider(), attrs.getProviderUserId());
        if (existing != null) return existing;

        String email = (attrs.getEmail() != null && !attrs.getEmail().isBlank()) ? attrs.getEmail() : null;
        if (email != null) {
            User byEmail = userMapper.findByEmail(email);
            if (byEmail != null) {
                userMapper.insertOAuthAccount(byEmail.getId(), attrs.getProvider(), attrs.getProviderUserId());
                return byEmail;
            }
        }

        User newUser = User.builder()
                .email(email)
                .provider(attrs.getProvider())
                .providerUserId(attrs.getProviderUserId())
                .nickname(attrs.getNickname())
                .role("USER")
                .build();
        userMapper.insert(newUser);
        userMapper.insertOAuthAccount(newUser.getId(), attrs.getProvider(), attrs.getProviderUserId());
        userMapper.insertDefaultProfile(newUser.getId());
        userMapper.insertDefaultSimConfig(newUser.getId());
        return newUser;
    }
}

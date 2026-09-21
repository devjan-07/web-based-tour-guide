package com.voyara.tourguide.notifications;

import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import java.security.Principal;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final AppUserRepository userRepository;
    private final boolean securityEnabled;

    public NotificationController(NotificationService notificationService, AppUserRepository userRepository,
                                  @Value("${app.security.enabled:true}") boolean securityEnabled) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.securityEnabled = securityEnabled;
    }

    @GetMapping
    public List<Notification> all(Principal principal) {
        return notificationService.findForUser(currentUser(principal).getId());
    }

    @PatchMapping("/{id}/read")
    public Notification markRead(@PathVariable Long id, Principal principal) {
        return notificationService.markRead(id, currentUser(principal).getId());
    }

    @PatchMapping("/read-all")
    public List<Notification> markAllRead(Principal principal) {
        return notificationService.markAllRead(currentUser(principal).getId());
    }

    private AppUser currentUser(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            if (!securityEnabled) return userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No local user exists"));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        return userRepository.findByEmailIgnoreCase(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }
}

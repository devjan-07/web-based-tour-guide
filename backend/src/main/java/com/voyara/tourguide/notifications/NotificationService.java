package com.voyara.tourguide.notifications;

import com.voyara.tourguide.bookings.Booking;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final AppUserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, AppUserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Notification> findForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Notification markRead(Long notificationId, Long userId) {
        Notification notification = ownedNotification(notificationId, userId);
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public List<Notification> markAllRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifications.forEach(notification -> notification.setRead(true));
        return notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void notifyBookingUser(Booking booking, String title, String message, String type) {
        bookingUser(booking).ifPresent(user -> create(user, title, message, type, booking.getId()));
    }

    @Transactional
    public void notifyAdmins(String title, String message, String type, String referenceId) {
        userRepository.findByRoleNameOrderByCreatedAtDesc("ADMIN")
                .forEach(user -> create(user, title, message, type, referenceId));
    }

    @Transactional
    public void notifyAssignedGuide(Booking booking, String title, String message, String type) {
        if (booking.getTourGuide() == null || booking.getTourGuide().getUserId() == null) return;
        userRepository.findById(booking.getTourGuide().getUserId())
                .ifPresent(user -> create(user, title, message, type, booking.getId()));
    }

    private java.util.Optional<AppUser> bookingUser(Booking booking) {
        if (booking.getTourist() != null && booking.getTourist().getId() != null) {
            return userRepository.findById(booking.getTourist().getId());
        }
        if (booking.getEmail() != null && !booking.getEmail().isBlank()) {
            return userRepository.findByEmailIgnoreCase(booking.getEmail());
        }
        return java.util.Optional.empty();
    }

    private Notification create(AppUser user, String title, String message, String type, String referenceId) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        return notificationRepository.save(notification);
    }

    private Notification ownedNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return notification;
    }
}

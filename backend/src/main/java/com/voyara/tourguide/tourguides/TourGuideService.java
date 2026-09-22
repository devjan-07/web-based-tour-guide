package com.voyara.tourguide.tourguides;

import com.voyara.tourguide.common.ResourceNotFoundException;
import com.voyara.tourguide.auth.EmailVerificationOtpRepository;
import com.voyara.tourguide.bookings.BookingRepository;
import com.voyara.tourguide.notifications.NotificationRepository;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import com.voyara.tourguide.users.Role;
import com.voyara.tourguide.users.RoleRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TourGuideService {
    private final TourGuideRepository repository;
    private final AppUserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;
    private final EmailVerificationOtpRepository otpRepository;

    public TourGuideService(TourGuideRepository repository, AppUserRepository userRepository, RoleRepository roleRepository,
                            PasswordEncoder passwordEncoder, BookingRepository bookingRepository,
                            NotificationRepository notificationRepository, EmailVerificationOtpRepository otpRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.bookingRepository = bookingRepository;
        this.notificationRepository = notificationRepository;
        this.otpRepository = otpRepository;
    }

    @Transactional(readOnly = true)
    public List<TourGuide> findAll() {
        List<TourGuide> guides = repository.findAll();
        guides.forEach(this::initializeCollections);
        return guides;
    }

    @Transactional(readOnly = true)
    public TourGuide findById(Long id) {
        TourGuide guide = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tour guide", id));
        initializeCollections(guide);
        return guide;
    }

    @Transactional
    public TourGuide save(TourGuide guide) {
        validateGuide(guide);
        guide.setRating(0.0);
        guide.setReviews(0);
        TourGuide saved = repository.save(guide);
        ensureStakeholderAccount(saved);
        saved = repository.save(saved);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public TourGuide update(Long id, TourGuide guide) {
        validateGuide(guide);
        TourGuide existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour guide", id));
        existing.setName(guide.getName());
        existing.setEmail(guide.getEmail());
        existing.setPhone(guide.getPhone());
        existing.setNationality(guide.getNationality());
        existing.setProfilePhoto(guide.getProfilePhoto());
        existing.setInitials(guide.getInitials());
        existing.setColor(guide.getColor());
        existing.setLocation(guide.getLocation());
        existing.setCountry(guide.getCountry());
        existing.setPricePerDay(guide.getPricePerDay());
        existing.setExperience(guide.getExperience());
        existing.setStatus(guide.getStatus());
        existing.setBio(guide.getBio());
        existing.setToursCompleted(guide.getToursCompleted());
        existing.getSpecialties().clear();
        existing.getLanguages().clear();
        if (guide.getSpecialties() != null) existing.getSpecialties().addAll(new ArrayList<>(guide.getSpecialties()));
        if (guide.getLanguages() != null) existing.getLanguages().addAll(new ArrayList<>(guide.getLanguages()));
        ensureStakeholderAccount(existing);
        initializeCollections(existing);
        return existing;
    }

    @Transactional
    public void delete(Long id) {
        TourGuide guide = findById(id);
        if (bookingRepository.existsByTourGuideId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This tour guide is referenced by existing bookings. Mark the guide unavailable instead.");
        }
        Long userId = guide.getUserId();
        repository.delete(guide);
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                notificationRepository.deleteByUserId(userId);
                otpRepository.deleteByUserId(userId);
                userRepository.delete(user);
            });
        }
    }

    private void validateGuide(TourGuide guide) {
        if (guide.getName() == null || guide.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guide name is required");
        }
        if (guide.getPricePerDay() != null && guide.getPricePerDay().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guide price per day cannot be negative");
        }
        if (guide.getExperience() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guide experience cannot be negative");
        }
        if (guide.getToursCompleted() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed tours cannot be negative");
        }
        String status = guide.getStatus();
        if (status == null || status.isBlank()) {
            guide.setStatus("Available");
        } else if (!List.of("Available", "Unavailable", "On Leave", "Busy", "Offline").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported guide status");
        }
        if (guide.getSpecialties() == null) guide.setSpecialties(new ArrayList<>());
        if (guide.getLanguages() == null) guide.setLanguages(new ArrayList<>());
    }

    private void initializeCollections(TourGuide guide) {
        if (guide.getSpecialties() != null) guide.getSpecialties().size();
        if (guide.getLanguages() != null) guide.getLanguages().size();
    }

    private void ensureStakeholderAccount(TourGuide guide) {
        if (guide.getEmail() == null || guide.getEmail().isBlank()) return;
        String email = guide.getEmail().trim().toLowerCase(Locale.ROOT);
        AppUser account = guide.getUserId() == null
                ? userRepository.findByEmailIgnoreCase(email).orElse(null)
                : userRepository.findById(guide.getUserId()).orElse(null);
        if (account == null) {
            account = new AppUser();
            account.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            account.setActive(false);
            account.setEmailVerified(false);
            account.setAccountStatus("Pending Invitation");
        } else if (!email.equalsIgnoreCase(account.getEmail())) {
            AppUser other = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (other != null && !other.getId().equals(account.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
            }
        }
        Role guideRole = roleRepository.findByRoleName("TOUR_GUIDE")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tour Guide access profile not found"));
        account.setFullName(guide.getName().trim());
        account.setEmail(email);
        account.setPhone(guide.getPhone());
        account.setStakeholderType("TOUR_GUIDE");
        account.setProfilePhoto(guide.getProfilePhoto());
        account.getRoles().clear();
        account.getRoles().add(guideRole);
        if (account.getAccountStatus() == null || account.getAccountStatus().isBlank()) account.setAccountStatus("Pending Invitation");
        guide.setUserId(userRepository.save(account).getId());
    }
}

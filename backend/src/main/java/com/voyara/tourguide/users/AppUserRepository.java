package com.voyara.tourguide.users;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("select u from AppUser u join u.roles r where r.roleName = :roleName order by u.createdAt desc")
    List<AppUser> findByRoleNameOrderByCreatedAtDesc(@Param("roleName") String roleName);

    boolean existsByRolesId(Long roleId);
}

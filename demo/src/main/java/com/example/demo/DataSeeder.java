package com.example.demo;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if our Genesis Admin already exists
        if (userRepository.findByEmail("admin@bookmyflight.com").isEmpty()) {
            
            User admin = new User();
            admin.setFullName("System Administrator");
            admin.setEmail("admin@bookmyflight.com");
            // Encrypting the password before saving it to the database!
            admin.setPassword(passwordEncoder.encode("Admin@123")); 
            admin.setRole("ADMIN"); // Granting the Admin role

            userRepository.save(admin);
            System.out.println("✅ Genesis Admin account created successfully.");
        } else {
            System.out.println("ℹ️ Genesis Admin account already exists. Skipping creation.");
        }
    }
}
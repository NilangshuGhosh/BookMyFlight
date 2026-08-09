package com.example.demo.dto;

public record AuthResponse(
    String token,
    String email,
    String role,
    Long userId
) {}
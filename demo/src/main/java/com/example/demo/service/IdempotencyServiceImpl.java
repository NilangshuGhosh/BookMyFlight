package com.example.demo.service;

import com.example.demo.entity.IdempotencyRecord;
import com.example.demo.repository.IdempotencyRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class IdempotencyServiceImpl implements IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyServiceImpl.class);

    private final IdempotencyRecordRepository repository;
    private final ObjectMapper objectMapper;

    @Value("${app.idempotency.ttl-hours:24}")
    private long ttlHours;

    public IdempotencyServiceImpl(IdempotencyRecordRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public String computeHash(Object request) {
        try {
            String json = objectMapper.writeValueAsString(request);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate SHA-256 request hash for idempotency", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> findValidRecord(Long userId, String idempotencyKey) {
        return repository.findByUserIdAndIdempotencyKey(userId, idempotencyKey)
                .filter(record -> record.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public IdempotencyRecord startOrGet(Long userId, String idempotencyKey, String requestHash, String endpoint) {
        Optional<IdempotencyRecord> existingOpt = repository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);

        if (existingOpt.isPresent()) {
            IdempotencyRecord existing = existingOpt.get();

            // Reject expired keys explicitly rather than silently resetting them
            if (existing.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException(
                        "Idempotency-Key has expired. Please generate a new key for new booking requests."
                );
            }

            // Validate payload hash to prevent key hijacking with different parameters
            if (!existing.getRequestHash().equals(requestHash)) {
                throw new IllegalArgumentException(
                        "Idempotency key was previously used with different request parameters."
                );
            }

            // If already completed, return existing record so cached response can be served
            if ("COMPLETED".equalsIgnoreCase(existing.getStatus())) {
                return existing;
            }

            // If in progress by another concurrent thread/request
            if ("IN_PROGRESS".equalsIgnoreCase(existing.getStatus())) {
                throw new IllegalStateException(
                        "A request with this Idempotency-Key is currently in progress. Please wait."
                );
            }
        }

        // Attempt atomic insert with IN_PROGRESS status
        try {
            LocalDateTime expiresAt = LocalDateTime.now().plusHours(ttlHours);
            IdempotencyRecord newRecord = new IdempotencyRecord(
                    userId,
                    idempotencyKey,
                    requestHash,
                    endpoint,
                    "IN_PROGRESS",
                    expiresAt
            );
            return repository.saveAndFlush(newRecord);
        } catch (DataIntegrityViolationException ex) {
            // PostgreSQL marks the current transaction block as aborted upon unique constraint violation.
            // Any follow-up SELECT in this transaction block would fail with PSQLException.
            // The unique constraint uq_user_idempotency_key proves another concurrent transaction
            // holds this key, so we reject with 409 Conflict immediately.
            throw new IllegalStateException(
                    "A request with this Idempotency-Key is currently in progress. Please wait."
            );
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void markCompleted(Long recordId, int statusCode, Object responseDto, Long bookingId) {
        IdempotencyRecord record = repository.findById(recordId)
                .orElseThrow(() -> new IllegalStateException("Idempotency record not found for ID: " + recordId));

        try {
            record.setStatus("COMPLETED");
            record.setResponseStatusCode(statusCode);
            record.setResponseBody(objectMapper.writeValueAsString(responseDto));
            record.setBookingId(bookingId);
            repository.saveAndFlush(record);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize and commit idempotent response for record ID: " + recordId, e);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void releaseOnFailure(Long recordId) {
        if (recordId != null) {
            repository.deleteById(recordId);
        }
    }

    @Override
    public <T> T deserialize(String json, Class<T> targetClass) {
        try {
            return objectMapper.readValue(json, targetClass);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to deserialize cached idempotent response", e);
        }
    }

    @Override
    @Scheduled(cron = "${app.idempotency.cleanup-cron:0 0 3 * * *}")
    @Transactional
    public int purgeExpiredRecords() {
        LocalDateTime now = LocalDateTime.now();
        int deleted = repository.purgeExpiredRecords(now);
        if (deleted > 0) {
            log.info("Purged {} expired idempotency records at {}", deleted, now);
        }
        return deleted;
    }
}

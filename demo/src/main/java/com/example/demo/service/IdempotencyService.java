package com.example.demo.service;

import com.example.demo.entity.IdempotencyRecord;

import java.util.Optional;

public interface IdempotencyService {

    /**
     * Computes a deterministic SHA-256 hex digest of the request payload.
     */
    String computeHash(Object request);

    /**
     * Looks up an existing, unexpired idempotency record for the given user.
     */
    Optional<IdempotencyRecord> findValidRecord(Long userId, String idempotencyKey);

    /**
     * Atomically creates an IN_PROGRESS idempotency record in a new transaction.
     * Throws IllegalStateException if another request with this key is already running.
     */
    IdempotencyRecord startOrGet(Long userId, String idempotencyKey, String requestHash, String endpoint);

    /**
     * Updates an in-progress record to COMPLETED, storing response metadata.
     */
    void markCompleted(Long recordId, int statusCode, Object responseDto, Long bookingId);

    /**
     * Releases (deletes) an in-progress record if the operation fails with a business error,
     * allowing the user to retry.
     */
    void releaseOnFailure(Long recordId);

    /**
     * Deserializes cached JSON payload into the target DTO class.
     */
    <T> T deserialize(String json, Class<T> targetClass);

    /**
     * Scheduled cleanup of expired records.
     */
    int purgeExpiredRecords();
}

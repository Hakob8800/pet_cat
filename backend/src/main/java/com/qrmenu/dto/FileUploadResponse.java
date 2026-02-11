package com.qrmenu.dto;

public record FileUploadResponse(
        String filename,
        String url,
        String contentType,
        long size
) {}

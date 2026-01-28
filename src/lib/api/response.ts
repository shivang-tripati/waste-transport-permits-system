import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    pagination?: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Pagination parameters from request
 */
export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

/**
 * Sorting parameters
 */
export interface SortParams {
    field: string;
    order: 'asc' | 'desc';
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: unknown;

    constructor(code: string, message: string, statusCode: number = 400, details?: unknown) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiError';
    }
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
    data: T,
    pagination?: PaginationMeta,
    status: number = 200
): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };

    if (pagination) {
        response.pagination = pagination;
    }

    return NextResponse.json(response, { status });
}

/**
 * Create an error response
 */
export function createErrorResponse(
    error: ApiError | Error | unknown,
    statusCode?: number
): NextResponse<ApiResponse<never>> {
    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                },
            },
            { status: error.statusCode }
        );
    }

    if (error instanceof Error) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: process.env.NODE_ENV === 'development'
                        ? error.message
                        : 'An unexpected error occurred',
                },
            },
            { status: statusCode || 500 }
        );
    }

    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
            },
        },
        { status: statusCode || 500 }
    );
}

/**
 * Parse pagination from URL search params
 */
export function parsePagination(
    searchParams: URLSearchParams,
    defaultLimit: number = 10,
    maxLimit: number = 100
): PaginationParams {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);
    const limit = Math.min(Math.max(1, rawLimit), maxLimit);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

/**
 * Parse sorting from URL search params
 */
export function parseSort(
    searchParams: URLSearchParams,
    allowedFields: string[],
    defaultField: string = 'createdAt',
    defaultOrder: 'asc' | 'desc' = 'desc'
): SortParams {
    const field = searchParams.get('sort') || defaultField;
    const order = (searchParams.get('order') || defaultOrder) as 'asc' | 'desc';

    // Validate field is allowed
    const validField = allowedFields.includes(field) ? field : defaultField;
    const validOrder = ['asc', 'desc'].includes(order) ? order : defaultOrder;

    return { field: validField, order: validOrder };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
    page: number,
    limit: number,
    total: number
): PaginationMeta {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Common error responses
 */
export const CommonErrors = {
    notFound: (resource: string) =>
        new ApiError('NOT_FOUND', `${resource} not found`, 404),

    unauthorized: (message?: string) =>
        new ApiError('UNAUTHORIZED', message || 'Authentication required', 401),

    forbidden: (message?: string) =>
        new ApiError('FORBIDDEN', message || 'You do not have permission to perform this action', 403),

    badRequest: (message: string, details?: unknown) =>
        new ApiError('BAD_REQUEST', message, 400, details),

    conflict: (message: string) =>
        new ApiError('CONFLICT', message, 409),

    validationError: (details: unknown) =>
        new ApiError('VALIDATION_ERROR', 'Validation failed', 400, details),

    internalError: (message?: string) =>
        new ApiError('INTERNAL_ERROR', message || 'An unexpected error occurred', 500),
};

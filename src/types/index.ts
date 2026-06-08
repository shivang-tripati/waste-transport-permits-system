export interface Evidence {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    description?: string;
    createdAt: string;
}

export interface PermitDetail {
    id: string;
    permitNumber: string;
    token: string;
    status: string;
    wasteType: string;
    estimatedWeight?: number;
    estimatedVolume?: number;
    wasteDescription?: string;
    pickupAddress: string;
    pickupCity: string;
    pickupState: string;
    pickupPincode: string;
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
    vehicleType?: string;
    validFrom?: string;
    validUntil?: string;
    rejectionReason?: string;
    createdAt: string;
    submittedAt?: string;
    approvedAt?: string;
    project: { id: string; name: string; address: string; city: string; company: { id: string; name: string } };
    plant: { id: string; name: string; code: string; address: string; city: string };
    user: { id: string; name: string; email: string; phone?: string };
    weighments: Array<{
        id: string;
        weighmentNumber: string;
        status: string;
        firstWeight?: number;
        secondWeight?: number;
        netWeight?: number;
        fileUrl?: string;
        weighedAt?: string;
    }>;
    wasteEvidences: Evidence[];
}



export interface UserDetail extends Record<string, any> {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    company?: {
        id: string;
        name: string;
        registrationNumber?: string;
        projects: Array<{ id: string, name: string, city: string }>;
    };
    identityDocuments: Array<{
        id: string;
        type: string;
        documentNumber: string;
        filePath?: string;
        isVerified: boolean;
    }>;
    recentPermits: Array<{
        id: string;
        permitNumber: string;
        status: string;
        createdAt: string;
        project?: { name: string };
        plant: { name: string };
    }>;
}
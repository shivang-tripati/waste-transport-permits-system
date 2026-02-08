"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, Button, Input, FileUpload } from "@/components/ui";
import { createPermitSchema, CreatePermitInput } from "@/schemas";
import { useAuth } from "@/hooks";
import { get, post } from "@/lib/api/client";
import { uploadEvidenceAsync } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { MapPinIcon } from "lucide-react";

interface Project {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Plant {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
}

interface EvidenceFile {
  url: string;
}

export default function NewPermitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

  // We can infer default role behavior
  const isCompanyUser = user?.role === "COMPANY_USER";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePermitInput>({
    resolver: zodResolver(createPermitSchema),
    shouldFocusError: true,
    defaultValues: {
      wasteType: "CND_SEGREGATED",
    },
  });

  console.log("errors", errors);

  const selectedProjectId = watch("projectId");

  useEffect(() => {


    const fetchData = async () => {
      try {
        // Fetch Plants (System controlled - maybe just active ones)
        const plantsRes = await get<Plant[]>("/plants", { limit: 100, isActive: true });
        if (plantsRes.success) {
          setPlants(plantsRes.data || []);
          // Pre-fill single plant if only one exists
          if (plantsRes.data && plantsRes.data.length === 1) {
            setValue("plantId", plantsRes.data[0].id);
          }
        }

        // Fetch Projects ONLY if Company User
        if (isCompanyUser) {
          const projectsRes = await get<Project[]>(
            "/projects",
            { limit: 100, isActive: true }
          );
          if (projectsRes.success) setProjects(projectsRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, isCompanyUser, setValue]);

  // Handle Project Selection Auto-fill
  useEffect(() => {
    if (selectedProjectId && isCompanyUser) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (project) {
        setValue("pickupAddress", project.address);
        setValue("pickupCity", project.city);
        setValue("pickupState", project.state);
        setValue("pickupPincode", project.pincode);
      }
    }
  }, [selectedProjectId, projects, isCompanyUser, setValue]);

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setValue("pickupLatitude", latitude, { shouldValidate: true });
        setValue("pickupLongitude", longitude, { shouldValidate: true });
        setLocLoading(false);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          if (!res.ok) {
            throw new Error("Reverse geocoding failed");
          }

          const data = await res.json();
          const address = data.address || {};

          // Best-effort mapping (Nominatim fields vary by country)
          setValue(
            "pickupAddress",
            data.display_name || `${latitude}, ${longitude}`,
            { shouldValidate: true }
          );

          setValue(
            "pickupCity",
            address.city || address.town || address.village || "",
            { shouldValidate: true }
          );

          setValue(
            "pickupState",
            address.state || "",
            { shouldValidate: true }
          );

          setValue(
            "pickupPincode",
            address.postcode || "",
            { shouldValidate: true }
          );
        } catch (err) {
          console.error(err);
          alert(
            "Location detected, but address could not be auto-filled. Please enter it manually."
          );
        }
        setLocLoading(false);
      },

      (error) => {
        setLocLoading(false);
        alert("Error fetching location: " + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const onSubmit: SubmitHandler<CreatePermitInput> = async (data) => {
    console.log("Submitting data:", data);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!isCompanyUser && data.projectId) {
      data.projectId = undefined;
    }

    try {
      // 1️⃣ Create Permit (ONLY this controls isSubmitting)
      const result = await post<{ id: string }>("/permits", {
        ...data,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "Failed to create permit");
      }

      const permitId = result.data.id;

      // 2️⃣ Fire-and-forget evidence upload
      if (evidenceFiles.length > 0) {
        await uploadEvidenceAsync(permitId, evidenceFiles);
      }

      // 3️⃣ Redirect immediately
      router.push(`/dashboard/permits/${permitId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create permit");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold mt-2">Create New Permit</h1>
        <p className="text-gray-500">
          {isCompanyUser
            ? "Select a project and verify details."
            : "Enter waste pickup details."}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}
            {Object.keys(errors).length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Please fix the highlighted fields before submitting.
              </div>
            )}

            {/* SECTION 1: ORIGIN (Project/Location) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Pickup Details
              </h3>

              <input type="hidden" {...register("pickupLatitude", { valueAsNumber: true })} />
              <input type="hidden" {...register("pickupLongitude", { valueAsNumber: true })} />


              {isCompanyUser ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Project
                  </label>
                  <select
                    {...register("projectId")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.city}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Address will be auto-filled from project.
                  </p>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                  >
                    <MapPinIcon className="w-4 h-4 mr-2" /> Use My Current Location
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Address *"
                  {...register("pickupAddress")}
                  error={errors.pickupAddress?.message}
                  readOnly={isCompanyUser && !!selectedProjectId}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City *"
                    {...register("pickupCity")}
                    error={errors.pickupCity?.message}
                    readOnly={isCompanyUser && !!selectedProjectId}
                  />
                  <Input
                    label="State *"
                    {...register("pickupState")}
                    error={errors.pickupState?.message}
                    readOnly={isCompanyUser && !!selectedProjectId}
                  />
                  <Input
                    label="Pincode *"
                    {...register("pickupPincode")}
                    error={errors.pickupPincode?.message}
                    readOnly={isCompanyUser && !!selectedProjectId}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: DESTINATION (Plant) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Destination Plant
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Plant *
                  </label>
                  <select
                    {...register("plantId")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Plant --</option>
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                  {errors.plantId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.plantId.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: WASTE DETAILS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Waste Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waste Type *
                  </label>
                  <select
                    {...register("wasteType")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CND_SEGREGATED">C&D Segregated</option>
                    <option value="CND_UNSEGREGATED">C&D Unsegregated</option>
                  </select>
                </div>
                <Input
                  label="Estimated Weight (kg)"
                  type="number"
                  {...register("estimatedWeight", { valueAsNumber: true })}
                  error={errors.estimatedWeight?.message}
                />
              </div>
              <Input
                label="Description"
                {...register("wasteDescription")}
                helperText="Briefly describe contents"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Evidence (Max 3 Images) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="border rounded p-2">
                      {evidenceFiles[i] ? (
                        <div className="relative">
                          <img
                            src={
                              evidenceFiles[i].url || "/placeholder-image.png"
                            }
                            alt="Evidence"
                            className="h-24 w-full object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = [...evidenceFiles];
                              newFiles.splice(i, 1);
                              setEvidenceFiles(newFiles);
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <FileUpload
                          label={`Image ${i + 1}`}
                          onUploadComplete={(data) =>
                            setEvidenceFiles([...evidenceFiles, data])
                          }
                          className={
                            evidenceFiles.length === i
                              ? ""
                              : "pointer-events-none opacity-50"
                          }
                          existingFilesCount={evidenceFiles.length}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Upload at least 1 image.
                </p>
              </div>
            </div>

            {/* SECTION 4: DRIVER & VALIDITY */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Transport Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Driver Name" {...register("driverName")} />
                <Input label="Driver Phone" {...register("driverPhone")} />
                <Input label="License Number" {...register("licenseNumber")} placeholder="HR1420230000001" />
                <Input label="Vehicle Number" {...register("vehicleNumber")} placeholder="HR51AB1234" />
                <Input
                  label="Vehicle Type"
                  {...register("vehicleType")}
                  placeholder="e.g. Truck, Dumper"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From
                  </label>

                  <input
                    type="datetime-local"
                    {...register("validFrom")}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg",
                      errors.validFrom && "border-red-500 focus:ring-red-500",
                    )}
                  />

                  {errors.validFrom && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.validFrom.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>

                  <input
                    type="datetime-local"
                    {...register("validUntil")}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg",
                      errors.validUntil && "border-red-500 focus:ring-red-500",
                    )}
                  />

                  {errors.validUntil && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.validUntil.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Permit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!isCompanyUser && (
        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded text-sm">
          <p>
            Note: Ensure you have uploaded your Identify Documents (PAN/Aadhaar)
            in your Profile settings before transit.
          </p>
        </div>
      )}
    </div>
  );
}

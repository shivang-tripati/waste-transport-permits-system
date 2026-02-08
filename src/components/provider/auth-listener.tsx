"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthListener({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const handler = () => router.push("/login");

        window.addEventListener("auth:logout", handler);
        return () => window.removeEventListener("auth:logout", handler);
    }, [router]);

    return <>{children}</>;
}

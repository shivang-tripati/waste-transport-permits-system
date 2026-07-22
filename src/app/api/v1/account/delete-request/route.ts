import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {

    try {

        const body = await req.json();

        const { email, phone, reason } = body;

        if (!email) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Email required",
                },
                {
                    status: 400,
                }
            );

        }

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        await prisma.accountDeletionRequest.create({

            data: {

                email,

                phone,

                reason,

                userId: user?.id,

            },

        });

        return NextResponse.json({

            success: true,

            message:
                "Deletion request submitted successfully.",

        });

    } catch {

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            {
                status: 500,
            }
        );

    }

}
"use client";

import { useState } from "react";

export default function DeleteAccountPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState({
        email: "",
        phone: "",
        reason: "",
    });

    async function submit(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);

        try {
            const res = await fetch("/api/v1/account/delete-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                alert("Unable to submit request.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 py-16">

            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-10">

                <h1 className="text-4xl font-bold mb-6">
                    Delete Your Account
                </h1>

                <p className="text-gray-600 mb-8">
                    If you would like to permanently delete your
                    <strong> Malba Free Gurugram </strong>
                    account, please submit the request below.
                </p>

                <div className="mb-8">

                    <h2 className="font-semibold text-lg mb-3">
                        Data Deleted
                    </h2>

                    <ul className="list-disc ml-6 space-y-2 text-gray-700">
                        <li>User profile</li>
                        <li>Login credentials</li>
                        <li>Refresh tokens</li>
                        <li>Identity documents</li>
                        <li>Notifications</li>
                    </ul>

                </div>

                <div className="mb-8">

                    <h2 className="font-semibold text-lg mb-3">
                        Data Retained
                    </h2>

                    <p className="text-gray-700">

                        Transport permit records, audit logs and
                        information required by law may be retained
                        for the legally required period.

                    </p>

                </div>

                {submitted ? (

                    <div className="rounded-lg bg-green-100 p-6">

                        <h2 className="font-bold text-xl">
                            Request Submitted
                        </h2>

                        <p className="mt-2">

                            Your account deletion request has been
                            received.

                            We normally process requests within
                            <strong> 7 working days.</strong>

                        </p>

                    </div>

                ) : (

                    <form
                        className="space-y-5"
                        onSubmit={submit}
                    >

                        <div>

                            <label>Email *</label>

                            <input
                                required
                                type="email"
                                className="w-full border rounded-lg p-3 mt-2"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        email: e.target.value,
                                    })
                                }
                            />

                        </div>

                        <div>

                            <label>Phone</label>

                            <input
                                className="w-full border rounded-lg p-3 mt-2"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        phone: e.target.value,
                                    })
                                }
                            />

                        </div>

                        <div>

                            <label>Reason</label>

                            <textarea
                                rows={5}
                                className="w-full border rounded-lg p-3 mt-2"
                                value={form.reason}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        reason: e.target.value,
                                    })
                                }
                            />

                        </div>

                        <button
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg"
                        >

                            {loading
                                ? "Submitting..."
                                : "Request Account Deletion"}

                        </button>

                    </form>

                )}

            </div>

        </main>
    );
}
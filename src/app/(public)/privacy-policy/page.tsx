import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

const SITE_URL = "https://malbafreegurugram.com";
const LAST_UPDATED = "23 July 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | Malba Free Gurugram Transport Permit System",
  description:
    "Read how Indo Enviro Integrated Solutions Ltd. collects, uses, stores, and protects personal data on the Malba Free Gurugram Construction & Demolition Waste Transport Permit System, including camera, storage, location and notification permissions, data retention, and account deletion.",
  keywords: [
    "Malba Free Gurugram Privacy Policy",
    "C&D Waste Transport Permit Privacy",
    "Gurugram Construction Waste Permit App",
    "Indo Enviro Integrated Solutions Privacy Policy",
    "Malba Free Gurugram Account Deletion",
    "Gurugram Municipal Waste Permit System",
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
  openGraph: {
    title: "Privacy Policy | Malba Free Gurugram Transport Permit System",
    description:
      "How Indo Enviro Integrated Solutions Ltd. collects, uses, and protects personal data on the Malba Free Gurugram C&D Waste Transport Permit System.",
    url: `${SITE_URL}/privacy-policy`,
    siteName: "Malba Free Gurugram",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | Malba Free Gurugram Transport Permit System",
    description:
      "How Indo Enviro Integrated Solutions Ltd. collects, uses, and protects personal data on the Malba Free Gurugram C&D Waste Transport Permit System.",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* <PublicHeader /> */}

      <main className="bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))]">
        {/* Hero Section */}
        <section className="bg-[hsl(var(--color-primary))] text-[hsl(0_0%_100%)]">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--color-primary-light))]">
              Indo Enviro Integrated Solutions Ltd.
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-3xl text-base text-[hsl(0_0%_100%)] sm:text-lg">
              This Privacy Policy explains how the Malba Free Gurugram Construction
              &amp; Demolition Waste Transport Permit System collects, uses, stores,
              shares, and protects your personal data across our website and
              Android application.
            </p>
            <p className="mt-6 inline-block rounded-full bg-[hsl(var(--color-primary-dark)/0.16)] px-4 py-1.5 text-sm text-[hsl(0_0%_100%)]">
              Last Updated: {LAST_UPDATED}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="space-y-14">
              <div className="block lg:hidden">
                <nav
                  aria-label="Table of contents"
                  className="mb-10 rounded-3xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-secondary))] p-6"
                >
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--color-muted-foreground))]">
                    On this page
                  </h2>
                  <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-[hsl(var(--color-primary))]">
                    <li><a href="#introduction" className="hover:underline">1. Introduction</a></li>
                    <li><a href="#scope" className="hover:underline">2. Scope of This Policy</a></li>
                    <li><a href="#information-we-collect" className="hover:underline">3. Information We Collect</a></li>
                    <li><a href="#how-we-use-information" className="hover:underline">4. How We Use Information</a></li>
                    <li><a href="#android-permissions" className="hover:underline">5. Android App Permissions</a></li>
                    <li><a href="#authentication" className="hover:underline">6. Authentication &amp; Session Security</a></li>
                    <li><a href="#government-processing" className="hover:underline">7. Government &amp; Regulatory Processing</a></li>
                    <li><a href="#data-sharing" className="hover:underline">8. Data Sharing</a></li>
                    <li><a href="#security" className="hover:underline">9. Security</a></li>
                    <li><a href="#data-retention" className="hover:underline">10. Data Retention</a></li>
                    <li><a href="#user-rights" className="hover:underline">11. Your Rights</a></li>
                    <li><a href="#account-deletion" className="hover:underline">12. Account Deletion</a></li>
                    <li><a href="#childrens-privacy" className="hover:underline">13. Children&apos;s Privacy</a></li>
                    <li><a href="#third-party-services" className="hover:underline">14. Third-Party Services</a></li>
                    <li><a href="#changes" className="hover:underline">15. Changes to This Policy</a></li>
                    <li><a href="#contact" className="hover:underline">16. Contact Us</a></li>
                  </ol>
                </nav>
              </div>

              {/* 1. Introduction */}
              <section id="introduction" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">1. Introduction</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>
                    The Malba Free Gurugram Transport Permit System (&quot;the
                    Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is
                    owned and operated by <strong>Indo Enviro Integrated Solutions
                      Ltd.</strong> (&quot;the Operator&quot;), a company engaged in
                    Construction &amp; Demolition (C&amp;D) waste collection, transport
                    monitoring, and processing services for Gurugram.
                  </p>
                  <p>
                    The Platform digitizes the end-to-end lifecycle of C&amp;D waste
                    transport permits — from permit application and approval to
                    vehicle tracking, QR code verification at checkpoints, and final
                    delivery confirmation at our waste processing plant. It is used by
                    Transporters, Drivers, Waste Generators, Companies, Projects,
                    Municipal Authorities, Plant Operators, and Administrators.
                  </p>
                  <p>
                    We understand that operating a permit and compliance system
                    requires handling sensitive personal, vehicular, and location
                    information, and we are committed to processing this data
                    lawfully, transparently, and only to the extent necessary to
                    deliver the service and meet our regulatory obligations to the
                    Municipal Corporation of Gurugram and other competent authorities.
                  </p>
                  <p>
                    This Policy is drafted to comply with the{" "}
                    <strong>Digital Personal Data Protection Act, 2023 (India)</strong>{" "}
                    (&quot;DPDP Act&quot;), the principles of the{" "}
                    <strong>General Data Protection Regulation (GDPR)</strong> where
                    applicable, and the{" "}
                    <strong>Google Play User Data Policy</strong> and{" "}
                    <strong>Google Play Account Deletion Policy</strong>. Under the
                    DPDP Act, the Operator acts as the &quot;Data Fiduciary&quot; in
                    respect of personal data processed through the Platform.
                  </p>
                </div>
              </section>

              {/* 2. Scope */}
              <section id="scope" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">2. Scope of This Policy</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>This Policy applies to all personal data collected through:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>The Malba Free Gurugram website and web dashboard.</li>
                    <li>The Malba Free Gurugram Android application.</li>
                    <li>
                      Any user role interacting with the Platform, including
                      Transporters, Drivers, Waste Generators, Companies, Project
                      Administrators, Municipal Authorities, Plant Operators, and
                      System Administrators.
                    </li>
                  </ul>
                  <p>
                    By registering on, logging into, or otherwise using the Platform
                    in any of these roles, you agree to the collection and use of
                    your information as described in this Policy.
                  </p>
                </div>
              </section>

              {/* 3. Information We Collect */}
              <section id="information-we-collect" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">3. Information We Collect</h2>
                <div className="mt-4 space-y-6 leading-relaxed">
                  <p>
                    We collect only the information required to register users,
                    process permits, verify identity, and meet legal and municipal
                    reporting obligations. This includes:
                  </p>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">3.1 Personal Information</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-6">
                      <li>Full name</li>
                      <li>Email address</li>
                      <li>Phone number</li>
                      <li>Password (stored in encrypted/hashed form, never in plain text)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">3.2 Driver Information</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-6">
                      <li>Driver name</li>
                      <li>Driving license number</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">3.3 Vehicle Information</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-6">
                      <li>Vehicle registration number</li>
                      <li>Vehicle type/category</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">3.4 Permit Information</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-6">
                      <li>Pickup address</li>
                      <li>Drop/disposal location</li>
                      <li>Waste category being transported</li>
                      <li>Associated company name</li>
                      <li>Associated project name/details</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">3.5 Identity Documents &amp; Images</h3>
                    <p className="mt-2">
                      Government-issued identity documents (such as driving licenses
                      and vehicle registration certificates) and photographs uploaded
                      for permit verification, driver identification, and vehicle
                      inspection at checkpoints or the weighbridge.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">3.6 Location Data</h3>
                    <p className="mt-2">
                      Precise GPS coordinates captured at the time of permit
                      application, pickup, transit, and drop-off, used to verify that
                      waste is transported along an authorized route to an approved
                      disposal site.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">3.7 Device &amp; Technical Information</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-6">
                      <li>Browser type and version</li>
                      <li>Device model, operating system, and app version</li>
                      <li>IP address</li>
                      <li>Server and application logs</li>
                      <li>Cookies and similar tracking technologies (web platform)</li>
                      <li>JWT authentication and refresh tokens</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 4. How We Use Information */}
              <section id="how-we-use-information" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">4. How We Use Information</h2>
                <div className="mt-4 leading-relaxed">
                  <p>We use the information described above to:</p>
                  <ul className="mt-3 list-disc space-y-2 pl-6">
                    <li><strong>Authenticate users</strong> — verify identity at login and maintain secure sessions.</li>
                    <li><strong>Process permits</strong> — review, approve, reject, and issue digital C&amp;D waste transport permits.</li>
                    <li><strong>Verify permits</strong> — enable QR-code-based checks by authorities, checkpoints, and plant operators.</li>
                    <li><strong>Ensure compliance</strong> — confirm that waste transport activity follows municipal C&amp;D waste rules.</li>
                    <li><strong>Support government reporting</strong> — supply required data to municipal authorities on request or as mandated by law.</li>
                    <li><strong>Send notifications</strong> — permit status updates, approval/rejection alerts, and service communications.</li>
                    <li><strong>Provide customer support</strong> — respond to queries, complaints, and technical issues.</li>
                    <li><strong>Maintain security</strong> — detect and prevent unauthorized access, fraud, or misuse of the Platform.</li>
                    <li><strong>Prevent fraud</strong> — identify duplicate, forged, or misused permits, documents, or vehicle details.</li>
                    <li><strong>Improve the Platform</strong> — aggregate, anonymized analytics on usage and permit volumes to improve performance and reliability.</li>
                    <li><strong>Meet legal obligations</strong> — comply with applicable Indian laws, court orders, and regulatory directions.</li>
                  </ul>
                </div>
              </section>

              {/* 5. Android Permissions */}
              <section id="android-permissions" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">5. Android App Permissions</h2>
                <div className="mt-4 space-y-5 leading-relaxed">
                  <p>
                    Our Android application requests only the permissions necessary
                    to operate core permit functions. We do not request or use any
                    permission beyond what is described below.
                  </p>

                  <div className="rounded-lg border border-[hsl(var(--color-border))] p-4">
                    <h3 className="font-semibold text-[hsl(var(--color-foreground))]">Camera Permission</h3>
                    <p className="mt-1">
                      Used to capture photographs of vehicles, waste loads, and
                      identity/permit documents at the time of permit application,
                      pickup, and drop-off verification. The camera is only accessed
                      when you actively choose to take a photo within the app.
                    </p>
                  </div>

                  <div className="rounded-lg border border-[hsl(var(--color-border))] p-4">
                    <h3 className="font-semibold text-[hsl(var(--color-foreground))]">Storage / File Access Permission</h3>
                    <p className="mt-1">
                      Used to let you select and upload existing photographs or
                      scanned identity documents (such as license or registration
                      copies) from your device, and to allow the app to save
                      generated digital permit PDFs to your device for offline
                      access.
                    </p>
                  </div>

                  <div className="rounded-lg border border-[hsl(var(--color-border))] p-4">
                    <h3 className="font-semibold text-[hsl(var(--color-foreground))]">Location Permission</h3>
                    <p className="mt-1">
                      Used to capture GPS coordinates at pickup and drop-off points
                      so that transport routes can be verified against the approved
                      permit route. Location is only captured during active permit
                      transactions, not continuously in the background.
                    </p>
                  </div>

                  <div className="rounded-lg border border-[hsl(var(--color-border))] p-4">
                    <h3 className="font-semibold text-[hsl(var(--color-foreground))]">Notification Permission</h3>
                    <p className="mt-1">
                      Used to send you alerts about permit approval, rejection,
                      expiry, and other status changes relevant to your account, so
                      you do not need to keep the app open to stay informed.
                    </p>
                  </div>

                  <div className="rounded-lg border border-[hsl(var(--color-border))] p-4">
                    <h3 className="font-semibold text-[hsl(var(--color-foreground))]">Internet Permission</h3>
                    <p className="mt-1">
                      Required for the app to communicate with our servers to submit
                      permit applications, retrieve permit status, sync data, and
                      deliver notifications. Without internet access, the app cannot
                      function.
                    </p>
                  </div>
                </div>
              </section>

              {/* 6. Authentication */}
              <section id="authentication" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">6. Authentication &amp; Session Security</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>
                    We use industry-standard <strong>JSON Web Tokens (JWT)</strong> to
                    authenticate users after login. Access tokens are short-lived and
                    are used to authorize requests to our Node.js/Express backend.
                  </p>
                  <p>
                    Authentication tokens and refresh tokens are stored in{" "}
                    <strong>secure, HTTP-only cookies</strong> where supported, to
                    reduce exposure to client-side scripts. Refresh tokens are used
                    to renew your session without requiring you to repeatedly
                    re-enter your password, and are automatically invalidated on
                    logout, password change, or after a period of inactivity.
                  </p>
                  <p>
                    All authentication traffic between your device and our servers is
                    encrypted using HTTPS/TLS.
                  </p>
                </div>
              </section>

              {/* 7. Government Processing */}
              <section id="government-processing" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">7. Government &amp; Regulatory Processing</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>
                    As a permit system operating within Gurugram&apos;s municipal
                    waste management framework, certain permit and transport data may
                    be processed by or shared with:
                  </p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Municipal Authorities (e.g., Municipal Corporation of Gurugram)</li>
                    <li>Relevant Government Agencies overseeing C&amp;D waste management</li>
                    <li>Law Enforcement Agencies, where legally required</li>
                    <li>Waste Processing Plants receiving the transported material</li>
                  </ul>
                  <p>
                    This sharing occurs <strong>only</strong> where necessary for
                    permit verification, checkpoint enforcement, regulatory
                    reporting, or to comply with a legal obligation, court order, or
                    lawful request from a competent authority. We do not share data
                    with government bodies for any purpose unrelated to C&amp;D waste
                    transport compliance.
                  </p>
                </div>
              </section>

              {/* 8. Data Sharing */}
              <section id="data-sharing" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">8. Data Sharing</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>
                    <strong>We do not sell your personal information</strong> to
                    anyone, for any purpose.
                  </p>
                  <p>We may share information only with the following categories of recipients, and only to the extent necessary:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Authorized Government Authorities, for permit verification and compliance reporting</li>
                    <li>Law Enforcement, when legally compelled to do so</li>
                    <li>Municipal Bodies overseeing C&amp;D waste transport in Gurugram</li>
                    <li>Waste Processing Plants, to confirm delivery and closure of a permit</li>
                    <li>Legal Service Providers, where required to protect our legal rights or comply with law</li>
                    <li>Email Service Providers (Zoho Mail), solely to deliver transactional emails and notifications</li>
                  </ul>
                  <p>
                    We do not share your personal data with advertisers, data
                    brokers, or unrelated third parties.
                  </p>
                </div>
              </section>

              {/* 9. Security */}
              <section id="security" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">9. Security</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>We apply a layered set of technical and organizational safeguards to protect your data:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Encryption</strong> — passwords are hashed, and sensitive data is encrypted at rest where applicable.</li>
                    <li><strong>HTTPS</strong> — all data transmitted between the app/website and our servers is encrypted in transit via TLS.</li>
                    <li><strong>Role-Based Access Control (RBAC)</strong> — users can only access data and functions relevant to their assigned role (Transporter, Driver, Company, Authority, Administrator, etc.).</li>
                    <li><strong>Audit Logs</strong> — key actions on permits and accounts are logged to support accountability and investigation of misuse.</li>
                    <li><strong>Secure Authentication</strong> — JWT-based sessions with secure, HTTP-only cookies and refresh-token rotation.</li>
                    <li><strong>Access Controls</strong> — administrative access to production systems is restricted to authorized personnel only.</li>
                    <li><strong>Monitoring</strong> — our systems are monitored for suspicious activity and unauthorized access attempts.</li>
                  </ul>
                  <p>
                    While we take these precautions seriously, no method of
                    transmission or storage is completely secure. We continuously
                    work to improve our safeguards.
                  </p>
                </div>
              </section>

              {/* 10. Data Retention */}
              <section id="data-retention" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">10. Data Retention</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>We retain personal data only for as long as necessary for the purposes described in this Policy, or as required by law:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Account Data</strong> (name, email, phone) — retained for as long as your account remains active, and for a limited period thereafter to handle disputes or legal requirements.</li>
                    <li><strong>Permit Records</strong> (applications, approvals, routes) — retained for the period required under municipal C&amp;D waste regulations, typically for the statutory record-keeping period applicable to waste transport compliance.</li>
                    <li><strong>Audit Logs</strong> — retained to support security investigations and regulatory accountability, in line with our internal retention schedule.</li>
                    <li><strong>Identity Documents</strong> — retained only as long as necessary to verify eligibility and for compliance record-keeping, after which they are securely deleted or anonymized.</li>
                  </ul>
                  <p>
                    Where we are required by Indian law, municipal regulation, or an
                    ongoing legal proceeding to retain specific records beyond the
                    periods above, we will do so only for the duration of that legal
                    obligation.
                  </p>
                </div>
              </section>

              {/* 11. User Rights */}
              <section id="user-rights" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">11. Your Rights</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>
                    Subject to applicable law, including the Digital Personal Data
                    Protection Act, 2023, you have the right to:
                  </p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Access</strong> the personal data we hold about you.</li>
                    <li><strong>Correct</strong> inaccurate or incomplete personal data.</li>
                    <li><strong>Request deletion</strong> of your personal data, subject to legal retention requirements.</li>
                    <li><strong>Restrict</strong> certain processing of your data.</li>
                    <li><strong>Withdraw consent</strong> for processing that is based on consent, without affecting the lawfulness of prior processing.</li>
                    <li><strong>Contact our support team</strong> with any privacy-related question, complaint, or request.</li>
                  </ul>
                  <p>
                    To exercise any of these rights, write to us at{" "}
                    <a href="mailto:info@malbafreegurugram.com" className="text-[hsl(var(--color-primary))] underline">
                      info@malbafreegurugram.com
                    </a>{" "}
                    or call our helpline at{" "}
                    <a href="tel:+919015339966" className="text-[hsl(var(--color-primary))] underline">
                      +91 90153 39966
                    </a>
                    . We will respond within a reasonable time and in accordance with
                    applicable law.
                  </p>
                </div>
              </section>

              {/* 12. Account Deletion */}
              <section id="account-deletion" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">12. Account Deletion</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>
                    You may request deletion of your account and associated personal
                    data at any time by visiting:{" "}
                    <Link href="/delete-account" className="font-semibold text-[hsl(var(--color-primary))] underline">
                      malbafreegurugram.com/delete-account
                    </Link>
                    . You can also submit a deletion request by emailing{" "}
                    <a href="mailto:info@malbafreegurugram.com" className="text-[hsl(var(--color-primary))] underline">
                      info@malbafreegurugram.com
                    </a>{" "}
                    from your registered email address, or by calling our helpline at{" "}
                    <a href="tel:+919015339966" className="text-[hsl(var(--color-primary))] underline">
                      +91 90153 39966
                    </a>
                    .
                  </p>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">What is deleted</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-6">
                      <li>Your name, email address, phone number, and password/credentials</li>
                      <li>Uploaded photographs and identity documents linked to your profile</li>
                      <li>Saved device and session information, including authentication and refresh tokens</li>
                      <li>Your profile association with driver, vehicle, or company records where you are the sole owner of that data</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">What may be retained</h3>
                    <p className="mt-2">
                      Certain records cannot be deleted immediately because they form
                      part of statutory compliance or ongoing legal/regulatory
                      obligations. This includes:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-6">
                      <li>Issued permit records required for municipal C&amp;D waste compliance and audit purposes</li>
                      <li>Audit logs required for security, fraud prevention, and regulatory accountability</li>
                      <li>Data subject to an active legal dispute, investigation, or government reporting obligation</li>
                    </ul>
                    <p className="mt-2">
                      Where data is retained for these reasons, it is restricted from
                      general use and kept solely for the applicable legal or
                      compliance purpose, then deleted once that purpose no longer
                      applies.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">Processing time</h3>
                    <p className="mt-2">
                      We process account deletion requests within{" "}
                      <strong>30 days</strong> of verification of your identity and
                      request. You will receive a confirmation once deletion is
                      complete.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">Legal exceptions</h3>
                    <p className="mt-2">
                      We may decline or delay deletion of specific data where
                      retention is required to comply with applicable law, resolve
                      disputes, enforce our agreements, or fulfil a legitimate
                      municipal/regulatory reporting obligation, as described above.
                    </p>
                  </div>
                </div>
              </section>

              {/* 13. Children's Privacy */}
              <section id="childrens-privacy" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">13. Children&apos;s Privacy</h2>
                <div className="mt-4 leading-relaxed">
                  <p>
                    The Malba Free Gurugram Transport Permit System is a professional
                    compliance platform intended for use by adult Transporters,
                    Drivers, Company representatives, Authorities, and
                    Administrators. It is <strong>not intended for use by
                      individuals under the age of 18</strong>, and we do not knowingly
                    collect personal data from minors. If we become aware that we
                    have inadvertently collected data from a minor, we will take
                    steps to delete it promptly.
                  </p>
                </div>
              </section>

              {/* 14. Third-Party Services */}
              <section id="third-party-services" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">14. Third-Party Services</h2>
                <div className="mt-4 space-y-4 leading-relaxed">
                  <p>We rely on a limited number of third-party services to operate the Platform:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Zoho Mail</strong> — used to send transactional and account-related emails, such as verification, notifications, and support communication.</li>
                    <li><strong>Government &amp; Municipal Systems</strong> — used to submit or verify permit and compliance data with relevant municipal and regulatory authorities, where required.</li>
                    <li><strong>Google Play Services</strong> — used, where applicable, to distribute and update the Android application through the Google Play Store.</li>
                  </ul>
                  <p>
                    We do not integrate with advertising networks, social media
                    trackers, or data broker services.
                  </p>
                </div>
              </section>

              {/* 15. Changes */}
              <section id="changes" className="scroll-mt-24 mb-14">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">15. Changes to This Policy</h2>
                <div className="mt-4 leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time to reflect
                    changes in our practices, technology, legal requirements, or
                    Platform features. When we make material changes, we will update
                    the &quot;Last Updated&quot; date at the top of this page and, where
                    appropriate, notify you through the Platform or by email. We
                    encourage you to review this Policy periodically.
                  </p>
                </div>
              </section>

              {/* 16. Contact */}
              <section id="contact" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))]">16. Contact Us</h2>
                <div className="mt-4 space-y-2 leading-relaxed">
                  <p>
                    If you have any questions, concerns, or requests regarding this
                    Privacy Policy or how your data is handled, please contact:
                  </p>
                  <div className="mt-4 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-secondary))] p-6">
                    <p className="font-semibold text-[hsl(var(--color-foreground))]">Indo Enviro Integrated Solutions Ltd.</p>
                    <p className="mt-1">Indo Enviro Waste Management Plant</p>
                    <p>Basai Plant, DLF Cyber City</p>
                    <p>Gurugram, Haryana 122001</p>
                    <p className="mt-3">
                      Email:{" "}
                      <a href="mailto:info@malbafreegurugram.com" className="text-[hsl(var(--color-primary))] underline">
                        info@malbafreegurugram.com
                      </a>
                    </p>
                    <p>
                      Helpline:{" "}
                      <a href="tel:+919015339966" className="text-[hsl(var(--color-primary))] underline">
                        +91 90153 39966
                      </a>
                    </p>
                  </div>
                </div>
              </section>
            </article>

            <aside className="hidden lg:block">
              <nav
                aria-label="Table of contents"
                className="sticky top-24 space-y-6 rounded-3xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-secondary))] p-6 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--color-muted-foreground))]">
                    On this page
                  </p>
                  <p className="mt-2 text-sm text-[hsl(var(--color-foreground))]">
                    Quickly jump to the section you want to read.
                  </p>
                </div>
                <ol className="grid grid-cols-1 gap-y-2 text-sm text-[hsl(var(--color-primary))]">
                  <li><a href="#introduction" className="hover:underline">1. Introduction</a></li>
                  <li><a href="#scope" className="hover:underline">2. Scope of This Policy</a></li>
                  <li><a href="#information-we-collect" className="hover:underline">3. Information We Collect</a></li>
                  <li><a href="#how-we-use-information" className="hover:underline">4. How We Use Information</a></li>
                  <li><a href="#android-permissions" className="hover:underline">5. Android App Permissions</a></li>
                  <li><a href="#authentication" className="hover:underline">6. Authentication &amp; Session Security</a></li>
                  <li><a href="#government-processing" className="hover:underline">7. Government &amp; Regulatory Processing</a></li>
                  <li><a href="#data-sharing" className="hover:underline">8. Data Sharing</a></li>
                  <li><a href="#security" className="hover:underline">9. Security</a></li>
                  <li><a href="#data-retention" className="hover:underline">10. Data Retention</a></li>
                  <li><a href="#user-rights" className="hover:underline">11. Your Rights</a></li>
                  <li><a href="#account-deletion" className="hover:underline">12. Account Deletion</a></li>
                  <li><a href="#childrens-privacy" className="hover:underline">13. Children&apos;s Privacy</a></li>
                  <li><a href="#third-party-services" className="hover:underline">14. Third-Party Services</a></li>
                  <li><a href="#changes" className="hover:underline">15. Changes to This Policy</a></li>
                  <li><a href="#contact" className="hover:underline">16. Contact Us</a></li>
                </ol>
              </nav>
            </aside>
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}

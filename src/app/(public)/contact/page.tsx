'use client';

import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Start fake loading
    setTimeout(() => {
        setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      
      <main className="flex-grow">
        <div className="bg-primary py-12 text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto px-4">
            Have questions? We're here to help.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-12">
                
                {/* Contact Info */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h2>
                        <p className="text-gray-600">
                            Our support team is available Mon-Fri, 9 AM to 6 PM to assist you with any issues related to the Transport Permit System.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Head Office</h3>
                                <p className="text-gray-600">
                                    Indo Enviro Waste Management Plant,<br />
                                    Basai Plant, DLF Cyber City<br />
                                    Gurugram, Haryana, 122001
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Email Us</h3>
                                {/* <p className="text-gray-600">support@tps-system.gov.in</p> */}
                                <p className="text-gray-600">info@malbafreegurugram.com</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Helpline</h3>
                                <p className="text-gray-600">+91 9015339966</p>
                                {/* <p className="text-gray-600">011-2345-6789</p> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardContent className="p-8">
                        {submitted ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                <p className="text-gray-600">Thank you for contacting us. We will get back to you shortly.</p>
                                <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>Send Another</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <h3 className="text-xl font-semibold mb-6">Send us a message</h3>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input label="Name" placeholder="Your Name" required />
                                    <Input label="Email" type="email" placeholder="your@email.com" required />
                                </div>
                                <Input label="Subject" placeholder="How can we help?" required />
                            
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Message</label>
                                    <textarea 
                                        className="w-full min-h-[150px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        placeholder="Write your message here..."
                                        required
                                    ></textarea>
                                </div>

                                <Button type="submit" className="w-full">Send Message</Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>

      {/* <PublicFooter /> */}
    </div>
  );
}

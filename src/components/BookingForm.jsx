import React from 'react';

export function BookingForm({ formData, onChange, error }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...formData, [name]: value });
    };

    return (
        <div className="space-y-4 pt-4 border-t border-brand-200">
            <h2 className="text-lg font-bold text-brand-900">5. Your Details</h2>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="booker_name"
                        value={formData.booker_name || ''}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-2 rounded-lg border border-brand-300 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1">Email <span className="text-gray-400">(optional)</span></label>
                    <input
                        type="email"
                        name="booker_email"
                        value={formData.booker_email || ''}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2 rounded-lg border border-brand-300 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
                    <input
                        type="tel"
                        name="booker_phone"
                        value={formData.booker_phone || ''}
                        onChange={handleChange}
                        placeholder="+1 555 000 0000"
                        className="w-full px-4 py-2 rounded-lg border border-brand-300 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}

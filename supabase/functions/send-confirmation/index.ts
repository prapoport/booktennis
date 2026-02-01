import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
    booking_id: string;
    email: string;
    booker_name: string;
    booking_date: string;
    start_time: string;
    court_name: string;
    house_name: string;
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { booking_id, email, booker_name, booking_date, start_time, court_name, house_name } = await req.json() as BookingRequest;

        if (!RESEND_API_KEY) {
            throw new Error("Missing RESEND_API_KEY");
        }

        // Format date nicely (Assuming YYYY-MM-DD)
        const dateObj = new Date(booking_date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        // Send email using Resend API
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Los Naranjos Reservations <reservations@booktennis.cc>",
                to: [email],
                subject: `Booking Confirmed: ${court_name} on ${dateStr}`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8a6a5c;">Booking Confirmed!</h1>
            <p>Hola <strong>${booker_name}</strong>,</p>
            <p>Your reservation for <strong>${house_name}</strong> has been confirmed.</p>
            
            <div style="background-color: #f2e8e5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Court:</strong> ${court_name}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${dateStr}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${start_time}</p>
            </div>

            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This email is automatically generated. Please do not reply to this email as it is not monitored.
            </p>
            <p style="font-size: 12px; color: #ccc; text-align: center;">
              Ref: ${booking_id}
            </p>
          </div>
        `,
            }),
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: res.ok ? 200 : 400,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

import { serve } from "https://deno.land/std/http/server.ts";
import { Resend } from "npm:resend@3.2.0";

serve(async (req) => {
  try {
    const { email } = await req.json();
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    await resend.emails.send({
      from: "AI Outfit Rater <hello@outfitrater.xyz>",
      to: email,
      subject: "Welcome to AI Outfit Rater!",
      html: "<h1>Welcome!</h1><p>Your AI stylist is ready.</p>",
    });

    return new Response("OK");
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
});

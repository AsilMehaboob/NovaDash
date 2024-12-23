"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/utils/supabaseClient";

const StartPage = dynamic(() => import("@/components/StartPage"), {
  ssr: false,
});

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      } else {
        window.location.href = "/signin";
      }
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        window.location.href = "/auth"; // Handle session expiration
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  if (loading) {
    return <p></p>; //loading
  }

  if (!user) {
    return null; // Avoid rendering StartPage until user data is fetched
  }

  return <StartPage />;
}

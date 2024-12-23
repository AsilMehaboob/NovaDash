"use client";

import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function Auth() {
  const router = useRouter();

  const handleAuth = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Error logging in:", error.message);
      return;
    }

    const user = data.user;

    if (user) {
      const displayname = user.user_metadata.full_name || user.email;

      try {
        const { error: dbError } = await supabase
          .from("leaderboard")
          .upsert(
            { displayname: displayname, rank: 0, highscore: 0 },
            { onConflict: "displayname" }
          );

        if (dbError) {
          console.error("Error updating leaderboard:", dbError.message);
        } else {
          console.log("Leaderboard updated successfully!");
        }

        router.push("/");
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <button
        onClick={handleAuth}
        className="flex items-center justify-center px-6 py-3 bg-black border border-gray-700 rounded-full shadow-md text-white hover:bg-gray-800 transition-all duration-300"
      >
        <img
          src="https://pluspng.com/img-png/google-logo-png-open-2000.png"
          alt="Google logo"
          className="w-5 h-5"
        />
      </button>
    </div>
  );
}

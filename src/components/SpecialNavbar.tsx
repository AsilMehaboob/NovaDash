"use client";

import React from "react";
import Image from "next/image";
import { Menu, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

import EXCEL_LOGO from "@/assets/images/excel.png";

export default function NavbarProfileLogo() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error.message);
        alert("Failed to log out. Please try again.");
        return;
      }

      console.log("Logged out successfully.");
      router.push("/auth");
    } catch (err) {
      console.error("Unexpected error during logout:", err);
    }
  };

  return (
    <div className="w-full navBorder max-h-[82px] h-full absolute z-10 top-0">
      <div className="flex items-center justify-between px-[25px] py-2 backdrop-blur-[12px] w-full max-h-[96px] h-full navStyle">
        <a href="./" className="flex shrink-0 items-center">
          <Image alt="Excel '24" src={EXCEL_LOGO} className="h-[42px] w-auto" />
        </a>

        <div className="relative flex rounded-full">
          <Menu as="div" className="relative inline-block text-left">
            <div className="h-fit flex border-2 border-gray-700 rounded-full">
              <Menu.Button>
                <img
                  alt="Profile"
                  src="https://i.pinimg.com/736x/c1/01/27/c10127cfeefd05a9bc1c337b421395c7.jpg"
                  className="w-[38px] h-[38px] rounded-full cursor-pointer"
                />
              </Menu.Button>
            </div>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-3 w-[132px] origin-top-right text-white z-10 rounded-[17px] bg-black max-h-[52px] flex justify-center items-center py-[6px] border-white border">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`group flex rounded-sm items-center w-full p-2 text-lg`}
                      >
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
}

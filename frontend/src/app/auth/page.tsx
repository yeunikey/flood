'use client'

import AuthWidget from "@/widgets/auth/AuthWidget";
import CodeModal from "@/widgets/auth/modal/CodeModal";

export default function AuthPage() {

    return (
        <div className="h-dvh w-full px-6 py-20 flex gap-16">

            <CodeModal />

            <div className="w-full h-full flex justify-center items-center">
                <AuthWidget />
            </div>
        </div >
    );
}
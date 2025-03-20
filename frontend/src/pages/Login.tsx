import { SignInOrUpForm } from "app";
import { Header } from "../components/Header";

export default function Login() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <Header />
      
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md p-8 border-2 border-black bg-white relative">
          <div className="absolute -left-4 -top-4 w-full h-full border-2 border-black bg-[#e6e6e6] z-0"></div>
          <div className="relative z-10">
            <div className="mb-6 inline-block">
              <span className="font-mono text-sm bg-black text-white px-2 py-1">SECURE ACCESS</span>
            </div>
            <h1 className="text-3xl font-serif font-bold mb-6">
              <span className="font-mono text-xl">///</span> Sign In to LexForge
            </h1>
            <p className="mb-8 text-gray-700">
              Access your account to manage and generate legal documents.
            </p>
            <SignInOrUpForm signInOptions={{ google: true, emailAndPassword: true }} />
          </div>
        </div>
      </div>
    </div>
  );
};
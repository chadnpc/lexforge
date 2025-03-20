import React from "react";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import { FeatureCard } from "../components/FeatureCard";
import { DocumentTypeCard } from "../components/DocumentTypeCard";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "app";

export default function App() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <Header />
      
      {/* Hero Section */}
      <section className="relative border-b-2 border-black bg-white">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <div className="mb-6 inline-block">
                <span className="font-mono text-sm bg-black text-white px-2 py-1">LEGAL DOCUMENT GENERATOR</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight">
                <span className="font-mono text-xl md:text-2xl">//</span> Your Ultimate Legal <br /> Document <span className="font-mono">{">"}</span> Platform
              </h1>
              <p className="text-lg mb-8 text-gray-700">
                Generate professional legal documents in minutes using AI. Save time, reduce costs, and ensure legal compliance for your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="brutalist" 
                  size="lg"
                  onClick={() => user ? navigate('/dashboard') : navigate('/login')}
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => document.getElementById('document-types')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View Samples
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative w-full aspect-square border-2 border-black bg-white p-6">
                <div className="absolute -left-4 -top-4 w-full h-full border-2 border-black bg-[#e6e6e6]"></div>
                <div className="relative z-10 h-full w-full flex flex-col">
                  <div className="flex-1 p-4 border-2 border-black bg-white mb-4 overflow-hidden">
                    <div className="font-mono text-sm mb-3">/// DOCUMENT PREVIEW</div>
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-100 w-full border-b border-gray-300"></div>
                      <div className="h-4 bg-gray-100 w-3/4"></div>
                      <div className="h-4 bg-gray-100 w-5/6"></div>
                      <div className="h-4 bg-gray-100 w-4/5"></div>
                      <div className="h-12 bg-gray-100 w-full mt-4"></div>
                      <div className="h-4 bg-gray-100 w-3/4"></div>
                      <div className="h-4 bg-gray-100 w-full"></div>
                      <div className="h-4 bg-gray-100 w-5/6"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square border-2 border-black p-2 flex items-center justify-center bg-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div className="aspect-square border-2 border-black p-2 flex items-center justify-center bg-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="container mx-auto border-t-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
            <div className="p-6 flex flex-col">
              <span className="text-3xl font-bold font-serif mb-1">100+</span>
              <span className="text-gray-600">Legal Templates</span>
            </div>
            <div className="p-6 flex flex-col">
              <span className="text-3xl font-bold font-serif mb-1">5,000+</span>
              <span className="text-gray-600">Documents Generated</span>
            </div>
            <div className="p-6 flex flex-col">
              <span className="text-3xl font-bold font-serif mb-1">99%</span>
              <span className="text-gray-600">Customer Satisfaction</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 border-b-2 border-black bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="font-mono text-sm">/// SERVICES</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-4">AI-Powered Legal Solutions</h2>
            <p className="text-lg text-gray-700">
              LexForge uses advanced AI to create professional legal documents tailored to your specific needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              title="AI Document Generation"
              description="Create legally sound documents in minutes using our advanced GPT-4 powered system."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="m9 15 3 3 3-3"></path></svg>}
            />
            <FeatureCard 
              title="Professional PDF Format"
              description="Get beautifully formatted PDF documents ready for immediate use and distribution."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 15h10"></path><path d="m5 12-3 3 3 3"></path></svg>}
            />
            <FeatureCard 
              title="Legal Compliance"
              description="Documents tailored to specific jurisdictions and industry requirements for full compliance."
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
            />
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 border-b-2 border-black bg-[#e6e6e6]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="font-mono text-sm">/// HOW TO</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-4">Create Documents in 3 Steps</h2>
            <p className="text-lg text-gray-700">
              Our streamlined process makes document generation simple and efficient.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative p-6 border-2 border-black bg-white">
              <div className="absolute -top-5 -left-5 w-10 h-10 flex items-center justify-center bg-black text-white font-bold border-2 border-black">
                1
              </div>
              <h3 className="text-xl font-bold font-serif mb-3 mt-2">Select Document Type</h3>
              <p className="text-gray-700 mb-4">
                Choose from our library of legal document templates for your specific needs.
              </p>
              <div className="h-32 border-2 border-black p-3 bg-white">
                <div className="grid grid-cols-2 gap-2 h-full">
                  <div className="bg-gray-100 p-2 flex items-center justify-center border border-gray-300">
                    <span className="text-xs font-mono">NDA</span>
                  </div>
                  <div className="bg-gray-100 p-2 flex items-center justify-center border border-gray-300">
                    <span className="text-xs font-mono">TOS</span>
                  </div>
                  <div className="bg-gray-100 p-2 flex items-center justify-center border border-gray-300">
                    <span className="text-xs font-mono">Privacy</span>
                  </div>
                  <div className="bg-gray-100 p-2 flex items-center justify-center border border-gray-300">
                    <span className="text-xs font-mono">+More</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative p-6 border-2 border-black bg-white">
              <div className="absolute -top-5 -left-5 w-10 h-10 flex items-center justify-center bg-black text-white font-bold border-2 border-black">
                2
              </div>
              <h3 className="text-xl font-bold font-serif mb-3 mt-2">Enter Your Details</h3>
              <p className="text-gray-700 mb-4">
                Provide specific information needed to customize your legal document.
              </p>
              <div className="h-32 border-2 border-black p-3 bg-white">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-100 w-full border border-gray-300"></div>
                  <div className="h-6 bg-gray-100 w-full border border-gray-300"></div>
                  <div className="h-6 bg-gray-100 w-full border border-gray-300"></div>
                </div>
              </div>
            </div>
            
            <div className="relative p-6 border-2 border-black bg-white">
              <div className="absolute -top-5 -left-5 w-10 h-10 flex items-center justify-center bg-black text-white font-bold border-2 border-black">
                3
              </div>
              <h3 className="text-xl font-bold font-serif mb-3 mt-2">Generate & Download</h3>
              <p className="text-gray-700 mb-4">
                Our AI creates your document, which you can instantly download as a PDF.
              </p>
              <div className="h-32 border-2 border-black p-3 bg-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Document Types Section */}
      <section id="document-types" className="py-16 md:py-24 border-b-2 border-black bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="font-mono text-sm">/// SELECT DOCUMENT TYPE</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-4">Popular Legal Documents</h2>
            <p className="text-lg text-gray-700">
              Choose from our extensive library of legal templates to get started.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DocumentTypeCard 
              title="Non-Disclosure Agreement"
              description="Protect your confidential information when sharing with partners, employees, or contractors."
              onClick={() => user ? navigate('/dashboard') : navigate('/login')}
            />
            <DocumentTypeCard 
              title="Terms of Service"
              description="Establish the rules and guidelines for using your website or application services."
              onClick={() => user ? navigate('/dashboard') : navigate('/login')}
            />
            <DocumentTypeCard 
              title="Privacy Policy"
              description="Inform users about how you collect, use, and protect their personal information."
              onClick={() => user ? navigate('/dashboard') : navigate('/login')}
            />
            <DocumentTypeCard 
              title="Employment Contract"
              description="Define the employment relationship between your company and employees."
              onClick={() => user ? navigate('/dashboard') : navigate('/login')}
            />
            <DocumentTypeCard 
              title="Business Contract"
              description="Formalize business agreements and outline responsibilities between parties."
              onClick={() => user ? navigate('/dashboard') : navigate('/login')}
            />
            <DocumentTypeCard 
              title="View All Documents"
              description="Browse our complete library of legal document templates for various needs."
              className="bg-gray-100"
              onClick={() => user ? navigate('/dashboard') : navigate('/login')}
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="font-mono text-sm text-gray-400">/// GET STARTED</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-6">
              Ready to Create Your Legal Documents?
            </h2>
            <p className="text-lg mb-8 text-gray-300">
              Join thousands of businesses using LexForge to generate professional legal documents quickly and affordably.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                variant="brutalist" 
                size="lg" 
                className="bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]"
                onClick={() => user ? navigate('/dashboard') : navigate('/login')}
              >
                Create Your First Document
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t-2 border-black py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-black text-white font-bold">
                  L
                </div>
                <span className="font-serif text-lg font-bold">LexForge</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                AI-powered legal document generation for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-serif font-bold mb-4">Documents</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Non-Disclosure Agreement</a></li>
                <li><a href="#" className="hover:underline">Terms of Service</a></li>
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Employment Contract</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-serif font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">About Us</a></li>
                <li><a href="#" className="hover:underline">Contact</a></li>
                <li><a href="#" className="hover:underline">Blog</a></li>
                <li><a href="#" className="hover:underline">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-serif font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Terms</a></li>
                <li><a href="#" className="hover:underline">Privacy</a></li>
                <li><a href="#" className="hover:underline">Cookies</a></li>
                <li><a href="#" className="hover:underline">Licenses</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} LexForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
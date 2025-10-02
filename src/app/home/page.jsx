"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Shield, Database, Users, Fingerprint, ArrowRight, Menu, X, Check } from 'lucide-react';

export default function CertiVaultLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-slate-900/90 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                CertiVault
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
                <a href="#roles" className="hover:text-cyan-400 transition-colors">User Roles</a>
                <a href="#team" className="hover:text-cyan-400 transition-colors">Team</a>
                <button 
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  Login
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 hover:text-cyan-400">Features</a>
              <a href="#roles" className="block px-3 py-2 hover:text-cyan-400">User Roles</a>
              <a href="#team" className="block px-3 py-2 hover:text-cyan-400">Team</a>
              <button 
                onClick={handleLogin}
                className="w-full text-left px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-md"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm">
              <Fingerprint className="w-4 h-4 mr-2 text-cyan-400" />
              Next-Generation Certificate Security
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent leading-tight">
            CertiVault
          </h1>
          
          <p className="text-xl sm:text-2xl mb-8 text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Advanced blockchain-powered certificate management system with military-grade AES encryption, 
            IPFS distributed storage, and digital signature verification for academic institutions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleLogin}
              className="group bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#features" className="px-8 py-4 rounded-full border border-slate-700 hover:border-cyan-500 transition-colors text-lg font-semibold">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Advanced Security Features
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Built with cutting-edge technology to ensure maximum security and reliability for academic credentials
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "AES Encryption",
                description: "Military-grade AES encryption ensures your certificates and transcripts are completely secure"
              },
              {
                icon: Database,
                title: "IPFS Storage",
                description: "Decentralized storage on IPFS ensures permanent availability and prevents single points of failure"
              },
              {
                icon: Fingerprint,
                title: "Digital Signatures",
                description: "Advanced digital signature and verification module ensures authenticity of all certificates"
              },
              {
                icon: Users,
                title: "Role-Based Access",
                description: "Sophisticated access control enables controlled sharing of student records with authorized parties"
              }
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-800/70 transform hover:-translate-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-cyan-400">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Secure Role-Based System
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Three specialized user roles designed for seamless certificate management and verification
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🎓",
                title: "Students",
                description: "Secure storage and management of your academic certificates and transcripts",
                features: [
                  "Upload certificates with AES encryption",
                  "View and manage all academic records",
                  "Send verification requests to institutions",
                  "Share verified documents with employers",
                  "Digital signature verification"
                ]
              },
              {
                icon: "🏛️",
                title: "Institutions",
                description: "Streamlined certificate issuance and verification process",
                features: [
                  "Review verification requests",
                  "Approve or reject submissions",
                  "Issue digitally signed certificates",
                  "Track verification history",
                  "Maintain authenticity records"
                ]
              },
              {
                icon: "💼",
                title: "Verifiers/Employers",
                description: "Access verified academic credentials with complete confidence",
                features: [
                  "View shared certificates from students",
                  "Verify authenticity instantly",
                  "Access detailed verification status",
                  "Trust in document integrity",
                  "Role-based access control"
                ]
              }
            ].map((role, index) => (
              <div key={index} className="group">
                <div className="bg-slate-800/30 border border-slate-700 rounded-3xl p-8 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-800/50 transform hover:-translate-y-2">
                  <div className="text-6xl mb-6">{role.icon}</div>
                  <h3 className="text-2xl font-bold mb-4 text-cyan-400">{role.title}</h3>
                  <p className="text-slate-300 mb-6 leading-relaxed">{role.description}</p>
                  <ul className="space-y-3">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-slate-400">
                        <Check className="w-4 h-4 mr-3 text-cyan-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Meet Our Team
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Expert developers and security specialists dedicated to revolutionizing certificate management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Alex Johnson",
                role: "Lead Developer",
                specialty: "Blockchain & Security Expert",
                avatar: "👨‍💻"
              },
              {
                name: "Sarah Chen",
                role: "Frontend Developer",
                specialty: "UI/UX Design Specialist",
                avatar: "👩‍💻"
              },
              {
                name: "Mike Rodriguez",
                role: "Backend Developer",
                specialty: "IPFS & Encryption Expert",
                avatar: "👨‍💼"
              },
              {
                name: "Dr. Emily Watson",
                role: "Security Consultant",
                specialty: "Cryptography Researcher",
                avatar: "👩‍🔬"
              }
            ].map((member, index) => (
              <div key={index} className="group">
                <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8 text-center transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-800/50 transform hover:-translate-y-2">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                    {member.avatar}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-cyan-400">{member.name}</h3>
                  <p className="text-slate-300 mb-2">{member.role}</p>
                  <p className="text-sm text-slate-500">{member.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              CertiVault
            </span>
          </div>
          <p className="text-slate-400 mb-2">
            © 2025 CertiVault. All rights reserved. Built with 💜 for secure certificate management.
          </p>
          <p className="text-slate-500 text-sm">
            Powered by AES encryption, IPFS distributed storage, and digital signature verification.
          </p>
        </div>
      </footer>
    </div>
  );
}
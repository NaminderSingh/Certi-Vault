"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  Shield, 
  Upload, 
  FileText, 
  User, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Award
} from "lucide-react";
import Link from "next/link";

export default function UploadCertificate() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { data: session } = useSession();

  const steps = [
    { text: "Validating certificate data...", duration: 1000 },
    { text: "Encrypting with AES-256...", duration: 1500 },
    { text: "Uploading to IPFS network...", duration: 2000 },
    { text: "Generating secure hash...", duration: 800 },
    { text: "Storing encrypted metadata...", duration: 1200 },
    { text: "Certificate uploaded successfully!", duration: 500 }
  ];

  const simulateProgress = async () => {
    setProgress(0);
    let totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
    let elapsed = 0;

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].text);
      
      await new Promise(resolve => {
        setTimeout(() => {
          elapsed += steps[i].duration;
          setProgress((elapsed / totalDuration) * 100);
          resolve();
        }, steps[i].duration);
      });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      
      if (allowedTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setMessage("");
        setMessageType("");
      } else {
        setMessage("Please upload PDF, JPG, or PNG files only.");
        setMessageType("error");
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setMessage("");
        setMessageType("");
      } else {
        setMessage("Please upload PDF, JPG, or PNG files only.");
        setMessageType("error");
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file first.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");
    
    // Start progress simulation
    simulateProgress();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("email", session?.user?.email);
    formData.append("description", description);
    formData.append("file", file);

    try {
      const res = await fetch("/api/certifictes/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      // Wait for progress to complete
      await new Promise(resolve => setTimeout(resolve, 7000));
      
      if (res.ok) {
        setMessage("Certificate uploaded successfully and secured!");
        setMessageType("success");
        setTitle("");
        setDescription("");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setMessage(data.error || "Upload failed.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Something went wrong during upload.");
      setMessageType("error");
    } finally {
      setLoading(false);
      setCurrentStep("");
      setProgress(0);
    }
  };

  const getFileIcon = () => {
    if (!file) return <FileText className="w-5 h-5" />;
    
    if (file.type === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-400" />;
    }
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  const getFileColor = () => {
    if (!file) return "text-slate-400";
    
    if (file.type === "application/pdf") {
      return "text-red-400";
    }
    return "text-blue-400";
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
         

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Certificate Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Award className="w-4 h-4 inline mr-2" />
                  Certificate Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Additional details about your certificate..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                  disabled={loading}
                />
              </div>

              {/* File Upload / Progress Area */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Certificate File (PDF, JPG, PNG)
                </label>
                
                {loading ? (
                  // Progress Display
                  <div className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-6 text-center">
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-300">Securing Your Certificate</span>
                          <span className="text-sm text-cyan-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Current Step */}
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-slate-200 text-sm font-medium">{currentStep}</span>
                      </div>
                    </div>
                  </div>
                ) : !file ? (
                  // Drag and Drop Area
                  <div
                    className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                      dragActive 
                        ? "border-cyan-400 bg-cyan-400/10" 
                        : "border-slate-600 hover:border-cyan-500 hover:bg-slate-700/30"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <p className="text-slate-300 font-medium mb-1 text-sm">
                      Drop your certificate here or click to browse
                    </p>
                    <p className="text-slate-500 text-xs">
                      Supports PDF, JPG, PNG files (Max 10MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  // File Preview
                  <div className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          file.type === "application/pdf" ? "bg-red-500/20" : "bg-blue-500/20"
                        }`}>
                          {getFileIcon()}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{file.name}</p>
                          <p className="text-xs text-slate-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Securing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Upload & Secure
                  </>
                )}
              </button>
            </form>

            {/* Message Display */}
            {message && (
              <div className={`mt-4 p-3 rounded-xl border ${
                messageType === "success" 
                  ? "bg-green-500/20 border-green-500/30 text-green-400" 
                  : "bg-red-500/20 border-red-500/30 text-red-400"
              }`}>
                <div className="flex items-center gap-2">
                  {messageType === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">{message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Security Info Section */}
          <div className="space-y-4">
            <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">Your Certificate Security</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">AES-256 Encrypted</p>
                    <p className="text-slate-400 text-xs">Military-grade security</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">IPFS Storage</p>
                    <p className="text-slate-400 text-xs">Decentralized & permanent</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Private Access</p>
                    <p className="text-slate-400 text-xs">Only you control sharing</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/20 border border-slate-700 rounded-2xl p-4">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">Upload Process</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
                  <span className="text-slate-300">Validate & encrypt your certificate</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
                  <span className="text-slate-300">Upload to secure IPFS network</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                  <span className="text-slate-300">Generate secure access hash</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
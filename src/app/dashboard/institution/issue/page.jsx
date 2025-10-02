"use client";

import { useState, useRef } from "react";
import { 
  Shield, 
  Upload, 
  FileText, 
  Mail, 
  User, 
  Award, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import Link from "next/link";

export default function IssueCertificatePage() {
  const [studentEmail, setStudentEmail] = useState("");
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

  const steps = [
    { text: "Validating certificate data...", duration: 1000 },
    { text: "Encrypting with AES-256...", duration: 1500 },
    { text: "Generating digital signature...", duration: 1200 },
    { text: "Uploading to IPFS network...", duration: 2000 },
    { text: "Certificate issued successfully!", duration: 500 }
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
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setMessage("");
        setMessageType("");
      } else {
        setMessage("Please upload only PDF files.");
        setMessageType("error");
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setMessage("");
      setMessageType("");
    } else {
      setMessage("Please upload only PDF files.");
      setMessageType("error");
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
      setMessage("Please select a PDF file first.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");
    
    // Start progress simulation
    simulateProgress();

    const formData = new FormData();
    formData.append("studentEmail", studentEmail);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file);

    try {
      const res = await fetch("/api/certifictes/issue", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      // Wait for progress to complete
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      if (res.ok) {
        setMessage("Certificate issued successfully and sent to student!");
        setMessageType("success");
        setStudentEmail("");
        setTitle("");
        setDescription("");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setMessage(data.error || "Certificate issuance failed.");
        setMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong while issuing certificate.");
      setMessageType("error");
    } finally {
      setLoading(false);
      setCurrentStep("");
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/institution"
            className="inline-flex items-center text-slate-400 hover:text-cyan-400 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Issue Certificate
              </h1>
              <p className="text-slate-400">Create and digitally sign a new certificate for a student</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Student Email Address
              </label>
              <input
                type="email"
                placeholder="student@university.edu"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                required
                disabled={loading}
              />
            </div>

            {/* Certificate Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Certificate Title
              </label>
              <input
                type="text"
                placeholder="Bachelor of Science in Computer Science"
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
                <User className="w-4 h-4 inline mr-2" />
                Description (Optional)
              </label>
              <textarea
                placeholder="Additional details about the certificate..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                disabled={loading}
              />
            </div>

            {/* File Upload / Progress Area */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Upload className="w-4 h-4 inline mr-2" />
                Certificate File (PDF only)
              </label>
              
              {loading ? (
                // Progress Display
                <div className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-8 text-center">
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">Processing</span>
                        <span className="text-sm text-cyan-400">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Current Step */}
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      <span className="text-slate-200 font-medium">{currentStep}</span>
                    </div>
                  </div>
                </div>
              ) : !file ? (
                // Drag and Drop Area
                <div
                  className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
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
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <p className="text-slate-300 font-medium mb-2">
                    Drop your PDF certificate here or click to browse
                  </p>
                  <p className="text-slate-500 text-sm">
                    Only PDF files are accepted (Max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                // File Preview
                <div className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Certificate...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5" />
                  Issue Certificate
                </>
              )}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl border ${
              messageType === "success" 
                ? "bg-green-500/20 border-green-500/30 text-green-400" 
                : "bg-red-500/20 border-red-500/30 text-red-400"
            }`}>
              <div className="flex items-center gap-2">
                {messageType === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                {message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
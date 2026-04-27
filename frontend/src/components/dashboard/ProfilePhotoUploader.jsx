import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Trash2, Upload, Loader2, X, Image as ImageIcon, RotateCcw, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import Button from '../ui/Button';

export default function ProfilePhotoUploader() {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  
  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream when modal closes
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Could not access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;
      
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      context.drawImage(video, startX, startY, size, size, 0, 0, size, size);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const handleFile = async (fileOrBlob, isDataUrl = false) => {
    let fileToUpload = fileOrBlob;

    if (isDataUrl) {
      const res = await fetch(fileOrBlob);
      const blob = await res.blob();
      fileToUpload = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
    }

    if (!fileToUpload) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(fileToUpload.type)) {
      return toast.error('Please upload a valid image (JPG, PNG, or WebP)');
    }
    if (fileToUpload.size > 5 * 1024 * 1024) {
      return toast.error('Image size must be less than 5MB');
    }

    const objectUrl = isDataUrl ? fileOrBlob : URL.createObjectURL(fileToUpload);
    setPreview(objectUrl);

    setUploading(true);
    const toastId = toast.loading('Uploading photo...');

    try {
      const formData = new FormData();
      formData.append('avatar', fileToUpload);
      
      const { data } = await authService.uploadAvatar(formData);
      updateUser(data.data.user);
      toast.success('Profile photo updated successfully!', { id: toastId });
      setPreview(null);
      stopCamera();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.', { id: toastId });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
    e.target.value = '';
  };

  const handleRemovePhoto = async () => {
    if (!user?.avatar) return;
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

    setUploading(true);
    const toastId = toast.loading('Removing photo...');

    try {
      const { data } = await authService.removeAvatar();
      updateUser(data.data.user);
      toast.success('Profile photo removed', { id: toastId });
    } catch (err) {
      toast.error('Failed to remove photo', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 relative">
      
      {/* Avatar Display & Drag/Drop Area */}
      <div 
        className={cn(
          "relative group cursor-pointer transition-all duration-300",
          isDragging && "scale-105 ring-4 ring-blue-500/20"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => galleryInputRef.current?.click()}
      >
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden bg-white shadow-xl border-4 border-white">
          {preview || user?.avatar ? (
            <img 
              src={preview || user.avatar} 
              alt={user?.name} 
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                uploading && "opacity-50 blur-[2px]"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 text-4xl font-black">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
              <Loader2 size={32} className="text-white animate-spin drop-shadow-md" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
            <Upload size={24} />
            <span className="text-xs font-bold uppercase tracking-wider">Drop Photo</span>
          </div>
        </div>

        <div className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all md:opacity-0 group-hover:opacity-100 border-4 border-white">
          <Camera size={20} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 text-center md:text-left space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 mb-1">Profile Photo</h3>
          <p className="text-xs text-slate-500 font-medium">Recommended: Square JPG, PNG or WebP (Max 5MB)</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Button 
            variant="secondary"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-50 text-blue-600 border-none rounded-xl font-bold py-3 px-6 flex items-center justify-center gap-2"
          >
            <ImageIcon size={18} /> Choose from Gallery
          </Button>

          <Button 
            variant="secondary"
            onClick={startCamera}
            disabled={uploading}
            className="bg-indigo-50 text-indigo-600 border-none rounded-xl font-bold py-3 px-6 flex items-center justify-center gap-2"
          >
            <Camera size={18} /> Use Live Camera
          </Button>

          {user?.avatar && (
            <Button 
              variant="secondary"
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="bg-red-50 text-red-500 border-none rounded-xl font-bold py-3 px-6 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> Remove
            </Button>
          )}
        </div>

        <input 
          type="file" 
          ref={galleryInputRef} 
          className="hidden" 
          accept="image/png,image/jpeg,image/jpg,image/webp" 
          onChange={handleFileChange}
        />
      </div>

      {/* ── LIVE CAMERA MODAL (PORTAL) ── */}
      {showCamera && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Take Profile Photo</h3>
              <button onClick={stopCamera} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900">
                <X size={24} />
              </button>
            </div>

            <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center">
              {!capturedImage ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                  <div className="absolute inset-0 pointer-events-none border-[3rem] border-black/20">
                    <div className="w-full h-full border-2 border-dashed border-white/40 rounded-full" />
                  </div>
                </>
              ) : (
                <img src={capturedImage} className="w-full h-full object-cover" />
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-8 bg-slate-50 flex items-center justify-center gap-4">
              {!capturedImage ? (
                <button 
                  onClick={takePhoto}
                  className="w-20 h-20 bg-white rounded-full border-8 border-slate-200 flex items-center justify-center active:scale-90 transition-transform group"
                >
                  <div className="w-12 h-12 bg-red-500 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-red-500/30" />
                </button>
              ) : (
                <div className="flex gap-4 w-full">
                  <Button 
                    variant="secondary" 
                    onClick={startCamera} 
                    className="flex-1 rounded-2xl font-black py-4 bg-white border-slate-200"
                  >
                    <RotateCcw size={20} className="mr-2" /> Retake
                  </Button>
                  <Button 
                    onClick={() => handleFile(capturedImage, true)} 
                    loading={uploading}
                    className="flex-1 rounded-2xl font-black py-4 bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                  >
                    <Check size={20} className="mr-2" /> Use This Photo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}

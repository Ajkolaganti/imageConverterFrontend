"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { FileText, FileSpreadsheet, Download, Upload, Info, Camera } from "lucide-react"

export default function EnhancedImageConverter() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState<"text" | "excel" | null>(null)
  const [convertedData, setConvertedData] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = async () => {
    if (isCameraActive) {
      // Capture image
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setImage(file);
            setPreview(URL.createObjectURL(file));
          }
        }, 'image/jpeg');
      }
      stopCamera();
    } else {
      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please check permissions.");
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraActive(false);
  }
 

  const handleConvert = async (type: "text" | "excel") => {
    if (!image) return
    setConverting(true)
    const formData = new FormData()
    formData.append('image', image)
    formData.append('type', type)
  
    try {
      const response = await fetch('http://35.153.182.117:3000/api/convert', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setConvertedData(data.result) // This is now base64 encoded for both text and excel
      setConverted(type)
    } catch (error) {
      console.error('Conversion error:', error)
      setError('Conversion failed. Please try again.')
    } finally {
      setConverting(false)
    }
  }

  const handleDownload = async (format: "txt" | "xlsx") => {
    if (!convertedData) return
    try {
      const response = await fetch('http://35.153.182.117:3000/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: convertedData, format }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `converted.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      setError('Failed to download the file. Please try again.')
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setShowInfo(true), 1000)
    return () => clearTimeout(timer)
  }, [])


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 text-white p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Image Converter Pro
            </h1>
            <Tabs defaultValue="convert" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="convert">Convert</TabsTrigger>
                <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
              </TabsList>
              <TabsContent value="convert">
                <div className="space-y-8">
                  <div className="relative group">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-lg py-6"
                      >
                        <Upload className="mr-2 h-5 w-5" /> Upload Image
                      </Button>
                      <Button
                        onClick={handleCameraCapture}
                        className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-300 text-lg py-6"
                      >
                        <Camera className="mr-2 h-5 w-5" /> {isCameraActive ? 'Capture' : 'Camera'}
                      </Button>
                    </div>
                    <AnimatePresence>
                      {isCameraActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 relative rounded-xl overflow-hidden shadow-xl"
                        >
                          <video ref={videoRef} autoPlay playsInline className="w-full" />
                        </motion.div>
                      )}
                      {image && !isCameraActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 relative group rounded-xl overflow-hidden shadow-xl"
                        >
                          <img
                            src={preview || ''}
                            alt="Uploaded"
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <p className="text-white text-lg font-semibold">Preview</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Button
                      onClick={() => handleConvert("text")}
                      disabled={!image || converting}
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-300 text-lg py-6"
                    >
                      <FileText className="mr-2 h-5 w-5" /> Convert to Text
                    </Button>
                    <Button
                      onClick={() => handleConvert("excel")}
                      disabled={!image || converting}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 text-lg py-6"
                    >
                      <FileSpreadsheet className="mr-2 h-5 w-5" /> Convert to Excel
                    </Button>
                  </div>
                  <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="w-full bg-white bg-opacity-20 backdrop-blur-lg hover:bg-opacity-30 text-white border border-white border-opacity-30 shadow-lg transition-all duration-300"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" /> Download Converted File
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white bg-opacity-90 backdrop-blur-lg border border-white border-opacity-30">
                  <DropdownMenuItem onClick={() => handleDownload("txt")} className="hover:bg-purple-100">
                    <FileText className="mr-2 h-4 w-4" /> Download as TXT
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload("xlsx")} className="hover:bg-purple-100">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Download as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
                </div>
                {converting && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-center text-lg text-blue-400 animate-pulse"
                  >
                    Converting... Please wait.
                  </motion.p>
                )}
                {converted && !converting && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center text-lg text-green-400"
                  >
                    Successfully converted to {converted}. Ready to download!
                  </motion.p>
                )}
              </TabsContent>
              <TabsContent value="how-it-works">
                <div className="space-y-6 text-lg">
                  <p>
                    Welcome to Image Converter Pro! Here's how to use our powerful tool:
                  </p>
                  <ol className="list-decimal list-inside space-y-4">
                    <li>Click the "Upload Image" button to select an image from your device.</li>
                    <li>Once uploaded, you'll see a preview of your image.</li>
                    <li>Choose to convert your image to Text or Excel format using the respective buttons.</li>
                    <li>Wait for the conversion process to complete.</li>
                    <li>Once converted, use the "Download Converted File" button to save your file in the desired format.</li>
                  </ol>
                  <p>
                    Our advanced AI algorithms analyze your image and extract the relevant information, 
                    converting it into editable text or structured Excel data. This process is perfect for 
                    digitizing printed documents, extracting data from charts or graphs, or converting 
                    handwritten notes into editable formats.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mt-6 text-center text-sm text-gray-300"
            >
              <p>Need help? Check out our FAQ or contact support.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="fixed bottom-4 right-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
          onClick={() => setShowInfo(!showInfo)}
        >
          <Info className="h-5 w-5" />
          <span className="sr-only">Show Information</span>
        </Button>
      </div>
    </div>
  )
}
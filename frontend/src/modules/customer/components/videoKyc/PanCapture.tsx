import { useRef, useState } from "react"
import { FileImage, Loader2, Upload, X } from "lucide-react"
import toast from "react-hot-toast"

interface PanCaptureProps {
  onUpload: (data: {
    image: string
    mimeType: string
    preview?: string
  }) => void | Promise<void>

  loading?: boolean
}

const PanCapture = ({
  onUpload,
  loading = false,
}: PanCaptureProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [image, setImage] = useState<string>("")
  const [preview, setPreview] = useState<string>("")
  const [mimeType, setMimeType] = useState<string>("")

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Please upload JPG, PNG or WEBP image"
      )

      event.target.value = ""
      return
    }

    // 8 MB frontend limit
    const maxSize = 8 * 1024 * 1024

    if (file.size > maxSize) {
      toast.error(
        "PAN image must be less than 8 MB"
      )

      event.target.value = ""
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result

      if (typeof result !== "string") {
        toast.error("Unable to read image")
        return
      }

      /*
       * FileReader gives:
       *
       * data:image/jpeg;base64,/9j/4AAQ...
       *
       * Backend requires only the raw base64 portion:
       *
       * /9j/4AAQ...
       */
      const base64 = result.split(",")[1]

      if (!base64) {
        toast.error("Invalid image data")
        return
      }

      setImage(base64)
      setPreview(result)
      setMimeType(file.type)
    }

    reader.onerror = () => {
      toast.error("Unable to read image")
    }

    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!image || !mimeType) {
      toast.error("Please select PAN card image")
      return
    }

    await onUpload({
      image,
      mimeType,
      preview,
    })
  }

  const removeImage = () => {
    setImage("")
    setPreview("")
    setMimeType("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="size-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <FileImage className="size-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mt-4">
          Upload PAN Card
        </h3>

        <p className="text-sm text-slate-500 mt-2">
          Upload a clear photo of your PAN card.
          Make sure all details are clearly visible.
        </p>
      </div>

      {!preview ? (
        <div
          onClick={() =>
            !loading &&
            fileInputRef.current?.click()
          }
          className="
            border-2 border-dashed
            border-slate-300
            rounded-2xl
            p-8
            text-center
            cursor-pointer
            hover:border-blue-500
            hover:bg-blue-50/40
            transition-all
          "
        >
          <Upload className="size-10 mx-auto text-slate-400" />

          <p className="text-sm font-semibold text-slate-700 mt-4">
            Click to upload PAN card
          </p>

          <p className="text-xs text-slate-400 mt-2">
            JPG, PNG or WEBP
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
            <img
              src={preview}
              alt="PAN Card Preview"
              className="w-full max-h-[350px] object-contain"
            />

            {!loading && (
              <button
                type="button"
                onClick={removeImage}
                className="
                  absolute
                  top-3
                  right-3
                  size-10
                  rounded-full
                  bg-white
                  shadow-md
                  flex
                  items-center
                  justify-center
                  text-slate-600
                  hover:text-red-600
                  hover:bg-red-50
                  transition-colors
                "
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={loading}
              className="
                flex-1
                px-5
                py-3
                rounded-xl
                border
                border-slate-200
                text-slate-700
                text-sm
                font-bold
                hover:bg-slate-50
                disabled:opacity-50
              "
            >
              Choose Different Image
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="
                flex-1
                px-5
                py-3
                rounded-xl
                bg-blue-600
                text-white
                text-sm
                font-bold
                hover:bg-blue-700
                disabled:opacity-50
                flex
                items-center
                justify-center
                gap-2
              "
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Verify PAN
                </>
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </div>
      )}

      <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 p-4">
        <p className="text-xs font-semibold text-amber-800">
          PAN photo tips
        </p>

        <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc ml-4">
          <li>Keep all four corners visible.</li>
          <li>Avoid glare or reflections.</li>
          <li>Make sure PAN number is readable.</li>
          <li>Use a clear and well-lit photo.</li>
        </ul>
      </div>
    </div>
  )
}

export default PanCapture

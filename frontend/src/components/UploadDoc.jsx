import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth, setAuth } from "../auth";

export default function UploadDoc() {
  const { user } = getAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return setError("Please select a file");
    const formData = new FormData();
    formData.append("document", file);
    formData.append("address", user.eth_address);

    try {
      await axios.post("http://localhost:5000/api/user/upload-doc", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // After uploading, mark user as verified in local storage
      setAuth(localStorage.getItem("token"), { ...user, verified: true });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="p-8 bg-white shadow-md rounded w-96">
        <h1 className="text-2xl font-bold mb-4">Upload ID for Verification</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input type="file" className="w-full mb-2" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload} className="w-full bg-gray-700 text-white p-2 rounded mt-2">Upload</button>
      </div>
    </div>
  );
}

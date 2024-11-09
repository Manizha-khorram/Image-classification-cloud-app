"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      setPredictions(null);
      setError(null);
    } else {
      setError("Please select a valid image file");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!image) {
      setError("Please select an image first");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", responseText);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to classify image");
      }

      if (!data.predictions || !Array.isArray(data.predictions)) {
        console.error("Unexpected response format:", data);
        throw new Error("Invalid response format from server");
      }

      setPredictions(data.predictions);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error in classification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Classification App</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex flex-col gap-4">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="border p-2 rounded"
          />
          <button
            type="submit"
            disabled={!image || isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            {isLoading ? "Classifying..." : "Classify"}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-50 rounded">{error}</div>
      )}

      {predictions && (
        <div className="border rounded p-4 bg-white shadow">
          <h2 className="font-bold mb-2 text-gray-600">Predictions:</h2>
          <ul className="space-y-2">
            {predictions.map((pred, index) => (
              <li
                key={index}
                className="flex justify-between items-center border-b py-2 text-gray-600"
              >
                <span className="font-medium">{pred.description}</span>
                <span className="text-gray-600">
                  {(pred.probability * 100).toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
